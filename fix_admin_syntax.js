const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'public', 'admin.html');
let content = fs.readFileSync(filePath, 'utf8');

// Replace the entire renderMasterList function correctly
const newRenderMasterList = `    window.renderMasterList = function() {
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
            
            tbody.innerHTML += \`
                <tr id="m-row-\${idx}">
                    <td data-label="분류"><span style="font-size:12px; color:#4b5563;">\${prod.category || '기타카테고리'}</span></td>
                    <td><input type="text" class="m-name" value="\${prod.name}"></td>
                    <td><input type="text" class="m-model" value="\${prod.model || ''}"></td>
                    <td><input type="text" class="m-features" value="\${prod.features || ''}"></td>
                    <td><input type="number" class="m-duration" value="\${prod.duration || ''}" placeholder="예: 120" style="width:100%; padding:6px; border:1px solid #d1d5db; border-radius:4px;"></td>
                    <td><input type="text" class="m-remarks" value="\${prod.remarks || ''}" placeholder="비공개 메모"></td>
                    <td><input type="text" class="m-defaultPrice" value="\${prod.defaultPriceText || ''}"></td>
                    <td><input type="text" class="m-link" value="\${prod.detailLink || ''}" placeholder="./products/xxx.html"></td>
                    <td style="font-size: 13px;">\${siteNames}</td>
                    <td style="text-align:center;">
                        <button class="btn-primary" style="padding: 6px 12px; font-size:12px; margin-bottom: 4px; display:block; width:100%;" onclick="updateMasterRow(\${idx})">수정(저장)</button>
                        <button class="btn-danger" style="padding: 6px 12px; font-size:12px; display:block; width:100%;" onclick="deleteMasterRow(\${idx})">삭제</button>
                    </td>
                </tr>
            \`;
        });
    }`;

// Since the file is messed up around renderMasterList, let's use a regex to replace from window.renderMasterList up to the end of the forEach
const regex = /window\.renderMasterList = function\(\) \{[\s\S]*?(?=window\.addMasterRow = function)/;
content = content.replace(regex, newRenderMasterList + '\n\n    ');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed renderMasterList successfully!');
