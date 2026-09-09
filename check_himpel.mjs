import { createClient } from '@supabase/supabase-js';
const sb = createClient('https://belchthacupzpgxevecx.supabase.co','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlbGNodGhhY3VwenBneGV2ZWN4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTgwNTUwNiwiZXhwIjoyMTAxMzgxNTA2fQ.cjEfiENLjNwl5dudDTU_ylppF_SIhQCmx9lb_gXh8bo');
const {data} = await sb.from('products').select('id,name,model,brand,category').eq('brand','힘펠').order('category,name');
console.log(`힘펠 브랜드 전체 ${data.length}개:`);
data.forEach(p => console.log(`  [${p.id.slice(0,8)}] ${p.name} | model:${p.model} | cat:${p.category}`));
