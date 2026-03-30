#!/usr/bin/env python
import requests
import json

# Test the new restock endpoint
url = "http://localhost:8000/api/admin/inventory/27/restock/"
headers = {
    "Content-Type": "application/json",
    # You'll need to add actual auth token here
    # "Authorization": "Bearer YOUR_TOKEN_HERE"
}

data = {
    "add_quantity": 25
}

print("=== Testing Restock Endpoint ===")
print(f"URL: {url}")
print(f"Method: PATCH")
print(f"Data: {json.dumps(data, indent=2)}")

try:
    response = requests.patch(url, json=data, headers=headers)
    print(f"\n✅ Response Status: {response.status_code}")
    print(f"✅ Response Headers: {dict(response.headers)}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Response Data: {json.dumps(result, indent=2)}")
    else:
        print(f"❌ Error Response: {response.text}")
        
except requests.exceptions.ConnectionError as e:
    print(f"❌ Connection Error: {e}")
except Exception as e:
    print(f"❌ Unexpected Error: {e}")
