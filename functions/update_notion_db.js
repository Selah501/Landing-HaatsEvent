const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [key, val] = line.split('=');
  if (key && val) acc[key.trim()] = val.trim();
  return acc;
}, {});
process.env = { ...process.env, ...env };
const { Client } = require("@notionhq/client");

const notion = new Client({ auth: process.env.NOTION_API_KEY });

async function search() {
  try {
    const ids = ["8836c02d-fc56-4629-be58-3858bccd61ce", "bd2787cf-58ea-48d6-9d20-a887c6c4d2f4", "21d010fd-0189-4588-bb40-5de717050763"];
    for (const id of ids) {
      try {
        const page = await notion.pages.retrieve({ page_id: id });
        console.log(`ID: ${id} is a PAGE. Title: ${page.properties.title?.title[0]?.plain_text || 'Unknown'}`);
      } catch (e) {
        if (e.code === 'object_not_a_page') {
          const db = await notion.databases.retrieve({ database_id: id });
          console.log(`ID: ${id} is a DATABASE. Title: ${db.title[0]?.plain_text}`);
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
}
search();
