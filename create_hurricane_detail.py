import json
import urllib.request
import re
import datetime

url = 'https://belchthacupzpgxevecx.supabase.co/rest/v1/products?id=eq.3b7b8c08-8991-81d4-9788-fc8014b4b82e'
key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlbGNodGhhY3VwenBneGV2ZWN4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTgwNTUwNiwiZXhwIjoyMTAxMzgxNTA2fQ.cjEfiENLjNwl5dudDTU_ylppF_SIhQCmx9lb_gXh8bo'

# 1. DB에서 기존 내역 불러오기
req = urllib.request.Request(url, headers={
    'apikey': key,
    'Authorization': f'Bearer {key}',
    'Content-Type': 'application/json'
}, method='GET')

with urllib.request.urlopen(req) as response:
    data = json.loads(response.read().decode())
    if not data:
        print("Product not found.")
        exit()
    
    product = data[0]
    pages = product.get('detail_pages', [])
    
    # 2. 직전 수정전 버전(테라 기반으로 덮어쓰기 전의 허리케인 원본 템플릿) 찾기
    # pages 배열의 뒷쪽부터 찾되, "테라"나 "chuseok-terra"라는 문맥이 들어오기 전의 버전을 찾거나, 단순히 2~3단계 전의 버전을 찾습니다.
    # 대표님이 '직전의 수정전'이라고 하신 것은, 테라 템플릿으로 복사해오기 전(어제 생성한 최초 허리케인 버전)일 수 있습니다.
    # 안전하게 배열 전체를 뒤져서 <!-- [2단계] 시각적 신뢰 (시공 사례) --> 와 <!-- [3단계] 사이의 내용을 확인
    
    hurricane_section_2 = ""
    for p in reversed(pages):
        html_content = p.get('html', '')
        # 테라 이미지가 없는 버전을 찾음
        if 'terra_install.jpg' not in html_content and '<!-- [2단계] 시각적 신뢰 (시공 사례) -->' in html_content:
            match = re.search(r'(<!-- \[2단계\] 시각적 신뢰 \(시공 사례\) -->.*?)(?=<!-- \[3단계\])', html_content, re.DOTALL)
            if match:
                hurricane_section_2 = match.group(1)
                break
    
    if not hurricane_section_2:
        print("Could not find previous hurricane specific section 2.")
        # 만약 못 찾으면 기본 3개 이미지 렌더링 코드로 대체
        hurricane_section_2 = """<!-- [2단계] 시각적 신뢰 (시공 사례) -->
            <div class="detail-section">
                <h2 class="section-title">본사 공식 대리점의 전문 시공</h2>
                <div class="trust-badge">✓ 충남대리점 전문 기사 직접 방문 시공</div>
                <div class="trust-badge">✓ 깔끔한 마감 및 기존 후드 수거</div>
                <div class="trust-badge">✓ 이전설치와 폐기수거가 포함된 이벤트 가격</div>
                
                <p style="color: #ddd; font-size: 14px; margin-bottom: 16px; line-height: 1.6;">
                    많은 아파트 단지에서 이미 하츠 허리케인 후드를 선택하고 계십니다.<br>
                    강력한 성능의 정통 스테인리스 디자인으로 주방의 품격을 높여드립니다.
                </p>

                <img src="https://flyer-event-page-2026.web.app/images/catalog/deco_page_20_bottom_right.png" alt="시공사례1" style="width: 100%; border-radius: 8px; margin-bottom: 8px;">
                <img src="https://flyer-event-page-2026.web.app/images/catalog/deco_page_21_top_left.png" alt="시공사례2" style="width: 100%; border-radius: 8px; margin-bottom: 8px;">
                <img src="https://flyer-event-page-2026.web.app/images/catalog/deco_page_22_top_right.png" alt="시공사례3" style="width: 100%; border-radius: 8px;">
                <p style="text-align: center; color: #888; font-size: 12px; margin-top: 8px;">[다양한 현장에 설치된 허리케인 후드 사례]</p>
            </div>\n\n            """

    # 3. 현재 엑티브한(가장 최신) HTML 템플릿 가져오기
    current_html = pages[-1]['html']
    
    # 4. 현재 템플릿의 2단계를 hurricane_section_2로 치환
    new_html = re.sub(r'<!-- \[2단계\] 시각적 신뢰 \(시공 사례\) -->.*?(?=<!-- \[3단계\])', hurricane_section_2, current_html, flags=re.DOTALL)
    
    # 5. 새 버전 생성 및 DB 업데이트
    for p in pages:
        p['is_active'] = False
        
    today = datetime.datetime.now()
    date_str = today.strftime('%y.%m.%d %H:%M')
    new_version = {
        'id': f"v1_{int(today.timestamp()*1000)}",
        'title': f"AI 생성 버전 (시공사례 복구 {date_str})",
        'is_active': True,
        'html': new_html
    }
    pages.append(new_version)
    
    update_req = urllib.request.Request(url, data=json.dumps({'detail_pages': pages}).encode(), headers={
        'apikey': key,
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
    }, method='PATCH')
    
    with urllib.request.urlopen(update_req) as update_res:
        print("Success: Hurricane section 2 reverted to original 3 images.")
