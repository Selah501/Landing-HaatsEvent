import sys

with open('landing/public/admin_v2.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 기존에 잘못 들어간 JS 코드 제거 (supabase-js 태그 사이에 들어간 부분)
start_marker = "// [시공 검색 V2] 뷰 모드 토글"
end_marker = "function closePhotoModal() {\n            document.getElementById('photo-viewer-modal').style.display = 'none';\n        }"

start_idx = html.find(start_marker)
if start_idx != -1:
    end_idx = html.find(end_marker, start_idx)
    if end_idx != -1:
        end_idx += len(end_marker)
        html = html[:start_idx] + html[end_idx:]

js_addition = """
<script>
        // [시공 검색 V2] 뷰 모드 토글
        let currentSearchMode = 'card'; // 'card' or 'table'
        function toggleSearchView(mode) {
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
        }

        async function searchArchiveTable() {
            const startDateStr = document.getElementById('search-date-start').value;
            const endDateStr = document.getElementById('search-date-end').value;
            const aptKeyword = document.getElementById('search-apt').value.trim().toLowerCase();
            const phoneKeyword = document.getElementById('search-phone').value.trim().toLowerCase();
            const notesKeyword = document.getElementById('search-notes').value.trim().toLowerCase();
            
            document.getElementById('search-results-stats').innerHTML = "검색 중... <span class='spinner'></span>";
            const tbody = document.querySelector('#search-grid-table tbody');
            tbody.innerHTML = "<tr><td colspan='6' style='text-align:center;'>검색 중입니다...</td></tr>";

            try {
                const snapshot = await window.fbDatabase.ref('reservations').once('value');
                if (!snapshot.exists()) {
                    document.getElementById('search-results-stats').textContent = "데이터가 0건입니다.";
                    tbody.innerHTML = "<tr><td colspan='6' style='text-align:center;'>데이터가 없습니다.</td></tr>";
                    return;
                }

                const data = snapshot.val();
                let results = [];
                
                const startTs = startDateStr ? new Date(startDateStr + "T00:00:00").getTime() : 0;
                const endTs = endDateStr ? new Date(endDateStr + "T23:59:59").getTime() : 9999999999999;

                for (let date in data) {
                    const dateTs = new Date(date + "T00:00:00").getTime();
                    if(startTs && dateTs < startTs) continue;
                    if(endTs && dateTs > endTs) continue;

                    for (let slot in data[date]) {
                        const evt = data[date][slot];
                        let matchApt = true;
                        let matchPhone = true;
                        let matchNotes = true;
                        
                        const title = evt.title ? evt.title.toLowerCase() : '';
                        const phone = evt.contact_info ? evt.contact_info.toLowerCase() : '';
                        const notes = evt.notes ? evt.notes.toLowerCase() : '';
                        
                        if(aptKeyword && !title.includes(aptKeyword)) matchApt = false;
                        if(phoneKeyword && !phone.includes(phoneKeyword)) matchPhone = false;
                        if(notesKeyword && !notes.includes(notesKeyword)) matchNotes = false;

                        if (matchApt && matchPhone && matchNotes) {
                            results.push({ date, slot, ...evt });
                        }
                    }
                }

                results.sort((a, b) => {
                    const timeA = new Date(`${a.date}T${a.slot.split('~')[0]}`).getTime();
                    const timeB = new Date(`${b.date}T${b.slot.split('~')[0]}`).getTime();
                    return timeB - timeA;
                });

                document.getElementById('search-results-stats').textContent = `검색 완료: 총 ${results.length}건`;
                renderSearchResultsTable(results);
                
            } catch (err) {
                console.error("검색 중 에러:", err);
                document.getElementById('search-results-stats').textContent = "검색 중 에러가 발생했습니다.";
                tbody.innerHTML = `<tr><td colspan='6' style='text-align:center;'>에러 발생: ${err.message}</td></tr>`;
            }
        }

        function renderSearchResultsTable(results) {
            const tbody = document.querySelector('#search-grid-table tbody');
            tbody.innerHTML = '';
            
            if (results.length === 0) {
                tbody.innerHTML = "<tr><td colspan='6' style='text-align:center;'>검색 결과가 없습니다.</td></tr>";
                return;
            }

            results.forEach(res => {
                const tr = document.createElement('tr');
                
                let photoBtnHTML = '-';
                if(res.media && res.media.length > 0) {
                    const safeUrls = JSON.stringify(res.media).replace(/"/g, '&quot;');
                    photoBtnHTML = `<button class="btn btn-primary" style="padding:4px 8px; font-size:12px;" onclick="openPhotoModal(${safeUrls})">사진 (${res.media.length})</button>`;
                }
                
                let usedProdsHTML = '';
                if(res.usedProducts && res.usedProducts.length > 0) {
                    usedProdsHTML = res.usedProducts.map(p => `<div><span style="color:var(--color-interactive-lime);">[${p.brand || '하츠'}]</span> ${p.name || ''} <b>${p.price||0}원</b></div>`).join('');
                } else if(res.mainProducts && res.mainProducts.length > 0) {
                    usedProdsHTML = res.mainProducts.map(p => `<div><span style="color:var(--color-highlight-gold);">(예약)</span> ${p}</div>`).join('');
                }

                tr.innerHTML = `
                    <td>${res.title || '이름없음'}</td>
                    <td>${res.date}<br><span style="font-size:12px;color:#aaa;">${res.slot}</span></td>
                    <td>${res.contact_info || '-'}</td>
                    <td>${usedProdsHTML || '-'}</td>
                    <td>${res.notes || '-'}</td>
                    <td style="text-align:center;">${photoBtnHTML}</td>
                `;
                tbody.appendChild(tr);
            });
        }

        function openPhotoModal(urls) {
            const modal = document.getElementById('photo-viewer-modal');
            const container = document.getElementById('photo-gallery-container');
            container.innerHTML = '';
            
            if(Array.isArray(urls)) {
                urls.forEach(url => {
                    const img = document.createElement('img');
                    img.src = url;
                    img.onclick = () => window.open(url, '_blank');
                    img.style.cursor = 'pointer';
                    container.appendChild(img);
                });
            }
            modal.style.display = 'flex';
        }
        
        function closePhotoModal() {
            document.getElementById('photo-viewer-modal').style.display = 'none';
        }
</script>
"""
if "function toggleSearchView(" not in html:
    html = html.replace('</body>', js_addition + '\n</body>')
    with open('landing/public/admin_v2.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("JS Function appended successfully to body end.")
else:
    print("JS Function already exists.")
