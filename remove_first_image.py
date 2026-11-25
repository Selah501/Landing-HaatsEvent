import json
import urllib.request
import re
import datetime

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
    
    if not pages:
        print("페이지가 없습니다.")
        exit(1)
        
    # 가장 최신 활성화된 버전을 찾습니다.
    target_page = None
    for p in reversed(pages):
        if p.get('is_active', False):
            target_page = p
            break
            
    if not target_page:
        target_page = pages[-1]

    html_content = target_page['html']
    
    # 2단계 영역 추출
    match = re.search(r'(<!-- \[2단계\] 시각적 신뢰 \(시공 사례\) -->.*?)(?=<!-- \[3단계\])', html_content, re.DOTALL)
    if not match:
        print("2단계 영역을 찾을 수 없습니다.")
        exit(1)
        
    section_2 = match.group(1)
    
    # section_2 내에서 이미지 태그들을 찾습니다.
    # 대표님이 삭제하길 원하는 이미지는: <img src="https://flyer-event-page-2026.web.app/images/catalog/deco_page_20_bottom_right.png" ...> (첫 번째 이미지)
    # 정규식으로 첫 번째 <img> 태그만 삭제
    # "deco_page_20_bottom_right.png" 이 포함된 img 태그를 삭제
    new_section_2 = re.sub(r'<img[^>]*deco_page_20_bottom_right\.png[^>]*>\s*', '', section_2)
    
    # 원본 html_content에 치환 반영
    new_html_content = html_content.replace(section_2, new_section_2)
    
    # 기존 활성화 해제
    for p in pages:
        p['is_active'] = False
        
    # 새 버전 추가
    today = datetime.datetime.now()
    date_str = today.strftime('%y.%m.%d %H:%M')
    new_version = {
        'id': f"v1_{int(today.timestamp()*1000)}",
        'title': f"AI 생성 버전 (시공이미지 2개로 수정 {date_str})",
        'is_active': True,
        'html': new_html_content
    }
    
    pages.append(new_version)
    
    update_req = urllib.request.Request(url, data=json.dumps({'detail_pages': pages}).encode(), headers={
        'apikey': key,
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
    }, method='PATCH')
    
    with urllib.request.urlopen(update_req) as update_res:
        print("Success: 첫 번째 카탈로그 이미지 삭제 완료.")
