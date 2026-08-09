const fs = require('fs');

let content = fs.readFileSync('public/reservation_v2.html', 'utf8');

// 1. Add auth.js script tag
const targetScript = `    <script type="module">
        import { initializeApp }`;
const replaceScript = `    <script src="./auth.js"></script>
    <script type="module">
        import { initializeApp }`;
if (content.includes(targetScript)) {
    content = content.replace(targetScript, replaceScript);
}

// 2. Fix loginAdmin function
const targetLoginAdmin = `        window.loginAdmin = function() {
            window.location.href = "./admin.html";
        }
        
        window.addEventListener('DOMContentLoaded', () => {
            if(sessionStorage.getItem('adminAuth') === 'true') {
                window.isAdmin = true;
                document.getElementById('admin-panel').style.display = "block";
            }
        });`;

const replaceLoginAdmin = `        window.loginAdmin = function() {
            if (window.isAdmin) {
                alert("이미 관리자 모드입니다.");
                return;
            }
            initAdminAuth(() => {
                window.isAdmin = true;
                document.getElementById('admin-panel').style.display = "block";
                if(window.selectedDate) {
                    renderTimeSlots(window.selectedDate); // 리렌더링하여 클릭 활성화
                }
                alert("관리자 모드로 전환되었습니다.");
            });
        }
        
        window.addEventListener('DOMContentLoaded', () => {
            if(sessionStorage.getItem('adminAuth') === 'true') {
                window.isAdmin = true;
                document.getElementById('admin-panel').style.display = "block";
            }
        });`;

if (content.includes(targetLoginAdmin)) {
    content = content.replace(targetLoginAdmin, replaceLoginAdmin);
}

fs.writeFileSync('public/reservation_v2.html', content, 'utf8');
console.log('reservation_v2.html updated successfully with inline admin Auth.');
