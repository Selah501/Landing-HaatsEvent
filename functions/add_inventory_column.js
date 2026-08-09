const { Client } = require('pg');
const client = new Client('postgresql://postgres.belchthacupzpgxevecx:lSUR7jziVlaqSAEz@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres');

async function main() {
    await client.connect();
    await client.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS inventory_count INTEGER DEFAULT 0");
    console.log("Column inventory_count added");
    client.end();
}
main();
