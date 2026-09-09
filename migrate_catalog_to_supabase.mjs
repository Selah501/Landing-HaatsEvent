import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://belchthacupzpgxevecx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_weMvIv-69PgtXwzGlgweLg_NEJfOACN';
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
    console.log("Loading data.json...");
    const raw = fs.readFileSync('data.json', 'utf8');
    const data = JSON.parse(raw);
    const products = data.products || [];

    console.log(`Found ${products.length} products in data.json. Starting migration to Supabase...`);

    let successCount = 0;
    let failCount = 0;

    for (const p of products) {
        if (!p.model) continue;
        
        let catalogUrl = "";
        if (p.details && p.details.level1 && p.details.level1.images && p.details.level1.images.length > 0) {
            catalogUrl = p.details.level1.images[0];
            // Fix relative paths to absolute firebase hosting url
            if (catalogUrl.startsWith('/')) {
                catalogUrl = 'https://flyer-event-page-2026.web.app' + catalogUrl;
            }
        }

        if (catalogUrl) {
            // First, get the current product from Supabase to preserve existing URLs if any
            const { data: existingData, error: fetchErr } = await sb
                .from('products')
                .select('id, detail_urls')
                .eq('model', p.model)
                .single();
                
            if (fetchErr && fetchErr.code !== 'PGRST116') {
                console.error(`Error fetching ${p.model}:`, fetchErr.message);
                continue;
            }

            if (existingData) {
                let urls = existingData.detail_urls || [];
                // Set the catalog url to the first index
                urls[0] = catalogUrl;

                const { error: updateErr } = await sb
                    .from('products')
                    .update({ detail_urls: urls })
                    .eq('id', existingData.id);

                if (updateErr) {
                    console.error(`Failed to update ${p.model}:`, updateErr.message);
                    failCount++;
                } else {
                    console.log(`Updated ${p.model} with catalog URL: ${catalogUrl}`);
                    successCount++;
                }
            }
        }
    }

    console.log(`\nMigration complete! Success: ${successCount}, Failures: ${failCount}`);
}

run();
