import re

with open('landing/public/admin_v2.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 기존 로직: const mediaArray = res.media || (res.report && res.report.media) || [];
# 수정할 로직: const mediaArray = res.media || (res.report && res.report.mediaUrls) || (res.report && res.report.media) || (res.data && res.data.report && res.data.report.mediaUrls) || [];

old_media_logic = "const mediaArray = res.media || (res.report && res.report.media) || [];"
new_media_logic = "const mediaArray = res.media || (res.report && res.report.mediaUrls) || (res.report && res.report.media) || (res.data && res.data.report && res.data.report.mediaUrls) || [];"

if old_media_logic in html:
    html = html.replace(old_media_logic, new_media_logic)
    print("Media array logic updated.")
else:
    print("Could not find the old media logic. Checking if already updated or slightly different.")
    # 정규식으로 조금 더 유연하게 탐색
    m_logic = re.search(r'const mediaArray = [^;]+;', html)
    if m_logic:
        print("Found:", m_logic.group(0))
        html = html.replace(m_logic.group(0), new_media_logic)
        print("Media array logic updated via regex.")

with open('landing/public/admin_v2.html', 'w', encoding='utf-8') as f:
    f.write(html)
