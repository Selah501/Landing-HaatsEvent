import json
import urllib.request
import time

url = 'https://flyer-event-page-2026-default-rtdb.firebaseio.com/events.json'

# 1. 현재 events 목록 가져오기
req = urllib.request.Request(url, method='GET')
try:
    with urllib.request.urlopen(req) as response:
        events = json.loads(response.read().decode('utf-8'))
        if not events:
            events = []
except Exception as e:
    events = []
    
# 2. 새 이벤트 생성
new_event = {
  "id": f"ev_lhstar_{int(time.time())}",
  "title": "내포 LH스타힐스 추석세일",
  "status": "active",
  "periodText": "26.09.21(월) ~ 10.05(월)",
  "heroTitle": "<h1 style=\"font-size: 20px; color: var(--color-interactive-lime); margin-bottom: 8px; font-weight: bold; line-height: 1.3;\">LH스타힐스 입주민 전용 특별 혜택</h1><h2 style=\"font-size: 24px; line-height: 1.4; color: #fff; font-weight: bold;\">행복한 한가위를 기원하며, 하츠 추석맞이 특별 세일</h2>",
  "targetApt": "LH스타힐스",
  "managerId": "m_hongseong",
  "mainProducts": [
    {
      "id": "3b7b8c08-8991-81d4-9788-fc8014b4b82e",
      "customText": "335,000원",
      "customLink": "./product.html?id=3b7b8c08-8991-81d4-9788-fc8014b4b82e"
    }
  ],
  "addonProducts": [
    {
      "id": "3b7b8c08-8991-8156-8406-c00e4e7fa59a",
      "customText": "350,000원",
      "customLink": "./products/chuseok-terra.html"
    },
    {
      "id": "3b2b8c08-8991-81d8-8edc-faf02acddde4",
      "customText": "215,000원",
      "customLink": "./products/tioram-mini.html"
    },
    {
      "id": "p_vent_large",
      "customText": "140,000원",
      "customLink": "./products/zeroc.html"
    },
    {
      "id": "p_1787663733480",
      "customText": "165,000원",
      "customLink": "./products/zeroc.html"
    }
  ]
}

# 기존에 껍데기만 만들어진게 있으면 제거
if isinstance(events, list):
    events = [e for e in events if e and 'LH스타힐스 추석세일' not in str(e)]
    events.insert(0, new_event) # 맨 앞에 추가
    
# 3. 업데이트 (PUT으로 전체 배열 덮어쓰기)
req_put = urllib.request.Request(url, data=json.dumps(events).encode('utf-8'), headers={'Content-Type': 'application/json'}, method='PUT')
try:
    with urllib.request.urlopen(req_put) as res_put:
        print("Success: LH스타힐스 이벤트 DB 삽입 완료")
except Exception as e:
    print(f"Error updating RTDB: {e}")
