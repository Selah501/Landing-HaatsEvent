
        import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
        import { getDatabase, ref, onValue, set, get, update, push, increment } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
        import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";
        import { getStorage, ref as sRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

        const firebaseConfig = {
            databaseURL: "https://flyer-event-page-2026-default-rtdb.firebaseio.com",
            projectId: "flyer-event-page-2026"
        };

        const app = initializeApp(firebaseConfig);
        const db = getDatabase(app);
        const functions = getFunctions(app);
        const storage = getStorage(app);
        
        window.db = db;
        window.ref = ref;
        window.set = set;
        window.get = get;
        window.update = update;
        window.storage = storage;
        window.sRef = sRef;
        window.uploadBytes = uploadBytes;
        window.getDownloadURL = getDownloadURL;
        window.onValue = onValue;
        window.push = push;
        window.increment = increment;

        // Supabase Initialization
        const SUPABASE_URL = 'https://belchthacupzpgxevecx.supabase.co';
        const SUPABASE_ANON_KEY = 'sb_publishable_weMvIv-69PgtXwzGlgweLg_NEJfOACN';
        window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        // Global
        window.currentData = {};
        window.groupedTasks = [];
        window.masterProducts = [];

        // Load master_products globally from Supabase
        (async () => {
            try {
                const { data, error } = await window.supabaseClient.from('products').select('*');
                if (data) {
                    window.masterProducts = data.map(p => ({
                        name: p.name,
                        model: p.model,
                        brandCategory: p.brand || p.category,
                        category: p.category,
                        costPrice: p.price_purchase,
                        sellPrice: p.price_selling,
                        imageUrl: (p.details && p.details.level1 && p.details.level1.images && p.details.level1.images[0]) ? p.details.level1.images[0] : ''
                    }));
                }
            } catch (err) {
                console.error("Failed to load products from Supabase:", err);
            }
        })();

        // View Toggle
        window.setView = function(view) {
            const container = document.getElementById('app');
            const btnPc = document.getElementById('btn-pc-view');
            const btnMobile = document.getElementById('btn-mobile-view');
            
            if (view === 'pc') {
                container.classList.remove('view-mobile');
                container.classList.add('view-pc');
                btnPc.classList.add('active');
                btnMobile.classList.remove('active');
            } else {
                container.classList.remove('view-pc');
                container.classList.add('view-mobile');
                btnMobile.classList.add('active');
                btnPc.classList.remove('active');
            }
        };

        // Tab Toggle (Only work tab remains in this view)
        window.switchTab = function(tabName) {
            document.getElementById('tab-work').style.display = 'block';
            
            const btnWork = document.getElementById('nav-work');
            if (btnWork) {
                btnWork.style.background = '#3b82f6';
                btnWork.style.color = '#fff';
                btnWork.style.border = 'none';
            }
        };

        // Initialize Date
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;
        
        document.getElementById('date-picker').value = dateStr;
        document.getElementById('date-display').innerText = `(${today.getDay() === 0 ? '일' : today.getDay() === 1 ? '월' : today.getDay() === 2 ? '화' : today.getDay() === 3 ? '수' : today.getDay() === 4 ? '목' : today.getDay() === 5 ? '금' : '토'})`;

        // Data Loader
        window.loadData = function() {
            const selectedDate = document.getElementById('date-picker').value;
            const d = new Date(selectedDate);
            const days = ['일','월','화','수','목','금','토'];
            document.getElementById('date-display').innerText = `(${days[d.getDay()]})`;

            const resRef = ref(db, `reservations/${selectedDate}`);
            onValue(resRef, (snapshot) => {
                const data = snapshot.val() || {};
                processData(data);
                renderGrid();
            });
        };

        function processData(dayData) {
            window.groupedTasks = [];
            let map = new Map();

            // Group by reservationId
            Object.keys(dayData).forEach(time => {
                const slot = dayData[time];
                if (slot.type === 'admin') return; // 차단된 슬롯 무시
                
                const rId = slot.reservationId || time; // id가 없으면 시간으로 대체
                if (!map.has(rId)) {
                    map.set(rId, {
                        rId: rId,
                        times: [time],
                        data: slot
                    });
                } else {
                    map.get(rId).times.push(time);
                }
            });

            // Convert map to array and sort by first time
            window.groupedTasks = Array.from(map.values()).sort((a, b) => {
                return a.times[0].localeCompare(b.times[0]);
            });
        }

        // CRM Data Loader
        window.loadCRMData = function() {
            const crmRef = ref(db, 'crm_pending');
            onValue(crmRef, (snapshot) => {
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
        
        // Start listening to CRM data on load
        loadCRMData();
        
        window.deleteCRMItem = function(key) {
            if(confirm('이 통화 요약을 삭제하시겠습니까? (스팸/불필요 통화)')) {
                set(ref(db, `crm_pending/${key}`), null);
            }
        };

        window.approveCRMItem = function(key) {
            get(ref(db, `crm_pending/${key}`)).then(snap => {
                const item = snap.val();
                if (!item) return;
                
                document.getElementById('crm-approve-key').value = key;
                
                // Parse date if possible from booking_info (fallback to today)
                let yyyy = today.getFullYear();
                let mm = String(today.getMonth() + 1).padStart(2, '0');
                let dd = String(today.getDate()).padStart(2, '0');
                document.getElementById('crm-approve-date').value = `${yyyy}-${mm}-${dd}`;
                document.getElementById('crm-approve-time').value = "10:00"; // default time
                
                document.getElementById('crm-approve-phone').value = item.contact_info || '';
                document.getElementById('crm-approve-site').value = item.site_info || '';
                document.getElementById('crm-approve-notes').value = 
                    `[구매희망] ${item.purchase_info || '없음'}\n[요약] ${item.summary || ''}\n[답변/약속] ${item.promises || ''}`;
                
                document.getElementById('crm-approve-modal').style.display = 'flex';
            });
        };

        window.closeCrmApproveModal = function() {
            document.getElementById('crm-approve-modal').style.display = 'none';
        };

        window.saveCrmApprove = function() {
            const key = document.getElementById('crm-approve-key').value;
            const dateStr = document.getElementById('crm-approve-date').value;
            const timeStr = document.getElementById('crm-approve-time').value;
            const phone = document.getElementById('crm-approve-phone').value;
            const site = document.getElementById('crm-approve-site').value;
            const notes = document.getElementById('crm-approve-notes').value;
            
            if (!dateStr || !timeStr) {
                alert('날짜와 시간을 입력해주세요.');
                return;
            }
            
            const rId = "crm_" + Date.now();
            const resData = {
                reservationId: rId,
                status: 'confirmed',
                type: 'ai_call',
                customerInfo: {
                    address: site,
                    contact: phone,
                    items: "상담 내역 참조",
                    name: "AI 접수 고객",
                    notes: notes
                }
            };
            
            // 캘린더에 예약 저장
            set(ref(db, `reservations/${dateStr}/${timeStr}`), resData)
            .then(() => {
                // CRM pending에서 삭제
                set(ref(db, `crm_pending/${key}`), null);
                closeCrmApproveModal();
                
                alert('캘린더에 성공적으로 예약이 확정되었습니다!');
                
                // 모달 닫은 후 작업지시 탭으로 이동하고 해당 날짜 렌더링
                switchTab('work');
                document.getElementById('date-picker').value = dateStr;
                loadData();
            })
            .catch(e => {
                console.error(e);
                alert('오류 발생: ' + e.message);
            });
        };

        window.holdCRMItem = function(key) {
            update(ref(db, `crm_pending/${key}`), { status: 'hold' });
        };
        
        window.editCRMItem = function(key) {
            get(ref(db, `crm_pending/${key}`)).then(snap => {
                const item = snap.val();
                if (!item) return;
                
                // 간단히 prompt로 연락처와 요약을 수정할 수 있게 제공 (또는 모달창 구현 가능하나 심플하게)
                const newPhone = prompt('연락처를 수정하세요:', item.contact_info || '');
                if (newPhone !== null) {
                    update(ref(db, `crm_pending/${key}`), { contact_info: newPhone });
                }
            });
        };

        function renderCRMGrid(data) {
            const grid = document.getElementById('crm-grid');
            grid.innerHTML = '';
            
            // 일반 대기와 보류(hold) 분리 후 정렬 (일반이 위, 보류가 아래, 최신순)
            const keys = Object.keys(data).sort((a, b) => {
                const itemA = data[a];
                const itemB = data[b];
                const holdA = itemA.status === 'hold' ? 1 : 0;
                const holdB = itemB.status === 'hold' ? 1 : 0;
                if (holdA !== holdB) return holdA - holdB;
                return b.localeCompare(a);
            });
            
            if (keys.length === 0) {
                grid.innerHTML = `<div class="empty-state">새로 분석된 통화 녹음이 없습니다.</div>`;
                return;
            }
            
            keys.forEach(key => {
                const item = data[key];
                
                let catColor = '#888';
                if(item.category && item.category.includes('예약')) catColor = 'var(--color-interactive-lime)';
                if(item.category && item.category.includes('상담')) catColor = 'var(--color-highlight-gold)';
                if(item.category && item.category.includes('변경')) catColor = '#ef4444';

                const isHold = item.status === 'hold';
                const opacity = isHold ? '0.6' : '1';
                const border = isHold ? '1px dashed #555' : '1px solid #333';
                const holdLabel = isHold ? `<span style="background:#eab308; color:#000; padding:2px 6px; border-radius:4px; font-size:11px; margin-left:8px;">보류됨</span>` : '';

                // 시간, 요일, 전화번호 추출 (파일명 기준)
                let callTime = "";
                let extractedPhone = "";
                if (item.filename) {
                    // 번호 추출
                    const phoneMatch = item.filename.match(/(010\d{8})/);
                    if (phoneMatch) {
                        const p = phoneMatch[1];
                        extractedPhone = `${p.substring(0,3)}-${p.substring(3,7)}-${p.substring(7)}`;
                    }
                    // 날짜/시간 추출 (_260805_173500)
                    const match = item.filename.match(/_(\d{2})(\d{2})(\d{2})_(\d{2})(\d{2})/);
                    if (match) {
                        const yy = "20" + match[1];
                        const mm = match[2];
                        const dd = match[3];
                        const hr = match[4];
                        const min = match[5];
                        const dObj = new Date(`${yy}-${mm}-${dd}`);
                        const days = ['일','월','화','수','목','금','토'];
                        callTime = `${parseInt(mm)}/${parseInt(dd)} ${days[dObj.getDay()]} ${hr}:${min}`;
                    }
                }
                if (!callTime && item.created_at) {
                    callTime = item.created_at.split('T')[1].substring(0,5);
                }
                
                // AI가 연락처를 못 찾았다면 파일명에서 추출한 번호로 대체
                if ((!item.contact_info || item.contact_info === '없음' || item.contact_info.trim() === '') && extractedPhone) {
                    item.contact_info = extractedPhone;
                }

                // 스팸이나 개인통화 등 무관한 통화인지 확인
                const catStr = item.category || '';
                const isUnrelated = catStr.includes('스팸') || catStr.includes('기타') || catStr.includes('개인') || catStr.includes('무관') || catStr.includes('광고');

                const fields = [
                    { label: '현장', key: 'site_info', color: '#fff' },
                    { label: '연락처', key: 'contact_info', color: '#10b981' },
                    { label: '예약희망', key: 'booking_info', color: 'var(--color-interactive-lime)' },
                    { label: '구매품', key: 'purchase_info', color: 'var(--color-highlight-gold)' },
                    { label: '결제', key: 'payment_info', color: '#3b82f6' },
                    { label: '약속/답변', key: 'promises', color: '#ccc' }
                ];
                
                let fieldHtml = '';
                if (!isUnrelated) {
                    fields.forEach(f => {
                        const val = item[f.key];
                        if (val && val !== 'null' && val.trim() !== '' && val !== '없음') {
                            fieldHtml += `<div><span style="color:#888; display:inline-block; width:65px;">${f.label}:</span> <span style="color:${f.color};">${val}</span></div>`;
                        } else {
                            fieldHtml += `<div><span style="color:#888; display:inline-block; width:65px;">${f.label}:</span> <span style="color:#444;">-</span></div>`;
                        }
                    });
                }

                const html = `
                    <div class="card" style="opacity:${opacity}; border:${border};">
                        <div class="card-header" style="padding-bottom:8px;">
                            <div style="font-weight:bold; color:${catColor}; font-size:16px;">
                                [${item.category || '미분류'}] ${holdLabel}
                            </div>
                            <div style="font-size:14px; color:#aaa;">${callTime}</div>
                        </div>
                        <div class="card-body" style="background:#111; padding:12px; border-radius:6px; margin-bottom:8px;">
                            <div style="color:var(--color-pure-white); font-weight:bold; margin-bottom: ${isUnrelated ? '0' : '12px'}; font-size:14px; line-height:1.4;">
                                "${item.summary || '요약 없음'}"
                            </div>
                            
                            ${!isUnrelated ? `
                            <div style="font-size:13px; display:grid; gap:6px;">
                                ${fieldHtml}
                            </div>
                            ` : ''}
                        </div>
                        
                        <div style="display:flex; gap:8px;">
                            <button class="btn btn-secondary" style="flex:1; font-size:12px; background:#444; padding:8px;" onclick="deleteCRMItem('${key}')">🗑️ 삭제</button>
                            <button class="btn btn-secondary" style="flex:1; font-size:12px; background:#3b82f6; padding:8px;" onclick="editCRMItem('${key}')">✏️ 수정</button>
                            ${!isHold ? `<button class="btn btn-secondary" style="flex:1; font-size:12px; background:#eab308; color:#000; padding:8px;" onclick="holdCRMItem('${key}')">⏳ 보류</button>` : ''}
                            <button class="btn btn-primary" style="flex:2; font-size:12px; padding:8px;" onclick="approveCRMItem('${key}')">📝 캘린더 등록</button>
                        </div>
                    </div>
                `;
                grid.innerHTML += html;
            });
        }

        function renderGrid() {
            const grid = document.getElementById('schedule-grid');
            grid.innerHTML = '';
            
            let statCompleted = 0;
            let statPending = 0;

            if (window.groupedTasks.length === 0) {
                grid.innerHTML = `<div class="empty-state">해당 날짜에 접수된 일정이 없습니다.</div>`;
                document.getElementById('stat-total').innerText = 0;
                document.getElementById('stat-completed').innerText = 0;
                document.getElementById('stat-pending').innerText = 0;
                return;
            }

            window.groupedTasks.forEach(task => {
                // 시간 포맷 (예: 09:00 ~ 11:00)
                task.times.sort();
                let timeStr = task.times[0];
                if (task.times.length > 1) {
                    // 끝나는 시간 계산 (마지막 슬롯 + 1시간)
                    const lastTime = task.times[task.times.length - 1];
                    const hour = parseInt(lastTime.split(':')[0]) + 1;
                    timeStr = `${task.times[0]} ~ ${String(hour).padStart(2, '0')}:00`;
                }

                const cInfo = task.data.customerInfo || {};
                let itemsStr = "-";
                if (Array.isArray(cInfo.items)) {
                    itemsStr = cInfo.items.join(', ');
                } else if (cInfo.items) {
                    itemsStr = String(cInfo.items);
                }
                
                // 상태 결정 (단일 카드로 관리)
                // 만약 report 객체가 있다면 completed로 간주
                const isCompleted = !!task.data.report;
                const isConfirmed = task.data.status === 'confirmed';
                
                let badgeClass = 'status-pending';
                let badgeText = '예약 대기 (미확정)';
                
                if (isCompleted) {
                    badgeClass = 'status-completed';
                    badgeText = '✅ 작업 보고 완료';
                    statCompleted++;
                } else if (isConfirmed) {
                    badgeClass = 'status-confirmed';
                    badgeText = '📍 확정 (진행 예정)';
                    statPending++;
                } else {
                    statPending++;
                }

                let reportHtml = '';
                if (isCompleted) {
                    const r = task.data.report;
                    const marginHtml = r.margin !== undefined ? 
                        `<div style="margin-top:4px; border-top:1px dashed #444; padding-top:4px;">
                            <span style="color:#888;">시공품:</span> <span style="color:#eed37f;">${(r.usedProducts||[]).join(', ')||'없음'}</span><br>
                            <span style="color:#888;">예상마진:</span> <span style="color:#10b981; font-weight:bold;">${Number(r.margin||0).toLocaleString()}원</span>
                        </div>` : '';

                    reportHtml = `
                        <div style="margin-top: 12px; padding: 12px; background: #111; border-radius: 6px; font-size: 13px; color: #ccc;">
                            <div style="font-weight:bold; color:var(--color-pure-white); margin-bottom:4px;">[작업완료 보고서]</div>
                            <div>💰 결제: ${r.payMethod} / ${parseInt(r.payAmount || 0).toLocaleString()}원</div>
                            ${marginHtml}
                            ${r.notes ? `<div style="margin-top:4px;">📝 메모: ${r.notes.replace(/\n/g, '<br>')}</div>` : ''}
                        </div>
                    `;
                }

                // 3가지 예약 경로 판별 (단어 자동 인지 판별식 강화 및 레거시 데이터 안전 변환)
                let sourceBadgeHtml = "";
                const resType = task.data.type || "";
                const notesText = String(cInfo.notes || "").toLowerCase();
                const aptText = String(cInfo.apt || "").toLowerCase();
                if (resType === "test" || notesText.includes("테스트") || aptText.includes("테스트")) {
                    sourceBadgeHtml = `<span style="background:#8b5cf6; color:#fff; padding:2px 6px; border-radius:4px; font-size:11px; font-weight:bold; margin-left:6px;">🧪 테스트</span>`;
                } else if (resType === "admin_phone" || resType === "phone" || resType === "admin" || notesText.includes("통화") || notesText.includes("전화") || notesText.includes("협의") || notesText.includes("관리자") || aptText.includes("통화") || aptText.includes("전화")) {
                    sourceBadgeHtml = `<span style="background:#f97316; color:#fff; padding:2px 6px; border-radius:4px; font-size:11px; font-weight:bold; margin-left:6px;">📞 통화협의</span>`;
                } else {
                    sourceBadgeHtml = `<span style="background:#3b82f6; color:#fff; padding:2px 6px; border-radius:4px; font-size:11px; font-weight:bold; margin-left:6px;">🌐 온라인</span>`;
                }

                const safeNotes = String(cInfo.notes || '').replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/\n/g, '\\n').replace(/\r/g, '');
                const notesShort = safeNotes.length > 30 ? safeNotes.substring(0,30) + '...' : safeNotes;

                grid.innerHTML += `
                    <div class="card">
                        <div class="card-header">
                            <div style="display:flex; align-items:center;">
                                <div class="time-badge">${timeStr}</div>
                                ${sourceBadgeHtml}
                            </div>
                            <div class="status-badge ${badgeClass}">${badgeText}</div>
                        </div>
                        <div class="card-body">
                            <div class="info-row"><div class="info-label">연락처</div><div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;"><span>${cInfo.phone || '-'}</span> ${cInfo.phone ? `<a href="tel:${cInfo.phone}" class="btn" style="padding:4px 8px; background:#10b981; color:#fff; text-decoration:none; font-size:12px; border-radius:4px; display:inline-flex; align-items:center; gap:2px;">📞 통화</a> <button class="btn" style="padding:4px 8px; background:#8b5cf6; color:#fff; font-weight:bold; font-size:12px; border-radius:4px; border:none; cursor:pointer;" onclick="try{window.saveToPhoneContactsFromCard('${task.rId}');}catch(e){alert('Error: '+e.message);}">👤 폰 주소록 저장</button> <button class="btn" style="padding:4px 8px; background:#374151; color:#fff; font-size:12px; border-radius:4px; border:none; cursor:pointer;" onclick="copyCustomerInfo('${(cInfo.apt||'').replace(/'/g, "")}', '${cInfo.phone}')">📋 명함복사</button> <select class="btn" style="padding:4px 6px; background:#f59e0b; color:#000; font-weight:bold; font-size:12px; border-radius:4px; border:none; cursor:pointer;" onchange="if(this.value){ try{sendSmsFromCard('${task.rId}', this.value);}catch(e){alert('Error: '+e.message);} this.value=''; }"><option value="">💬 문자발송(4대 SMS)</option><option value="receipt">📨 ① 접수 확인</option><option value="confirm">📍 ② 예약 확정</option><option value="change">🔄 ③ 일정 변경</option><option value="missing">⚠️ ④ 동호수 요청</option></select>` : ''}</div></div>
                            <div class="info-row"><div class="info-label">동/호수</div><div>${cInfo.apt || '-'}</div></div>
                            <div class="info-row">
                                <div class="info-label">기타(메모)</div>
                                <div>
                                    <div style="margin-bottom:4px;">${notesShort || '-'}</div>
                                    ${safeNotes ? `<button style="background:#fde68a; border:1px solid #f59e0b; border-radius:4px; padding:4px 8px; font-size:11px; cursor:pointer; color:#92400e; font-weight:bold;" onclick="alert('📝 기타(메모) 전체보기:\\n\\n${safeNotes}')">📝 전체 메모 및 통화요약 보기</button>` : ''}
                                </div>
                            </div>
                            <div class="info-row"><div class="info-label">시공품목</div><div style="color:var(--color-interactive-lime); font-weight:bold;">${itemsStr}</div></div>
                            
                            ${reportHtml}
                        </div>
                        
                        <div class="card-actions" style="display:flex; gap:8px; flex-wrap:wrap;">
                            <button class="btn" style="background:#3b82f6; color:#fff; border:none; cursor:pointer; font-weight:bold; padding:8px 12px; border-radius:6px; flex:1;" onclick="openEditCustomerModal('${task.rId}')">✏️ 고객정보 변경</button>
                            ${isCompleted ? 
                                `<button class="btn btn-secondary" style="flex:1;" onclick="openModal('${task.rId}')">📝 보고서 수정</button>
                                 <button class="btn" style="flex:1; background:#6366f1; color:white; border:none; cursor:pointer; font-weight:bold;" onclick="copyNotionArchive('${task.rId}')">📋 노션 복사</button>` :
                                `<button class="btn btn-primary" style="flex:1;" onclick="openModal('${task.rId}')">✅ 폼 작성</button>
                                 <button class="btn" style="flex:1; background:#e32652; color:white; border:none; cursor:pointer; font-weight:bold;" onclick="startVoiceReport('${task.rId}')">🎤 음성 보고</button>`
                            }
                        </div>
                    </div>
                `;
            });
            
            document.getElementById('stat-total').innerText = window.groupedTasks.length;
            document.getElementById('stat-completed').innerText = statCompleted;
            document.getElementById('stat-pending').innerText = statPending;
        }

        // Customer Info Edit Modal Logic
        window.openEditCustomerModal = function(rId) {
            const task = window.groupedTasks.find(t => t.rId === rId);
            if (!task) return;
            const cInfo = task.data.customerInfo || {};
            
            document.getElementById('edit-cust-rid').value = rId;
            document.getElementById('edit-cust-apt').value = cInfo.apt || '';
            document.getElementById('edit-cust-phone').value = cInfo.phone || '';
            
            let itemsStr = '';
            if (Array.isArray(cInfo.items)) itemsStr = cInfo.items.join(', ');
            else if (cInfo.items) itemsStr = String(cInfo.items);
            
            document.getElementById('edit-cust-items').value = itemsStr;
            document.getElementById('edit-cust-notes').value = cInfo.notes || '';
            
            document.getElementById('edit-customer-modal').style.display = 'flex';
        };

        window.closeEditCustomerModal = function() {
            document.getElementById('edit-customer-modal').style.display = 'none';
        };

        window.saveEditCustomerInfo = function() {
            if(!confirm('고객 정보(동/호수, 상품 등) 변경사항을 저장하시겠습니까?')) return;
            const rId = document.getElementById('edit-cust-rid').value;
            const task = window.groupedTasks.find(t => t.rId === rId);
            if (!task) return;
            
            const selectedDate = document.getElementById('date-picker').value;
            const newApt = document.getElementById('edit-cust-apt').value.trim();
            const newPhone = document.getElementById('edit-cust-phone').value.trim();
            const newItemsStr = document.getElementById('edit-cust-items').value.trim();
            const newNotes = document.getElementById('edit-cust-notes').value.trim();
            
            const newItems = newItemsStr.split(',').map(s => s.trim()).filter(Boolean);
            
            const updatedCustomerInfo = {
                ...(task.data.customerInfo || {}),
                apt: newApt,
                phone: newPhone,
                items: newItems.length > 0 ? newItems : [newItemsStr],
                notes: newNotes
            };
            
            let updates = {};
            task.times.forEach(t => {
                updates[`reservations/${selectedDate}/${t}/customerInfo`] = updatedCustomerInfo;
            });
            
            const execUpdate = window.update || update;
            const execRef = window.ref || ref;
            const targetDb = window.db || db;

            execUpdate(execRef(targetDb), updates).then(() => {
                alert('✅ 고객 정보가 성공적으로 변경되었습니다!');
                closeEditCustomerModal();
            }).catch(e => {
                alert('저장 실패: ' + e.message);
            });
        };

        // Modal Logic
        window.openModal = function(rId) {
            document.getElementById('report-modal').style.display = 'flex';
            document.getElementById('modal-res-id').value = rId;
            
            // 미디어 첨부 초기화 (버그 픽스: 이전 첨부 파일 초기화)
            const photosInput = document.getElementById('modal-photos');
            if (photosInput) photosInput.value = '';

            
            const task = window.groupedTasks.find(t => t.rId === rId);
            const report = task && task.data.report ? task.data.report : {};
            
            document.getElementById('modal-notes').value = report.notes || '';
            document.getElementById('modal-pay-method').value = report.payMethod || '계좌이체';
            document.getElementById('modal-pay-amount').value = report.payAmount || '';
            
            let used = report.usedProducts || [];
            window.currentSelectedProducts = used.map(p => {
                if (typeof p === 'string') {
                    // 구버전(문자열 배열) 호환성 처리
                    const mp = window.masterProducts.find(m => m.name === p) || {};
                    return { name: p, qty: 1, cost: Number(mp.costPrice)||0, sell: Number(mp.sellPrice)||0 };
                }
                return p;
            });
            
            // 모달 열 때 수동입력 초기화
            const payAmountInput = document.getElementById('modal-pay-amount');
            if (payAmountInput) {
                if (!payAmountInput.value) {
                    payAmountInput.dataset.autoFilled = 'true';
                } else {
                    payAmountInput.dataset.autoFilled = 'false';
                }
            }
            
            populateBrandCategories();
            renderAddedProducts();
        };

        function populateBrandCategories() {
            const catSelect = document.getElementById('modal-brand-cat');
            catSelect.innerHTML = '<option value="">-- 대분류 선택 --</option>';
            const predefinedCategories = [
                "하츠후드 엘리카", "하츠후드 플래티늄", "하츠후드 데코", "하츠후드 스템", 
                "하츠 전기레인지", "하츠 가스레인지", "하츠 수전빌트인", "하츠 씽크볼", 
                "하츠 기타빌트인", "기타카테고리"
            ];
            predefinedCategories.forEach(b => {
                catSelect.innerHTML += `<option value="${b}">${b}</option>`;
            });
            document.getElementById('modal-prod-select').innerHTML = '<option value="">-- 제품을 먼저 선택하세요 --</option>';
        }

        window.updateModalProductList = function() {
            const cat = document.getElementById('modal-brand-cat').value;
            const pSelect = document.getElementById('modal-prod-select');
            pSelect.innerHTML = '<option value="">-- 상품 선택 --</option>';
            if(!cat) return;
            
            const validCategories = [
                "하츠후드 엘리카", "하츠후드 플래티늄", "하츠후드 데코", "하츠후드 스템", 
                "하츠 전기레인지", "하츠 가스레인지", "하츠 수전빌트인", "하츠 씽크볼", "하츠 기타빌트인"
            ];
            
            window.masterProducts.forEach(p => {
                let c = p.category || "";
                let derivedCat = "기타카테고리";
                
                if (validCategories.includes(c)) {
                    derivedCat = c;
                }
                
                if(derivedCat === cat && p.name) {
                    pSelect.innerHTML += `<option value="${p.name}">${p.name} (${p.model||'모델명없음'})</option>`;
                }
            });
            
            if (cat === "기타카테고리") {
                pSelect.innerHTML += `<option value="직접입력(메모)">직접입력(메모기재)</option>`;
            }
        }

        window.addModalProduct = function() {
            const name = document.getElementById('modal-prod-select').value;
            const qty = parseInt(document.getElementById('modal-prod-qty').value);
            
            if(!name || isNaN(qty) || qty < 1) {
                alert('제품과 올바른 수량을 선택해주세요.');
                return;
            }
            
            let mp = window.masterProducts.find(m => m.name === name);
            if(!mp) {
                if (name === "비등록제품(메모참조)" || name === "출장/수리비") {
                    mp = { name: name, price_purchase: 0, price_selling: 0, cost: 0, sell: 0 };
                } else {
                    return;
                }
            }

            const existing = window.currentSelectedProducts.find(p => p.name === name);
            if(existing) {
                existing.qty += qty;
            } else {
                window.currentSelectedProducts.push({
                    name: name,
                    qty: qty,
                    cost: Number(mp.costPrice) || 0,
                    sell: Number(mp.sellPrice) || 0
                });
            }
            
            document.getElementById('modal-prod-qty').value = 1;
            renderAddedProducts();
        };

        window.removeModalProduct = function(index) {
            window.currentSelectedProducts.splice(index, 1);
            renderAddedProducts();
        };

        function renderAddedProducts() {
            const list = document.getElementById('modal-added-products');
            list.innerHTML = '';
            
            if(window.currentSelectedProducts.length === 0) {
                list.innerHTML = '<div style="color:#666; font-size:13px; text-align:center; padding:10px;">추가된 시공 제품이 없습니다.</div>';
            } else {
                window.currentSelectedProducts.forEach((p, idx) => {
                    list.innerHTML += `
                        <div style="display:flex; justify-content:space-between; align-items:center; padding:8px; background:#222; margin-bottom:4px; border-radius:4px; border:1px solid #444;">
                            <div>
                                <span style="color:#eed37f; font-weight:bold;">${p.name}</span>
                                <span style="color:#aaa; font-size:13px; margin-left:8px;">${p.qty}개</span>
                            </div>
                            <button class="btn btn-secondary" style="width:auto; padding:4px 8px; font-size:11px;" onclick="removeModalProduct(${idx})">삭제</button>
                        </div>
                    `;
                });
            }
            window.calculateMargin();
        }

        window.calculateMargin = function() {
            let totalCost = 0;
            let totalSell = 0;
            window.currentSelectedProducts.forEach(p => {
                totalCost += (p.cost || 0) * p.qty;
                totalSell += (p.sell || 0) * p.qty;
            });
            const margin = totalSell - totalCost;
            document.getElementById('modal-total-cost').innerText = totalCost.toLocaleString() + ' 원';
            document.getElementById('modal-total-sell').innerText = totalSell.toLocaleString() + ' 원';
            document.getElementById('modal-margin').innerText = margin.toLocaleString() + ' 원';

            // 결제 금액 입력란 자동 채우기 (비어있는 경우)
            const payAmountInput = document.getElementById('modal-pay-amount');
            if (payAmountInput) {
                // 사용자가 임의로 입력한 값이 아닌 경우에만 덮어쓰기 (처음이거나 빈칸일때)
                if (!payAmountInput.value || payAmountInput.dataset.autoFilled === 'true') {
                    payAmountInput.value = totalSell > 0 ? totalSell : '';
                    payAmountInput.dataset.autoFilled = 'true';
                }
            }
        };

        window.closeModal = function() {
            document.getElementById('report-modal').style.display = 'none';
        };

        window.saveReport = async function() {
            const rId = document.getElementById('modal-res-id').value;
            const selectedDate = document.getElementById('date-picker').value;
            const task = window.groupedTasks.find(t => t.rId === rId);
            
            if (!task) return;
            
            const notes = document.getElementById('modal-notes').value;
            const payMethod = document.getElementById('modal-pay-method').value;
            const payAmount = document.getElementById('modal-pay-amount').value;
            
            if (window.currentSelectedProducts.length === 0) {
                if(!confirm("선택된 시공 제품이 없습니다. 이대로 저장하시겠습니까?")) return;
            }
            
            let totalCost = 0;
            let totalSell = 0;
            let productNamesForMemo = [];
            
            window.currentSelectedProducts.forEach(p => {
                totalCost += (Number(p.cost) || 0) * (Number(p.qty) || 1);
                totalSell += (Number(p.sell) || 0) * (Number(p.qty) || 1);
                productNamesForMemo.push(`${p.name} ${p.qty}개`);
            });
            
            const margin = totalSell - totalCost;

            // --- 미디어 업로드 로직 추가 ---
            const photosInput = document.getElementById('modal-photos');
            const files = photosInput ? photosInput.files : [];
            let uploadedUrls = [];

            if (files.length > 0) {
                // UI에 업로드 중 표시 (버튼 텍스트 변경 등)
                const saveBtn = document.querySelector('#report-modal .modal-content button.btn-primary');
                const originalBtnText = saveBtn.innerText;
                
                try {
                    for (let i = 0; i < files.length; i++) {
                        saveBtn.innerText = `사진 업로드 중... (${i+1}/${files.length})`;
                        const file = files[i];
                        const storageRef = window.sRef(window.storage, `reports/${selectedDate}/${rId}/${Date.now()}_${file.name}`);
                        await window.uploadBytes(storageRef, file);
                        const downloadUrl = await window.getDownloadURL(storageRef);
                        uploadedUrls.push(downloadUrl);
                    }
                } catch (err) {
                    console.error("Storage 업로드 에러:", err);
                    alert("사진 업로드 중 오류가 발생했습니다.");
                    saveBtn.innerText = originalBtnText;
                    return; // 업로드 실패 시 저장 중단
                }
                saveBtn.innerText = originalBtnText;
            }

            const reportData = {
                notes,
                payMethod,
                payAmount,
                usedProducts: window.currentSelectedProducts,
                totalCost,
                totalSell,
                margin,
                mediaUrls: uploadedUrls, // 업로드된 이미지 URL 저장
                timestamp: Date.now()
            };

            const updates = {};
            const isFirstCompletion = task.data.status !== 'completed';

            task.times.forEach(time => {
                updates[`reservations/${selectedDate}/${time}/report`] = reportData;
                updates[`reservations/${selectedDate}/${time}/status`] = 'completed';
            });

            if (isFirstCompletion) {
                window.currentSelectedProducts.forEach(p => {
                    updates[`inventory_counts/${p.name}`] = increment(-p.qty);
                });
            }

            const numericAmount = parseInt(payAmount);
            if (!isNaN(numericAmount) && numericAmount > 0) {
                let ledgerAccount = '현금';
                if (payMethod === '계좌이체' || payMethod === '선결제') ledgerAccount = '이체(우리은행)';
                else if (payMethod === '카드') ledgerAccount = '카드(대리점)';

                const newLedgerKey = push(ref(window.db, 'ledger')).key;
                const cInfo = task.data.customerInfo || {};
                const aptInfo = cInfo.apt ? ` (${cInfo.apt})` : '';

                updates[`ledger/${newLedgerKey}`] = {
                    date: selectedDate,
                    type: 'income',
                    category: '시공 수입',
                    account: ledgerAccount,
                    amount: numericAmount,
                    memo: `[작업보고서] ${productNamesForMemo.join(', ')}${aptInfo}`,
                    timestamp: Date.now()
                };
            }

            const execUpdate = window.update || update;
            const execRef = window.ref || ref;
            const targetDb = window.db || db;

            try {
                await execUpdate(execRef(targetDb), updates);
                
                // Supabase 재고 차감 (5단계 로직)
                if (isFirstCompletion) {
                    for (const p of window.currentSelectedProducts) {
                        try {
                            const { error } = await window.supabaseClient.rpc('decrement_inventory', {
                                product_name: p.name,
                                qty: p.qty
                            });
                            if (error) console.error("Supabase Inventory Decrement Error:", error);
                        } catch (err) {
                            console.error("Supabase Call Error:", err);
                        }
                    }
                }
                
                closeModal();
            } catch(e) {
                alert('저장 실패: ' + e.message);
            }
        };

        // 고객 식별 정보 복사 (5단계 CRM MVP)
        window.copyCustomerInfo = function(apt, phone) {
            const text = `[하츠V2] ${apt} / ${phone}`;
            navigator.clipboard.writeText(text).then(() => {
                alert('✅ 고객 식별 정보가 복사되었습니다:\n' + text);
            }).catch(() => {
                prompt('아래 텍스트를 복사하세요:', text);
            });
        };

        // 노션 시공대장 복사 (3단계 노션 반출 MVP)
        window.copyNotionArchive = function(rId) {
            const task = window.groupedTasks.find(t => t.rId === rId);
            if (!task || !task.data.report) {
                alert('완료 보고서가 없습니다.');
                return;
            }
            const cInfo = task.data.customerInfo || {};
            const r = task.data.report;
            const dateStr = document.getElementById('date-picker').value;
            
            const text = `📍 [시공완료] ${dateStr}\n` +
                         `▪️ 동호수: ${cInfo.apt || '-'}\n` +
                         `▪️ 연락처: ${cInfo.phone || '-'}\n` +
                         `▪️ 시공품목: ${(r.usedProducts||[]).join(', ')||'없음'}\n` +
                         `▪️ 결제금액: ${parseInt(r.payAmount||0).toLocaleString()}원 (${r.payMethod})\n` +
                         `▪️ 예상마진: ${parseInt(r.margin||0).toLocaleString()}원\n` +
                         `▪️ 현장메모: ${r.notes || '없음'}`;
                         
            navigator.clipboard.writeText(text).then(() => {
                alert('📋 노션 시공대장 데이터가 클립보드로 복사되었습니다!\n노션 페이지에 Ctrl+V 하세요.\n\n' + text);
            }).catch(() => {
                prompt('아래 텍스트를 복사하여 노션에 붙여넣으세요:', text);
            });
        };

        // 카드 내에서 4대 SMS 발송
        window.sendSmsFromCard = function(rId, type) {
            const task = window.groupedTasks.find(t => t.rId === rId);
            if (!task) return;
            const cInfo = task.data.customerInfo || {};
            const apt = cInfo.apt || '';
            const phone = cInfo.phone || '';
            const items = Array.isArray(cInfo.items) ? cInfo.items.join(', ') : (cInfo.items ? String(cInfo.items) : '');
            const dateStr = document.getElementById('date-picker').value || '';
            const d = new Date(dateStr);
            const days = ['일','월','화','수','목','금','토'];
            const dateFormatted = `${d.getMonth()+1}/${d.getDate()}(${days[d.getDay()]})`;
            const startTime = task.times[0] || '';
            
            let body = "";
            if(type === 'receipt') {
                body = `안녕하세요?\n하츠 접수 확인입니다.\n\n${apt}\n\n설치 희망일시 : ${dateFormatted} ${startTime}\n\n신청제품 : ${items}\n특기사항 : \n\n📍 일정이 검토 후 확정되면 확정 문자를 다시 보내드립니다.\n\n감사합니다~\n담당 010-2886-5086`;
            } else if(type === 'confirm') {
                body = `안녕하세요?\n하츠 설치예약(확정) 안내입니다.\n\n${apt}\n\n도착시간 : ${dateFormatted} ${startTime}\n\n신청제품 : ${items}\n특기사항 : \n\n감사합니다~\n담당 010-2886-5086`;
            } else if(type === 'change') {
                body = `안녕하세요?\n하츠 설치예약(변경) 안내입니다.\n\n${apt}\n\n도착시간 : ${dateFormatted} ${startTime}\n\n신청제품 : ${items}\n특기사항 : \n\n감사합니다~\n담당 010-2886-5086`;
            } else if(type === 'missing') {
                body = `안녕하세요?\n하츠 접수안내 및 (동호수)요청입니다.\n📍누락 데이터 : 동 호수\n\n접수데이터 ----\n${apt}\n\n설치 희망일시 : ${dateFormatted} ${startTime}\n\n신청제품 : ${items}\n\n📍전화나 문자로 동호수를 알려주세요.\n접수안내 문자를 다시 보내드리겠습니다.\n\n감사합니다~\n담당 010-2886-5086`;
            }
            window.location.href = `sms:${phone}?body=${encodeURIComponent(body)}`;
        };

        window.saveToPhoneContactsFromCard = function(rId) {
            const task = window.groupedTasks.find(t => t.rId === rId);
            if (!task) return;
            const cInfo = task.data.customerInfo || {};
            const apt = cInfo.apt || "고객";
            const phone = (cInfo.phone || "").replace(/[^0-9]/g, '');
            const items = (cInfo.items || []).join(', ') || "신청상품";
            const notes = cInfo.notes || "";
            
            const vcard = [
                "BEGIN:VCARD",
                "VERSION:3.0",
                `FN:${apt}`,
                `TEL;TYPE=CELL:${phone}`,
                `NOTE:신청상품: ${items} / 메모: ${notes}`,
                "END:VCARD"
            ].join("\r\n");
            
            const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.setAttribute('download', `${apt}.vcf`);
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        };

        // 음성 보고(Voice Report) 로직
        let mediaRecorder;
        let audioChunks = [];
        let isRecording = false;

        window.startVoiceReport = function(rId) {
            try {
                document.getElementById('voice-report-modal').style.display = 'flex';
                document.getElementById('voice-report-rid').value = rId;
                document.getElementById('voice-status-text').innerHTML = '버튼을 누르고 말씀하세요.<br>예: "티오람 교체했고 현금 5만원 받았어"';
                const btn = document.getElementById('btn-record-toggle');
                btn.style.animation = 'none';
                btn.style.borderColor = '#ff4d6d';
                audioChunks = []; // 초기화
            } catch (err) {
                alert("Error in startVoiceReport: " + err.message);
            }
        };

        window.closeVoiceReportModal = function() {
            document.getElementById('voice-report-modal').style.display = 'none';
            if (isRecording && mediaRecorder) {
                mediaRecorder.stop();
                isRecording = false;
            }
        };

        document.getElementById('btn-record-toggle').addEventListener('click', async function() {
            if (!isRecording) {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    mediaRecorder = new MediaRecorder(stream);
                    audioChunks = [];
                    
                    mediaRecorder.ondataavailable = e => {
                        if (e.data.size > 0) audioChunks.push(e.data);
                    };
                    
                    mediaRecorder.onstop = () => {
                        console.log("녹음 완료:", audioChunks.length, "chunks");
                    };
                    
                    mediaRecorder.start();
                    isRecording = true;
                    
                    // UI 변경
                    this.style.animation = 'pulse 1.5s infinite';
                    this.style.borderColor = '#10b981';
                    document.getElementById('voice-status-text').innerHTML = '<span style="color:#10b981; font-weight:bold;">녹음 중입니다... 완료하려면 다시 누르세요.</span>';
                } catch (err) {
                    alert('마이크 접근 권한이 필요합니다. 설정에서 마이크를 허용해주세요.');
                }
            } else {
                mediaRecorder.stop();
                isRecording = false;
                
                // UI 변경
                this.style.animation = 'none';
                this.style.borderColor = '#ff4d6d';
                document.getElementById('voice-status-text').innerHTML = '녹음이 완료되었습니다. <br>[✨ AI 분석 시작]을 눌러주세요.';
            }
        });

        window.analyzeVoiceReport = async function() {
            if (audioChunks.length === 0) {
                alert('녹음된 음성이 없습니다. 버튼을 눌러 녹음해주세요.');
                return;
            }
            
            document.getElementById('voice-status-text').innerHTML = '음성 데이터 전송 및 AI 분석 중... ⏳ (약 5~10초 소요)';
            
            try {
                // 1. 오디오 청크를 하나의 Blob으로 병합 (WebM 형식)
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                
                // 2. Base64로 변환하여 서버리스 함수로 전송
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = async function() {
                    const base64data = reader.result.split(',')[1];
                    
                    try {
                        const analyzeVoiceReportFn = httpsCallable(functions, 'analyzeVoiceReport');
                        const result = await analyzeVoiceReportFn({
                            audioBase64: base64data,
                            mimeType: 'audio/webm'
                        });
                        
                        const aiData = result.data;
                        closeVoiceReportModal();
                        
                        // 3. 결과 파싱 및 폼 적용
                        processAIReportData(aiData, document.getElementById('voice-report-rid').value);
                    } catch (fnErr) {
                        console.error('Function Error:', fnErr);
                        alert('AI 분석 중 오류가 발생했습니다: ' + fnErr.message);
                        document.getElementById('voice-status-text').innerHTML = '분석 실패. 닫고 다시 시도해주세요.';
                    }
                };
            } catch (err) {
                console.error(err);
                alert('오디오 처리 중 오류 발생');
                document.getElementById('voice-status-text').innerHTML = '오류 발생.';
            }
        };
        
        function processAIReportData(data, rId) {
            const { matchedProduct, payMethod, payAmount, notes } = data;
            
            // 스마트 매칭 로직 (4단계)
            let foundProduct = null;
            if (matchedProduct && window.masterProducts) {
                // 단순 텍스트 포함 여부로 가장 그럴싸한 제품 검색 (대소문자, 띄어쓰기 무시)
                const searchStr = String(matchedProduct || "").replace(/ /g, '').toLowerCase();
                foundProduct = window.masterProducts.find(p => {
                    const pName = String(p.name || "").replace(/ /g, '').toLowerCase();
                    const pModel = String(p.model || "").replace(/ /g, '').toLowerCase();
                    return pName.includes(searchStr) || searchStr.includes(pName) || (pModel && (pModel.includes(searchStr) || searchStr.includes(pModel)));
                });
            }

            if (foundProduct) {
                // 승인 팝업 띄우기
                document.getElementById('ai-match-modal').style.display = 'flex';
                document.getElementById('ai-match-name').innerText = foundProduct.name;
                document.getElementById('ai-match-model').innerText = foundProduct.model || '상세 모델명 없음';
                
                // 썸네일 렌더링
                const imgEl = document.getElementById('ai-match-img');
                if (foundProduct.imageUrl) {
                    imgEl.src = foundProduct.imageUrl;
                    imgEl.style.display = 'block';
                } else {
                    imgEl.style.display = 'none';
                }
                
                // 확정 콜백
                window.confirmAiMatch = function() {
                    document.getElementById('ai-match-modal').style.display = 'none';
                    applyAiDataToForm(rId, data, foundProduct);
                };
                
                // 취소 콜백
                window.rejectAiMatch = function() {
                    document.getElementById('ai-match-modal').style.display = 'none';
                    applyAiDataToForm(rId, data, null);
                };
            } else {
                // 매칭 실패 시 그냥 폼에 넣기 (기타 메모로)
                applyAiDataToForm(rId, data, null);
            }
        }
        
        function applyAiDataToForm(rId, aiData, foundProduct) {
            const { matchedProduct, payMethod, payAmount, notes } = aiData;
            
            openModal(rId);
            
            setTimeout(() => {
                let finalNotes = (notes || '') + '\n(🎤 AI 음성 분석 완료)';
                
                // 제품 매칭 성공 시 장바구니에 쏙!
                if (foundProduct) {
                    const existing = window.currentSelectedProducts.find(p => p.name === foundProduct.name);
                    if(existing) {
                        existing.qty += 1;
                    } else {
                        window.currentSelectedProducts.push({
                            name: foundProduct.name,
                            qty: 1,
                            cost: Number(foundProduct.costPrice) || 0,
                            sell: Number(foundProduct.sellPrice) || 0
                        });
                    }
                    renderAddedProducts();
                } else if (matchedProduct && matchedProduct !== '없음' && matchedProduct !== 'null') {
                    // 매칭 실패 시 특이사항 첫 줄에 기록
                    finalNotes = `[매칭 실패 제품: ${matchedProduct}]\n` + finalNotes;
                }
                
                document.getElementById('modal-notes').value = finalNotes;
                
                if (payMethod && payMethod !== '없음') {
                    // 키워드 정규화
                    let finalMethod = '계좌이체';
                    if (payMethod.includes('현금')) finalMethod = '현금';
                    else if (payMethod.includes('카드')) finalMethod = '카드';
                    else if (payMethod.includes('선결제')) finalMethod = '선결제';
                    
                    document.getElementById('modal-pay-method').value = finalMethod;
                }
                
                if (payAmount && !isNaN(parseInt(payAmount)) && parseInt(payAmount) > 0) {
                    document.getElementById('modal-pay-amount').value = parseInt(payAmount);
                    document.getElementById('modal-pay-amount').dataset.autoFilled = 'false';
                }
            }, 300);
        }

        // 초기 실행
        loadData();

    