import re

# 참조 파일(이전 버전)에서 renderEventList 함수 추출
with open('temp_ref_admin.html', 'r', encoding='utf-8') as f:
    ref_content = f.read()

# renderEventList 함수 전체 추출
m = re.search(r'window\.renderEventList\s*=\s*function\(\)\s*\{.*?\n\s*\}', ref_content, re.DOTALL)
if m:
    func_text = m.group(0)
    print("Found renderEventList:")
    print(func_text[:3000])
else:
    # 더 넓게 검색
    idx = ref_content.find('window.renderEventList')
    if idx != -1:
        print("Found at index:", idx)
        print(ref_content[idx:idx+3000])
    else:
        print("NOT FOUND")
