import json
import urllib.request

url = 'https://flyer-event-page-2026-default-rtdb.firebaseio.com/events.json'

# 1. 현재 events 목록 가져오기
req = urllib.request.Request(url, method='GET')
try:
    with urllib.request.urlopen(req) as response:
        events = json.loads(response.read().decode('utf-8'))
except Exception as e:
    events = []
    
# 2. 제가 방금 넣은 엉터리 이벤트 삭제
if isinstance(events, list):
    # 'ev_lhstar_' 로 시작하거나 '내포 LH스타힐스 추석세일' 제목인 이벤트 제거
    filtered_events = [e for e in events if e and 'LH스타힐스 추석세일' not in str(e)]
    
    # 3. 업데이트 (PUT으로 덮어쓰기)
    req_put = urllib.request.Request(url, data=json.dumps(filtered_events).encode('utf-8'), headers={'Content-Type': 'application/json'}, method='PUT')
    try:
        with urllib.request.urlopen(req_put) as res_put:
            print("Success: 엉터리 이벤트 삭제 완료")
    except Exception as e:
        print(f"Error updating RTDB: {e}")
