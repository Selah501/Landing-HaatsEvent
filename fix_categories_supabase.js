const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://belchthacupzpgxevecx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_weMvIv-69PgtXwzGlgweLg_NEJfOACN';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const validCategories = [
    '하츠후드 엘리카',
    '하츠후드 플래티늄',
    '하츠후드 데코',
    '하츠후드 시스템', // User wrote 스템, DB has 시스템
    '하츠후드 스템',
    '하츠 전기레인지',
    '하츠 가스레인지',
    '하츠 수전빌트인',
    '하츠 씽크볼',
    '하츠 기타빌트인'
];

async function run() {
    const { data, error } = await supabase.from('products').select('id, category');
    if (error) {
        console.error(error);
        return;
    }

    let updateCount = 0;
    for (let p of data) {
        let newCategory = p.category;
        
        if (newCategory === '하츠후드 스템') newCategory = '하츠후드 시스템';

        if (!validCategories.includes(newCategory) && newCategory !== '기타카테고리') {
            newCategory = '기타카테고리';
        }

        if (p.category !== newCategory) {
            const { error: updateError } = await supabase.from('products').update({ category: newCategory }).eq('id', p.id);
            if (updateError) {
                console.error(`Failed to update ${p.id}:`, updateError);
            } else {
                updateCount++;
                console.log(`Updated ${p.id} from '${p.category}' to '${newCategory}'`);
            }
        }
    }
    console.log(`Finished updating. Total updated: ${updateCount}`);
}

run();
