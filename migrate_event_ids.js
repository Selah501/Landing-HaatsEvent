// 구형 p_ ID → 현재 UUID 매핑 및 Firebase 이벤트 데이터 마이그레이션 스크립트
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

function putJSON(url, data) {
    return new Promise((resolve, reject) => {
        const jsonStr = JSON.stringify(data);
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(jsonStr) }
        };
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve(JSON.parse(body)));
        });
        req.on('error', reject);
        req.write(jsonStr);
        req.end();
    });
}

// 구형 ID → 현재 UUID 확정 매핑
const OLD_ID_TO_UUID = {
    'p_tioram':                  '3b2b8c08-8991-81d8-8edc-faf02acddde4',  // 티오람 미니
    'p_terra':                   '3b2b8c08-8991-8123-9599-f2b8e6ee4b71',  // 테라 주방후드
    'p_sink':                    '3b2b8c08-8991-81dd-99f7-f4046d96de2a',  // 사각씽크볼 세트
    'p_hurricane':               '3b2b8c08-8991-8121-94c6-d89a4fbf749e',  // 허리케인 주방후드
    'p_ish46s_1784638060019':    '3b7b8c08-8991-819b-a5dc-f381c316c487',  // 스퀘어 아일랜드 ISH-46S
    // 아래는 매핑 불가 (구형 가짜 DB에만 있던 상품 - 현재 진짜 DB에 없음)
    // 'p_vent_medium': ???  (환풍기 중형 - 현재 DB에 환풍기 카테고리 없음)
    // 'p_vent_large': ???   (환풍기 대형 - 동일)
    // 'p_1784139265988': ???  (타임스탬프 기반 구형 ID - 원본 상품 추적 불가)
    // 'p_1784632259162': ???  (타임스탬프 기반 구형 ID - 원본 상품 추적 불가)
};

async function main() {
    const BASE = 'https://flyer-event-page-2026-default-rtdb.firebaseio.com';
    
    const events = await fetchJSON(`${BASE}/events.json`);
    const products = await fetchJSON(`${BASE}/products.json`);
    
    const prodArr = Array.isArray(products) ? products : Object.values(products);
    
    // 현재 상품 목록에서 이름으로 검색 가능한 맵 구축
    console.log('=== 현재 상품 목록에서 후보 검색 ===\n');
    
    // 구형 ID 수집
    const evArr = Array.isArray(events) ? events : Object.values(events);
    const oldIds = new Set();
    evArr.forEach(ev => {
        [...(ev.mainProducts || []), ...(ev.addonProducts || [])].forEach(p => {
            if (p.id.startsWith('p_')) oldIds.add(p.id);
        });
    });
    
    // 확정 매핑 적용
    const idMapping = { ...OLD_ID_TO_UUID };
    
    console.log('\n=== 최종 매핑 결과 ===');
    console.log(JSON.stringify(idMapping, null, 2));
    
    // DRY RUN: 마이그레이션 시뮬레이션
    console.log('\n=== DRY RUN: 마이그레이션 시뮬레이션 ===');
    let migratedCount = 0;
    const migratedEvents = evArr.map(ev => {
        const newEv = { ...ev };
        
        newEv.mainProducts = (ev.mainProducts || []).map(p => {
            if (idMapping[p.id]) {
                const newProd = { ...p, id: idMapping[p.id] };
                console.log(`  [${ev.title}] 메인: ${p.id} → ${idMapping[p.id]}`);
                migratedCount++;
                return newProd;
            }
            return p;
        });
        
        newEv.addonProducts = (ev.addonProducts || []).map(p => {
            if (idMapping[p.id]) {
                const newProd = { ...p, id: idMapping[p.id] };
                console.log(`  [${ev.title}] 부가: ${p.id} → ${idMapping[p.id]}`);
                migratedCount++;
                return newProd;
            }
            return p;
        });
        
        return newEv;
    });
    
    console.log(`\n총 마이그레이션 대상: ${migratedCount}건`);
    
    // 매핑되지 않은 ID 확인
    const stillUnmatched = new Set();
    migratedEvents.forEach(ev => {
        [...(ev.mainProducts || []), ...(ev.addonProducts || [])].forEach(p => {
            if (p.id.startsWith('p_')) stillUnmatched.add(p.id);
        });
    });
    
    if (stillUnmatched.size > 0) {
        console.log('\n⚠️ 여전히 매핑 안 된 ID:');
        stillUnmatched.forEach(id => console.log(`  ${id}`));
    } else {
        console.log('\n✅ 모든 구형 ID 매핑 완료!');
    }
    
    // 실제 저장은 --apply 플래그 있을 때만
    if (process.argv.includes('--apply')) {
        console.log('\n=== 실제 Firebase에 저장 중... ===');
        await putJSON(`${BASE}/events.json`, migratedEvents);
        console.log('✅ Firebase events 업데이트 완료!');
    } else {
        console.log('\n💡 실제 적용하려면: node migrate_event_ids.js --apply');
    }
}

main().catch(console.error);
