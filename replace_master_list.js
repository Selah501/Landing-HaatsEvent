const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'public', 'admin.html');
let content = fs.readFileSync(filePath, 'utf8');

const regexTableStart = /<div style="overflow-x: auto;">[\s\S]*?<thead>/g;
const replacementTableStart = `
        <div style="margin-bottom: 10px; display: flex; align-items: center; gap: 10px;">
            <select id="master-category-filter" style="padding:8px; border:1px solid #d1d5db; border-radius:4px;" onchange="renderMasterList()">
                <option value="ALL">전체 보기 (느릴 수 있음)</option>
                <option value="하츠후드 엘리카" selected>하츠후드 엘리카</option>
                <option value="하츠후드 플래티늄">하츠후드 플래티늄</option>
                <option value="하츠후드 데코">하츠후드 데코</option>
                <option value="하츠후드 시스템">하츠후드 시스템</option>
                <option value="하츠 전기레인지">하츠 전기레인지</option>
                <option value="하츠 가스레인지">하츠 가스레인지</option>
                <option value="하츠 수전빌트인">하츠 수전빌트인</option>
                <option value="하츠 씽크볼">하츠 씽크볼</option>
                <option value="하츠 기타빌트인">하츠 기타빌트인</option>
                <option value="기타카테고리">기타카테고리</option>
            </select>
            <span style="font-size: 13px; color: #6b7280;">* 카테고리를 선택하여 조회하세요.</span>
        </div>
        <div style="overflow-x: auto;">
            <table>
                <thead>
                    <tr>
                        <th style="min-width: 80px;">분류</th>`; // Add Category column

content = content.replace(regexTableStart, replacementTableStart);

const regexRenderList = /window\.renderMasterList = function\(\) {[\s\S]*?tbody\.innerHTML = '';/;
const replacementRenderList = `window.renderMasterList = function() {
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
            const idx = window.currentProducts.indexOf(prod);`;

content = content.replace(regexRenderList, replacementRenderList);

const regexRowInner = /<tr id="m-row-\$\{idx\}">[\s\S]*?<td data-label="상품명">/;
const replacementRowInner = `<tr id="m-row-\${idx}">
                    <td data-label="분류"><span style="font-size:12px; color:#4b5563;">\${prod.category || '기타카테고리'}</span></td>
                    <td data-label="상품명">`;

content = content.replace(regexRowInner, replacementRowInner);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Replaced renderMasterList successfully!');
