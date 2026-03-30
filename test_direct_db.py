#!/usr/bin/env python
import os
import sys
import django

# Setup Django
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hardware_api.settings.dev')
django.setup()

print("=== Testing Direct Database Operations ===")

from apps.products.models import Product

try:
    # Test if we can access products
    products = Product.objects.all()[:5]
    print(f"✅ Found {products.count()} products")
    
    for product in products:
        print(f"  - {product.name} (ID: {product.id}, Stock: {product.stock_quantity})")
        
    # Test updating a product
    if products.exists():
        test_product = products.first()
        print(f"\n🔄 Testing update on: {test_product.name}")
        test_product.stock_quantity = 999
        test_product.save()
        print(f"✅ Updated stock to: {test_product.stock_quantity}")
        
        # Verify the update
        updated = Product.objects.get(id=test_product.id)
        print(f"✅ Verified stock is: {updated.stock_quantity}")
        
except Exception as e:
    print(f"❌ Error: {e}")
    print(f"Error type: {type(e)}")
    import traceback
    traceback.print_exc()
