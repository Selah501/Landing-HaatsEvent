import json
import urllib.request

url = 'https://flyer-event-page-2026-default-rtdb.firebaseio.com/products.json'
try:
    with urllib.request.urlopen(url) as response:
        products = json.loads(response.read().decode('utf-8'))
        
        if products:
            for i, p in enumerate(products):
                name = p.get('name', '')
                pid = p.get('id', '')
                if '싱크볼' in name or '씽크볼' in name or '건조대' in name:
                    print(f"[{i}] ID: {pid}, Name: {name}")
except Exception as e:
    print(f"Error: {e}")
