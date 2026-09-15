import re

file_path = r"c:\dev\전단지이벤트\landing\public\apt_db.html"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Firebase RTDB 모듈 로드 (get, set, ref 추가)
if "firebase-database.js" not in content:
    firebase_db_script = """
        import { getDatabase, ref as dbRef, get, set } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
        window.firebaseDb = getDatabase(app);
        window.dbRef = dbRef;
        window.dbGet = get;
        window.dbSet = set;
"""
    content = content.replace("window.getDownloadURL = getDownloadURL;", "window.getDownloadURL = getDownloadURL;\n" + firebase_db_script)

# 2. 전역 카테고리 로직 추가
js_category = """
        let currentCategories = ['주방후드', '영업자료']; // 초기 기본값

        async function loadCategories() {
            if(!window.firebaseDb) {
                setTimeout(loadCategories, 200);
                return;
            }
            const r = window.dbRef(window.firebaseDb, 'system/apt_categories');
            try {
                const snapshot = await window.dbGet(r);
                if (snapshot.exists()) {
                    currentCategories = snapshot.val();
                }
                renderCategoryOptions();
            } catch (err) {
                console.error("Categories load failed:", err);
            }
        }

        function renderCategoryOptions() {
            let dl = document.getElementById('global-cat-list');
            if(!dl) {
                dl = document.createElement('datalist');
                dl.id = 'global-cat-list';
                document.body.appendChild(dl);
            }
            dl.innerHTML = currentCategories.map(c => `<option value="${c}">`).join('');
            
            // 기존 렌더링된 select나 input이 있으면 업데이트
            if (typeof renderReplacements === 'function') {
                renderReplacements();
            }
        }

        window.manageCategories = async () => {
            let html = `<div style="text-align:left; max-height:250px; overflow-y:auto; margin-bottom:10px;" id="cat-manage-list">`;
            currentCategories.forEach((cat, i) => {
                html += `<div style="display:flex; justify-content:space-between; margin-bottom:5px; padding:5px; border-bottom:1px solid #ddd;">
                    <span>${cat}</span>
                    <button class="btn-sm btn-del-row" onclick="window.removeCat(${i})">삭제</button>
                </div>`;
            });
            html += `</div>
            <div style="display:flex; gap:5px;">
                <input type="text" id="new-cat-input" class="swal2-input" placeholder="새 구분 입력" style="margin:0; flex:1;">
                <button class="btn-primary" style="padding:10px;" onclick="window.addCat()">추가</button>
            </div>`;

            await Swal.fire({
                title: '구분 목록 관리',
                html: html,
                showConfirmButton: true,
                confirmButtonText: '닫기'
            });
        }

        window.removeCat = async (idx) => {
            currentCategories.splice(idx, 1);
            if(window.firebaseDb) await window.dbSet(window.dbRef(window.firebaseDb, 'system/apt_categories'), currentCategories);
            renderCategoryOptions();
            manageCategories(); // 팝업 재렌더링
        }
        
        window.addCat = async () => {
            const val = document.getElementById('new-cat-input').value.trim();
            if(!val) return;
            if(currentCategories.includes(val)) {
                Swal.showValidationMessage('이미 존재하는 구분입니다.');
                return;
            }
            currentCategories.push(val);
            if(window.firebaseDb) await window.dbSet(window.dbRef(window.firebaseDb, 'system/apt_categories'), currentCategories);
            renderCategoryOptions();
            manageCategories();
        }
        
        // 페이지 로드 시 카테고리 로드
        document.addEventListener('DOMContentLoaded', () => {
            loadCategories(); 
        });
"""

if "function manageCategories()" not in content:
    content = content.replace("let currentReplacements = [];", js_category + "\n        let currentReplacements = [];")

# 3. HTML 헤더에 관리 버튼 추가
header_old = '<h3 style="margin: 0; border: none; padding: 0;">교체 품목 및 자료 (문서/이미지)</h3>'
header_new = '<h3 style="margin: 0; border: none; padding: 0; display: flex; align-items: center;">교체 품목 및 자료 (문서/이미지) <button type="button" class="btn-sm" style="background:#f3f4f6; color:#374151; border:1px solid #d1d5db; margin-left:10px;" onclick="manageCategories()">⚙️ 구분 관리</button></h3>'
if "구분 관리" not in content:
    content = content.replace(header_old, header_new)

# 4. renderReplacements 의 datalist 수정
datalist_old = """<datalist id="cat-list">
                            <option value="주방후드">
                            <option value="영업자료">
                        </datalist>"""
content = content.replace(datalist_old, "")
content = content.replace('list="cat-list"', 'list="global-cat-list"')

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Categories patched!")
