import re
import subprocess
import sys

html = open(r'c:\dev\전단지이벤트\landing\public\admin_v2.html', 'r', encoding='utf-8').read()
match = re.search(r'<script type="module">([\s\S]*?)</script>', html)
if match:
    js_code = match.group(1)
    with open('test_admin_v2.js', 'w', encoding='utf-8') as f:
        f.write(js_code)
    print("Extracted. Checking syntax...")
    result = subprocess.run(['node', '-c', 'test_admin_v2.js'], capture_output=True, text=True)
    if result.returncode != 0:
        print("Syntax error!")
        print(result.stderr)
    else:
        print("Syntax OK!")
else:
    print("Script not found.")
