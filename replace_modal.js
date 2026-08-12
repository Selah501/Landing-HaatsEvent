const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'public', 'admin.html');
let content = fs.readFileSync(filePath, 'utf8');

const newFunc = `    window.openEventModal = function(index = -1) {
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
                managerSelect.innerHTML += \`<option value="\${mgr.id}" \${ev.managerId === mgr.id ? 'selected' : ''}>\${mgr.name} (\${mgr.phone})</option>\`;
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
            optionsHtml += \`<optgroup label="\${cat}">\`;
            optionsHtml += prods.map(p => \`<option value="\${p.id}" data-name="\${p.name}" data-price="\${p.defaultPriceText||''}">\${p.name}</option>\`).join('');
            optionsHtml += \`</optgroup>\`;
        }

        const mainDiv = document.getElementById('modal-main-prods');
        const addonDiv = document.getElementById('modal-addon-prods');
        if(mainDiv) {
            const selectedMain = (ev.mainProducts || []);
            
            mainDiv.innerHTML = \`
                <div style="margin-bottom:8px;">
                    <select id="main-prod-add-select" style="width:70%; padding:6px; border:1px solid #d1d5db; border-radius:4px;">
                        \${optionsHtml}
                    </select>
                    <button class="btn-info" style="padding:6px 12px; font-size:13px;" onclick="addMainProduct()">추가</button>
                </div>
                <div id="main-prod-list">
                    \${selectedMain.map((p,i) => {
                        const prod = window.currentProducts.find(x=>x.id===p.id);
                        return \`<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                            <span>\${prod ? prod.name : p.id}</span>
                            <input type="text" id="price-main-\${p.id}" placeholder="단가" value="\${p.customText||''}" style="width:150px;padding:4px;border:1px solid #d1d5db;border-radius:4px;">
                            <button onclick="removeMainProduct('\${p.id}')" style="color:red;background:none;border:none;cursor:pointer;">✕</button>
                        </div>\`;
                    }).join('')}
                </div>
            \`;
        }
        if(addonDiv) {
            const selectedAddon = (ev.addonProducts || []);
            addonDiv.innerHTML = \`
                <div style="margin-bottom:8px;">
                    <select id="addon-prod-add-select" style="width:70%; padding:6px; border:1px solid #d1d5db; border-radius:4px;">
                        \${optionsHtml}
                    </select>
                    <button class="btn-info" style="padding:6px 12px; font-size:13px;" onclick="addAddonProduct()">추가</button>
                </div>
                <div id="addon-prod-list">
                    \${selectedAddon.map((p,i) => {
                        const prod = window.currentProducts.find(x=>x.id===p.id);
                        return \`<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                            <span>\${prod ? prod.name : p.id}</span>
                            <input type="text" id="price-addon-\${p.id}" placeholder="단가" value="\${p.customText||''}" style="width:150px;padding:4px;border:1px solid #d1d5db;border-radius:4px;">
                            <button onclick="removeAddonProduct('\${p.id}')" style="color:red;background:none;border:none;cursor:pointer;">✕</button>
                        </div>\`;
                    }).join('')}
                </div>
            \`;
        }`;

// Replace the function using regex
const regex = /window\.openEventModal = function\([\s\S]*?(?=window\.addMainProduct = function\(\))/;
content = content.replace(regex, newFunc + '\n    }\n\n    ');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Replaced openEventModal successfully!');
