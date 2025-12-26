import openfoodfacts
import json

api = openfoodfacts.API(user_agent="Debug/1.0")
code = "YOUR_BARCODE_HERE"
data = api.product.get(code)
# This prints the raw data nicely so you can find the correct field name
print(json.dumps(data['product'], indent=4))