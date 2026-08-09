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

async function updateDatabase(id, payload) {
  const res = await fetch(`https://api.notion.com/v1/databases/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (data.id) {
    console.log(`✅ Updated DB: ${id}`);
  } else {
    console.error(`❌ Failed to update DB: ${id}`, data);
  }
}

async function deleteBlock(id) {
  const res = await fetch(`https://api.notion.com/v1/blocks/${id}`, {
    method: 'DELETE',
    headers
  });
  if (res.status === 200) {
    console.log(`🗑️ Deleted block (archived DB): ${id}`);
  } else {
    const data = await res.json();
    console.error(`❌ Failed to delete block: ${id}`, data);
  }
}

async function main() {
  console.log("Cleaning up Notion DBs...");

  // 1. Rename the active '제품 카탈로그 DB' to '상품 DB'
  await updateDatabase('3b2b8c08-8991-81dd-810c-d06461fff701', {
    title: [{ type: "text", text: { content: "상품 DB" } }]
  });

  // 2. Archive the duplicate '제품 카탈로그 DB'
  await deleteBlock('fc513a43-c6ef-41e4-a568-d522ea022fa0');

  // 3. Archive both '시공 완료 보고서 (ERP)'
  await deleteBlock('3b2b8c08-8991-819c-9575-e30ea45bd368');
  await deleteBlock('39e41c18-09a4-4e61-a33f-6669c27843a8');

  console.log("Cleanup finished.");
}

main();
