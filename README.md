# 🍲 Smart Bite - Smart Food Management System 🍲

## 🔧 Tech Stack

* **Backend**: Python, Flask
* **Computer Vision**: OpenCV
* **OCR**: Tesseract OCR
* **Database**: SQLite
* **Email Service**: SMTP

## 📄 Overview

**Smart Bite** is a smart food management system that helps users reduce food waste by automatically detecting and tracking expiry dates of food products through image processing. It stores product details and proactively notifies users about upcoming expiry dates with recipe suggestions.

🔗 **Live Demo**: [https://smart-bite-beryl.vercel.app/](https://smart-bite-beryl.vercel.app/)

## 🔹 Features

* 📸 **Image-based Expiry Date Detection**: Utilizes OpenCV and Tesseract OCR to extract expiry dates from food product images.
* 📅 **Product Information Storage**: Stores extracted product info in a lightweight SQLite database.
* 📧 **Automated Email Alerts**: Sends timely notifications to users about upcoming expiry dates.
* 🍽️ **Recipe Suggestions**: Provides creative recipes based on expiring items.
* 😊 **User Engagement**: Boosts interaction through helpful and proactive reminders.

## 🌟 Benefits

* ✅ Reduces food waste by up to **40%**
* 🏡 Simplifies kitchen and pantry management
* 📢 Increases user engagement with timely alerts and suggestions

## 📁 Project Structure

```
Smart-Bite/
├── static/
│   └── uploads/              # Folder for uploaded images
│       └── .gitkeep          # Ensures uploads folder is tracked
├── templates/                # HTML templates
│   ├── index.html
│   └── saved_items.html
├── .gitignore                # Git ignore file
├── app.py                    # Main Flask application file
├── Procfile                  # For deployment with Gunicorn
├── README.md                 # Project documentation
├── requirements.txt          # Python dependencies
```

## ⚡ Getting Started

### ✨ Prerequisites

* Python 3.x
* Tesseract OCR installed and added to system path

### 🚀 Installation

```bash
pip install -r requirements.txt
```

### ⚙️ Configuration

1. Add your SMTP credentials in `config.py`
2. Initialize the SQLite database using the provided schema
3. Run the Flask app:

```bash
python app.py
```

## 🔄 Usage

1. Upload food product images via the Smart Bite web interface
2. The system automatically extracts expiry dates and stores the data
3. Email alerts are sent before items expire
4. Get recipe suggestions tailored to your expiring items

## 👥 Contributing

We welcome all contributions! Fork the repo, submit pull requests, or suggest new features and improvements.

---

Built with ❤️ using Python and Flask. Enjoy managing your food smartly with **Smart Bite**! 🍲

