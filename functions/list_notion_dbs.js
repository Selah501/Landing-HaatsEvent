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
  const searchRes = await fetch('https://api.notion.com/v1/search', {
    method: 'POST',
    headers,
    body: JSON.stringify({ filter: { value: 'database', property: 'object' } })
  });
  const searchData = await searchRes.json();
  
  console.log("All Databases in workspace:");
  searchData.results.forEach(db => {
    const title = db.title.length > 0 ? db.title[0].plain_text : "Untitled";
    console.log(`- ${title} (ID: ${db.id})`);
  });
}

main();
