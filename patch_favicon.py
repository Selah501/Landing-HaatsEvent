import re

with open('landing/public/admin_v2.html', 'r', encoding='utf-8') as f:
    html = f.read()

# <head> 안에 favicon 태그 추가
if 'rel="icon"' not in html:
    html = html.replace('<head>', '<head>\n    <link rel="icon" href="data:,">')

with open('landing/public/admin_v2.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("Favicon patch applied.")
