import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://belchthacupzpgxevecx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_weMvIv-69PgtXwzGlgweLg_NEJfOACN';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const mapping = {
    'basic-vent-large.html': '6dcd84ca-9d35-4e25-840d-96d82ee80371', // 힘펠 대형 제로크 MD-N
    'basic-vent-medium.html': 'a4655410-1015-4b74-9c29-42272c4151c5', // 힘펠 중형 플렉스 댐퍼
    'basic-vent.html': 'a4655410-1015-4b74-9c29-42272c4151c5', // 힘펠 중형 플렉스 댐퍼 (can have multiple versions)
    'chuseok-terra.html': '3b2b8c08-8991-8123-9599-f2b8e6ee4b71', // 테라 주방후드
    'electric-drying-rack.html': '3b7b8c08-8991-81f7-9bb0-cdd01c764f16', // 전동식 빨래 건조대
    'hood.html': '3b2b8c08-8991-8121-94c6-d89a4fbf749e', // 허리케인 주방후드
    'sink-faucet.html': '3b7b8c08-8991-8187-8365-cf6e8acc7c77', // 싱크 수전 FC-YB310
    'square-island.html': '3b7b8c08-8991-819b-a5dc-f381c316c487', // 스퀘어 아일랜드
    'tioram-mini.html': '3b2b8c08-8991-81d8-8edc-faf02acddde4', // 복합기 티오람 미니
    'zeroc.html': 'ea6e6e22-1250-4828-b516-7c9b2201d04e' // 힘펠 대형 제로크
};

async function migrate() {
    const productsDir = path.join(__dirname, 'public', 'products');
    
    // Fetch all products first
    const { data: products, error } = await supabase.from('products').select('id, detail_pages');
    if (error) {
        console.error('Error fetching products:', error);
        return;
    }
    
    for (const [filename, productId] of Object.entries(mapping)) {
        const filePath = path.join(productsDir, filename);
        if (!fs.existsSync(filePath)) {
            console.log(`File ${filename} not found, skipping.`);
            continue;
        }
        
        let htmlContent = fs.readFileSync(filePath, 'utf-8');
        // Minor fix for static paths (change ../ to ./) since it will be rendered in product.html which is at /
        htmlContent = htmlContent.replace(/\.\.\//g, './');
        
        const titleMatch = htmlContent.match(/<title>(.*?)<\/title>/);
        const title = titleMatch ? titleMatch[1] : filename;
        
        const product = products.find(p => p.id === productId);
        if (!product) {
            console.error(`Product ID ${productId} not found for ${filename}.`);
            continue;
        }
        
        const detail_pages = product.detail_pages || [];
        
        // Skip if a page with the exact same title already exists to avoid dupes
        if (detail_pages.some(dp => dp.title === `[Legacy] ${title}`)) {
            console.log(`Skipping ${filename}, already exists in ${productId}.`);
            continue;
        }
        
        const newPage = {
            id: crypto.randomUUID(),
            title: `[Legacy] ${title}`,
            content: htmlContent,
            created_at: new Date().toISOString()
        };
        
        detail_pages.push(newPage);
        
        const { error: updateError } = await supabase.from('products').update({ detail_pages }).eq('id', productId);
        if (updateError) {
            console.error(`Failed to update product ${productId}:`, updateError);
        } else {
            console.log(`Successfully migrated ${filename} to product ${productId}.`);
        }
    }
}

migrate();
