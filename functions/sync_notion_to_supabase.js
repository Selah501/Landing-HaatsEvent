const { Client } = require('pg');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [key, val] = line.split('=');
  if (key && val) acc[key.trim()] = val.trim();
  return acc;
}, {});

const NOTION_API_KEY = env.NOTION_API_KEY || process.env.NOTION_API_KEY;
const NOTION_PRODUCT_DB_ID = '3b2b8c08-8991-81dd-810c-d06461fff701';

const connectionString = 'postgresql://postgres.belchthacupzpgxevecx:lSUR7jziVlaqSAEz@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres';

const headers = {
  "Authorization": `Bearer ${NOTION_API_KEY}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json"
};

async function syncNotionToSupabase() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    
    // 1. Fetch from Notion
    console.log("Fetching products from Notion...");
    let hasMore = true;
    let nextCursor = undefined;
    let allPages = [];

    while (hasMore) {
      const res = await fetch(`https://api.notion.com/v1/databases/${NOTION_PRODUCT_DB_ID}/query`, {
        method: 'POST',
        headers,
        body: JSON.stringify(nextCursor ? { start_cursor: nextCursor } : {})
      });
      const data = await res.json();
      allPages.push(...data.results);
      hasMore = data.has_more;
      nextCursor = data.next_cursor;
    }

    console.log(`Found ${allPages.length} products in Notion. Syncing to Supabase...`);

    // 2. Update Supabase
    let updated = 0;
    for (const page of allPages) {
      const isHandled = page.properties['취급여부']?.checkbox ?? true;
      const firebaseId = page.properties['FirebaseID']?.rich_text[0]?.plain_text;
      
      const pricePurchase = page.properties['매입가(원가)']?.number || null;
      const priceSelling = page.properties['최종판매가']?.number || null;
      const priceOnline = page.properties['인터넷가(배송비포함)']?.number || null;
      const priceLocal = page.properties['타업체추정가']?.number || null;
      
      const detailPage2 = page.properties['상세페이지2']?.url || null;
      const detailPage3 = page.properties['상세페이지3']?.url || null;

      if (firebaseId) {
        // Fetch existing details first
        const { rows } = await client.query('SELECT details FROM products WHERE id = $1', [firebaseId]);
        
        let detailsObj = {};
        if (rows.length > 0) {
          detailsObj = rows[0].details || {};
          if (typeof detailsObj === 'string') {
            try { detailsObj = JSON.parse(detailsObj); } catch(e){}
          }
        }
        
        if (!detailsObj.level2) detailsObj.level2 = { type: "custom", html: "", images: [] };
        if (!detailsObj.level3) detailsObj.level3 = { type: "advanced", text: "", images: [] };
        
        if (detailPage2) detailsObj.level2.images = [detailPage2];
        if (detailPage3) detailsObj.level3.images = [detailPage3];

        const name = page.properties['제품명']?.title[0]?.plain_text || '이름없음';
        const brand = page.properties['브랜드']?.select?.name || '';
        const category = page.properties['대분류']?.select?.name || '';
        const model = page.properties['모델명']?.rich_text[0]?.plain_text || '';
        const features = page.properties['특징']?.rich_text.map(rt => rt.plain_text).join('') || '';

        if (rows.length > 0) {
          await client.query(
            `UPDATE products SET 
              is_handled = $1,
              price_purchase = $2,
              price_selling = $3,
              price_online = $4,
              price_local = $5,
              details = $6,
              name = $7,
              brand = $8,
              category = $9,
              model = $10,
              features = $11
             WHERE id = $12`,
            [isHandled, pricePurchase, priceSelling, priceOnline, priceLocal, JSON.stringify(detailsObj), name, brand, category, model, features, firebaseId]
          );
        } else {
          await client.query(
            `INSERT INTO products (id, name, brand, category, model, features, is_handled, price_purchase, price_selling, price_online, price_local, details)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [firebaseId, name, brand, category, model, features, isHandled, pricePurchase, priceSelling, priceOnline, priceLocal, JSON.stringify(detailsObj)]
          );
        }
        updated++;
      }
    }
    
    console.log(`✅ Synced ${updated} products from Notion to Supabase.`);
  } catch (err) {
    console.error("Sync Error:", err);
  } finally {
    await client.end();
  }
}

// Run immediately, or can be scheduled
syncNotionToSupabase();
