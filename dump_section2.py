import json
import urllib.request
import re

url = 'https://belchthacupzpgxevecx.supabase.co/rest/v1/products?id=eq.3b7b8c08-8991-81d4-9788-fc8014b4b82e'
key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlbGNodGhhY3VwenBneGV2ZWN4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTgwNTUwNiwiZXhwIjoyMTAxMzgxNTA2fQ.cjEfiENLjNwl5dudDTU_ylppF_SIhQCmx9lb_gXh8bo'

req = urllib.request.Request(url, headers={
    'apikey': key,
    'Authorization': f'Bearer {key}',
    'Content-Type': 'application/json'
}, method='GET')

with urllib.request.urlopen(req) as response:
    data = json.loads(response.read().decode())
    pages = data[0].get('detail_pages', [])
    latest_html = pages[-1]['html']
    
    match = re.search(r'(<!-- \[2단계\] 시각적 신뢰 \(시공 사례\) -->.*?)(?=<!-- \[3단계\])', latest_html, re.DOTALL)
    if match:
        with open('debug_section2.html', 'w', encoding='utf-8') as f:
            f.write(match.group(1))
        print("dumped to debug_section2.html")
    else:
        print("not found")
