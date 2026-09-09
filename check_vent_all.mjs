/**
 * check_vent_all.mjs
 * DB에서 환풍기/힘펠 관련 제품 전체 조회
 */
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
    'https://belchthacupzpgxevecx.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlbGNodGhhY3VwenBneGV2ZWN4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTgwNTUwNiwiZXhwIjoyMTAxMzgxNTA2fQ.cjEfiENLjNwl5dudDTU_ylppF_SIhQCmx9lb_gXh8bo'
);

// 힘펠 브랜드 또는 환풍기 관련 전체
const { data, error } = await sb
    .from('products')
    .select('id, name, model, brand, category, detail_urls')
    .or('brand.ilike.%힘펠%,name.ilike.%환풍기%,name.ilike.%한풍기%,name.ilike.%일반한%,model.ilike.%HV%,model.ilike.%vent%')
    .order('brand, name');

if (error) { console.error(error); process.exit(1); }

console.log(`총 ${data.length}개 결과:\n`);
data.forEach(p => {
    console.log(`[${p.id.slice(0,8)}...] ${p.name}`);
    console.log(`  brand: ${p.brand || '(없음)'}  |  model: ${p.model || '(없음)'}  |  category: ${p.category || '(없음)'}`);
    console.log(`  detail_urls[1]: ${(p.detail_urls?.[1] || '(비어있음)').slice(0, 80)}`);
    console.log();
});
