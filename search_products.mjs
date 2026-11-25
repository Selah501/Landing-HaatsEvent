import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://belchthacupzpgxevecx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_weMvIv-69PgtXwzGlgweLg_NEJfOACN';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function search() {
    const { data: products } = await supabase.from('products').select('id, name, model');
    
    const keywords = ['테라', '건조대', '후드', '수전', '스퀘어', '아일랜드', '제로크'];
    
    for (const kw of keywords) {
        console.log(`\n--- Keyword: ${kw} ---`);
        const matches = products.filter(p => p.name.includes(kw) || (p.model && p.model.includes(kw)));
        matches.slice(0, 5).forEach(m => console.log(`${m.name} (${m.model}) -> ${m.id}`));
    }
}
search();
