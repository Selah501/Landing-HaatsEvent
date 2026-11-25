import json
import urllib.request
import time

event_url = 'https://flyer-event-page-2026-default-rtdb.firebaseio.com/events.json'
product_url_base = 'https://belchthacupzpgxevecx.supabase.co/rest/v1/products'
key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlbGNodGhhY3VwenBneGV2ZWN4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTgwNTUwNiwiZXhwIjoyMTAxMzgxNTA2fQ.cjEfiENLjNwl5dudDTU_ylppF_SIhQCmx9lb_gXh8bo'

headers = {
    'apikey': key,
    'Authorization': f'Bearer {key}',
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
}

# --- 1. 이벤트 DB 수정 (LH스타힐스의 customLink 수정) ---
req = urllib.request.Request(event_url, method='GET')
try:
    with urllib.request.urlopen(req) as response:
        events = json.loads(response.read().decode('utf-8'))
        
        if isinstance(events, list):
            for ev in events:
                if ev and 'LH스타힐스 추석세일' in str(ev):
                    # 연계옵션 링크 수정
                    for addon in ev.get('addonProducts', []):
                        if addon['id'] == '3b2b8c08-8991-81dd-99f7-f4046d96de2a': # 싱크볼
                            addon['customLink'] = './products/sink-faucet.html'
                        elif addon['id'] == '3b7b8c08-8991-81f7-9bb0-cdd01c764f16': # 건조대
                            addon['customLink'] = './products/electric-drying-rack.html'
                        elif addon['id'] == '6dcd84ca-9d35-4e25-840d-96d82ee80371': # 제로크
                            addon['customLink'] = './products/basic-vent-large.html'
            
            # 덮어쓰기
            req_put = urllib.request.Request(event_url, data=json.dumps(events).encode('utf-8'), headers={'Content-Type': 'application/json'}, method='PUT')
            with urllib.request.urlopen(req_put) as res_put:
                print("이벤트 customLink 수정 완료")
except Exception as e:
    print(f"이벤트 수정 실패: {e}")


# --- 2. 상품마스터 DB에 detail_pages 외부링크로 추가 ---
def add_external_link_to_product(pid, link, title):
    get_req = urllib.request.Request(f"{product_url_base}?id=eq.{pid}", headers=headers, method='GET')
    try:
        with urllib.request.urlopen(get_req) as response:
            data = json.loads(response.read().decode('utf-8'))
            if not data: return
            
            product = data[0]
            pages = product.get('detail_pages', [])
            if not pages: pages = []
            
            # 이미 있으면 스킵
            for p in pages:
                if p.get('html') == link:
                    print(f"{title} 이미 있음 스킵")
                    return
            
            # 외부 링크 객체 형태로 추가
            new_page = {
                "id": f"v1_{int(time.time()*1000)}",
                "title": f"🔗 {title} (외부링크)",
                "html": link,
                "is_active": True,
                "is_external_link": True
            }
            
            # 기존 is_active false 처리
            for p in pages: p['is_active'] = False
            
            pages.append(new_page)
            
            patch_req = urllib.request.Request(f"{product_url_base}?id=eq.{pid}", data=json.dumps({"detail_pages": pages}).encode('utf-8'), headers=headers, method='PATCH')
            with urllib.request.urlopen(patch_req) as res_patch:
                print(f"{title} 상품마스터 업데이트 완료")
    except Exception as e:
        print(f"{title} 업데이트 에러: {e}")

# 각 제품에 추가
add_external_link_to_product('3b7b8c08-8991-81f7-9bb0-cdd01c764f16', './products/electric-drying-rack.html', '전동빨래건조대')
add_external_link_to_product('3b2b8c08-8991-81dd-99f7-f4046d96de2a', './products/sink-faucet.html', '사각씽크볼세트')
add_external_link_to_product('6dcd84ca-9d35-4e25-840d-96d82ee80371', 'https://flyer-event-page-2026.web.app/products/basic-vent-large.html', '제로크 MD-N')

print("모든 작업 완료!")
