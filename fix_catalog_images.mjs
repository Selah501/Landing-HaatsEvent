/**
 * fix_catalog_images.mjs
 *
 * [목적] Supabase products 테이블의 detail_urls[0]에 들어간 쓰레기/404 URL을
 *       public/catalog_images/ 폴더에 실제 존재하는 정밀 추출 이미지 URL로 교체한다.
 *
 * [매칭 규칙]
 *   - catalog_images/[모델명].png 파일명(확장자 제거) ↔ DB의 model 컬럼 (대소문자 무시, 공백 제거)
 *   - 매칭 성공: detail_urls[0] = 'https://flyer-event-page-2026.web.app/catalog_images/[파일명].png'
 *   - 매칭 실패: detail_urls[0] = '' (쓰레기 URL 제거, detail_urls[1,2]는 절대 건드리지 않음)
 *
 * [실행 방법] node fix_catalog_images.mjs (landing/ 디렉토리에서 실행)
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Supabase 접속 정보 ──────────────────────────────────────────
const SUPABASE_URL = 'https://belchthacupzpgxevecx.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlbGNodGhhY3VwenBneGV2ZWN4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTgwNTUwNiwiZXhwIjoyMTAxMzgxNTA2fQ.cjEfiENLjNwl5dudDTU_ylppF_SIhQCmx9lb_gXh8bo';
const BASE_URL = 'https://flyer-event-page-2026.web.app';

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ── 이미지 폴더 경로 ─────────────────────────────────────────────
const IMAGES_DIR = path.join(__dirname, 'public', 'catalog_images');

async function run() {
    console.log('='.repeat(60));
    console.log('  📦 카탈로그 이미지 복구 스크립트 시작');
    console.log('='.repeat(60));

    // Step 1: 로컬 이미지 파일 목록 스캔
    console.log(`\n[Step 1] 📂 이미지 폴더 스캔: ${IMAGES_DIR}`);
    const files = fs.readdirSync(IMAGES_DIR).filter(f => f.toLowerCase().endsWith('.png'));
    console.log(`  → 총 ${files.length}개 PNG 파일 발견`);

    // 파일명(소문자, 확장자 제거) → 원본 파일명 매핑
    const fileMap = new Map(); // key: lowercase model → value: 원본 파일명
    for (const f of files) {
        const key = path.basename(f, '.png').toLowerCase().replace(/\s+/g, '');
        fileMap.set(key, f);
    }

    // Step 2: Supabase 전체 products 조회
    console.log('\n[Step 2] 🗄️  Supabase products 테이블 전체 조회...');
    const { data: products, error: fetchErr } = await sb
        .from('products')
        .select('id, model, name, detail_urls');

    if (fetchErr) {
        console.error('❌ DB 조회 실패:', fetchErr.message);
        process.exit(1);
    }
    console.log(`  → 총 ${products.length}개 상품 조회 완료`);

    // Step 3: 매칭 및 업데이트
    console.log('\n[Step 3] 🔗 모델명 매칭 및 URL 업데이트...\n');

    let successCount = 0;
    let failCount = 0;
    let skipCount = 0;
    const noMatchList = [];

    for (const p of products) {
        if (!p.model && !p.name) {
            skipCount++;
            continue;
        }

        // 매칭 키: model 우선, 없으면 name으로 시도
        const modelKey = (p.model || '').toLowerCase().replace(/\s+/g, '');
        const nameKey  = (p.name  || '').toLowerCase().replace(/\s+/g, '');

        let matchedFile = fileMap.get(modelKey) || fileMap.get(nameKey) || null;
        
        // 추가 방어 1: 하이픈 제거 후 재매칭
        if (!matchedFile) {
            const modelKeyNoHyphen = modelKey.replace(/-/g, '');
            for (const [k, v] of fileMap.entries()) {
                if (k.replace(/-/g, '') === modelKeyNoHyphen) {
                    matchedFile = v;
                    break;
                }
            }
        }

        // 추가 방어 2: HZ- / FC- / WS- 등 브랜드 접두사 제거 후 재매칭
        if (!matchedFile) {
            const withoutPrefix = modelKey.replace(/^(hz-|fc-|ws-|hf-|ha-)/, '');
            matchedFile = fileMap.get(withoutPrefix) || null;
            if (!matchedFile) {
                for (const [k, v] of fileMap.entries()) {
                    if (k.replace(/^(hz-|fc-|ws-|hf-|ha-)/, '') === withoutPrefix) {
                        matchedFile = v;
                        break;
                    }
                }
            }
        }

        // 추가 방어 3: 복합 모델명 (콤마/슬래시로 구분된 경우) → 첫 번째 모델로 시도
        if (!matchedFile && (modelKey.includes(',') || modelKey.includes('/'))) {
            const firstModel = modelKey.split(/[,\/]/)[0].trim().replace(/^(hz-|fc-|ws-)/, '');
            matchedFile = fileMap.get(firstModel) || null;
            if (!matchedFile) {
                for (const [k, v] of fileMap.entries()) {
                    if (k.startsWith(firstModel) || firstModel.startsWith(k)) {
                        matchedFile = v;
                        break;
                    }
                }
            }
        }

        // 현재 detail_urls 배열 복사 (기존 [1], [2] 보존)
        const urls = Array.isArray(p.detail_urls) ? [...p.detail_urls] : ['', '', ''];
        // 배열 길이 최소 3칸 확보
        while (urls.length < 3) urls.push('');

        if (matchedFile) {
            const newUrl = `${BASE_URL}/catalog_images/${matchedFile}`;
            urls[0] = newUrl;
            console.log(`  ✅ [${p.model || p.name}] → ${matchedFile}`);
        } else {
            urls[0] = ''; // 쓰레기 URL 제거
            noMatchList.push(p.model || p.name);
            // 매칭 실패는 로그에서 구분하기 위해 표시 (하지만 계속 진행)
        }

        const { error: updateErr } = await sb
            .from('products')
            .update({ detail_urls: urls })
            .eq('id', p.id);

        if (updateErr) {
            console.error(`  ❌ 업데이트 실패 [${p.model}]:`, updateErr.message);
            failCount++;
        } else {
            if (matchedFile) successCount++;
        }
    }

    // Step 4: 결과 리포트
    console.log('\n' + '='.repeat(60));
    console.log('  📊 작업 완료 리포트');
    console.log('='.repeat(60));
    console.log(`  ✅ 이미지 매칭 성공 (URL 업데이트): ${successCount}개`);
    console.log(`  ⬜ 매칭 실패 (detail_urls[0] 초기화): ${noMatchList.length}개`);
    console.log(`  ❌ DB 업데이트 오류: ${failCount}개`);
    console.log(`  ⏭️  모델명 없어 건너뜀: ${skipCount}개`);

    if (noMatchList.length > 0) {
        console.log('\n  [매칭 실패 목록]');
        noMatchList.forEach(m => console.log(`    - ${m}`));
    }

    console.log('\n✨ 완료! product_master.html에서 연두색 밑줄 이미지를 확인하세요.');
}

run().catch(err => {
    console.error('스크립트 실행 중 예외 발생:', err);
    process.exit(1);
});
