// 환풍기, 전동댐퍼 등 관련 상품 검색
const https = require('https');

function fetchJSON(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });
}

async function main() {
    const BASE = 'https://flyer-event-page-2026-default-rtdb.firebaseio.com';
    const products = await fetchJSON(`${BASE}/products.json`);
    const prodArr = Array.isArray(products) ? products : Object.values(products);
    
    // 환풍기, 댐퍼, 제로크 등 검색
    const keywords = ['환풍', '댐퍼', '제로크', '전동', 'vent', '바스', '욕실'];
    console.log('=== 환풍기/댐퍼 관련 상품 검색 ===');
    prodArr.forEach(p => {
        const name = (p.name || '').toLowerCase();
        if (keywords.some(k => name.includes(k.toLowerCase()))) {
            console.log(`  ${p.id} | ${p.name} | ${p.category || ''}`);
        }
    });
    
    // 전체 카테고리별 상품 수
    console.log('\n=== 카테고리별 상품 수 ===');
    const catCount = {};
    prodArr.forEach(p => {
        const cat = p.category || '기타';
        catCount[cat] = (catCount[cat] || 0) + 1;
    });
    Object.entries(catCount).sort((a,b) => b[1] - a[1]).forEach(([cat, count]) => {
        console.log(`  ${cat}: ${count}개`);
    });
}

main().catch(console.error);
