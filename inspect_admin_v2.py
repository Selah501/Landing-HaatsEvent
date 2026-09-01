import re
import sys

# 표준 출력을 utf-8로 강제 변경 (윈도우 콘솔 문제 해결)
sys.stdout.reconfigure(encoding='utf-8')

with open('landing/public/admin_v2.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 검색 탭 찾기
m = re.search(r'<div[^>]*id=["\']?(search-tab|archive-tab|tab-search|search|tab2)["\']?[^>]*>.*?(?=<!--|$)', content, re.IGNORECASE | re.DOTALL)
if m:
    print(m.group(0)[:1500])
else:
    # 탭 메뉴나 다른 구조 출력
    print("Tab not found. Trying to find search keywords...")
    m2 = re.search(r'.{0,200}시공\s*검색.{0,500}', content, re.IGNORECASE | re.DOTALL)
    if m2:
        print(m2.group(0))
    else:
        print("Keyword not found.")
