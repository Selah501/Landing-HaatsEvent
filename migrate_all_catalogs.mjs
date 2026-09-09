import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://belchthacupzpgxevecx.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlbGNodGhhY3VwenBneGV2ZWN4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTgwNTUwNiwiZXhwIjoyMTAxMzgxNTA2fQ.cjEfiENLjNwl5dudDTU_ylppF_SIhQCmx9lb_gXh8bo';
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function run() {
    console.log("Loading all catalog JSON sources...");
    const urlMap = new Map(); // model -> url

    function fixUrl(url) {
        if (!url) return null;
        if (url.startsWith('/')) return 'https://flyer-event-page-2026.web.app' + url;
        if (!url.startsWith('http')) return 'https://flyer-event-page-2026.web.app/images/catalog/' + url;
        return url;
    }

    // 1. data.json
    try {
        const d1 = JSON.parse(fs.readFileSync('data.json', 'utf8'));
        if (d1.products) {
            d1.products.forEach(p => {
                if (p.model && p.details?.level1?.images?.[0]) {
                    urlMap.set(p.model.trim().toLowerCase(), fixUrl(p.details.level1.images[0]));
                }
            });
        }
    } catch(e) {}

    // 2. extracted_all.json
    try {
        const d2 = JSON.parse(fs.readFileSync('../extracted_all.json', 'utf8'));
        d2.forEach(p => {
            if (p.model && (p.image_path || p.image_file)) {
                let url = p.image_path || p.image_file;
                if (!url.includes('/')) {
                    // guess path based on category or something, but usually image_path is full
                    if(p.image_path) url = p.image_path; 
                }
                urlMap.set(p.model.trim().toLowerCase(), fixUrl(url));
            }
        });
    } catch(e) {}

    // 3. extracted_catalog.json
    try {
        const d3 = JSON.parse(fs.readFileSync('../extracted_catalog.json', 'utf8'));
        d3.forEach(p => {
            if (p.model && (p.image_path || p.image_file)) {
                let url = p.image_path || p.image_file;
                if(p.image_path) url = p.image_path;
                urlMap.set(p.model.trim().toLowerCase(), fixUrl(url));
            }
        });
    } catch(e) {}

    console.log(`Found ${urlMap.size} unique catalog images from JSON sources.`);

    // 4. Fetch all Supabase products
    const { data: products, error: fetchErr } = await sb.from('products').select('id, model, name, detail_urls');
    if (fetchErr) {
        console.error("Failed to fetch Supabase products:", fetchErr.message);
        return;
    }

    console.log(`Fetched ${products.length} products from Supabase.`);

    let successCount = 0;
    let failCount = 0;

    for (const p of products) {
        if (!p.model) continue;
        
        const mKey = p.model.trim().toLowerCase();
        let targetUrl = urlMap.get(mKey);
        
        // Try fallback by name if model not found
        if (!targetUrl && p.name) {
             const nKey = p.name.trim().toLowerCase();
             targetUrl = urlMap.get(nKey);
        }

        if (targetUrl) {
            let urls = p.detail_urls || [];
            urls[0] = targetUrl;

            const { data, error: updateErr } = await sb
                .from('products')
                .update({ detail_urls: urls })
                .eq('id', p.id)
                .select(); // Ensure we get the updated row back

            if (updateErr) {
                console.error(`Failed to update ${p.model}:`, updateErr.message);
                failCount++;
            } else if (!data || data.length === 0) {
                console.error(`Update silently failed for ${p.model} (RLS block?)`);
                failCount++;
            } else {
                successCount++;
            }
        }
    }

    console.log(`\nMigration complete! Success: ${successCount}, Failures: ${failCount}`);
}

run();
