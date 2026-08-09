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

async function main() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    
    // 1. Fetch all products from Supabase
    const { rows: products } = await client.query('SELECT * FROM products');
    console.log(`Fetched ${products.length} products from Supabase.`);

    // 2. Fetch all existing pages in Notion
    let hasMore = true;
    let nextCursor = undefined;
    let allPages = [];
    while (hasMore) {
      const res = await fetch(`https://api.notion.com/v1/databases/${NOTION_PRODUCT_DB_ID}/query`, {
        method: 'POST', headers,
        body: JSON.stringify(nextCursor ? { start_cursor: nextCursor } : {})
      });
      const data = await res.json();
      allPages.push(...data.results);
      hasMore = data.has_more;
      nextCursor = data.next_cursor;
    }
    
    // Create a map of FirebaseID -> pageId to update instead of delete
    const notionMap = {};
    for (const p of allPages) {
      const fId = p.properties['FirebaseID']?.rich_text[0]?.plain_text;
      if (fId) notionMap[fId] = p.id;
    }

    console.log(`Found ${Object.keys(notionMap).length} items in Notion.`);

    // 3. Upsert into Notion
    let added = 0;
    let updated = 0;

    for (const np of products) {
      const props = {
        "제품명": { title: [{ text: { content: np.name || "-" } }] },
        "FirebaseID": { rich_text: [{ text: { content: np.id || "-" } }] },
        "모델명": { rich_text: [{ text: { content: np.model || "-" } }] },
        "특징": { rich_text: [{ text: { content: np.features || "-" } }] },
        "기본가격텍스트": { rich_text: [{ text: { content: np.default_price_text || "-" } }] },
        "기본정보URL": { url: `https://flyer-event-page-2026.web.app/catalog_detail.html?id=${np.id}` },
        "취급여부": { checkbox: np.is_handled },
        "브랜드": { select: { name: np.brand || "기타" } },
        "대분류": { select: { name: np.category || "기타" } },
        "매입가(원가)": { number: np.price_purchase },
        "최종판매가": { number: np.price_selling },
        "인터넷가(배송비포함)": { number: np.price_online },
        "타업체추정가": { number: np.price_local }
      };

      // Add detail page URLs
      let detailsObj = {};
      if (typeof np.details === 'string') {
        try { detailsObj = JSON.parse(np.details); } catch(e){}
      } else if (np.details) {
        detailsObj = np.details;
      }

      const img1 = detailsObj?.level1?.images?.[0];
      const img2 = detailsObj?.level2?.images?.[0];
      const img3 = detailsObj?.level3?.images?.[0];

      if (img1) props["상세페이지1"] = { url: img1.startsWith('http') ? img1 : `https://flyer-event-page-2026.web.app${img1}` };
      if (img2) props["상세페이지2"] = { url: img2.startsWith('http') ? img2 : `https://flyer-event-page-2026.web.app${img2}` };
      if (img3) props["상세페이지3"] = { url: img3.startsWith('http') ? img3 : `https://flyer-event-page-2026.web.app${img3}` };

      if (notionMap[np.id]) {
        // Update existing
        await fetch(`https://api.notion.com/v1/pages/${notionMap[np.id]}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ properties: props })
        });
        updated++;
      } else {
        // Create new
        await fetch('https://api.notion.com/v1/pages', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            parent: { database_id: NOTION_PRODUCT_DB_ID },
            properties: props
          })
        });
        added++;
      }
    }
    
    console.log(`✅ Sync Complete! Added ${added}, Updated ${updated} products in Notion.`);

  } catch (error) {
    console.error(error);
  } finally {
    await client.end();
  }
}

main();
