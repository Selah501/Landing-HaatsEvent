const { Client } = require('pg');
const fs = require('fs');

const connectionString = 'postgresql://postgres.belchthacupzpgxevecx:lSUR7jziVlaqSAEz@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres';

const client = new Client({
  connectionString,
});

async function main() {
  try {
    console.log('Connecting to Supabase PostgreSQL...');
    await client.connect();

    console.log('Altering products table to add new columns...');
    const alterQuery = `
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS details JSONB,
      ADD COLUMN IF NOT EXISTS price_purchase INTEGER,
      ADD COLUMN IF NOT EXISTS price_selling INTEGER,
      ADD COLUMN IF NOT EXISTS price_online INTEGER,
      ADD COLUMN IF NOT EXISTS price_local INTEGER,
      ADD COLUMN IF NOT EXISTS install_fee_tier VARCHAR(50);
    `;
    await client.query(alterQuery);
    console.log('✅ Schema updated successfully!');

    console.log('Importing details data from data.json...');
    const data = JSON.parse(fs.readFileSync('../data.json', 'utf8'));
    
    let updatedCount = 0;
    for (const product of data.products) {
      if (product.details) {
        // Build the price fields if any defaults can be parsed, but mostly null for now
        let sellingPrice = null;
        if (product.defaultPriceText && product.defaultPriceText.includes('원')) {
          const parsed = parseInt(product.defaultPriceText.replace(/[^0-9]/g, ''));
          if (!isNaN(parsed) && parsed > 0) sellingPrice = parsed;
        }

        await client.query(
          `UPDATE products 
           SET details = $1, price_selling = $2 
           WHERE id = $3`,
          [product.details, sellingPrice, product.id]
        );
        updatedCount++;
      }
    }
    console.log(`✅ Successfully updated details for ${updatedCount} products!`);

  } catch (err) {
    console.error('❌ Migration Error:', err.message);
  } finally {
    await client.end();
    console.log('Connection closed.');
  }
}

main();
