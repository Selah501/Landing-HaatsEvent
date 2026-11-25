import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://belchthacupzpgxevecx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_weMvIv-69PgtXwzGlgweLg_NEJfOACN';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkMigration() {
    const productsDir = path.join(__dirname, 'public', 'products');
    const files = fs.readdirSync(productsDir).filter(f => f.endsWith('.html'));
    
    console.log(`Found ${files.length} HTML files in public/products:`, files);
    
    const { data: products, error } = await supabase.from('products').select('id, name, detail_urls, detail_pages');
    if (error) {
        console.error('Error fetching products:', error);
        return;
    }
    
    let targets = [];
    
    for (const file of files) {
        const fileUrl = `./products/${file}`;
        const fileUrl2 = `../products/${file}`;
        
        // Find if any product points to this file in detail_urls
        const linkedProducts = products.filter(p => 
            (p.detail_urls && (p.detail_urls.includes(fileUrl) || p.detail_urls.includes(fileUrl2) || p.detail_urls.some(url => url && url.includes(file))))
        );
        
        if (linkedProducts.length > 0) {
            for (const p of linkedProducts) {
                // Check if this product already has detail_pages
                const hasDetailPages = p.detail_pages && Array.isArray(p.detail_pages) && p.detail_pages.length > 0;
                targets.push({
                    file: file,
                    productId: p.id,
                    productName: p.name,
                    hasDetailPages: hasDetailPages,
                    detailPagesCount: hasDetailPages ? p.detail_pages.length : 0
                });
            }
        } else {
            console.log(`File ${file} is NOT linked in any product's detail_urls.`);
        }
    }
    
    console.log('\nMigration Targets:');
    console.table(targets);
}

checkMigration();
