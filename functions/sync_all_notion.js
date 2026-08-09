const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [key, val] = line.split('=');
  if (key && val) acc[key.trim()] = val.trim();
  return acc;
}, {});
process.env = { ...process.env, ...env };

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const headers = {
  "Authorization": `Bearer ${NOTION_API_KEY}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json"
};

async function main() {
  try {
    const searchRes = await fetch('https://api.notion.com/v1/search', {
      method: 'POST',
      headers,
      body: JSON.stringify({ filter: { value: 'database', property: 'object' } })
    });
    const searchData = await searchRes.json();
    const productDb = searchData.results.find(db => db.title.length > 0 && db.title[0].plain_text === "상품 DB");
    
    if (!productDb) {
      console.log("Could not find '상품 DB'");
      return;
    }

    const data = JSON.parse(fs.readFileSync('../data.json', 'utf8'));
    
    // In a real scenario we'd query existing items and update them, 
    // but for now we'll just add the ones that aren't there or blindly add them.
    // Let's blindly add them. The user can clear old rows in Notion UI if needed, 
    // or we can just fetch and delete. Let's fetch and delete first for a clean sync.
    console.log("Clearing old products from Notion...");
    const queryRes = await fetch(`https://api.notion.com/v1/databases/${productDb.id}/query`, {
      method: 'POST', headers
    });
    const queryData = await queryRes.json();
    for (const page of queryData.results) {
      await fetch(`https://api.notion.com/v1/pages/${page.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ archived: true })
      });
    }

    console.log("Syncing 37 products to Notion...");
    for (const np of data.products) {
      await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          parent: { database_id: productDb.id },
          properties: {
            "제품명": { title: [{ text: { content: np.name || "-" } }] },
            "FirebaseID": { rich_text: [{ text: { content: np.id || "-" } }] },
            "모델명": { rich_text: [{ text: { content: np.model || "-" } }] },
            "특징": { rich_text: [{ text: { content: np.features || "-" } }] },
            "기본가격텍스트": { rich_text: [{ text: { content: np.defaultPriceText || "-" } }] },
            "상세페이지URL": { url: `https://example.com/catalog_detail.html?id=${np.id}` },
            "취급여부": { checkbox: np.isHandled },
            "브랜드": { select: { name: np.brand } },
            "대분류": { select: { name: np.category } }
          }
        })
      });
    }
    console.log("✅ Complete Notion Sync Finished!");

  } catch (error) {
    console.error(error);
  }
}

main();
