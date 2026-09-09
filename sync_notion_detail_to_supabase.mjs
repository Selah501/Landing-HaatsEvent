/**
 * sync_notion_detail_to_supabase.mjs
 *
 * [목적] 노션 상품 DB의 "상세페이지1/2/3" URL을
 *       Supabase products 테이블의 detail_urls[0/1/2]에 일괄 동기화
 *
 * [매칭 방법] 노션 페이지 ID ↔ Supabase notion_page_id 컬럼 (정확한 1:1 매칭)
 *            매칭 실패 시 모델명으로 2차 매칭 시도
 *
 * [실행 방법] node sync_notion_detail_to_supabase.mjs (landing/ 디렉토리에서 실행)
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── .env 로드 ─────────────────────────────────────────────────────
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
const SUPABASE_URL = 'https://belchthacupzpgxevecx.supabase.co';
const SUPABASE_KEY = env.SUPABASE_SERVICE_KEY;

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

const NOTION_HEADERS = {
    "Authorization": `Bearer ${NOTION_TOKEN}`,
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json"
};

// ── 노션 전체 상품 조회 (페이지네이션) ──────────────────────────────
async function fetchAllNotionProducts() {
    let allPages = [];
    let hasMore = true;
    let nextCursor = undefined;

    while (hasMore) {
        const body = { page_size: 100 };
        if (nextCursor) body.start_cursor = nextCursor;

        const res = await fetch(`https://api.notion.com/v1/databases/${NOTION_DB_ID}/query`, {
            method: 'POST',
            headers: NOTION_HEADERS,
            body: JSON.stringify(body)
        });
        const data = await res.json();
        if (!data.results) {
            console.error('❌ 노션 API 오류:', data);
            break;
        }
        allPages.push(...data.results);
        hasMore = data.has_more;
        nextCursor = data.next_cursor;
    }
    return allPages;
}

async function run() {
    console.log('='.repeat(60));
    console.log('  🔗 노션 → Supabase 상세페이지 URL 동기화 시작');
    console.log('='.repeat(60));

    // Step 1: 노션 전체 상품 조회
    console.log('\n[Step 1] 📋 노션 상품 DB 전체 조회 중...');
    const notionPages = await fetchAllNotionProducts();
    console.log(`  → ${notionPages.length}개 노션 페이지 수집 완료`);

    // Step 2: Supabase 전체 상품 조회
    console.log('\n[Step 2] 🗄️  Supabase products 전체 조회 중...');
    const { data: supaProducts, error } = await sb
        .from('products')
        .select('id, model, name, notion_page_id, detail_urls');

    if (error) {
        console.error('❌ Supabase 조회 실패:', error.message);
        process.exit(1);
    }
    console.log(`  → ${supaProducts.length}개 Supabase 상품 조회 완료`);

    // Supabase: notion_page_id → 상품 맵
    const supaByNotionId = new Map();
    const supaByModel = new Map();
    for (const p of supaProducts) {
        if (p.notion_page_id) supaByNotionId.set(p.notion_page_id, p);
        if (p.model) supaByModel.set(p.model.toLowerCase().trim(), p);
    }

    // Step 3: 노션 데이터 기반 Supabase 업데이트
    console.log('\n[Step 3] 🔗 노션 → Supabase 매칭 및 업데이트...\n');

    let successCount = 0;
    let failCount = 0;
    let emptyCount = 0;
    let noMatchCount = 0;

    for (const page of notionPages) {
        const props = page.properties;

        // 노션에서 URL 추출
        const url1 = props['상세페이지1']?.url || null;
        const url2 = props['상세페이지2']?.url || null;
        const url3 = props['상세페이지3']?.url || null;

        // 상세페이지 URL이 전혀 없으면 건너뜀 (업데이트할 내용 없음)
        if (!url1 && !url2 && !url3) {
            emptyCount++;
            continue;
        }

        // 노션 제품명 & 모델명 (로그용)
        const notionName = props['제품명']?.title?.[0]?.plain_text || '이름없음';
        const notionModel = props['모델명']?.rich_text?.[0]?.plain_text || '';

        // Supabase 매칭: notion_page_id 우선, 없으면 model로 2차 시도
        const notionPageId = page.id;
        let supaRow = supaByNotionId.get(notionPageId)
            || supaByModel.get(notionModel.toLowerCase().trim())
            || null;

        if (!supaRow) {
            console.log(`  ⚠️  매칭 실패: [${notionName}] (${notionModel})`);
            noMatchCount++;
            continue;
        }

        // 기존 detail_urls 배열 복사 (길이 최소 3칸 확보)
        const urls = Array.isArray(supaRow.detail_urls) ? [...supaRow.detail_urls] : [];
        while (urls.length < 3) urls.push('');

        // 노션 URL로 덮어쓰기 (null이면 기존값 유지)
        if (url1 !== null) urls[0] = url1;
        if (url2 !== null) urls[1] = url2;
        if (url3 !== null) urls[2] = url3;

        console.log(`  ✅ [${notionModel || notionName}] → ${url1 || '(빈칸)'}`);

        const { error: updateErr } = await sb
            .from('products')
            .update({ detail_urls: urls })
            .eq('id', supaRow.id);

        if (updateErr) {
            console.error(`  ❌ 업데이트 실패 [${notionModel}]:`, updateErr.message);
            failCount++;
        } else {
            successCount++;
        }
    }

    // Step 4: 결과 리포트
    console.log('\n' + '='.repeat(60));
    console.log('  📊 동기화 완료 리포트');
    console.log('='.repeat(60));
    console.log(`  ✅ URL 업데이트 성공: ${successCount}개`);
    console.log(`  ⚠️  Supabase 매칭 실패: ${noMatchCount}개`);
    console.log(`  ⬜ 노션 URL 비어있어 건너뜀: ${emptyCount}개`);
    console.log(`  ❌ DB 업데이트 오류: ${failCount}개`);
    console.log('\n✨ 완료! product_master.html에서 이미지를 확인하세요.');
    console.log('   https://flyer-event-page-2026.web.app/product_master.html');
}

run().catch(err => {
    console.error('스크립트 실행 중 예외 발생:', err);
    process.exit(1);
});
