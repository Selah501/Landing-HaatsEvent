const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://belchthacupzpgxevecx.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlbGNodGhhY3VwenBneGV2ZWN4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTgwNTUwNiwiZXhwIjoyMTAxMzgxNTA2fQ.cjEfiENLjNwl5dudDTU_ylppF_SIhQCmx9lb_gXh8bo';
const sb = createClient(SUPABASE_URL, KEY);

async function main() {
  // 허리케인 검색
  const { data: hurr } = await sb.from('products').select('id,name,brand,category,model,is_handled').ilike('name', '%hurricane%');
  console.log('=== HURRICANE (영문) 검색 결과 ===');
  console.log(JSON.stringify(hurr, null, 2));

  // 대분류(category) 종류
  const { data: cats } = await sb.from('products').select('brand,category').limit(500);
  const brands = [...new Set((cats||[]).map(p=>p.brand).filter(Boolean))].sort();
  const categories = [...new Set((cats||[]).map(p=>p.category).filter(Boolean))].sort();
  console.log('\n=== 브랜드 목록 ===');
  console.log(brands);
  console.log('\n=== 카테고리 목록 (대분류) ===');
  console.log(categories);

  // is_handled 상태
  const { count: handled } = await sb.from('products').select('*', {count:'exact',head:true}).eq('is_handled', true);
  const { count: total } = await sb.from('products').select('*', {count:'exact',head:true});
  console.log(`\n=== 취급여부 ===\ntotal: ${total} / is_handled=true: ${handled}`);
}
main();
