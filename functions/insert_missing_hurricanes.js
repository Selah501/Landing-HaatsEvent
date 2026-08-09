const { Client } = require('pg');

const connectionString = 'postgresql://postgres.belchthacupzpgxevecx:lSUR7jziVlaqSAEz@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres';

async function addMissingProducts() {
  const client = new Client({ connectionString });
  try {
    await client.connect();

    const missingProducts = [
      { id: "p_haatz_hdh90", brand: "하츠", category: "주방 후드", name: "허리케인 도어", model: "HDH-90S", defaultPriceText: "상담문의", features: "도어 일체형 허리케인 후드", isHandled: true },
      { id: "p_haatz_hrh80s", brand: "하츠", category: "주방 후드", name: "허리케인", model: "HRH-80S", defaultPriceText: "상담문의", features: "강력한 흡입력의 허리케인 800각", isHandled: true },
      { id: "p_haatz_hrh90s", brand: "하츠", category: "주방 후드", name: "허리케인", model: "HRH-90S", defaultPriceText: "상담문의", features: "강력한 흡입력의 허리케인 900각", isHandled: true },
      // hsh-90whci is already there, but let's add hsh-90whcls just in case it's a different variant
      { id: "p_haatz_hsh90cls", brand: "하츠", category: "주방 후드", name: "허리케인 스노우 클래식", model: "HSH-90WHCLS", defaultPriceText: "상담문의", features: "심플함과 모던한 디자인", isHandled: true },
    ];

    for (const p of missingProducts) {
      await client.query(`
        INSERT INTO products (id, brand, category, name, model, features, default_price_text, is_handled, details)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO NOTHING
      `, [
        p.id, p.brand, p.category, p.name, p.model, p.features, p.defaultPriceText, p.isHandled,
        JSON.stringify({
          level1: { images: ["/images/catalog/haatz/haatz_page_41.jpg"] },
          level2: {}, level3: {}
        })
      ]);
    }
    console.log("✅ Missing hurricanes inserted into Supabase!");
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
addMissingProducts();
