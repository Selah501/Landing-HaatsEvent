import re

with open('landing/public/admin_v2.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. </body> 직전에 넣었던 스크립트 완전 제거
js_removal_pattern = r'<script>\s*// \[시공 검색 V2\] 뷰 모드 토글.*?function closePhotoModal\(\) \{.*?\n\s*\}\n\s*<\/script>'
html = re.sub(js_removal_pattern, '', html, flags=re.IGNORECASE | re.DOTALL)

# 2. window.searchArchive = function() { ... } 의 닫는 괄호를 찾아 그 직후에 함수들을 삽입한다.
# 기존 Firebase 데이터를 접근하는 get(ref(db, ...)) 스코프 내(type="module" 내부)에 넣기 위함.
js_addition = """
        window.toggleSearchView = function(mode) {
            currentSearchMode = mode;
            if(mode === 'card') {
                document.getElementById('btn-view-card').classList.add('active');
                document.getElementById('btn-view-table').classList.remove('active');
                document.getElementById('search-basic-panel').style.display = 'flex';
                document.getElementById('search-detail-panel').style.display = 'none';
                document.getElementById('search-grid').style.display = 'grid';
                document.getElementById('search-table-container').style.display = 'none';
                document.getElementById('search-results-stats').textContent = "단순 검색 모드입니다.";
            } else {
                document.getElementById('btn-view-card').classList.remove('active');
                document.getElementById('btn-view-table').classList.add('active');
                document.getElementById('search-basic-panel').style.display = 'none';
                document.getElementById('search-detail-panel').style.display = 'block';
                document.getElementById('search-grid').style.display = 'none';
                document.getElementById('search-table-container').style.display = 'block';
                document.getElementById('search-results-stats').textContent = "상세 필터를 입력하고 검색하세요.";
                
                if(!document.getElementById('search-date-start').value) {
                    const today = new Date();
                    const pastMonth = new Date();
                    pastMonth.setMonth(today.getMonth() - 1);
                    document.getElementById('search-date-start').value = pastMonth.toISOString().split('T')[0];
                    document.getElementById('search-date-end').value = today.toISOString().split('T')[0];
                }
            }
        };

        window.searchArchiveTable = async function() {
            const startDateStr = document.getElementById('search-date-start').value;
            const endDateStr = document.getElementById('search-date-end').value;
            const aptKeyword = document.getElementById('search-apt').value.trim().toLowerCase();
            const phoneKeyword = document.getElementById('search-phone').value.trim().toLowerCase();
            const notesKeyword = document.getElementById('search-notes').value.trim().toLowerCase();
            
            document.getElementById('search-results-stats').innerHTML = "검색 중... <span class='spinner'></span>";
            const tbody = document.querySelector('#search-grid-table tbody');
            tbody.innerHTML = "<tr><td colspan='6' style='text-align:center;'>검색 중입니다...</td></tr>";

            try {
                // v9 get(ref(db, 'reservations')) 사용
                const snap = await get(ref(db, 'reservations'));
                if (!snap.exists()) {
                    document.getElementById('search-results-stats').textContent = "데이터가 0건입니다.";
                    tbody.innerHTML = "<tr><td colspan='6' style='text-align:center;'>데이터가 없습니다.</td></tr>";
                    return;
                }

                const data = snap.val() || {};
                let results = [];
                
                const startTs = startDateStr ? new Date(startDateStr + "T00:00:00").getTime() : 0;
                const endTs = endDateStr ? new Date(endDateStr + "T23:59:59").getTime() : 9999999999999;

                for (let date in data) {
                    const dateTs = new Date(date + "T00:00:00").getTime();
                    if(startTs && dateTs < startTs) continue;
                    if(endTs && dateTs > endTs) continue;

                    for (let slot in data[date]) {
                        const evt = data[date][slot];
                        // completed 상태이거나 report가 있는 등 추가 조건이 있다면 기입. 여기서는 기본 필터
                        let matchApt = true;
                        let matchPhone = true;
                        let matchNotes = true;
                        
                        const title = evt.title ? evt.title.toLowerCase() : '';
                        const phone = evt.contact_info ? evt.contact_info.toLowerCase() : '';
                        const notes = evt.notes ? evt.notes.toLowerCase() : '';
                        
                        // v9 기존 searchArchive 방식도 참고: apt는 evt.customerInfo?.apt 일 수도 있음
                        // 기존 코드 참고하여 넓게 검색
                        const searchStr = JSON.stringify(evt).toLowerCase(); 
                        
                        if(aptKeyword && !title.includes(aptKeyword) && !searchStr.includes(aptKeyword)) matchApt = false;
                        if(phoneKeyword && !phone.includes(phoneKeyword) && !searchStr.includes(phoneKeyword)) matchPhone = false;
                        if(notesKeyword && !notes.includes(notesKeyword) && !searchStr.includes(notesKeyword)) matchNotes = false;

                        if (matchApt && matchPhone && matchNotes) {
                            results.push({ date, slot, ...evt });
                        }
                    }
                }

                results.sort((a, b) => {
                    const timeA = new Date(`${a.date}T${a.slot.split('~')[0]}`).getTime();
                    const timeB = new Date(`${b.date}T${b.slot.split('~')[0]}`).getTime();
                    return timeB - timeA; // 최신순
                });

                document.getElementById('search-results-stats').textContent = `검색 완료: 총 ${results.length}건`;
                window.renderSearchResultsTable(results);
                
            } catch (err) {
                console.error("검색 중 에러:", err);
                document.getElementById('search-results-stats').textContent = "검색 중 에러가 발생했습니다.";
                tbody.innerHTML = `<tr><td colspan='6' style='text-align:center;'>에러 발생: ${err.message}</td></tr>`;
            }
        };

        window.renderSearchResultsTable = function(results) {
            const tbody = document.querySelector('#search-grid-table tbody');
            tbody.innerHTML = '';
            
            if (results.length === 0) {
                tbody.innerHTML = "<tr><td colspan='6' style='text-align:center;'>검색 결과가 없습니다.</td></tr>";
                return;
            }

            results.forEach(res => {
                const tr = document.createElement('tr');
                
                let photoBtnHTML = '-';
                // 기존 구조에 맞추기 위해 res.report.media 배열도 고려
                const mediaArray = res.media || (res.report && res.report.media) || [];
                if(mediaArray.length > 0) {
                    const safeUrls = JSON.stringify(mediaArray).replace(/"/g, '&quot;');
                    photoBtnHTML = `<button class="btn btn-primary" style="padding:4px 8px; font-size:12px;" onclick="window.openPhotoModal(${safeUrls})">사진 (${mediaArray.length})</button>`;
                }
                
                let usedProdsHTML = '';
                const usedArray = res.usedProducts || (res.report && res.report.usedProducts) || res.mainProducts || [];
                if(usedArray.length > 0) {
                    usedProdsHTML = usedArray.map(p => {
                        if (typeof p === 'object') {
                            return `<div><span style="color:var(--color-interactive-lime);">[${p.brand || '하츠'}]</span> ${p.name || ''} <b>${p.price||0}원</b></div>`;
                        } else {
                            return `<div><span style="color:var(--color-highlight-gold);">(예약)</span> ${p}</div>`;
                        }
                    }).join('');
                }

                // 현장명, 연락처, 메모
                const displayTitle = res.title || (res.customerInfo && res.customerInfo.apt) || '이름없음';
                const displayPhone = res.contact_info || (res.customerInfo && res.customerInfo.phone) || '-';
                const displayNotes = res.notes || (res.report && res.report.notes) || '-';

                tr.innerHTML = `
                    <td>${displayTitle}</td>
                    <td>${res.date}<br><span style="font-size:12px;color:#aaa;">${res.slot}</span></td>
                    <td>${displayPhone}</td>
                    <td>${usedProdsHTML || '-'}</td>
                    <td>${displayNotes}</td>
                    <td style="text-align:center;">${photoBtnHTML}</td>
                `;
                tbody.appendChild(tr);
            });
        };

        window.openPhotoModal = function(urls) {
            const modal = document.getElementById('photo-viewer-modal');
            const container = document.getElementById('photo-gallery-container');
            container.innerHTML = '';
            
            if(Array.isArray(urls)) {
                urls.forEach(url => {
                    const img = document.createElement('img');
                    img.src = url;
                    img.onclick = () => window.open(url, '_blank');
                    img.style.cursor = 'pointer';
                    // object-fit cover 등으로 깔끔하게 보이게 처리
                    img.style.width = '200px';
                    img.style.height = '200px';
                    img.style.objectFit = 'cover';
                    img.style.borderRadius = '8px';
                    container.appendChild(img);
                });
            }
            modal.style.display = 'flex';
        };
        
        window.closePhotoModal = function() {
            document.getElementById('photo-viewer-modal').style.display = 'none';
        };
"""

# searchArchive 함수 내부 코드를 건드리지 않고, window.searchArchive = function() { ... } 의 닫는 중괄호 } 를 찾은 다음 그 뒤에 코드를 붙이는 건 너무 복잡할 수 있음.
# 더 간단하게, `window.searchArchive = function() {` 선언 바로 앞줄에 함수들을 삽입하자. 그곳은 확실히 모듈 스코프 내부이다.
if "window.searchArchiveTable = async function()" not in html:
    idx = html.find("window.searchArchive = function()")
    if idx != -1:
        html = html[:idx] + js_addition + "\n        " + html[idx:]
        print("JS Functions injected into module scope successfully.")
    else:
        print("Failed to find window.searchArchive")
else:
    print("JS Functions already exist in module scope.")

with open('landing/public/admin_v2.html', 'w', encoding='utf-8') as f:
    f.write(html)
