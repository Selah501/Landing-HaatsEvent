
    import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
    import { getDatabase, ref, onValue, set, get, update, push, remove } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
    import { injectTestData } from "./test_data.js";

    const firebaseConfig = {
        databaseURL: "https://flyer-event-page-2026-default-rtdb.firebaseio.com",
        projectId: "flyer-event-page-2026"
    };

    const app = initializeApp(firebaseConfig);
    const db = getDatabase(app);

    // 전역 변수
    window.currentProducts = [];
    
    const SUPABASE_URL = 'https://belchthacupzpgxevecx.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_weMvIv-69PgtXwzGlgweLg_NEJfOACN';
    window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    window.currentData = [];
    window.currentConsultations = {};
    window.currentReservations = {};
    window.currentManagers = [];
    window.firebaseSet = set;
    window.firebasePush = push;
    window.firebaseRemove = remove;
    window.firebaseUpdate = update;
    window.firebaseRef = ref;
    window.firebaseDb = db;
    window.firebaseGet = get;
    window.firebaseOnValue = onValue;

    window.triggerInjectTestData = function() {
        injectTestData(db, ref, set, push);
    };

    // 로그인 확인 및 초기화
    initAdminAuth(() => {
        document.getElementById('nav-container').innerHTML = renderAdminNav('admin');
        document.getElementById('main-container').style.display = 'block';
        
        // Supabase에서 상품 로드 (로그인 후 DOM이 준비된 시점에 실행)
        (async () => {
            try {
                const { data: prodData, error: prodError } = await window.supabaseClient.from('products').select('*').order('name');
                if (prodData) {
                    window.currentProducts = prodData.map(p => ({
                        id: p.id,
                        name: p.name,
                        model: p.model,
                        features: p.features,
                        duration: (p.details && p.details.duration) ? p.details.duration : '',
                        remarks: (p.details && p.details.remarks) ? p.details.remarks : '',
                        defaultPriceText: p.default_price_text,
                        detailLink: (p.details && p.details.detailLink) ? p.details.detailLink : '',
                        brandCategory: p.brand || p.category,
                        category: p.category,
                        price_purchase: p.price_purchase,
                        price_selling: p.price_selling,
                        costPrice: p.price_purchase,
                        sellPrice: p.price_selling,
                        details: p.details
                    }));
                    if(document.getElementById('tab-master').classList.contains('active')) {
                        window.renderMasterList();
                    }
                } else if (prodError) {
                    console.error('Supabase 상품 로드 실패:', prodError.message);
                }
            } catch(e) {
                console.error('Supabase 상품 로드 오류:', e);
            }
        })();
        
        const dbRef = ref(db, '/');
        onValue(dbRef, (snapshot) => {
            const data = snapshot.val();
            if(data) {
                window.currentData = data.events || [];
                window.currentManagers = data.managers || [];
                window.currentConsultations = data.consultations || {};
                window.currentCrmPending = data.crm_pending || {};
                window.currentReservations = data.reservations || {};
                
                document.getElementById('db-status').innerHTML = '🟢 실시간 연동 중';
                
                if(document.getElementById('tab-master').classList.contains('active')) {
                    window.renderMasterList();
                } else if(document.getElementById('tab-events').classList.contains('active')) {
                    renderEventList();
                } else if(document.getElementById('tab-consultations').classList.contains('active')) {
                    renderCRMGrid(window.currentCrmPending);
                    renderConsultations();
                } else if(document.getElementById('tab-managers').classList.contains('active')) {
                    renderManagerList();
                }
            } else {
                document.getElementById('db-status').innerHTML = '🔴 데이터가 없습니다.';
            }
        }, (error) => {
            console.error("Firebase read failed: " + error.code);
            document.getElementById('db-status').innerHTML = '🔴 데이터베이스 오류';
        });
    });

    // PC / 모바일 뷰 토글
    window.setView = function(view) {
        const container = document.getElementById('main-container');
        const btnPc = document.getElementById('btn-pc-view');
        const btnMobile = document.getElementById('btn-mobile-view');
        
        if (view === 'pc') {
            container.style.maxWidth = '1400px';
            btnPc.style.backgroundColor = '#2563eb';
            btnPc.style.color = 'white';
            btnMobile.style.backgroundColor = 'transparent';
            btnMobile.style.color = '#4b5563';
        } else {
            container.style.maxWidth = '480px';
            btnMobile.style.backgroundColor = '#2563eb';
            btnMobile.style.color = 'white';
            btnPc.style.backgroundColor = 'transparent';
            btnPc.style.color = '#4b5563';
        }
    }

    // 서버 저장 함수
    window.syncToServer = function() {
        document.getElementById('db-status').innerHTML = '🟡 저장 중...';
        set(ref(db, '/products'), window.currentProducts); // Now handled by individual save buttons for Supabase
        set(ref(db, '/events'), window.currentData);
        set(ref(db, '/managers'), window.currentManagers).then(() => {
            document.getElementById('db-status').innerHTML = '🟢 실시간 연동 중';
        }).catch((error) => {
            alert('저장에 실패했습니다: ' + error);
        });
    }


    window.switchTab = function(tabId, element) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        element.classList.add('active');
        document.getElementById(tabId).classList.add('active');
        if(tabId === 'tab-master') window.renderMasterList();
        if(tabId === 'tab-events') renderEventList();
        if(tabId === 'tab-consultations') {
            renderCRMGrid(window.currentCrmPending);
            renderConsultations();
        }
        if(tabId === 'tab-managers') renderManagerList();
    }

    window.renderManagerList = function() {
        const tbody = document.getElementById('manager-tbody');
        if(!tbody) return;
        tbody.innerHTML = '';
        window.currentManagers.forEach((mgr, idx) => {
            tbody.innerHTML += `
                <tr>
                    <td data-label="담당자명"><input type="text" class="mgr-name" value="${mgr.name}"></td>
                    <td data-label="전화번호"><input type="text" class="mgr-phone" value="${mgr.phone}"></td>
                    <td data-label="관리" style="text-align:center;">
                        <button class="btn-warning" style="padding:6px 12px; font-size:12px; margin-bottom:4px; display:block; width:100%;" onclick="saveManagerRow(${idx})">저장</button>
                        <button class="btn-danger" style="padding: 6px 12px; font-size:12px; display:block; width:100%;" onclick="deleteManagerRow(${idx})">삭제</button>
                    </td>
                </tr>
            `;
        });
    }

    window.saveManagerRow = function(idx) {
        const rows = document.querySelectorAll('#manager-tbody tr');
        const row = rows[idx];
        if(!row) return;
        window.currentManagers[idx].name = row.querySelector('.mgr-name').value;
        window.currentManagers[idx].phone = row.querySelector('.mgr-phone').value;
        window.syncToServer();
        alert('담당자 정보가 저장되었습니다.');
    }

    window.addManagerRow = function() {
        window.currentManagers.push({
            id: 'mgr_' + Date.now(),
            name: '', phone: ''
        });
        renderManagerList();
    }

    window.deleteManagerRow = function(idx) {
        if(confirm("담당자를 삭제하시겠습니까? (기존 배정된 현장에는 영향 없습니다)")) {
            window.currentManagers.splice(idx, 1);
            window.syncToServer();
        }
    }

    function getApplicableSites(prodId) {
        let sites = [];
        window.currentData.forEach(ev => {
            const inMain = (ev.mainProducts || []).some(p => p.id === prodId);
            const inAddon = (ev.addonProducts || []).some(p => p.id === prodId);
            if(inMain || inAddon) sites.push(ev.title);
        });
        return sites;
    }

    // (Supabase 상품 로드는 initAdminAuth 콜백 내부로 이동됨)

        window.renderMasterList = function() {
        const tbody = document.getElementById('master-tbody');
        if(!tbody) return;
        tbody.innerHTML = '';
        const filterEl = document.getElementById('master-category-filter');
        const filterVal = filterEl ? filterEl.value : '하츠후드 엘리카';
        
        let filteredProducts = window.currentProducts;
        if (filterVal !== 'ALL') {
            filteredProducts = window.currentProducts.filter(p => (p.category || '기타카테고리') === filterVal);
        }
        
        filteredProducts.forEach((prod) => {
            const idx = window.currentProducts.indexOf(prod);
            const applicableSites = getApplicableSites(prod.id);
            const siteNames = applicableSites.length > 0 ? applicableSites.join(', ') : '<span style="color:#9ca3af;">없음</span>';
            
            tbody.innerHTML += `
                <tr id="m-row-${idx}">
                    <td data-label="분류"><span style="font-size:12px; color:#4b5563;">${prod.category || '기타카테고리'}</span></td>
                    <td><input type="text" class="m-name" value="${prod.name}"></td>
                    <td><input type="text" class="m-model" value="${prod.model || ''}"></td>
                    <td><input type="text" class="m-features" value="${prod.features || ''}"></td>
                    <td><input type="number" class="m-duration" value="${prod.duration || ''}" placeholder="예: 120" style="width:100%; padding:6px; border:1px solid #d1d5db; border-radius:4px;"></td>
                    <td><input type="text" class="m-remarks" value="${prod.remarks || ''}" placeholder="비공개 메모"></td>
                    <td><input type="text" class="m-defaultPrice" value="${prod.defaultPriceText || ''}"></td>
                    <td><input type="text" class="m-link" value="${prod.detailLink || ''}" placeholder="./products/xxx.html"></td>
                    <td style="font-size: 13px;">${siteNames}</td>
                    <td style="text-align:center;">
                        <button class="btn-info" style="padding: 6px 12px; font-size:12px; margin-bottom: 4px; display:block; width:100%;" onclick="openAssignModal('${prod.id}')">현장 배정</button>
                        <button class="btn-danger" style="padding: 6px 12px; font-size:12px; display:block; width:100%;" onclick="deleteMasterRow(${idx})">삭제</button>
                    </td>
                </tr>
            `;
        });
    }

    window.addMasterRow = function() {
        window.currentProducts.push({
            id: 'p_' + Date.now(),
            name: '', model: '', features: '', duration: '', remarks: '', defaultPriceText: '', detailLink: ''
        });
        window.renderMasterList();
    }

    window.deleteMasterRow = function(idx) {
        if(confirm("정말 삭제하시겠습니까? (이 상품을 사용하는 현장이 있다면 그곳에서도 사라집니다)")) {
            const id = window.currentProducts[idx].id;
            window.currentData.forEach(ev => {
                if(ev.mainProducts) ev.mainProducts = ev.mainProducts.filter(p => p.id !== id);
                if(ev.addonProducts) ev.addonProducts = ev.addonProducts.filter(p => p.id !== id);
            });
            window.currentProducts.splice(idx, 1);
            window.syncToServer();
        }
    }

    window.saveMasterList = function() {
        const rows = document.querySelectorAll('#master-tbody tr');
        rows.forEach((row, idx) => {
            window.currentProducts[idx].name = row.querySelector('.m-name').value;
            window.currentProducts[idx].model = row.querySelector('.m-model').value;
            window.currentProducts[idx].features = row.querySelector('.m-features').value;
            const durVal = parseInt(row.querySelector('.m-duration').value);
            window.currentProducts[idx].duration = isNaN(durVal) ? 0 : durVal;
            window.currentProducts[idx].remarks = row.querySelector('.m-remarks').value;
            window.currentProducts[idx].defaultPriceText = row.querySelector('.m-defaultPrice').value;
            window.currentProducts[idx].detailLink = row.querySelector('.m-link').value;
        });
        window.syncToServer();
        alert('서버에 저장되었습니다.');
    }

    window.openAssignModal = function(prodId) {
        document.getElementById('assign-modal').style.display = 'flex';
        document.getElementById('assign-prod-id').value = prodId;
        const prod = window.currentProducts.find(p => p.id === prodId);
        document.getElementById('assign-modal-title').innerText = `[${prod.name}] 현장 일괄 배정`;

        const listDiv = document.getElementById('assign-list');
        listDiv.innerHTML = '';
        window.currentData.forEach((ev, evIdx) => {
            const inMain = (ev.mainProducts || []).some(p => p.id === prodId);
            const inAddon = (ev.addonProducts || []).some(p => p.id === prodId);
            
            listDiv.innerHTML += `
                <div class="assignment-row">
                    <strong style="font-size:14px; width:150px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${ev.title}</strong>
                    <div class="radio-group" style="display:flex;">
                        <label><input type="radio" name="assign-${evIdx}" value="none" ${(!inMain && !inAddon) ? 'checked' : ''}> 미배정</label>
                        <label><input type="radio" name="assign-${evIdx}" value="main" ${inMain ? 'checked' : ''}> 메인 상품</label>
                        <label><input type="radio" name="assign-${evIdx}" value="addon" ${inAddon ? 'checked' : ''}> 부가 상품</label>
                    </div>
                </div>
            `;
        });
    }

    window.closeAssignModal = function() {
        document.getElementById('assign-modal').style.display = 'none';
    }

    window.saveAssignments = function() {
        const prodId = document.getElementById('assign-prod-id').value;
        
        window.currentData.forEach((ev, evIdx) => {
            const val = document.querySelector(`input[name="assign-${evIdx}"]:checked`).value;
            
            if(ev.mainProducts) ev.mainProducts = ev.mainProducts.filter(p => p.id !== prodId);
            if(ev.addonProducts) ev.addonProducts = ev.addonProducts.filter(p => p.id !== prodId);

            if(val === 'main') {
                ev.mainProducts.push({ id: prodId, customText: '' });
            } else if (val === 'addon') {
                ev.addonProducts.push({ id: prodId, customText: '' });
            }
        });

        window.closeAssignModal();
        window.syncToServer();
        alert('배정이 서버에 저장되었습니다.');
    }

    window.renderEventList = function() {
        const tbody = document.getElementById('event-tbody');
        if(!tbody) return;
        tbody.innerHTML = '';
        window.currentData.forEach((ev, idx) => {
            const isEnded = ev.status === 'ended';
            const mainNames = (ev.mainProducts || []).map(p => {
                const m = window.currentProducts.find(x => x.id === p.id);
                return m ? m.name : '(알수없음)';
            }).join(', ');
            const addonNames = (ev.addonProducts || []).map(p => {
                const m = window.currentProducts.find(x => x.id === p.id);
                return m ? m.name : '(알수없음)';
            }).join(', ');
            tbody.innerHTML += `
                <tr style="${isEnded ? 'background-color: #f9fafb; color: #9ca3af;' : ''}">
                    <td data-label="상태"><span class="badge ${isEnded ? 'ended' : 'active'}">${isEnded ? '종료됨' : '진행중'}</span></td>
                    <td data-label="현장명"><strong>${ev.title}</strong></td>
                    <td data-label="이벤트 기간">${ev.periodText || '-'}</td>
                    <td data-label="메인 상품" style="font-size: 13px;">${mainNames || '-'}</td>
                    <td data-label="같이 바꾸면 좋은 상품" style="font-size: 13px; color: #6b7280;">${addonNames || '-'}</td>
                    <td data-label="관리">
                        <div style="display:flex; gap:8px;">
                            <button class="btn-warning" style="flex:1; padding: 10px;" onclick="openEventModal(${idx})">수정</button>
                            ${!isEnded ? `<button class="btn-danger" style="flex:1; padding: 10px;" onclick="endEvent(${idx})">종료</button>` : `<button class="btn-secondary" style="flex:1; padding: 10px;" onclick="activateEvent(${idx})">진행</button>`}
                        </div>
                    </td>
                </tr>
            `;
        });
    }

    window.endEvent = function(index) { window.currentData[index].status = 'ended'; window.syncToServer(); }
    window.activateEvent = function(index) { window.currentData[index].status = 'active'; window.syncToServer(); }

    window.closeEventModal = function() {
        document.getElementById('event-modal').style.display = 'none';
    }

    window.saveEvent = function() {
        const index = parseInt(document.getElementById('modal-index').value);
        const title = document.getElementById('ev-title').value;
        if(!title) { alert('현장명을 입력하세요'); return; }

        const managerId = document.getElementById('ev-manager').value || '';
        const priceText = document.getElementById('ev-price').value || '';
        const periodText = document.getElementById('ev-period').value || '';

        const evObj = {
            id: index >= 0 ? window.currentData[index].id : 'site_' + Date.now(),
            title: title,
            priceText: priceText,
            periodText: periodText,
            managerId: managerId,
            mainProducts: window._editMainProds || [],
            addonProducts: window._editAddonProds || [],
            status: index >= 0 ? window.currentData[index].status : 'active'
        };

        if (index >= 0) {
            window.currentData[index] = evObj;
        } else {
            window.currentData.unshift(evObj);
        }

        window.closeEventModal();
        window.syncToServer();
        alert('서버에 반영되었습니다.');
    }

        window.openEventModal = function(index = -1) {
        document.getElementById('event-modal').style.display = 'flex';
        const isEdit = index >= 0;
        document.getElementById('modal-title').innerText = isEdit ? '현장 수정' : '신규 현장 추가';
        document.getElementById('modal-index').value = index;

        const ev = isEdit ? window.currentData[index] : { title: '', priceText: '', periodText: '', managerId: '', mainProducts: [], addonProducts: [] };
        
        document.getElementById('ev-title').value = ev.title;
        document.getElementById('ev-price').value = ev.priceText || '';
        document.getElementById('ev-period').value = ev.periodText || '';
        
        // 담당자 세팅
        const managerSelect = document.getElementById('ev-manager');
        if(managerSelect) {
            managerSelect.innerHTML = '<option value="">선택 안함</option>';
            window.currentManagers.forEach(mgr => {
                managerSelect.innerHTML += `<option value="${mgr.id}" ${ev.managerId === mgr.id ? 'selected' : ''}>${mgr.name} (${mgr.phone})</option>`;
            });
        }

        // 상품을 카테고리별로 그룹화
        const groupedProducts = window.currentProducts.reduce((acc, p) => {
            const cat = p.category || '기타카테고리';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(p);
            return acc;
        }, {});

        let optionsHtml = '<option value="">-- 추가할 상품 선택 --</option>';
        for (const [cat, prods] of Object.entries(groupedProducts)) {
            optionsHtml += `<optgroup label="${cat}">`;
            optionsHtml += prods.map(p => `<option value="${p.id}" data-name="${p.name}" data-price="${p.defaultPriceText||''}">${p.name}</option>`).join('');
            optionsHtml += `</optgroup>`;
        }

        const mainDiv = document.getElementById('modal-main-prods');
        const addonDiv = document.getElementById('modal-addon-prods');
        if(mainDiv) {
            const selectedMain = (ev.mainProducts || []);
            
            mainDiv.innerHTML = `
                <div style="margin-bottom:8px;">
                    <select id="main-prod-add-select" style="width:70%; padding:6px; border:1px solid #d1d5db; border-radius:4px;">
                        ${optionsHtml}
                    </select>
                    <button class="btn-info" style="padding:6px 12px; font-size:13px;" onclick="addMainProduct()">추가</button>
                </div>
                <div id="main-prod-list">
                    ${selectedMain.map((p,i) => {
                        const prod = window.currentProducts.find(x=>x.id===p.id);
                        return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                            <span>${prod ? prod.name : p.id}</span>
                            <input type="text" id="price-main-${p.id}" placeholder="단가" value="${p.customText||''}" style="width:150px;padding:4px;border:1px solid #d1d5db;border-radius:4px;">
                            <button onclick="removeMainProduct('${p.id}')" style="color:red;background:none;border:none;cursor:pointer;">✕</button>
                        </div>`;
                    }).join('')}
                </div>
            `;
        }
        if(addonDiv) {
            const selectedAddon = (ev.addonProducts || []);
            addonDiv.innerHTML = `
                <div style="margin-bottom:8px;">
                    <select id="addon-prod-add-select" style="width:70%; padding:6px; border:1px solid #d1d5db; border-radius:4px;">
                        ${optionsHtml}
                    </select>
                    <button class="btn-info" style="padding:6px 12px; font-size:13px;" onclick="addAddonProduct()">추가</button>
                </div>
                <div id="addon-prod-list">
                    ${selectedAddon.map((p,i) => {
                        const prod = window.currentProducts.find(x=>x.id===p.id);
                        return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                            <span>${prod ? prod.name : p.id}</span>
                            <input type="text" id="price-addon-${p.id}" placeholder="단가" value="${p.customText||''}" style="width:150px;padding:4px;border:1px solid #d1d5db;border-radius:4px;">
                            <button onclick="removeAddonProduct('${p.id}')" style="color:red;background:none;border:none;cursor:pointer;">✕</button>
                        </div>`;
                    }).join('')}
                </div>
            `;
        }
    }

    window.addMainProduct = function() {
        const sel = document.getElementById('main-prod-add-select');
        const id = sel.value; const name = sel.options[sel.selectedIndex]?.dataset?.name || '';
        if(!id) return;
        if(window._editMainProds.find(p=>p.id===id)) { alert('이미 추가된 상품입니다.'); return; }
        window._editMainProds.push({id, customText:''});
        const list = document.getElementById('main-prod-list');
        list.innerHTML += `<div id="mainrow-${id}" style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
            <span>${name}</span>
            <input type="text" id="price-main-${id}" placeholder="현장가" value="" style="width:150px;padding:4px;border:1px solid #d1d5db;border-radius:4px;">
            <button onclick="removeMainProduct('${id}')" style="color:red;background:none;border:none;cursor:pointer;">✕</button>
        </div>`;
    }

    window.removeMainProduct = function(id) {
        window._editMainProds = window._editMainProds.filter(p=>p.id!==id);
        const el = document.getElementById(`mainrow-${id}`);
        if(el) el.remove(); else { const list = document.getElementById('main-prod-list'); list.innerHTML = window._editMainProds.map(p=>{ const prod=window.currentProducts.find(x=>x.id===p.id); return `<div id="mainrow-${p.id}" style="display:flex;align-items:center;gap:8px;margin-bottom:6px;"><span>${prod?prod.name:p.id}</span><input type="text" id="price-main-${p.id}" value="${p.customText||''}"><button onclick="removeMainProduct('${p.id}')" style="color:red;background:none;border:none;cursor:pointer;">✕</button></div>`; }).join(''); }
    }

    window.addAddonProduct = function() {
        const sel = document.getElementById('addon-prod-add-select');
        const id = sel.value; const name = sel.options[sel.selectedIndex]?.dataset?.name || '';
        if(!id) return;
        if(window._editAddonProds.find(p=>p.id===id)) { alert('이미 추가된 상품입니다.'); return; }
        window._editAddonProds.push({id, customText:''});
        const list = document.getElementById('addon-prod-list');
        list.innerHTML += `<div id="addonrow-${id}" style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
            <span>${name}</span>
            <input type="text" id="price-addon-${id}" placeholder="현장가" value="" style="width:150px;padding:4px;border:1px solid #d1d5db;border-radius:4px;">
            <button onclick="removeAddonProduct('${id}')" style="color:red;background:none;border:none;cursor:pointer;">✕</button>
        </div>`;
    }

    window.removeAddonProduct = function(id) {
        window._editAddonProds = window._editAddonProds.filter(p=>p.id!==id);
        const el = document.getElementById(`addonrow-${id}`);
        if(el) el.remove();
    }


    window.renderConsultations = function() {
        const tbody = document.getElementById('consult-tbody');
        if(!tbody) return;
        tbody.innerHTML = '';
        
        let allItems = [];
        
        // V1 단순상담 파싱 (consultations/YYYY-MM-DD/{id})
        for (const [dateStr, dailyData] of Object.entries(window.currentConsultations)) {
            for (const [key, val] of Object.entries(dailyData)) {
                let contentText = val.eventName || '';
                let memoText = val.adminMemo || '';
                if (contentText.startsWith('[AI 단순상담]') && contentText.length > 20) {
                    memoText = contentText.substring(10).trim() + "\n\n" + memoText;
                    contentText = "[AI] 요약 참조 (구매품 미정)";
                }
                
                allItems.push({
                    id: key,
                    path: `consultations/${dateStr}/${key}`,
                    type: '무료상담(AI/웹)',
                    timestamp: val.timestamp || 0,
                    customer: val.apartment || '',
                    phone: val.phone || '',
                    content: contentText,
                    status: val.status || 'consultation_pending',
                    adminMemo: memoText
                });
            }
        }
        
        // V2 예약 파싱 (reservations/YYYY-MM-DD/HH:MM)
        const processedV2 = new Set();
        for (const [dateStr, dailyData] of Object.entries(window.currentReservations)) {
            // dateStr format is usually YYYY-MM-DD
            if (typeof dailyData === 'object' && dailyData !== null) {
                for (const [timeStr, val] of Object.entries(dailyData)) {
                    if(val && (val.type === 'customer' || val.type === 'ai_call')) {
                        const rId = val.reservationId || `${dateStr}_${timeStr}`;
                        if (processedV2.has(rId)) continue;
                        processedV2.add(rId);
                        
                        let prodStr = (val.customerInfo && val.customerInfo.items) ? val.customerInfo.items : '';
                        if(Array.isArray(prodStr)) prodStr = prodStr.join(' + ');
                        
                        let timeText = val.customerInfo?.parentTime || timeStr || '';
                        
                        allItems.push({
                            id: timeStr,
                            path: `reservations/${dateStr}/${timeStr}`,
                            type: '달력예약(V2)',
                            timestamp: val.timestamp || 0,
                            targetDate: dateStr,
                            targetTime: timeText,
                            customer: (val.customerInfo && val.customerInfo.address) || (val.customerInfo && val.customerInfo.apt) || '',
                            phone: (val.customerInfo && val.customerInfo.contact) || (val.customerInfo && val.customerInfo.phone) || '',
                            content: prodStr,
                            status: val.status || 'pending',
                            adminMemo: (val.customerInfo && val.customerInfo.notes) || val.adminMemo || ''
                        });
                    }
                }
            }
        }
        
        // 최신순 정렬
        allItems.sort((a,b) => b.timestamp - a.timestamp);
        
        // Group by Phone
        let groupedItems = [];
        let phoneMap = {};
        allItems.forEach(item => {
            const ph = (item.phone || '').replace(/[^0-9]/g, '');
            if(ph && ph.length >= 8) {
                if(!phoneMap[ph]) {
                    item.history = [];
                    phoneMap[ph] = item;
                    groupedItems.push(item);
                } else {
                    phoneMap[ph].history.push(item);
                }
            } else {
                groupedItems.push(item);
            }
        });

        groupedItems.forEach(item => {
            const d = new Date(item.timestamp || Date.now());
            const days = ['일','월','화','수','목','금','토'];
            const dateText = `${d.getMonth()+1}/${d.getDate()} ${days[d.getDay()]} ${d.getHours() >= 12 ? '오후' : '오전'}${d.getHours() % 12 || 12}:${String(d.getMinutes()).padStart(2,'0')}`;
            
            let statusBadge = '';
            if(item.status.includes('pending')) { statusBadge = '<span style="background:#fef3c7; color:#d97706; padding:4px 8px; border-radius:12px; font-size:12px; font-weight:bold;">🟡 확정 대기중</span>'; }
            else if(item.status === 'confirmed') { statusBadge = '<span style="background:#dcfce7; color:#15803d; padding:4px 8px; border-radius:12px; font-size:12px; font-weight:bold;">🟢 예약 확정</span>'; }
            else if(item.status === 'completed') { statusBadge = '<span style="background:#e5e7eb; color:#374151; padding:4px 8px; border-radius:12px; font-size:12px; font-weight:bold;">🔘 작업 완료</span>'; }
            else { statusBadge = '<span style="background:#fee2e2; color:#b91c1c; padding:4px 8px; border-radius:12px; font-size:12px; font-weight:bold;">🔴 취소/기타</span>'; }
            
            const safeContent = (item.content || '').replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/\n/g, '\\n').replace(/\r/g, '');
            const safeMemo = (item.adminMemo || '').replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/\n/g, '\\n').replace(/\r/g, '');
            const safeCustomer = (item.customer || '').replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/\n/g, '\\n').replace(/\r/g, '');
            const safePhone = (item.phone || '').replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/\n/g, '\\n').replace(/\r/g, '');
            const safePath = (item.path || '').replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/\n/g, '\\n').replace(/\r/g, '');
            let targetDateStr = '';
            if (item.path && item.path.startsWith('reservations/')) {
                const parts = item.path.split('/');
                if (parts.length >= 3) {
                    const dateParts = parts[1].split('-');
                    const timeParts = parts[2].split(':');
                    if (dateParts.length === 3 && timeParts.length >= 2) {
                        const m = parseInt(dateParts[1]);
                        const d = parseInt(dateParts[2]);
                        let h = parseInt(timeParts[0]);
                        const min = timeParts[1];
                        const ampm = h >= 12 ? 'pm' : 'am';
                        if (h > 12) h -= 12;
                        if (h === 0) h = 12;
                        const minStr = min === '00' ? '' : `:${min}`;
                        targetDateStr = `<div style="font-size:11.5px; color:#4b5563; margin-top:8px; font-weight:bold; background:#f3f4f6; padding:2px 6px; border-radius:4px; display:inline-block;">🕒 ${m}/${d} ${h}${minStr}${ampm}</div>`;
                    }
                }
            }

            let historyHtml = '';
            if(item.history && item.history.length > 0) {
                let historyNotes = item.history.map(h => {
                    const hd = new Date(h.timestamp);
                    const htime = `${hd.getMonth()+1}/${hd.getDate()} ${hd.getHours()}:${String(hd.getMinutes()).padStart(2,'0')}`;
                    return `[${htime}] ${h.type}\\n${h.content}\\n${h.adminMemo}`;
                }).join('\\n\\n-------------------\\n\\n');
                const safeHistory = historyNotes.replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/\n/g, '\\n').replace(/\r/g, '');
                historyHtml = `<div style="margin-top:8px;"><button style="background:#fde68a; border:1px solid #f59e0b; border-radius:4px; padding:4px 8px; font-size:11px; cursor:pointer; color:#92400e; font-weight:bold;" onclick="alert('🔄 과거 통화/접수 이력:\\n\\n${safeHistory}')">🔄 과거 이력 (${item.history.length}건) 보기</button></div>`;
            }

            tbody.innerHTML += `
                <tr>
                    <td data-label="날짜/시간" style="font-size:12px; color:#666; font-weight:bold;">${dateText}</td>
                    <td data-label="구분"><span style="background:#444; padding:4px 8px; border-radius:4px; font-size:12px; color:white;">${item.type}</span></td>
                    <td data-label="고객명(현장명/동호수)" style="font-weight:bold; color:#111;">${item.customer}</td>
                    <td data-label="연락처" style="color:#2563eb; font-weight:bold;">${item.phone}</td>
                    <td data-label="신청내용" style="font-size:13px; line-height:1.3;">
                        ${item.content ? `<div style="margin-bottom:4px; font-weight:bold;">${item.content}</div>` : ''}
                        <button style="background:#f3f4f6; border:1px solid #d1d5db; border-radius:4px; padding:2px 6px; font-size:11px; cursor:pointer; color:#374151;" onclick="alert('요약 메모:\\n${safeMemo}')">📝 요약 보기</button>
                        ${historyHtml}
                    </td>
                    <td data-label="상태" style="text-align:center; vertical-align:middle;">
                        ${statusBadge}
                        ${targetDateStr}
                    </td>
                    <td data-label="상태변경/메모" style="text-align:center;">
                        <div style="display:flex; flex-direction:column; gap:4px; align-items:center;">
                            <button style="background:#c9ff00; color:#000; border:1px solid #a3cc00; padding:6px 12px; border-radius:6px; font-size:12px; font-weight:bold; cursor:pointer; width:100%;" onclick="openUnifiedModal('${safePath}', '${safeCustomer}', '${safePhone}', '${safeContent}', '${safeMemo}')">🗓️ 예약 관리 (문자발송)</button>
                            <button style="background:#fee2e2; color:#b91c1c; border:1px solid #fca5a5; padding:6px 12px; border-radius:6px; font-size:12px; font-weight:bold; cursor:pointer; width:100%;" onclick="deleteMasterTableRow('${safePath}')">🗑️ 강제 삭제 (오류건)</button>
                        </div>
                    </td>
                </tr>
            `;
        });
        if(groupedItems.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 20px; color:#666;">데이터가 없습니다.</td></tr>';
        }
    }

    
    // ==========================================
    // 통합 예약 관리 모달 로직
    // ==========================================
    window.openUnifiedModal = function(path, customer, phone, items, memo) {
        document.getElementById('uni-res-path').value = path;
        document.getElementById('uni-customer-apt').value = customer || '';
        document.getElementById('uni-customer-phone').value = phone || '';
        document.getElementById('uni-customer-items').value = items || '';
        document.getElementById('uni-customer-notes').value = memo || '';
        
        let dateVal = "";
        let timeVal = "10:00";
        
        if (path && path.startsWith('reservations/')) {
            const parts = path.split('/');
            if (parts.length >= 3) {
                dateVal = parts[1];
                timeVal = parts[2];
            }
        } else {
            let yyyy = new Date().getFullYear();
            let mm = String(new Date().getMonth() + 1).padStart(2, '0');
            let dd = String(new Date().getDate()).padStart(2, '0');
            dateVal = `${yyyy}-${mm}-${dd}`;
        }
        
        document.getElementById('uni-res-date').value = dateVal;
        document.getElementById('uni-res-time').value = timeVal;
        
        document.getElementById('unified-res-modal').style.display = 'flex';
    };

    window.closeUnifiedModal = function() {
        document.getElementById('unified-res-modal').style.display = 'none';
    };

    window.deleteMasterTableRow = async function(path) {
        if(!confirm('이 예약 내역(테스트/오류건)을 데이터베이스에서 완전히 삭제하시겠습니까?')) return;
        try {
            const dbRef = window.firebaseRef(window.firebaseDb, path);
            await window.firebaseRemove(dbRef);
            alert('성공적으로 삭제되었습니다.');
        } catch(e) {
            console.error(e);
            alert('삭제 중 오류가 발생했습니다: ' + e.message);
        }
    };

    window.uniSaveToPhone = function() {
        const name = document.getElementById('uni-customer-apt').value || '미상';
        const phone = (document.getElementById('uni-customer-phone').value || '').replace(/[^0-9]/g, '');
        const items = document.getElementById('uni-customer-items').value || '신청제품미상';
        const notes = document.getElementById('uni-customer-notes').value || '';
        
        if(!phone) { alert("연락처가 필요합니다."); return; }
        
        let vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL;TYPE=CELL:${phone}\nNOTE:신청제품: ${items} / 메모: ${notes}\nEND:VCARD`;
        let blob = new Blob([vcard], {type: "text/vcard"});
        let url = URL.createObjectURL(blob);
        let a = document.createElement('a');
        a.href = url;
        a.download = `${name}.vcf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    window.saveUnifiedReservation = function() {
        const oldPath = document.getElementById('uni-res-path').value;
        const dateStr = document.getElementById('uni-res-date').value;
        const timeStr = document.getElementById('uni-res-time').value;
        
        const customer = document.getElementById('uni-customer-apt').value;
        const phone = document.getElementById('uni-customer-phone').value;
        const items = document.getElementById('uni-customer-items').value;
        const notes = document.getElementById('uni-customer-notes').value;
        
        if (!dateStr || !timeStr) {
            alert('날짜와 시간을 입력해주세요.');
            return;
        }
        
        const rId = "crm_" + Date.now();
        const newPath = `reservations/${dateStr}/${timeStr}`;
        
        const resData = {
            reservationId: rId,
            status: 'pending',
            type: 'ai_call',
            customerInfo: {
                address: customer,
                contact: phone,
                items: [items],
                name: "접수 고객",
                notes: notes,
                parentTime: timeStr
            },
            timestamp: Date.now(),
            adminMemo: notes
        };
        
        window.firebaseSet(window.firebaseRef(window.firebaseDb, newPath), resData).then(() => {
            if (oldPath && oldPath !== newPath) {
                window.firebaseRemove(window.firebaseRef(window.firebaseDb, oldPath));
                document.getElementById('uni-res-path').value = newPath;
            }
            alert('달력에 예약 등록(대기)이 완료되었습니다.');
        }).catch(e => alert('오류: ' + e.message));
    };

    window.uniSaveToPhone = function() {
        const name = document.getElementById('uni-customer-apt').value;
        const phone = document.getElementById('uni-customer-phone').value;
        const notes = document.getElementById('uni-customer-items').value;
        
        if(!name || !phone) { alert("이름(현장명)과 연락처가 필요합니다."); return; }
        
        let vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL;TYPE=CELL:${phone}\nNOTE:${notes}\nEND:VCARD`;
        let blob = new Blob([vcard], {type: "text/vcard"});
        let url = URL.createObjectURL(blob);
        let a = document.createElement('a');
        a.href = url;
        a.download = `${name}.vcf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    window.uniSendSms = function(type) {
        const apt = document.getElementById('uni-customer-apt').value || '고객';
        const phone = document.getElementById('uni-customer-phone').value;
        const dateStr = document.getElementById('uni-res-date').value;
        const timeStr = document.getElementById('uni-res-time').value;
        
        if(!phone) { alert('연락처가 없습니다.'); return; }
        
        let body = "";
        const [yy, mm, dd] = dateStr.split('-');
        let schedStr = `${mm}월 ${dd}일 ${timeStr}`;

        if(type === 'receipt') {
            body = `안녕하세요! 하츠 충남(홍성/내포) 대리점입니다.\n\n[ ${apt} ]\n접수해주신 내용 확인했습니다.\n\n일정 조율을 위해 연락드리겠습니다. 감사합니다.`;
        } else if(type === 'change') {
            body = `안녕하세요! 하츠 충남 대리점입니다.\n\n[ ${apt} ] 예약 일정 변경 안내드립니다.\n이전 현장 작업 지연으로 인하여 방문 시간이 다소 지연될 예정입니다.\n\n- 변경된 예상 시간: ${schedStr}\n\n최대한 신속하게 이동하겠습니다. 양해 부탁드립니다.`;
        } else if(type === 'missing') {
            body = `안녕하세요! 하츠 충남 대리점입니다.\n접수 시 정확한 동/호수 정보가 누락되어 연락드렸습니다.\n\n방문 및 제품 준비를 위해 문자로 정확한 동/호수를 남겨주시면 감사하겠습니다.`;
        }
        
        window.location.href = `sms:${phone}?body=${encodeURIComponent(body)}`;
    };

    window.updateDbStatus = function(path, newStatus) {
        if(!newStatus) return;
        window.firebaseUpdate(window.firebaseRef(window.firebaseDb, path), { status: newStatus }).then(() => {
            console.log("Status updated:", path, newStatus);
        }).catch(e => console.error(e));
    }

    window.updateDbMemo = function(path, newMemo) {
        window.firebaseUpdate(window.firebaseRef(window.firebaseDb, path), { adminMemo: newMemo }).then(() => {
            console.log("Memo updated:", path, newMemo);
        }).catch(e => console.error(e));
    }

    
    // ==========================================
    // CRM AI 통화 요약 결재판 로직
    // ==========================================
    window.loadCRMData = function() {
        const crmRef = window.firebaseRef(window.firebaseDb, 'crm_pending');
        window.firebaseOnValue(crmRef, (snapshot) => {
            const data = snapshot.val() || {};
            const keys = Object.keys(data);
            const badge = document.getElementById('crm-badge');
            if (badge) {
                if (keys.length > 0) {
                    badge.style.display = 'inline-block';
                    badge.innerText = keys.length;
                } else {
                    badge.style.display = 'none';
                }
            }
            renderCRMGrid(data);
        });
    };

    window.deleteCRMItem = function(key) {
        if(confirm('이 통화 요약을 [고객외 삭제] 처리하시겠습니까?')) {
            window.firebaseRemove(window.firebaseRef(window.firebaseDb, `crm_pending/${key}`))
                .catch(e => {
                    console.error("Delete error:", e);
                    window.firebaseSet(window.firebaseRef(window.firebaseDb, `crm_pending/${key}`), null);
                });
        }
    };

    window.editCRMItem = function(key) {
        window.firebaseGet(window.firebaseRef(window.firebaseDb, `crm_pending/${key}`)).then(snap => {
            const item = snap.val();
            if (!item) return;
            const newPhone = prompt('연락처를 수정하세요:', item.contact_info || '');
            if (newPhone !== null) {
                window.firebaseUpdate(window.firebaseRef(window.firebaseDb, `crm_pending/${key}`), { contact_info: newPhone });
            }
        });
    };

    window.saveAsLead = function(key) {
        if(!confirm('캘린더 일정 없이 [DB 리드]로만 보관하시겠습니까?')) return;
        window.firebaseGet(window.firebaseRef(window.firebaseDb, `crm_pending/${key}`)).then(snap => {
            const item = snap.val();
            if (!item) return;
            
            let extractedPhone = item.contact_info || '';
            if ((!extractedPhone || extractedPhone === '없음' || extractedPhone.trim() === '') && item.filename) {
                const phoneMatch = item.filename.match(/(010\d{8})/);
                if (phoneMatch) {
                    const p = phoneMatch[1];
                    extractedPhone = `${p.substring(0,3)}-${p.substring(3,7)}-${p.substring(7)}`;
                }
            }
            
            // consultations DB로 이동
            let yyyy = new Date().getFullYear();
            let mm = String(new Date().getMonth() + 1).padStart(2, '0');
            let dd = String(new Date().getDate()).padStart(2, '0');
            const dateStr = `${yyyy}-${mm}-${dd}`;
            const cId = "lead_" + Date.now();
            
            const leadData = {
                timestamp: Date.now(),
                eventName: item.purchase_info || '[AI] 요약 참조 (구매품 미정)',
                apartment: item.site_info || '',
                phone: extractedPhone,
                status: 'consultation_pending',
                adminMemo: `[요약]\n${item.summary || ''}\n\n[답변]\n${item.promises || ''}`
            };
            
            window.firebaseSet(window.firebaseRef(window.firebaseDb, `consultations/${dateStr}/${cId}`), leadData)
            .then(() => {
                // 원본 삭제
                window.firebaseSet(window.firebaseRef(window.firebaseDb, `crm_pending/${key}`), null);
                alert('리드(DB)로 성공적으로 저장되었습니다. 아래 표에서 확인 가능합니다.');
            });
        });
    };

    function renderCRMGrid(data) {
        const grid = document.getElementById('crm-grid');
        const badge = document.getElementById('crm-badge');
        if(!grid) return;
        
        const count = data ? Object.keys(data).length : 0;
        if(badge) {
            badge.innerText = count;
            badge.style.display = count > 0 ? 'inline-block' : 'none';
        }
        
        grid.innerHTML = '';
        if (!data) return;
        
        let itemsArr = [];
        for (const [key, item] of Object.entries(data)) {
            let itemDate = 0;
            // Extract Time from filename (e.g. 260804_1703)
            if (item.filename) {
                const match = item.filename.match(/_(\d{2})(\d{2})(\d{2})_(\d{2})(\d{2})/);
                if (match) {
                    const yy = "20" + match[1];
                    const mm = match[2];
                    const dd = match[3];
                    const hr = match[4];
                    const min = match[5];
                    itemDate = new Date(`${yy}-${mm}-${dd}T${hr}:${min}:00`).getTime();
                }
            }
            if(!itemDate && item.created_at) {
                itemDate = new Date(item.created_at).getTime();
            }
            item._ts = itemDate || 0;
            item._key = key;
            
            let extractedPhone = "";
            if (item.filename) {
                const phoneMatch = item.filename.match(/(010\d{8})/);
                if (phoneMatch) {
                    const p = phoneMatch[1];
                    extractedPhone = `${p.substring(0,3)}-${p.substring(3,7)}-${p.substring(7)}`;
                }
            }
            if ((!item.contact_info || item.contact_info === '없음' || item.contact_info.trim() === '') && extractedPhone) {
                item.contact_info = extractedPhone;
            }
            item._phone = (item.contact_info || '').replace(/[^0-9]/g, '');
            itemsArr.push(item);
        }
        
        // Sort newest first
        itemsArr.sort((a, b) => b._ts - a._ts);
        
        // Group by Phone
        let groupedItems = [];
        let phoneMap = {};
        itemsArr.forEach(item => {
            const ph = item._phone;
            if(ph && ph.length >= 8) {
                if(!phoneMap[ph]) {
                    item.history = [];
                    phoneMap[ph] = item;
                    groupedItems.push(item);
                } else {
                    phoneMap[ph].history.push(item);
                }
            } else {
                groupedItems.push(item);
            }
        });
        
        if (groupedItems.length === 0) {
            grid.innerHTML = `<div style="grid-column: 1 / -1; padding:20px; text-align:center; background:#f9fafb; border-radius:8px; color:#6b7280;">새로 분석된 통화 녹음이 없습니다.</div>`;
            return;
        }
        
        groupedItems.forEach(item => {
            const key = item._key;
            let catColor = '#6b7280';
            let catBg = '#f3f4f6';
            if(item.category && item.category.includes('예약')) { catColor = '#15803d'; catBg = '#dcfce7'; }
            if(item.category && item.category.includes('상담')) { catColor = '#b45309'; catBg = '#fef3c7'; }
            if(item.category && item.category.includes('변경')) { catColor = '#b91c1c'; catBg = '#fee2e2'; }

            const dObj = new Date(item._ts);
            const days = ['일','월','화','수','목','금','토'];
            const callTime = `${dObj.getMonth()+1}/${dObj.getDate()} ${days[dObj.getDay()]} ${dObj.getHours()}:${String(dObj.getMinutes()).padStart(2,'0')}`;
            
            const fields = [
                { label: '현장', key: 'site_info' },
                { label: '연락처', key: 'contact_info' },
                { label: '희망', key: 'booking_info' },
                { label: '구매품', key: 'purchase_info' },
                { label: '답변', key: 'promises' }
            ];
            
            let fieldHtml = '';
            fields.forEach(f => {
                const val = item[f.key];
                if (val && val !== 'null' && val.trim() !== '' && val !== '없음') {
                    fieldHtml += `<div style="margin-bottom:4px;"><span style="color:#6b7280; display:inline-block; width:50px; font-size:12px;">${f.label}</span> <span style="font-size:13px; font-weight:bold;">${val}</span></div>`;
                }
            });

            // Safe values for function call
            const safePath = `crm_pending/${key}`;
            const safeCustomer = (item.site_info || '').replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/\n/g, '\\n').replace(/\r/g, '');
            const safePhone = (item.contact_info || '').replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/\n/g, '\\n').replace(/\r/g, '');
            const safeItems = (item.purchase_info || '').replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/\n/g, '\\n').replace(/\r/g, '');
            const safeMemo = (item.summary || '').replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/\n/g, '\\n').replace(/\r/g, '');

            const html = `
                <div style="background:#fff; border:1px solid #e5e7eb; border-radius:12px; padding:16px; box-shadow:0 1px 3px rgba(0,0,0,0.1); display:flex; flex-direction:column;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                        <span style="background:${catBg}; color:${catColor}; padding:4px 8px; border-radius:6px; font-size:12px; font-weight:bold;">${item.category || '미분류'}</span>
                        <span style="font-size:12px; font-weight:bold; color:#111;">${callTime}</span>
                    </div>
                    
                    <div style="font-weight:bold; color:#111; margin-bottom:12px; font-size:14px; line-height:1.4;">
                        "${item.summary || '요약 없음'}"
                    </div>
                    
                    <div style="background:#f9fafb; padding:10px; border-radius:8px; margin-bottom:16px; flex:1;">
                        ${fieldHtml}
                    </div>
                    
                    <div style="display:grid; grid-template-columns: 1fr; gap:6px; margin-bottom:6px;">
                        <button class="btn" style="flex:1; background:#c9ff00; color:#000; font-weight:bold; padding:8px; border-radius:6px; border:none; cursor:pointer;" onclick="openUnifiedModal('${safePath}', '${safeCustomer}', '${safePhone}', '${safeItems}', '${safeMemo}')">🗓️ 예약 등록 (관리자)</button>
                    </div>
                    
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:6px;">
                        <button style="background:#fee2e2; color:#b91c1c; border:none; padding:8px; border-radius:6px; font-size:12px; font-weight:bold; cursor:pointer;" onclick="deleteCRMItem('${key}')">🗑️ 고객외 삭제</button>
                        <button style="background:#f3f4f6; color:#374151; border:none; padding:8px; border-radius:6px; font-size:12px; font-weight:bold; cursor:pointer;" onclick="saveAsLead('${key}')">💾 리드(DB) 임시저장</button>
                    </div>
                </div>
            `;
            grid.innerHTML += html;
        });
    }
