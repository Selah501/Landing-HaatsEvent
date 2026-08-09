const fs = require('fs');

let content = fs.readFileSync('public/erp.html', 'utf8');

const oldNav = `<div class="nav-links">
                <a href="./admin.html">기본관리자</a>
                <a href="./admin_v2.html">작업지시서</a>
                <button onclick="document.getElementById('app').classList.toggle('view-mobile')" style="background:none; border:1px solid #666; color:white; padding:4px 8px; border-radius:4px; cursor:pointer;">PC/모바일 전환</button>
            </div>`;
const newNav = `<div class="nav-links" style="display:flex; align-items:center; gap:8px;">
                <div id="nav-container"></div>
                <button onclick="document.getElementById('app').classList.toggle('view-mobile')" style="background:none; border:1px solid #666; color:white; padding:4px 8px; border-radius:4px; cursor:pointer;">PC/모바일 전환</button>
            </div>`;
content = content.replace(oldNav, newNav);

const oldScript = `<!-- Firebase SDK -->
    <script type="module">`;
const newScript = `<!-- Firebase SDK -->
    <script src="./auth.js"></script>
    <script type="module">`;
content = content.replace(oldScript, newScript);

const targetInit = `const db = getDatabase(app);`;
const replaceInit = `const db = getDatabase(app);
        
        initAdminAuth(() => {
            document.getElementById('nav-container').innerHTML = renderAdminNav('erp');
        });`;
content = content.replace(targetInit, replaceInit);

fs.writeFileSync('public/erp.html', content, 'utf8');
console.log('erp.html updated successfully.');
