const { Client } = require('pg');
const fs = require('fs');

// User provided Session Pooler connection string
const connectionString = 'postgresql://postgres.belchthacupzpgxevecx:lSUR7jziVlaqSAEz@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres';

const client = new Client({
  connectionString,
});

async function main() {
  try {
    console.log('Connecting to Supabase PostgreSQL...');
    await client.connect();

    console.log('Creating tables...');
    const createTablesQuery = `
      -- 1. Products (상품 DB)
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(100) PRIMARY KEY,
        brand VARCHAR(50),
        category VARCHAR(100),
        name VARCHAR(200),
        model VARCHAR(100),
        features TEXT,
        default_price_text VARCHAR(100),
        is_handled BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- 2. Installers/Admins (담당자 DB)
      CREATE TABLE IF NOT EXISTS installers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        role VARCHAR(50), -- 관리자, 시공자
        phone VARCHAR(50),
        regions TEXT[],
        status VARCHAR(50) DEFAULT '재직',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- 3. Vendors (거래처 DB)
      CREATE TABLE IF NOT EXISTS vendors (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(150) NOT NULL,
        type VARCHAR(50), -- 제조사, 자재상, 하청업체
        contact_name VARCHAR(100),
        phone VARCHAR(50),
        address TEXT,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- 4. Apartments (아파트 사전조사 DB)
      CREATE TABLE IF NOT EXISTS apartments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        region_large VARCHAR(50),
        region_small VARCHAR(50),
        brand VARCHAR(100),
        name_alias VARCHAR(100) NOT NULL,
        built_year INTEGER,
        hood_specs TEXT[],
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- 5. Customers / CRM (예약/고객 CRM DB)
      CREATE TABLE IF NOT EXISTS customers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(50),
        apartment_id UUID REFERENCES apartments(id) ON DELETE SET NULL,
        unit_info VARCHAR(100), -- 동/호수
        route VARCHAR(50), -- 예약 경로
        selected_product_id VARCHAR(100) REFERENCES products(id) ON DELETE SET NULL,
        install_date DATE,
        status VARCHAR(50), -- 접수, 확정, 완료, 취소
        installer_id UUID REFERENCES installers(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- 6. Ledgers / ERP (일일 마감/재무장부 DB)
      CREATE TABLE IF NOT EXISTS ledgers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(200) NOT NULL,
        ledger_date DATE NOT NULL,
        type VARCHAR(50), -- 수입, 지출
        material_cost INTEGER DEFAULT 0,
        transport_cost INTEGER DEFAULT 0,
        food_cost INTEGER DEFAULT 0,
        other_cost INTEGER DEFAULT 0,
        revenue INTEGER DEFAULT 0,
        profit INTEGER DEFAULT 0,
        installer_id UUID REFERENCES installers(id) ON DELETE SET NULL,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await client.query(createTablesQuery);
    console.log('✅ Tables created successfully!');

    // Read data.json to import products
    console.log('Importing 63 products from data.json...');
    const data = JSON.parse(fs.readFileSync('../data.json', 'utf8'));
    
    // Use an upsert strategy for products
    const insertProductQuery = `
      INSERT INTO products (id, brand, category, name, model, features, default_price_text, is_handled)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET
        brand = EXCLUDED.brand,
        category = EXCLUDED.category,
        name = EXCLUDED.name,
        model = EXCLUDED.model,
        features = EXCLUDED.features,
        default_price_text = EXCLUDED.default_price_text,
        is_handled = EXCLUDED.is_handled;
    `;

    for (const product of data.products) {
      await client.query(insertProductQuery, [
        product.id,
        product.brand || null,
        product.category || null,
        product.name || null,
        product.model || null,
        product.features || null,
        product.defaultPriceText || null,
        product.isHandled !== false // default true
      ]);
    }
    console.log(`✅ Successfully imported ${data.products.length} products to Supabase!`);

  } catch (err) {
    console.error('❌ Migration Error:', err.message);
  } finally {
    await client.end();
    console.log('Connection closed.');
  }
}

main();
