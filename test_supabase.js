const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://belchthacupzpgxevecx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_weMvIv-69PgtXwzGlgweLg_NEJfOACN';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
    const { data, error } = await supabase.from('products').select('*');
    if(error) console.error(error);
    else {
        console.log("Total products: " + data.length);
        if(data.length > 0) {
            console.log(data.slice(0, 5).map(p => p.name));
            console.log("First product features: " + data[0].features);
        }
    }
}
run();
