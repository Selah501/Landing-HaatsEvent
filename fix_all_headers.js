const fs = require('fs');

const path = 'c:/dev/전단지이벤트/landing/public/admin.html';
let html = fs.readFileSync(path, 'utf8');

// The faulty pattern is a <tr> immediately following the 분류 <th>, because I injected a <tr> instead of just adding the <th>
html = html.replace(/<th style="min-width: 80px;">분류<\/th>\s*<tr>/g, '<th style="min-width: 80px;">분류</th>');

fs.writeFileSync(path, html, 'utf8');
console.log('Fixed all table headers in admin.html.');
