const { Client } = require('pg');
const client = new Client('postgresql://postgres.belchthacupzpgxevecx:lSUR7jziVlaqSAEz@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres');

async function main() {
    await client.connect();
    await client.query(`
        CREATE OR REPLACE FUNCTION decrement_inventory(product_name text, qty integer)
        RETURNS void AS $$
        BEGIN
            UPDATE products
            SET inventory_count = COALESCE(inventory_count, 0) - qty
            WHERE name = product_name;
        END;
        $$ LANGUAGE plpgsql;
    `);
    console.log("RPC decrement_inventory created");
    client.end();
}
main();
