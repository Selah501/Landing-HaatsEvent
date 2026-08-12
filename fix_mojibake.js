const fs = require('fs');

const html = fs.readFileSync('c:/dev/전단지이벤트/landing/public/admin.html', 'utf8');

const regex = /window\.addMasterRow = function\(\) \{[\s\S]*?alert\('배정\?\?\?버\?\?\?\?되\?습\?다\.'\);\r?\n    \}/;

const cleanBlock = `window.addMasterRow = function() {
        window.currentProducts.push({
            id: 'p_' + Date.now(),
            name: '', model: '', features: '', duration: '', remarks: '', defaultPriceText: '', detailLink: ''
        });
        renderMasterList();
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
        document.getElementById('assign-modal-title').innerText = \`[\${prod.name}] 현장 일괄 배정\`;

        const listDiv = document.getElementById('assign-list');
        listDiv.innerHTML = '';
        window.currentData.forEach((ev, evIdx) => {
            const inMain = (ev.mainProducts || []).some(p => p.id === prodId);
            const inAddon = (ev.addonProducts || []).some(p => p.id === prodId);
            
            listDiv.innerHTML += \`
                <div class="assignment-row">
                    <strong style="font-size:14px; width:150px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">\${ev.title}</strong>
                    <div class="radio-group" style="display:flex;">
                        <label><input type="radio" name="assign-\${evIdx}" value="none" \${(!inMain && !inAddon) ? 'checked' : ''}> 미배정</label>
                        <label><input type="radio" name="assign-\${evIdx}" value="main" \${inMain ? 'checked' : ''}> 메인 상품</label>
                        <label><input type="radio" name="assign-\${evIdx}" value="addon" \${inAddon ? 'checked' : ''}> 부가 상품</label>
                    </div>
                </div>
            \`;
        });
    }

    window.closeAssignModal = function() {
        document.getElementById('assign-modal').style.display = 'none';
    }

    window.saveAssignments = function() {
        const prodId = document.getElementById('assign-prod-id').value;
        
        window.currentData.forEach((ev, evIdx) => {
            const val = document.querySelector(\`input[name="assign-\${evIdx}"]:checked\`).value;
            
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
    }`;

if(html.match(regex)) {
    const newHtml = html.replace(regex, cleanBlock);
    fs.writeFileSync('c:/dev/전단지이벤트/landing/public/admin.html', newHtml, 'utf8');
    console.log('Successfully replaced corrupted functions with clean ones.');
} else {
    console.log('Regex did not match.');
}
