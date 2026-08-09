const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [key, val] = line.split('=');
  if (key && val) acc[key.trim()] = val.trim();
  return acc;
}, {});

const NOTION_API_KEY = env.NOTION_API_KEY || process.env.NOTION_API_KEY;
const NOTION_PRODUCT_DB_ID = '3b2b8c08-8991-81dd-810c-d06461fff701';

const headers = {
  "Authorization": `Bearer ${NOTION_API_KEY}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json"
};

async function updateSchema() {
  try {
    const res = await fetch(`https://api.notion.com/v1/databases/${NOTION_PRODUCT_DB_ID}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        properties: {
          "매입가(원가)": { number: { format: "number_with_commas" } },
          "최종판매가": { number: { format: "number_with_commas" } },
          "인터넷가(배송비포함)": { number: { format: "number_with_commas" } },
          "타업체추정가": { number: { format: "number_with_commas" } },
          "상세페이지URL": null, // Remove old field
          "기본정보URL": { url: {} },
          "상세페이지1": { url: {} },
          "상세페이지2": { url: {} },
          "상세페이지3": { url: {} }
        }
      })
    });
    
    if (res.ok) {
      console.log("✅ Notion DB Schema Updated with URL columns!");
    } else {
      const err = await res.json();
      console.error("❌ Failed to update schema:", err);
    }
  } catch (e) {
    console.error(e);
  }
}

updateSchema();
