const ADMIN_PWD = "2896";

function initAdminAuth(onSuccess) {
    if (sessionStorage.getItem("adminAuth") === "true") {
        if (onSuccess) onSuccess();
        return;
    }

    const overlay = document.createElement("div");
    overlay.id = "auth-login-overlay";
    overlay.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:#f3f4f6; display:flex; justify-content:center; align-items:center; z-index:2147483647;";
    
    const box = document.createElement("div");
    box.style.cssText = "background:white; padding:40px; border-radius:12px; box-shadow:0 10px 25px rgba(0,0,0,0.1); text-align:center; max-width: 90%; width: 320px;";
    
    const h2 = document.createElement("h2");
    h2.textContent = "🔒 통합 관리자 로그인";
    h2.style.cssText = "margin-top:0; color:#111827; margin-bottom:24px; font-size: 20px;";
    
    const input = document.createElement("input");
    input.type = "password";
    input.placeholder = "비밀번호 입력";
    input.style.cssText = "padding:12px; font-size:18px; text-align:center; border:2px solid #d1d5db; border-radius:8px; width:100%; box-sizing: border-box; margin-bottom:20px; outline:none;";
    input.onkeypress = (e) => { if (e.key === 'Enter') checkPwd(); };
    
    const btn = document.createElement("button");
    btn.textContent = "접속하기";
    btn.style.cssText = "padding:12px 24px; font-size:16px; width:100%; background-color:#10b981; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:600; transition: background 0.2s;";
    btn.onclick = checkPwd;
    
    function checkPwd() {
        if (input.value === ADMIN_PWD) {
            sessionStorage.setItem("adminAuth", "true");
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.remove();
                if (onSuccess) onSuccess();
            }, 200);
        } else {
            alert("비밀번호가 일치하지 않습니다.");
            input.value = "";
            input.focus();
        }
    }
    
    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "돌아가기(취소)";
    cancelBtn.style.cssText = "margin-top:10px; padding:12px 24px; font-size:16px; width:100%; background-color:#e5e7eb; color:#4b5563; border:none; border-radius:6px; cursor:pointer; font-weight:600;";
    cancelBtn.onclick = () => {
        overlay.remove();
        if (window.location.pathname.includes('admin') || window.location.pathname.includes('erp') || window.location.pathname.includes('product_master') || window.location.pathname.includes('manual') || window.location.pathname.includes('price_calculator')) {
            window.location.href = './index.html';
        }
    };
    
    box.appendChild(h2);
    box.appendChild(input);
    box.appendChild(document.createElement("br"));
    box.appendChild(btn);
    box.appendChild(cancelBtn);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    
    setTimeout(() => input.focus(), 100);
}

function renderUnifiedHeader(activePageId, pageTitle) {
    const groups = [
        {
            label: '현장·현업',
            pages: [
                { id: 'admin_v2', name: '📋 작업지시', url: './admin_v2.html', color: '#8b5cf6' },
                { id: 'reservation', name: '📅 예약시스템', url: './reservation_v2.html?admin=true', color: '#6366f1' },
                { id: 'search', name: '🔎 시공 검색', url: './admin_v2.html?tab=search', color: '#f59e0b' },
                { id: 'erp', name: '📊 재무장부', url: './erp.html', color: '#10b981' }
            ]
        },
        {
            label: '상품·자료',
            pages: [
                { id: 'product_master', name: '📦 상품 마스터', url: './product_master.html', color: '#f97316' },
                { id: 'price_calculator', name: '💰 판매가계산', url: './price_calculator.html', color: '#c9ff00' },
                { id: 'apt_db', name: '🏢 아파트 DB', url: './apt_db.html', color: '#0ea5e9' },
                { id: 'photo_gallery', name: '📸 시공사진', url: './photo_gallery.html', color: '#06b6d4' }
            ]
        },
        {
            label: '통제·고객',
            pages: [
                { id: 'admin', name: '⚙️ 관리자메인', url: './admin.html', color: '#2563eb' },
                { id: 'manual', name: '📖 매뉴얼', url: './manual.html', color: '#ec4899' },
                { id: 'landing', name: '🏠 랜딩', url: './index.html', color: '#4b5563' },
                { id: 'always_on', name: '🛍️ 상시페이지', url: './catalog.html', color: '#84cc16' }
            ]
        }
    ];

    let navHTML = `<div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;" id="admin-unified-nav">`;

    groups.forEach(g => {
        navHTML += `<div style="display: flex; align-items: center; gap: 5px; flex-wrap: wrap; background: rgba(255,255,255,0.04); border: 1px solid #333; border-radius: 8px; padding: 4px 8px;">`;
        navHTML += `<span style="font-size: 11px; font-weight: 700; color: #9ca3af; margin-right: 4px; white-space: nowrap;">${g.label}</span>`;
        g.pages.forEach(p => {
            const isActive = activePageId === p.id;
            const bgColor = isActive ? p.color : '#2c2c2e';
            const textColor = isActive ? ((p.id === 'price_calculator' || p.id === 'always_on') ? '#000' : 'white') : '#d1d5db';
            const shadow = isActive ? 'box-shadow: 0 2px 6px rgba(0,0,0,0.35);' : '';
            navHTML += `<a href="${p.url}" style="text-decoration: none; padding: 5px 9px; border-radius: 6px; font-weight: 600; font-size: 12px; background-color: ${bgColor}; color: ${textColor}; transition: 0.2s; white-space: nowrap; ${shadow}">${p.name}</a>`;
        });
        navHTML += `</div>`;
    });

    navHTML += `</div>`;

    const dbStatusId = (activePageId === 'admin') ? 'db-status' : 'header-db-status';

    return `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; padding: 12px 18px; background-color: #1c1c1e; border-bottom: 1px solid #333; border-radius: 8px;">
            <div style="display: flex; align-items: center; gap: 14px;">
                <span id="${dbStatusId}" style="color:#10b981; font-weight:bold; font-size:13px; white-space:nowrap;">🟢 실시간 연동 중</span>
                <h1 style="margin:0; font-size: 19px; color: #fff; white-space:nowrap;">${pageTitle}</h1>
            </div>
            <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                ${navHTML}
            </div>
        </div>
    `;
}
