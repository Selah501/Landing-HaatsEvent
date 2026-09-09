/**
 * check_notion_detail_urls.mjs
 * 노션 상품 DB에서 상세페이지1/2/3 URL 필드를 샘플로 조회하여 확인
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// .env 로드
const envPath = path.join(__dirname, 'functions', '.env');
const env = fs.readFileSync(envPath, 'utf8').split('\n').reduce((acc, line) => {
    const idx = line.indexOf('=');
    if (idx > 0) {
        const key = line.slice(0, idx).trim();
        const val = line.slice(idx + 1).trim();
        if (key && val && !key.startsWith('#')) acc[key] = val;
    }
    return acc;
}, {});

const NOTION_TOKEN = env.NOTION_API_KEY;
const NOTION_DB_ID = env.NOTION_DB_PRODUCT.replace(/-/g, '');

console.log('Notion DB ID:', NOTION_DB_ID);

const headers = {
    "Authorization": `Bearer ${NOTION_TOKEN}`,
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json"
};

// 노션에서 첫 페이지 5개만 샘플 조회
const res = await fetch(`https://api.notion.com/v1/databases/${NOTION_DB_ID}/query`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ page_size: 5 })
});

const data = await res.json();

if (!data.results) {
    console.error('❌ 노션 API 오류:', JSON.stringify(data, null, 2));
    process.exit(1);
}

console.log(`\n총 ${data.results.length}개 샘플 결과\n`);

// 모든 필드명 출력 (첫 번째 페이지 기준)
if (data.results.length > 0) {
    const propKeys = Object.keys(data.results[0].properties);
    console.log('📋 노션 DB 전체 필드 목록:');
    propKeys.forEach(k => {
        const prop = data.results[0].properties[k];
        console.log(`  - "${k}" (type: ${prop.type})`);
    });
}

// 상세페이지 관련 필드만 출력
console.log('\n📸 상세페이지 URL 필드 샘플:');
data.results.forEach((page, i) => {
    const props = page.properties;
    const name = props['제품명']?.title?.[0]?.plain_text || '이름없음';
    const model = props['모델명']?.rich_text?.[0]?.plain_text || '';
    
    // 상세페이지 관련 필드 탐색
    const detailFields = Object.entries(props)
        .filter(([k]) => k.includes('상세') || k.includes('detail') || k.includes('Detail') || k.includes('URL') || k.includes('url') || k.includes('이미지'))
        .map(([k, v]) => {
            let val = null;
            if (v.type === 'url') val = v.url;
            else if (v.type === 'rich_text') val = v.rich_text?.[0]?.plain_text;
            else if (v.type === 'files') val = v.files?.map(f => f.external?.url || f.file?.url).join(', ');
            return { field: k, type: v.type, value: val };
        });
    
    console.log(`\n[${i+1}] ${name} (${model})`);
    if (detailFields.length > 0) {
        detailFields.forEach(f => console.log(`  ${f.field} [${f.type}]: ${f.value || '(비어있음)'}`));
    } else {
        console.log('  → 상세페이지 관련 필드 없음');
    }
});
