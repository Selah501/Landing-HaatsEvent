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
    
    box.appendChild(h2);
    box.appendChild(input);
    box.appendChild(document.createElement("br"));
    box.appendChild(btn);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    
    setTimeout(() => input.focus(), 100);
}

function renderAdminNav(activePageId) {
    const pages = [
        { id: 'admin', name: '⚙️ 기본설정', url: './admin.html', color: '#2563eb' },
        { id: 'admin_v2', name: '📋 작업지시', url: './admin_v2.html', color: '#8b5cf6' },
        { id: 'erp', name: '📊 재무장부', url: './erp.html', color: '#10b981' },
        { id: 'price_calculator', name: '💰 판매가계산', url: './price_calculator.html', color: '#c9ff00' }
    ];

    let navHTML = `<div style="display: flex; gap: 8px; flex-wrap: wrap;" id="admin-unified-nav">`;
    
    pages.forEach(p => {
        const isActive = activePageId === p.id;
        const bgColor = isActive ? p.color : '#e5e7eb';
        const textColor = isActive ? 'white' : '#4b5563';
        const shadow = isActive ? 'box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);' : '';
        navHTML += `<a href="${p.url}" style="text-decoration: none; padding: 10px 16px; border-radius: 6px; font-weight: 600; font-size: 14px; background-color: ${bgColor}; color: ${textColor}; transition: 0.2s; ${shadow}">${p.name}</a>`;
    });

    navHTML += `</div>`;
    return navHTML;
}
