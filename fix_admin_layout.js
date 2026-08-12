const fs = require('fs');

const path = 'c:/dev/전단지이벤트/landing/public/admin.html';
let html = fs.readFileSync(path, 'utf8');

// 1. Fix the double <tr> in the master table header
const brokenHeader = `                <thead>
                    <tr>
                        <th style="min-width: 80px;">분류</th>
                    <tr>
                        <th width="12%">상품명</th>`;
const fixedHeader = `                <thead>
                    <tr>
                        <th style="min-width: 80px;">분류</th>
                        <th width="12%">상품명</th>`;

html = html.replace(brokenHeader, fixedHeader);

// Wait, I should just use regex to fix any occurrence of it just in case
html = html.replace(/<th style="min-width: 80px;">분류<\/th>\s*<tr>\s*<th width="12%">상품명<\/th>/g, 
                   '<th style="min-width: 80px;">분류</th>\n                        <th width="12%">상품명</th>');

// 2. Fix renderMasterList() to window.renderMasterList() in addMasterRow
html = html.replace(/renderMasterList\(\);/g, 'window.renderMasterList();');

// 3. Fix deleteMasterRow's id logic if it has any errors. Wait, deleteMasterRow uses window.currentProducts and window.currentData. That's fine.

fs.writeFileSync(path, html, 'utf8');
console.log('Fixed headers and renderMasterList calls.');
