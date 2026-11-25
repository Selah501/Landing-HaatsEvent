import json
import urllib.request

url = 'https://belchthacupzpgxevecx.supabase.co/rest/v1/products?id=eq.3b7b8c08-8991-81d4-9788-fc8014b4b82e'
key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlbGNodGhhY3VwenBneGV2ZWN4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTgwNTUwNiwiZXhwIjoyMTAxMzgxNTA2fQ.cjEfiENLjNwl5dudDTU_ylppF_SIhQCmx9lb_gXh8bo'

req = urllib.request.Request(url, headers={
    'apikey': key,
    'Authorization': f'Bearer {key}',
    'Content-Type': 'application/json'
}, method='GET')

try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        pages = data[0].get('detail_pages', [])
        print(f"Total pages: {len(pages)}")
        for i, p in enumerate(pages[-3:]): # 최근 3개만 출력
            print(f"[{i}] title: {p.get('title')}, is_active: {p.get('is_active')}, version: {p.get('id')}")
except Exception as e:
    print(f"Error: {e}")
