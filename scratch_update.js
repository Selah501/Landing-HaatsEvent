const fs = require('fs');

let content = fs.readFileSync('public/admin_v2.html', 'utf8');

const oldNav = `<a href="./admin.html" style="color: white; text-decoration: none; font-size: 14px; background: #374151; padding: 6px 12px; border-radius: 6px;">⚙️ 기본관리자</a>
                <a href="./erp.html" style="color: white; text-decoration: none; font-size: 14px; background: #10b981; padding: 6px 12px; border-radius: 6px;">📊 재무/장부</a>`;
const newNav = `<div id="nav-container"></div>`;
content = content.replace(oldNav, newNav);

const target1 = `<!-- Firebase SDK -->
    <script type="module">`;
const replace1 = `<!-- Firebase SDK -->
    <script src="./auth.js"></script>
    <script type="module">`;
content = content.replace(target1, replace1);

const target2 = `        // Load master_products globally
        onValue(ref(db, 'master_products'), (snapshot) => {
            const data = snapshot.val();
            if(data) {
                window.masterProducts = Array.isArray(data) ? data : Object.values(data);
            }
        });`;
const replace2 = `        initAdminAuth(() => {
            document.getElementById('nav-container').innerHTML = renderAdminNav('admin_v2');
            
            // Load master_products globally
            onValue(ref(db, 'master_products'), (snapshot) => {
                const data = snapshot.val();
                if(data) {
                    window.masterProducts = Array.isArray(data) ? data : Object.values(data);
                }
            });
            
            const urlParams = new URLSearchParams(window.location.search);
            const forceDate = urlParams.get('date');
            if (forceDate) {
                document.getElementById('date-picker').value = forceDate;
            } else {
                const today = new Date();
                const yy = today.getFullYear();
                const mm = String(today.getMonth() + 1).padStart(2, '0');
                const dd = String(today.getDate()).padStart(2, '0');
                document.getElementById('date-picker').value = \`\${yy}-\${mm}-\${dd}\`;
            }
            loadData();
        });`;
content = content.replace(target2, replace2);

const target3 = `        const urlParams = new URLSearchParams(window.location.search);
        const forceDate = urlParams.get('date');
        if (forceDate) {
            document.getElementById('date-picker').value = forceDate;
        } else {
            const today = new Date();
            const yy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            document.getElementById('date-picker').value = \`\${yy}-\${mm}-\${dd}\`;
        }

        window.loadData = function() {`;
const replace3 = `        window.loadData = function() {`;
content = content.replace(target3, replace3);

fs.writeFileSync('public/admin_v2.html', content, 'utf8');
console.log('admin_v2.html updated successfully.');
