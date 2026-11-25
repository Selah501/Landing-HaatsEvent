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
    
    # 최신 활성 버전 찾기
    target_page = None
    for p in reversed(pages):
        if p.get('is_active', False):
            target_page = p
            break

    html_content = target_page['html']
    
    # 기존 통짜 이미지(install.png)를 개별 이미지 2개로 교체
    old_img_tag = r'<img src="\./images/products/hrh90s/install\.png"[^>]*>'
    
    new_img_tags = """
                <img src="https://flyer-event-page-2026.web.app/images/catalog/deco_page_21_top_left.png" alt="시공사례1" style="width: 100%; border-radius: 8px; margin-bottom: 8px;">
                <img src="https://flyer-event-page-2026.web.app/images/catalog/deco_page_22_top_right.png" alt="시공사례2" style="width: 100%; border-radius: 8px;">
    """
    
    new_html_content = re.sub(old_img_tag, new_img_tags, html_content)
    
    # 만약 install.png가 아니라 다른 형태였다면(혹시 몰라서 폴백 추가)
    if new_html_content == html_content:
        # 2단계 영역 전체를 하드코딩해서 교체
        replacement = """<!-- [2단계] 시각적 신뢰 (시공 사례) -->
            <div class="detail-section">
                <h2 class="section-title">본사 공식 대리점의 전문 시공</h2>
                <div class="trust-badge">✓ 충남대리점 전문 기사 직접 방문 시공</div>
                <div class="trust-badge">✓ 깔끔한 마감 및 기존 후드 수거</div>
                <div class="trust-badge">✓ 이전설치와 폐기수거가 포함된 이벤트 가격</div>
                
                <p style="color: #ddd; font-size: 14px; margin-bottom: 16px; line-height: 1.6;">
                    많은 아파트 단지에서 이미 하츠 허리케인 후드를 선택하고 계십니다.<br>
                    기존의 낡고 기름진 구형 후드를 탈거하고, 세련된 스테인리스 디자인과 기름받이가 적용된 신제품으로 완벽하게 교체해 드립니다.
                </p>

                <img src="https://flyer-event-page-2026.web.app/images/catalog/deco_page_21_top_left.png" alt="시공사례1" style="width: 100%; border-radius: 8px; margin-bottom: 8px;">
                <img src="https://flyer-event-page-2026.web.app/images/catalog/deco_page_22_top_right.png" alt="시공사례2" style="width: 100%; border-radius: 8px;">
                <p style="text-align: center; color: #888; font-size: 12px; margin-top: 8px;">[실제 아파트 현장 허리케인 후드 시공 완료 사진]</p>
            </div>\n\n"""
        new_html_content = re.sub(r'(<!-- \[2단계\] 시각적 신뢰 \(시공 사례\) -->.*?)(?=<!-- \[3단계\])', replacement, html_content, flags=re.DOTALL)
    
    # 기존 활성화 해제
    for p in pages:
        p['is_active'] = False
        
    # 새 버전 추가
    today = datetime.datetime.now()
    date_str = today.strftime('%y.%m.%d %H:%M')
    new_version = {
        'id': f"v1_{int(today.timestamp()*1000)}",
        'title': f"AI 생성 버전 (시공이미지 2개로 최종 {date_str})",
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
        print("Success: 통짜 이미지 대신 개별 이미지 2장으로 완벽 교체 완료.")
