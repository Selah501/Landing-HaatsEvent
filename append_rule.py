import os

file_path = r"c:\dev\전단지이벤트\.agents\AGENTS.md"
with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

new_rule = "\n5. [터미널 실행 승인 최소화] IDE의 보안 팝업(Allow running this command?)이 반복해서 뜨는 것을 방지하기 위해, `python -c \"...\"` 이나 `node -e \"...\"` 같은 일회성 인라인 스크립트 명령어 사용을 금지합니다. 대신, 필요한 로직은 항상 전용 스크립트 파일(.py, .js)로 작성하여 저장한 뒤, 해당 파일을 실행하는 방식을 사용하십시오.\n</RULE[user_project]>"

if "</RULE[user_project]>" in content:
    content = content.replace("</RULE[user_project]>", new_rule)
else:
    content += new_rule

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Rule appended.")
