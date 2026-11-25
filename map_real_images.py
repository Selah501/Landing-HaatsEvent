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
    
    img1_url = ""
    img2_url = ""
    
    # "이미지 원본 1", "이미지 원본 2" 찾기
    for p in pages:
        if p.get('title') == '이미지 원본 1':
            # html 필드에 URL 텍스트나 img 태그가 들어있을 것
            img1_url = p.get('html').strip()
            # 만약 img 태그로 감싸져있으면 src만 추출
            match = re.search(r'src="([^"]+)"', img1_url)
            if match: img1_url = match.group(1)
            
        elif p.get('title') == '이미지 원본 2':
            img2_url = p.get('html').strip()
            match = re.search(r'src="([^"]+)"', img2_url)
            if match: img2_url = match.group(1)
            
    print(f"Found img1: {img1_url}")
    print(f"Found img2: {img2_url}")
    
    # 최신 활성 페이지 찾기
    target_page = None
    for p in reversed(pages):
        if p.get('is_active', False):
            target_page = p
            break
            
    html_content = target_page['html']
    
    # 2단계 영역 찾아서 이미지 태그 교체
    # 제가 아까 넣었던 엉뚱한 이미지(deco_page_21, deco_page_22)를 지우고 이 원본 URL들로 치환
    if img1_url and img2_url:
        new_img_tags = f"""
                <img src="{img1_url}" alt="시공사례1" style="width: 100%; border-radius: 8px; margin-bottom: 8px;">
                <img src="{img2_url}" alt="시공사례2" style="width: 100%; border-radius: 8px;">
        """
        
        # 이전 스크립트에서 넣은 deco_page 이미지 두 장을 통째로 바꿈
        html_content = re.sub(
            r'<img src="[^"]*deco_page_21[^>]*>\s*<img src="[^"]*deco_page_22[^>]*>',
            new_img_tags.strip(),
            html_content
        )
        
        # 기존 활성화 해제
        for p in pages:
            p['is_active'] = False
            
        # 새 버전 추가
        today = datetime.datetime.now()
        date_str = today.strftime('%y.%m.%d %H:%M')
        new_version = {
            'id': f"v1_{int(today.timestamp()*1000)}",
            'title': f"AI 생성 버전 (진짜 시공사진 2장 매핑 {date_str})",
            'is_active': True,
            'html': html_content
        }
        
        pages.append(new_version)
        
        update_req = urllib.request.Request(url, data=json.dumps({'detail_pages': pages}).encode(), headers={
            'apikey': key,
            'Authorization': f'Bearer {key}',
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        }, method='PATCH')
        
        with urllib.request.urlopen(update_req) as update_res:
            print("Success: 진짜 원본 이미지 2장으로 교체 완료.")
    else:
        print("이미지 원본 1, 2를 DB에서 찾지 못했습니다.")
