import json
import os

for f_name in ['data.json', 'extracted_all.json', 'extracted_catalog.json', 'extracted_deco.json']:
    if not os.path.exists(f_name):
        continue
    try:
        with open(f_name, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        products = data.get('products', data) if isinstance(data, dict) else data
        if isinstance(products, list):
            categories = set(p.get('category') for p in products if isinstance(p, dict))
            print(f"=== {f_name} ===")
            print(f"Total Products: {len(products)}")
            print(f"Categories ({len(categories)}): {', '.join(str(c) for c in categories)}")
    except Exception as e:
        print(f"Error parsing {f_name}: {e}")
