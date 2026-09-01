import re

with open('landing/public/admin_v2.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. 모달 창 스타일 패치 (상하 스크롤 문제 및 닫기 버튼 잘림 해결)
# 기존 modal-content 에 max-height 와 overflow-y 추가
old_modal_content = 'class="modal-content" style="padding:20px; text-align:left; border:1px solid #444; width:90%; max-width:800px; background-color:#000;"'
new_modal_content = 'class="modal-content" style="padding:20px; text-align:left; border:1px solid #444; width:90%; max-width:800px; max-height: 90vh; overflow-y: auto; background-color:#000;"'
html = html.replace(old_modal_content, new_modal_content)

# photo-gallery-container 에도 overflow-y: auto 추가
old_gallery = 'id="photo-gallery-container" class="photo-gallery" style="display: flex; gap: 10px; overflow-x: auto; padding-bottom: 10px;"'
new_gallery = 'id="photo-gallery-container" class="photo-gallery" style="display: flex; gap: 10px; max-height: 70vh; overflow-y: auto; padding-bottom: 10px;"'
html = html.replace(old_gallery, new_gallery)


# 2. 테이블 가로 스크롤 및 잘림 문제 해결
# table 태그의 width 100% 에 min-width 를 부여하여 억지로 찌그러지지 않고 스크롤바가 생기도록 강제함.
old_table = '<table id="search-grid-table" class="archive-table">'
new_table = '<table id="search-grid-table" class="archive-table" style="min-width: 1000px;">'
html = html.replace(old_table, new_table)

with open('landing/public/admin_v2.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("UI patched for modal scrolling and table horizontal scrolling.")
