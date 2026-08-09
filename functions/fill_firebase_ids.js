const fs = require('fs');
const crypto = require('crypto');

const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [key, val] = line.split('=');
  if (key && val) acc[key.trim()] = val.trim();
  return acc;
}, {});
process.env = { ...process.env, ...env };

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_DB_ID = "3b2b8c08-8991-81dd-810c-d06461fff701";

async function notionApi(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${NOTION_API_KEY}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    }
  };
  if (body) options.body = JSON.stringify(body);
  
  const res = await fetch(`https://api.api.notion.com/v1${endpoint}`.replace('api.api.', 'api.'), options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Notion API Error: ${text}`);
  }
  return res.json();
}

async function run() {
  console.log("Fetching all products...");
  let hasMore = true;
  let nextCursor = undefined;
  let allPages = [];

  while (hasMore) {
    const res = await notionApi(`/databases/${NOTION_DB_ID}/query`, 'POST', nextCursor ? { start_cursor: nextCursor } : {});
    allPages.push(...res.results);
    hasMore = res.has_more;
    nextCursor = res.next_cursor;
  }

  let updatedCount = 0;
  for (const page of allPages) {
    const firebaseIdProp = page.properties['FirebaseID'];
    const firebaseId = firebaseIdProp?.rich_text?.[0]?.plain_text;
    
    if (!firebaseId) {
      const newId = crypto.randomUUID();
      await notionApi(`/pages/${page.id}`, 'PATCH', {
        properties: {
          'FirebaseID': { rich_text: [{ text: { content: newId } }] }
        }
      });
      const name = page.properties['제품명']?.title[0]?.plain_text;
      console.log(`Assigned new FirebaseID to ${name}`);
      updatedCount++;
      await new Promise(r => setTimeout(r, 200)); // rate limit
    }
  }
  console.log(`Finished. Updated ${updatedCount} products.`);
}

run().catch(console.error);
