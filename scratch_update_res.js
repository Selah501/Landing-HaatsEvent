const fs = require('fs');

let content = fs.readFileSync('public/reservation_v2.html', 'utf8');

const target1 = `        window.loginAdmin = function() {
            if (window.isAdmin) {
                alert("이미 관리자 모드입니다.");
                return;
            }
            const pwd = prompt("관리자 비밀번호를 입력하세요:");
            if (pwd === "5096") {
                window.isAdmin = true;
                document.getElementById('admin-panel').style.display = "block";
                if(window.selectedDate) {
                    renderTimeSlots(window.selectedDate); // 리렌더링하여 클릭 활성화
                }
                alert("관리자 모드로 전환되었습니다.");
            } else {
                alert("비밀번호가 틀렸습니다.");
            }
        }`;

const replace1 = `        window.loginAdmin = function() {
            window.location.href = "./admin.html";
        }
        
        window.addEventListener('DOMContentLoaded', () => {
            if(sessionStorage.getItem('adminAuth') === 'true') {
                window.isAdmin = true;
                document.getElementById('admin-panel').style.display = "block";
            }
        });`;

content = content.replace(target1, replace1);

fs.writeFileSync('public/reservation_v2.html', content, 'utf8');
console.log('reservation_v2.html updated successfully.');
