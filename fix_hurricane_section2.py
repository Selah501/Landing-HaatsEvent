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
    
    # "AI 생성 버전 (26.09.18)" 찾기 (원본 소스)
    source_html = ""
    for p in pages:
        if p.get('title') == 'AI 생성 버전 (26.09.18)':
            source_html = p.get('html', '')
            break
            
    if not source_html:
        print("소스 버전 'AI 생성 버전 (26.09.18)'을 찾을 수 없습니다.")
        exit(1)
        
    # 소스 HTML에서 2단계 추출
    match = re.search(r'(<!-- \[2단계\].*?)(?=<!-- \[3단계\])', source_html, re.DOTALL)
    if not match:
        print("소스 HTML에서 2단계를 찾을 수 없습니다.")
        exit(1)
        
    section_2_code = match.group(1)
    
    # "AI 생성 버전 (26.09.18 수정)" 찾기 (타겟 소스, 이것을 기반으로 새 버전을 만듬)
    # 가장 마지막 활성 버전을 타겟으로 삼거나 제목으로 찾음
    target_html = ""
    for p in reversed(pages):
        # 최신 수정버전을 타겟으로 함 (아까 만든 "시공사례 복구" 버전 등)
        target_html = p.get('html', '')
        break
        
    # 타겟 HTML의 2단계를 소스 HTML의 2단계로 교체
    new_html = re.sub(r'<!-- \[2단계\].*?(?=<!-- \[3단계\])', section_2_code, target_html, flags=re.DOTALL)
    
    # 기존 활성 버전 비활성화
    for p in pages:
        p['is_active'] = False
        
    # 새 버전 생성
    today = datetime.datetime.now()
    date_str = today.strftime('%y.%m.%d')
    new_version = {
        'id': f"v1_{int(today.timestamp()*1000)}",
        'title': f"AI 생성 버전 ({date_str} 최종수정)",
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
        print("Success: 2단계 시공사례 교체 완료. (새 버전 생성)")
