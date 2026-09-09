/**
 * check_vent_products.mjs
 * DB에서 티오람미니, 힘펠 환풍기 관련 제품 조회
 */
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
    'https://belchthacupzpgxevecx.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlbGNodGhhY3VwenBneGV2ZWN4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTgwNTUwNiwiZXhwIjoyMTAxMzgxNTA2fQ.cjEfiENLjNwl5dudDTU_ylppF_SIhQCmx9lb_gXh8bo'
);

const { data, error } = await sb
    .from('products')
    .select('id, name, model, category, detail_urls')
    .or('name.ilike.%티오람%,name.ilike.%환풍기%,name.ilike.%힘펠%,name.ilike.%복합환풍기%,category.ilike.%환풍기%,category.ilike.%ventilation%')
    .order('name');

if (error) { console.error(error); process.exit(1); }

console.log(`총 ${data.length}개 결과:\n`);
data.forEach(p => {
    console.log(`[${p.id.slice(0,8)}...] ${p.name}`);
    console.log(`  model: ${p.model || '(없음)'}`);
    console.log(`  category: ${p.category || '(없음)'}`);
    console.log(`  detail_urls[0]: ${(p.detail_urls?.[0] || '(비어있음)').slice(0, 70)}`);
    console.log(`  detail_urls[1]: ${(p.detail_urls?.[1] || '(비어있음)').slice(0, 70)}`);
    console.log();
});
