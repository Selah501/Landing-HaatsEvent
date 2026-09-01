import re
import sys

with open('landing/public/admin_v2.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. <thead> 수정
old_thead = """                    <thead>
                        <tr>
                            <th style="width: 15%;">현장(고객명)</th>
                            <th style="width: 12%;">시공일자</th>
                            <th style="width: 15%;">연락처</th>
                            <th style="width: 28%;">시공품목 (Used Products)</th>
                            <th style="width: 20%;">메모/보고사항</th>
                            <th style="width: 10%;">사진</th>
                        </tr>
                    </thead>"""

new_thead = """                    <thead>
                        <tr>
                            <th style="width: 15%; cursor:pointer;" onclick="window.sortTable('title')">현장(고객명) ↕</th>
                            <th style="width: 12%; cursor:pointer;" onclick="window.sortTable('date')">시공일자 ↕</th>
                            <th style="width: 15%; cursor:pointer;" onclick="window.sortTable('phone')">연락처 ↕</th>
                            <th style="width: 28%; cursor:pointer;" onclick="window.sortTable('products')">시공품목 ↕</th>
                            <th style="width: 20%; cursor:pointer;" onclick="window.sortTable('notes')">메모/보고사항 ↕</th>
                            <th style="width: 10%;">사진</th>
                        </tr>
                    </thead>"""
html = html.replace(old_thead, new_thead)


# 2. toggleSearchView 안에서 한달 전 날짜 강제 주입 부분 제거
# 기존 코드:
#                if(!document.getElementById('search-date-start').value) {
#                    const today = new Date();
#                    const pastMonth = new Date();
#                    pastMonth.setMonth(today.getMonth() - 1);
#                    document.getElementById('search-date-start').value = pastMonth.toISOString().split('T')[0];
#                    document.getElementById('search-date-end').value = today.toISOString().split('T')[0];
#                }
date_init_pattern = r'if\(!document\.getElementById\(\'search-date-start\'\)\.value\) \{.*?document\.getElementById\(\'search-date-end\'\)\.value = [^\}]*\}'
html = re.sub(date_init_pattern, '', html, flags=re.IGNORECASE | re.DOTALL)


# 3. JS 정렬 로직 추가 & 현재 결과 저장 로직 추가
js_sort_logic = """
        window.currentTableResults = [];
        window.currentSortCol = 'date';
        window.currentSortDesc = true;

        window.sortTable = function(col) {
            if(!window.currentTableResults || window.currentTableResults.length === 0) return;
            
            if(window.currentSortCol === col) {
                window.currentSortDesc = !window.currentSortDesc;
            } else {
                window.currentSortCol = col;
                window.currentSortDesc = true;
            }

            window.currentTableResults.sort((a, b) => {
                let valA = '';
                let valB = '';
                
                if(col === 'title') {
                    valA = a.title || (a.customerInfo && a.customerInfo.apt) || '';
                    valB = b.title || (b.customerInfo && b.customerInfo.apt) || '';
                } else if(col === 'date') {
                    valA = a.date + " " + a.slot;
                    valB = b.date + " " + b.slot;
                } else if(col === 'phone') {
                    valA = a.contact_info || (a.customerInfo && a.customerInfo.phone) || '';
                    valB = b.contact_info || (b.customerInfo && b.customerInfo.phone) || '';
                } else if(col === 'notes') {
                    valA = a.notes || (a.report && a.report.notes) || '';
                    valB = b.notes || (b.report && b.report.notes) || '';
                } else if(col === 'products') {
                    const ua = a.usedProducts || (a.report && a.report.usedProducts) || a.mainProducts || [];
                    const ub = b.usedProducts || (b.report && b.report.usedProducts) || b.mainProducts || [];
                    valA = ua.map(p => typeof p === 'object' ? p.name : p).join(',');
                    valB = ub.map(p => typeof p === 'object' ? p.name : p).join(',');
                }
                
                valA = String(valA).toLowerCase();
                valB = String(valB).toLowerCase();

                if (valA < valB) return window.currentSortDesc ? 1 : -1;
                if (valA > valB) return window.currentSortDesc ? -1 : 1;
                return 0;
            });
            
            window.renderSearchResultsTable(window.currentTableResults);
        };
"""

# searchArchiveTable 내의 results.sort 부분을 건드리지 않고, window.renderSearchResultsTable 호출 직전에 currentTableResults 에 할당하게 한다.
html = html.replace("window.renderSearchResultsTable(results);", """
                window.currentTableResults = results;
                document.getElementById('search-results-stats').textContent = `검색 완료: 총 ${results.length}건 (현재 ${results.length}건 표시됨)`;
                window.renderSearchResultsTable(results);
""")

if "window.sortTable = function(col)" not in html:
    idx = html.find("window.searchArchiveTable = async function()")
    html = html[:idx] + js_sort_logic + "\n        " + html[idx:]


with open('landing/public/admin_v2.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Patch UI features completed.")
