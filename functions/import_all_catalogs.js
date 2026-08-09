const fs = require('fs');
const path = require('path');

// Load env
const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [key, val] = line.split('=');
  if (key && val) acc[key.trim()] = val.trim();
  return acc;
}, {});
process.env = { ...process.env, ...env };

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_DB_ID = "3b2b8c08-8991-81dd-810c-d06461fff701";
const NOTION_VERSION = '2022-06-28';

async function notionApi(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${NOTION_API_KEY}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json'
    }
  };
  if (body) options.body = JSON.stringify(body);
  
  const res = await fetch(`https://api.notion.com/v1${endpoint}`, options);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Notion API Error: ${JSON.stringify(data)}`);
  }
  return data;
}

// Helper for rate limiting
const delay = ms => new Promise(res => setTimeout(res, ms));

async function run() {
  const data = JSON.parse(fs.readFileSync('../../extracted_all.json', 'utf8'));
  
  for (const p of data) {
    let name = p.name;
    name = name.replace(/^[\d\.]+\s*(kg)\s*[\d\.]*\s*(W)\s*/i, '');
    
    console.log(`Processing: ${name}`);
    const publicUrl = `https://flyer-event-page-2026.web.app/images/catalog/${p.image_file}`;
    
    // Search Notion
    const response = await notionApi(`/databases/${NOTION_DB_ID}/query`, 'POST', {
      filter: {
        property: "제품명",
        title: { equals: name }
      }
    });
    
    const properties = {
      "제품명": { title: [{ text: { content: name } }] },
      "모델명": { rich_text: [{ text: { content: p.model } }] },
      "대분류": { select: { name: p.category } },
      "상세페이지1": { url: publicUrl }
    };
    
    if (response.results.length > 0) {
      // Update
      await notionApi(`/pages/${response.results[0].id}`, 'PATCH', {
        properties: properties
      });
      console.log(`Updated Notion: ${name}`);
    } else {
      // Create
      await notionApi(`/pages`, 'POST', {
        parent: { database_id: NOTION_DB_ID },
        properties: properties
      });
      console.log(`Created Notion: ${name}`);
    }
    await delay(300); // 300ms delay to prevent rate limit
  }
}

run().catch(console.error);
