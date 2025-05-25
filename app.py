# app.py

from flask import Flask, render_template, request, jsonify, redirect, url_for
import os
from datetime import datetime, timedelta
import uuid
from azure.cognitiveservices.vision.computervision import ComputerVisionClient
from azure.cognitiveservices.vision.computervision.models import OperationStatusCodes
from msrest.authentication import CognitiveServicesCredentials
import re
import time
import tempfile
from flask_sqlalchemy import SQLAlchemy
from flask_mail import Mail, Message
import threading
import requests
from azure.core.credentials import AzureKeyCredential
from azure.search.documents import SearchClient
from azure.search.documents.models import QueryType
from azure.search.documents.models import VectorizedQuery

# Azure Cognitive Search configuration
AZURE_SEARCH_ENDPOINT = os.getenv("AZURE_SEARCH_ENDPOINT", "https://your-search-service.search.windows.net")
AZURE_SEARCH_KEY = os.getenv("AZURE_SEARCH_KEY")
AZURE_SEARCH_INDEX = "recipes-index"

search_client = SearchClient(
    endpoint=AZURE_SEARCH_ENDPOINT,
    index_name=AZURE_SEARCH_INDEX,
    credential=AzureKeyCredential(AZURE_SEARCH_KEY)
)

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload

# Create upload directory if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('SQLALCHEMY_DATABASE_URI', 'sqlite:///food_items.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Email configuration
app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'True').lower() == 'true'
app.config['MAIL_USE_SSL'] = os.getenv('MAIL_USE_SSL', 'False').lower() == 'true'
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER')

# Initialize extensions
db = SQLAlchemy(app)
mail = Mail(app)

# Azure Computer Vision client setup
AZURE_ENDPOINT = os.getenv("AZURE_VISION_ENDPOINT", "https://recipe.cognitiveservices.azure.com/")
AZURE_KEY = os.getenv("AZURE_VISION_KEY")
vision_client = ComputerVisionClient(
    AZURE_ENDPOINT,
    CognitiveServicesCredentials(AZURE_KEY)
)

# Define the FoodItem model
class FoodItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    expiry_date = db.Column(db.String(20), nullable=False)
    parsed_date = db.Column(db.Date, nullable=False)
    user_email = db.Column(db.String(100), nullable=False)
    notification_days = db.Column(db.Integer, default=3)
    image_path = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f''

# Create the database tables
with app.app_context():
    db.create_all()

# List of common date patterns for regex matching
MFG_DATE_PATTERNS = [
    r"(?:MFG|Mfg|mfg|Manufacturing|MANUFACTURING|Date of Manufacture|DOM|Production|PRODUCTION)\.?\s*:?\s*(\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4})",
    r"(?:MFG|Mfg|mfg|Manufacturing|MANUFACTURING|Date of Manufacture|DOM|Production|PRODUCTION)\.?\s*:?\s*(\d{2}[-/\.]\s*[A-Za-z]{3}[-/\.]\s*\d{2,4})",
    r"(?:MFG|Mfg|mfg|Manufacturing|MANUFACTURING|Date of Manufacture|DOM|Production|PRODUCTION)\.?\s*:?\s*([A-Za-z]{3}[-/\.]\s*\d{4})"
]

EXPIRY_DATE_PATTERNS = [
    r"(?:EXP|Exp|exp|Expiry|EXPIRY|Best Before|USE BY|Use By|BBE)\.?\s*:?\s*(\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4})",
    r"(?:EXP|Exp|exp|Expiry|EXPIRY|Best Before|BBE)\.?\s*:?\s*(\d{2}[-/\.]\s*[A-Za-z]{3}[-/\.]\s*\d{2,4})",
    r"(?:EXP|Exp|exp|Expiry|EXPIRY|Best Before|BBE)\.?\s*:?\s*([A-Za-z]{3}[-/\.]\s*\d{4})"
]

GENERIC_DATE_PATTERN = r"(\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4})"

# Function to check if an item with the same name already exists
def item_exists(food_name):
    return db.session.query(FoodItem).filter_by(name=food_name).first() is not None

# Function to send email asynchronously
def send_async_email(app, msg):
    with app.app_context():
        mail.send(msg)

# Function to send expiry notification email
def send_expiry_notification(food_item):
    msg = Message(
        subject=f"Food Expiry Alert: {food_item.name}",
        recipients=[food_item.user_email]
    )
    msg.body = f"""
Hello,

This is a reminder that your food item "{food_item.name}" is expiring soon on {food_item.expiry_date}.

You are receiving this notification {food_item.notification_days} days before expiry as requested.

Please consume it before it expires to avoid food waste.

Best regards,
Food Expiry Tracker
"""
    # Send email asynchronously
    threading.Thread(target=send_async_email, args=[app, msg]).start()
    return True

def extract_dates(text):
    """Extract both manufacturing and expiry dates from OCR text."""
    # Find manufacturing date
    mfg_date = None
    for pattern in MFG_DATE_PATTERNS:
        matches = re.findall(pattern, text)
        if matches:
            mfg_date = matches[0]
            break

    # Find expiry date
    exp_date = None
    for pattern in EXPIRY_DATE_PATTERNS:
        matches = re.findall(pattern, text)
        if matches:
            exp_date = matches[0]
            break

    # If no explicit expiry date found, look for any dates
    if not exp_date:
        # Get all generic dates
        all_dates = re.findall(GENERIC_DATE_PATTERN, text)
        # If we have multiple dates and one is manufacturing
        if len(all_dates) >= 2:
            # If manufacturing date is identified, find a date that comes after it
            if mfg_date and mfg_date in all_dates:
                # Get the index of manufacturing date
                mfg_index = all_dates.index(mfg_date)
                # Assume the next date after manufacturing is expiry
                if mfg_index < len(all_dates) - 1:
                    exp_date = all_dates[mfg_index + 1]
                    # Verify expiry date is later than manufacturing date
                    if not compare_dates(mfg_date, exp_date):
                        exp_date = None
            else:
                # If no manufacturing date identified, take the last date as expiry
                exp_date = all_dates[-1]

    return mfg_date, exp_date

def parse_date(date_str):
    """Try to parse the extracted date string into a standardized format."""
    try:
        # Remove any spaces in the date string
        date_str = re.sub(r'\s+', '', date_str)
        
        # Try different date parsing formats
        formats = [
            '%d/%m/%Y', '%d/%m/%y', '%m/%d/%Y', '%m/%d/%y',
            '%d-%m-%Y', '%d-%m-%y', '%m-%d-%Y', '%m-%d-%y',
            '%d.%m.%Y', '%d.%m.%y', '%m.%d.%Y', '%m.%d.%y',
            '%b%Y', '%b%y', '%B%Y', '%B%y',
            '%d%b%Y', '%d%b%y', '%d%B%Y', '%d%B%y'
        ]
        
        for fmt in formats:
            try:
                date_obj = datetime.strptime(date_str, fmt)
                return date_obj.strftime('%Y-%m-%d')
            except ValueError:
                continue
        
        return date_str  # Return the original if parsing fails
    except Exception as e:
        print(f"Error parsing date: {e}")
        return date_str

def compare_dates(mfg_date_str, exp_date_str):
    """Compare manufacturing and expiry dates to ensure expiry is later."""
    if not mfg_date_str or not exp_date_str:
        return True  # If one date is missing, we can't compare
    
    try:
        mfg_parsed = parse_date(mfg_date_str)
        exp_parsed = parse_date(exp_date_str)
        
        mfg_date = datetime.strptime(mfg_parsed, '%Y-%m-%d')
        exp_date = datetime.strptime(exp_parsed, '%Y-%m-%d')
        
        # Return True if expiry date is after manufacturing date
        return exp_date > mfg_date
    except:
        # If dates couldn't be parsed properly, we can't compare
        return True

def process_image(image_path):
    """Process image through Azure Computer Vision to extract text."""
    try:
        # Open the image file
        with open(image_path, "rb") as image_file:
            # Call the Azure OCR API
            read_response = vision_client.read_in_stream(image_file, raw=True)
            
            # Get the operation location from the response
            operation_location = read_response.headers["Operation-Location"]
            operation_id = operation_location.split("/")[-1]
            
            # Wait for the OCR operation to complete
            while True:
                read_result = vision_client.get_read_result(operation_id)
                if read_result.status not in [OperationStatusCodes.running, OperationStatusCodes.not_started]:
                    break
                time.sleep(1)
            
            # Extract text from the OCR results
            extracted_text = ""
            if read_result.status == OperationStatusCodes.succeeded:
                for text_result in read_result.analyze_result.read_results:
                    for line in text_result.lines:
                        extracted_text += line.text + "\n"
                
                # Extract both manufacturing and expiry dates
                mfg_date, exp_date = extract_dates(extracted_text)
                
                # If we have both dates, validate that expiry is after manufacturing
                if mfg_date and exp_date:
                    is_valid = compare_dates(mfg_date, exp_date)
                    if not is_valid:
                        return {
                            "success": False,
                            "raw_text": extracted_text,
                            "message": "Invalid expiry date: Expiry date is earlier than manufacturing date."
                        }
                
                if exp_date:
                    parsed_date = parse_date(exp_date)
                    return {
                        "success": True,
                        "raw_text": extracted_text,
                        "expiry_date": exp_date,
                        "parsed_date": parsed_date,
                        "manufacturing_date": mfg_date if mfg_date else "Not detected"
                    }
                else:
                    return {
                        "success": False,
                        "raw_text": extracted_text,
                        "message": "No expiry date found in the image."
                    }
    except Exception as e:
        return {
            "success": False,
            "message": f"Error processing image: {str(e)}"
        }

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/remove_item/<int:item_id>', methods=['POST'])
def remove_item(item_id):
    try:
        # Get the item from database
        item = FoodItem.query.get_or_404(item_id)
        
        # Get the image path to delete the file
        image_path = os.path.join('static', item.image_path)
        
        # Delete the item from database
        db.session.delete(item)
        db.session.commit()
        
        # Delete the image file if it exists
        if os.path.exists(image_path):
            os.remove(image_path)
        
        # Redirect back to the saved items page
        return redirect(url_for('saved_items'))
    except Exception as e:
        return jsonify({"success": False, "message": f"Error removing item: {str(e)}"}), 500

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"success": False, "message": "No file part"})
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"success": False, "message": "No selected file"})
    
    if file:
        # Generate a unique filename
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        
        # Save the file
        file.save(file_path)
        
        # Process the image
        result = process_image(file_path)
        
        # Add the image path to the result
        result["image_path"] = file_path.replace("static/", "")
        
        return jsonify(result)

@app.route('/capture', methods=['POST'])
def capture_image():
    if 'image' not in request.files:
        return jsonify({"success": False, "message": "No image data"})
    
    file = request.files['image']
    
    # Save the captured image to a temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg', dir=app.config['UPLOAD_FOLDER']) as temp:
        file.save(temp.name)
        temp_path = temp.name
    
    # Process the image
    result = process_image(temp_path)
    
    # Create a permanent filename for the image
    unique_filename = f"{uuid.uuid4()}.jpg"
    perm_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
    
    # Rename the temporary file to the permanent file
    os.rename(temp_path, perm_path)
    
    # Add the image path to the result
    result["image_path"] = perm_path.replace("static/", "")
    
    return jsonify(result)

@app.route('/save-item', methods=['POST'])
def save_item():
    try:
        data = request.json
        food_name = data.get('food_name')
        expiry_date = data.get('expiry_date')
        parsed_date = datetime.strptime(data.get('parsed_date'), '%Y-%m-%d').date()
        user_email = data.get('user_email')
        notification_days = int(data.get('notification_days', 3))
        image_path = data.get('image_path')
        force_add = data.get('force_add', False)  # New parameter to force add
        
        # Validate data
        if not all([food_name, expiry_date, parsed_date, user_email, image_path]):
            return jsonify({"success": False, "message": "Missing required fields"})
        
        # Check if item with same name exists
        if item_exists(food_name) and not force_add:
            return jsonify({
                "success": False, 
                "message": "duplicate",
                "duplicate": True,
                "food_name": food_name
            })
        
        # Create new food item
        new_item = FoodItem(
            name=food_name,
            expiry_date=expiry_date,
            parsed_date=parsed_date,
            user_email=user_email,
            notification_days=notification_days,
            image_path=image_path
        )
        
        # Save to database
        db.session.add(new_item)
        db.session.commit()
        
        # Send notification if expiry date is within specified days
        today = datetime.now().date()
        days_until_expiry = (parsed_date - today).days
        if days_until_expiry <= notification_days:
            send_expiry_notification(new_item)
        
        return jsonify({"success": True, "message": "Food item saved successfully"})
    except Exception as e:
        return jsonify({"success": False, "message": f"Error: {str(e)}"})

@app.route('/saved-items')
def saved_items():
    items = FoodItem.query.order_by(FoodItem.parsed_date).all()
    items_list = []
    
    for item in items:
        items_list.append({
            'id': item.id,
            'name': item.name,
            'expiry_date': item.expiry_date,
            'parsed_date': item.parsed_date.strftime('%Y-%m-%d'),
            'user_email': item.user_email,
            'notification_days': item.notification_days,
            'image_path': item.image_path,
            'days_left': (item.parsed_date - datetime.now().date()).days
        })
    
    return render_template('saved_items.html', items=items_list)

@app.route('/get-recipe/<int:item_id>', methods=['GET'])
def get_recipe(item_id):
    try:
        # Get the food item
        food_item = FoodItem.query.get_or_404(item_id)
        
        # Search for recipes using the food item name
        results = search_client.search(
            search_text=food_item.name,
            query_type=QueryType.SIMPLE,
            include_total_count=True,
            top=3  # Limit to 3 recipes
        )
        
        recipes = []
        for result in results:
            recipes.append({
                'title': result['title'],
                'ingredients': result['ingredients'],
                'instructions': result['instructions'],
                'image_url': result.get('image_url', '')
            })
        
        return jsonify({
            'success': True,
            'recipes': recipes,
            'item_id': item_id
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f"Error retrieving recipes: {str(e)}"
        })

if __name__ == '__main__':
    app.run(debug=True)