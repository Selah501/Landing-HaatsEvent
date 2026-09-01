import sys

with open('landing/public/admin_v2.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. 테이블 뷰 영역 추가
table_html = """
            </div> <!-- End search-grid (replaced by script) -->

            <!-- 테이블 뷰 영역 -->
            <div id="search-table-container" style="display: none; overflow-x: auto; margin-top: 16px;">
                <table id="search-grid-table" class="archive-table">
                    <thead>
                        <tr>
                            <th style="width: 15%;">현장(고객명)</th>
                            <th style="width: 12%;">시공일자</th>
                            <th style="width: 15%;">연락처</th>
                            <th style="width: 28%;">시공품목 (Used Products)</th>
                            <th style="width: 20%;">메모/보고사항</th>
                            <th style="width: 10%;">사진</th>
                        </tr>
                    </thead>
                    <tbody>
                        <!-- 테이블 로우가 여기에 추가됨 -->
                    </tbody>
                </table>
            </div>
"""

# search-grid가 열리고 닫히는 영역 뒤에 삽입해야 하는데 가장 안전한 방법은 `<div id="search-grid" class="schedule-grid" style="margin-top: 16px;">` 문자열을 찾은 후, 그 뒤에 빈 내용이 있을테니 이를 통째로 교체하는 것이다.
# 기존에 search-grid 내부는 빈 상태로 두었음(Javascript로 채움)
grid_str = '<div id="search-grid" class="schedule-grid" style="margin-top: 16px;">'
if 'id="search-table-container"' not in html:
    # 찾기 쉽게 grid_str 문자열 이후 줄바꿈을 포함하여 바로 삽입
    idx = html.find(grid_str)
    if idx != -1:
        # grid_str 과 그 뒤의 </div> 를 찾는다.
        end_idx = html.find('</div>', idx)
        if end_idx != -1:
            end_div_idx = end_idx + 6
            # search-grid </div> 뒤에 table_html 추가
            html = html[:end_div_idx] + "\n" + table_html + html[end_div_idx:]
            print("Table container added.")
        else:
            print("Could not find </div> for search-grid.")
    else:
        print("Could not find search-grid.")

# 2. 사진 모달 추가
modal_html = """
    <!-- Photo Viewer Modal -->
    <div id="photo-viewer-modal" class="modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.9); z-index:9999; justify-content:center; align-items:center;">
        <div class="modal-content" style="padding:20px; text-align:left; border:1px solid #444; width:90%; max-width:800px; background-color:#000;">
            <div style="display:flex; justify-content:space-between; margin-bottom:16px;">
                <h3 style="margin:0; color:var(--color-interactive-lime);">현장 사진 보기</h3>
                <button onclick="closePhotoModal()" style="background:none; border:none; color:#fff; font-size:24px; cursor:pointer;">&times;</button>
            </div>
            <div id="photo-gallery-container" class="photo-gallery" style="display: flex; gap: 10px; overflow-x: auto; padding-bottom: 10px;">
                <!-- 이미지 렌더링 영역 -->
            </div>
        </div>
    </div>
"""

if 'id="photo-viewer-modal"' not in html:
    html = html.replace('</body>', modal_html + '\n</body>')
    print("Modal added.")

with open('landing/public/admin_v2.html', 'w', encoding='utf-8') as f:
    f.write(html)
