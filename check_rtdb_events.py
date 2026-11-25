import urllib.request
import json

url = 'https://flyer-event-page-2026-default-rtdb.firebaseio.com/events.json'
try:
    with urllib.request.urlopen(url) as response:
        data = json.loads(response.read().decode('utf-8'))
        
        if not data:
            print("No events found in RTDB.")
            exit()
            
        found = False
        # data는 보통 배열 또는 객체 형태임
        if isinstance(data, list):
            for i, ev in enumerate(data):
                if ev and 'LH스타힐스' in str(ev):
                    print(f"Index {i}: {ev}")
                    found = True
        elif isinstance(data, dict):
            for key, ev in data.items():
                if ev and 'LH스타힐스' in str(ev):
                    print(f"Key {key}: {ev}")
                    found = True
                    
        if not found:
            print("LH스타힐스 이벤트가 DB에 없습니다.")
except Exception as e:
    print(f"Error fetching RTDB: {e}")
