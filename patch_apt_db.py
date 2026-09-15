import re

file_path = r"c:\dev\전단지이벤트\landing\public\apt_db.html"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. CSS 추가
css_to_add = """
        /* 교체 품목 테이블 스타일 */
        .replacement-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
        .replacement-table th, .replacement-table td { border: 1px solid #e5e7eb; padding: 8px; text-align: center; }
        .replacement-table th { background: #f9fafb; font-weight: 600; color: #374151; }
        .replacement-table input, .replacement-table select { width: 100%; box-sizing: border-box; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; }
        .replacement-table .img-preview { display: flex; gap: 4px; justify-content: center; flex-wrap: wrap; margin-top: 4px; }
        .replacement-table .img-preview img { width: 40px; height: 40px; object-fit: cover; border-radius: 4px; cursor: pointer; border: 1px solid #d1d5db; }
        .replacement-table .btn-sm { padding: 4px 8px; font-size: 12px; border-radius: 4px; cursor: pointer; border: none; }
        .btn-upload { background: #3b82f6; color: white; }
        .btn-del-row { background: #ef4444; color: white; }
        
        /* 모달 스타일 */
        #img-modal { display: none; position: fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:9999; justify-content:center; align-items:center; }
        #img-modal img { max-width: 90%; max-height: 90%; border-radius: 8px; }
        #img-modal .close-btn { position: absolute; top: 20px; right: 20px; font-size: 30px; color: white; cursor: pointer; }
"""
if "/* 교체 품목 테이블 스타일 */" not in content:
    content = content.replace("</style>", css_to_add + "\n    </style>")

# 2. HTML Section 추가
html_to_add = """
                    <div class="form-section">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid #f3f4f6; padding-bottom: 10px;">
                            <h3 style="margin: 0; border: none; padding: 0;">교체 품목 및 자료 (문서/이미지)</h3>
                            <div>
                                <input type="text" id="search-replacement" placeholder="항목 검색..." style="padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 13px; margin-right: 8px;" oninput="renderReplacements()">
                                <select id="sort-replacement" style="padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 13px; margin-right: 8px;" onchange="renderReplacements()">
                                    <option value="none">정렬 안함</option>
                                    <option value="old_asc">교체전 제품 (오름차순)</option>
                                    <option value="cat_asc">구분 (오름차순)</option>
                                </select>
                                <button type="button" class="btn-primary btn-sm" onclick="addReplacementRow()" style="padding: 6px 12px; font-size: 13px;">+ 행 추가</button>
                            </div>
                        </div>
                        <div style="overflow-x: auto;">
                            <table class="replacement-table" id="replacement-table">
                                <thead>
                                    <tr>
                                        <th style="width: 15%;">교체전 제품</th>
                                        <th style="width: 15%;">교체제품</th>
                                        <th style="width: 12%;">구분</th>
                                        <th style="width: 15%;">특징</th>
                                        <th style="width: 25%;">이미지/문서 (최대 5장)</th>
                                        <th style="width: 13%;">특기사항</th>
                                        <th style="width: 5%;">관리</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <!-- Rows will be injected here -->
                                </tbody>
                            </table>
                        </div>
                    </div>
"""
if "교체 품목 및 자료 (문서/이미지)" not in content:
    content = content.replace('<div class="form-section">\n                        <h3>관리 정보 & 비고</h3>', html_to_add + '\n                    <div class="form-section">\n                        <h3>관리 정보 & 비고</h3>')

# 3. 모달 HTML 추가 (</body> 앞)
modal_html = """
    <!-- 이미지 모달 -->
    <div id="img-modal" onclick="this.style.display='none'">
        <span class="close-btn">&times;</span>
        <img id="img-modal-content" src="" alt="Full size" onclick="event.stopPropagation()">
    </div>
"""
if "<!-- 이미지 모달 -->" not in content:
    content = content.replace("</body>", modal_html + "\n</body>")

# 4. Firebase 모듈 스크립트 추가
firebase_script = """
    <script type="module">
        import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
        import { getStorage, ref as sRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

        const firebaseConfig = {
            databaseURL: "https://flyer-event-page-2026-default-rtdb.firebaseio.com",
            projectId: "flyer-event-page-2026",
            storageBucket: "flyer-event-page-2026.firebasestorage.app"
        };
        const app = initializeApp(firebaseConfig);
        window.firebaseStorage = getStorage(app);
        window.sRef = sRef;
        window.uploadBytes = uploadBytes;
        window.getDownloadURL = getDownloadURL;
    </script>
"""
if "firebase-storage.js" not in content:
    content = content.replace('<script src="./auth.js?v=2"></script>', '<script src="./auth.js?v=2"></script>\n' + firebase_script)

# 5. JS 변수 및 함수 추가
js_logic = """
        let currentReplacements = []; // 현재 선택된 아파트의 교체품목 데이터 배열

        function renderReplacements() {
            const tbody = document.querySelector('#replacement-table tbody');
            tbody.innerHTML = '';
            
            const keyword = document.getElementById('search-replacement').value.toLowerCase();
            const sortMode = document.getElementById('sort-replacement').value;
            
            let filtered = currentReplacements.filter(item => {
                return (item.old_product || '').toLowerCase().includes(keyword) ||
                       (item.new_product || '').toLowerCase().includes(keyword) ||
                       (item.category || '').toLowerCase().includes(keyword) ||
                       (item.features || '').toLowerCase().includes(keyword) ||
                       (item.notes || '').toLowerCase().includes(keyword);
            });
            
            if (sortMode === 'old_asc') {
                filtered.sort((a, b) => (a.old_product || '').localeCompare(b.old_product || ''));
            } else if (sortMode === 'cat_asc') {
                filtered.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
            }

            if (filtered.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="color:#6b7280; padding: 20px;">등록된 품목이 없습니다.</td></tr>';
                return;
            }

            filtered.forEach((item) => {
                const idx = currentReplacements.indexOf(item);
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><input type="text" value="${item.old_product || ''}" onchange="updateReplacement(${idx}, 'old_product', this.value)"></td>
                    <td><input type="text" value="${item.new_product || ''}" onchange="updateReplacement(${idx}, 'new_product', this.value)"></td>
                    <td>
                        <input type="text" list="cat-list" value="${item.category || ''}" onchange="updateReplacement(${idx}, 'category', this.value)" style="width:100%;">
                        <datalist id="cat-list">
                            <option value="주방후드">
                            <option value="영업자료">
                        </datalist>
                    </td>
                    <td><input type="text" value="${item.features || ''}" onchange="updateReplacement(${idx}, 'features', this.value)"></td>
                    <td>
                        <div style="display:flex; flex-direction:column; gap:4px; align-items:center;">
                            <button type="button" class="btn-sm btn-upload" onclick="uploadReplacementMedia(${idx})" ${item.mediaUrls && item.mediaUrls.length >= 5 ? 'disabled style="opacity:0.5;"' : ''}>첨부 (${item.mediaUrls ? item.mediaUrls.length : 0}/5)</button>
                            <div class="img-preview">
                                ${(item.mediaUrls || []).map((url, mIdx) => `
                                    <div style="position:relative; display:inline-block;">
                                        <img src="${url}" onclick="openImgModal('${url}')">
                                        <div onclick="removeReplacementMedia(${idx}, ${mIdx})" style="position:absolute; top:-5px; right:-5px; background:red; color:white; border-radius:50%; width:16px; height:16px; font-size:10px; cursor:pointer; display:flex; align-items:center; justify-content:center;">&times;</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </td>
                    <td><input type="text" value="${item.notes || ''}" onchange="updateReplacement(${idx}, 'notes', this.value)"></td>
                    <td><button type="button" class="btn-sm btn-del-row" onclick="deleteReplacementRow(${idx})">❌</button></td>
                `;
                tbody.appendChild(tr);
            });
        }

        function addReplacementRow() {
            currentReplacements.push({
                old_product: '',
                new_product: '-',
                category: '',
                features: '',
                mediaUrls: [],
                notes: ''
            });
            renderReplacements();
        }

        function updateReplacement(idx, field, value) {
            if(currentReplacements[idx]) {
                currentReplacements[idx][field] = value;
            }
        }

        function deleteReplacementRow(idx) {
            if(confirm('해당 행을 삭제하시겠습니까?')) {
                currentReplacements.splice(idx, 1);
                renderReplacements();
            }
        }

        function openImgModal(url) {
            document.getElementById('img-modal-content').src = url;
            document.getElementById('img-modal').style.display = 'flex';
        }

        async function uploadReplacementMedia(idx) {
            if (!window.firebaseStorage || !window.uploadBytes) {
                Swal.fire('오류', '업로드 모듈 초기화 중입니다. 잠시 후 다시 시도해주세요.', 'warning');
                return;
            }
            
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*,application/pdf';
            fileInput.multiple = true;
            fileInput.onchange = async (e) => {
                const files = Array.from(e.target.files);
                if(files.length === 0) return;
                
                const item = currentReplacements[idx];
                const currentCount = item.mediaUrls ? item.mediaUrls.length : 0;
                if(currentCount + files.length > 5) {
                    Swal.fire('오류', '최대 5장까지만 업로드 가능합니다.', 'error');
                    return;
                }

                Swal.fire({ title: '업로드 중...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
                
                try {
                    const uploaded = [];
                    for(const file of files) {
                        const filename = Date.now() + '_' + file.name;
                        const storageRef = window.sRef(window.firebaseStorage, 'apt_db/' + filename);
                        await window.uploadBytes(storageRef, file);
                        const url = await window.getDownloadURL(storageRef);
                        uploaded.push(url);
                    }
                    
                    if(!item.mediaUrls) item.mediaUrls = [];
                    item.mediaUrls = [...item.mediaUrls, ...uploaded];
                    renderReplacements();
                    Swal.close();
                } catch (err) {
                    console.error(err);
                    Swal.fire('오류', '파일 업로드 실패: ' + err.message, 'error');
                }
            };
            fileInput.click();
        }

        function removeReplacementMedia(rowIdx, mediaIdx) {
            if(confirm('이 이미지를 삭제하시겠습니까?')) {
                currentReplacements[rowIdx].mediaUrls.splice(mediaIdx, 1);
                renderReplacements();
            }
        }
"""
if "function renderReplacements()" not in content:
    content = content.replace("let aptList = [];\n        let currentId = null;", "let aptList = [];\n        let currentId = null;\n" + js_logic)

# 6. selectApt 에서 호출
if "currentReplacements = apt.replacement_items || [];" not in content:
    content = content.replace("document.getElementById('f_next_sales_notes').value = apt.next_sales_notes || '';", "document.getElementById('f_next_sales_notes').value = apt.next_sales_notes || '';\n            currentReplacements = apt.replacement_items || [];\n            renderReplacements();")

# 7. createNew 에서 호출
if "currentReplacements = [];" not in content:
    content = content.replace("document.getElementById('f_id').value = '';", "document.getElementById('f_id').value = '';\n            currentReplacements = [];\n            renderReplacements();")

# 8. saveData payload 에 추가
if "replacement_items: currentReplacements" not in content:
    content = content.replace("next_sales_notes: document.getElementById('f_next_sales_notes').value", "next_sales_notes: document.getElementById('f_next_sales_notes').value,\n                replacement_items: currentReplacements")


with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("apt_db.html patched successfully!")
