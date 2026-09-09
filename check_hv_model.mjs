import { createClient } from '@supabase/supabase-js';
const sb = createClient('https://belchthacupzpgxevecx.supabase.co','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlbGNodGhhY3VwenBneGV2ZWN4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTgwNTUwNiwiZXhwIjoyMTAxMzgxNTA2fQ.cjEfiENLjNwl5dudDTU_ylppF_SIhQCmx9lb_gXh8bo');

// HV3 모델명으로 검색 (힘펠 일반환풍기 모델명 패턴)
const {data: byModel} = await sb.from('products').select('id,name,model,brand,category,detail_urls').ilike('model', '%HV%');
console.log(`HV모델 ${byModel.length}개:`);
byModel.forEach(p => console.log(`  [${p.id.slice(0,8)}] ${p.name} | model:${p.model} | brand:${p.brand} | urls[1]:${p.detail_urls?.[1]||'(없음)'}`));

// 일반한풍기 / 일반환풍기 이름 검색
const {data: byName} = await sb.from('products').select('id,name,model,brand,category,detail_urls').or('name.ilike.%일반한%,name.ilike.%일반환%,name.ilike.%환기%');
console.log(`\n일반환풍기류 ${byName.length}개:`);
byName.forEach(p => console.log(`  [${p.id.slice(0,8)}] ${p.name} | model:${p.model} | brand:${p.brand}`));
