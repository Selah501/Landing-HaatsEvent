const { Client } = require('pg');
const fs = require('fs');

const connectionString = 'postgresql://postgres.belchthacupzpgxevecx:lSUR7jziVlaqSAEz@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres';

async function importParsed() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    
    const parsedData = JSON.parse(fs.readFileSync('parsed_catalog.json', 'utf8'));
    const products = parsedData.products;

    let inserted = 0;
    for (const p of products) {
      await client.query(`
        INSERT INTO products (id, brand, category, name, model, features, default_price_text, is_handled, details)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          category = EXCLUDED.category
      `, [
        p.id, p.brand, p.category, p.name, p.model, p.features, p.defaultPriceText, p.isHandled,
        JSON.stringify({
          level1: { images: [] },
          level2: {}, level3: {}
        })
      ]);
      inserted++;
    }
    console.log(`✅ Successfully inserted/updated ${inserted} products in Supabase!`);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
importParsed();
