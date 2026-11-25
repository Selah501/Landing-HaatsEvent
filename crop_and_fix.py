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
    
    target_page = None
    # 1순위: 활성화된 항목 찾기
    for p in reversed(pages):
        if p.get('is_active', False):
            target_page = p
            break
            
    # 2순위: 모두 삭제되어 활성화된게 없으면 가장 마지막 항목 쓰기
    if not target_page and len(pages) > 0:
        target_page = pages[-1]
        
    if not target_page:
        print("수정할 페이지 내역이 전혀 없습니다!")
        exit(1)
        
    html_content = target_page['html']
    
    # 2단계 영역 찾기
    match = re.search(r'(<!-- \[2단계\] 시각적 신뢰 \(시공 사례\) -->.*?)(?=<!-- \[3단계\])', html_content, re.DOTALL)
    if not match:
        print("2단계를 찾을 수 없음")
        exit()
        
    section_2 = match.group(1)
    
    # 확실한 교체
    new_section_2 = """<!-- [2단계] 시각적 신뢰 (시공 사례) -->
            <div class="detail-section">
                <h2 class="section-title">본사 공식 대리점의 전문 시공</h2>
                <div class="trust-badge">✓ 충남대리점 전문 기사 직접 방문 시공</div>
                <div class="trust-badge">✓ 깔끔한 마감 및 기존 후드 수거</div>
                <div class="trust-badge">✓ 이전설치와 폐기수거가 포함된 이벤트 가격</div>
                
                <p style="color: #ddd; font-size: 14px; margin-bottom: 16px; line-height: 1.6;">
                    많은 아파트 단지에서 이미 하츠 허리케인 후드를 선택하고 계십니다.<br>
                    기존의 낡고 기름진 구형 후드를 탈거하고, 세련된 스테인리스 디자인과 기름받이가 적용된 신제품으로 완벽하게 교체해 드립니다.
                </p>

                <img src="../images/products/hrh90s/install_cropped.png" alt="시공사례" style="width: 100%; border-radius: 8px;">
                <p style="text-align: center; color: #888; font-size: 12px; margin-top: 8px;">[실제 아파트 현장 허리케인 후드 시공 완료 사진]</p>
            </div>\n\n"""
            
    new_html = html_content.replace(section_2, new_section_2)
    
    for p in pages:
        p['is_active'] = False
        
    today = datetime.datetime.now()
    date_str = today.strftime('%y.%m.%d %H:%M')
    new_version = {
        'id': f"v1_{int(today.timestamp()*1000)}",
        'title': f"AI 생성 버전 (다시 복구된 완벽 크롭판 {date_str})",
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
        print("Success: 복구 및 크롭판 재업로드 완료!")
