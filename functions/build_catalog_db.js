const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [key, val] = line.split('=');
  if (key && val) acc[key.trim()] = val.trim();
  return acc;
}, {});
process.env = { ...process.env, ...env };

const NOTION_API_KEY = process.env.NOTION_API_KEY;

// Find the Products DB ID by querying the parent page
// But we already know the Product DB ID from the previous step!
// Wait, I should read it from the environment if I saved it, or just query it.
// Let's just query databases in the parent page:
const parentPageId = "8836c02d-fc56-4629-be58-3858bccd61ce";
const headers = {
  "Authorization": `Bearer ${NOTION_API_KEY}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json"
};

const newProducts = [
  {
    id: "p_haatz_hsh90",
    brand: "하츠",
    name: "허리케인 스노우",
    model: "HSH-90WHCI",
    features: "심플함과 모던한 디자인으로 깨끗한 주방 연출",
    defaultPriceText: "상담문의",
    isHandled: true,
    detailLink: "./catalog_detail.html?id=p_haatz_hsh90",
    category: "환기가전(후드/환풍기)",
    details: {
      level1: { type: "official", images: ["/images/catalog/haatz/haatz_page_3.jpg"] },
      level2: { type: "custom", html: "", images: [] },
      level3: { type: "condition", text: "추가 배관 연장 시 비용이 발생할 수 있습니다." }
    }
  },
  {
    id: "p_haatz_eic30",
    brand: "하츠",
    name: "클레르 인덕션",
    model: "EIC-30HWR252",
    features: "공간에 자연스럽게 스며드는 화이트 감성",
    defaultPriceText: "상담문의",
    isHandled: true,
    detailLink: "./catalog_detail.html?id=p_haatz_eic30",
    category: "주방가전(인덕션/오븐)",
    details: {
      level1: { type: "official", images: ["/images/catalog/haatz/haatz_page_3.jpg"] },
      level2: { type: "custom", html: "", images: [] },
      level3: { type: "condition", text: "플러그인 타입으로 별도 전기공사 불필요" }
    }
  },
  {
    id: "p_himpel_fhd3",
    brand: "힘펠",
    name: "휴젠뜨 3",
    model: "FHD3-C150P",
    features: "음성안내, 블루투스 스피커 연동, 스마트 제어",
    defaultPriceText: "상담문의",
    isHandled: true,
    detailLink: "./catalog_detail.html?id=p_himpel_fhd3",
    category: "환기가전(후드/환풍기)",
    details: {
      level1: { type: "official", images: ["/images/catalog/himpel/himpel_page_35.jpg"] },
      level2: { type: "custom", html: "", images: [] },
      level3: { type: "condition", text: "" }
    }
  },
  {
    id: "p_himpel_palette",
    brand: "힘펠",
    name: "휴젠뜨 팔레트",
    model: "FHD2-C150P_PALETTE",
    features: "5가지 컬러 그릴, 뮤직테라피",
    defaultPriceText: "상담문의",
    isHandled: true,
    detailLink: "./catalog_detail.html?id=p_himpel_palette",
    category: "환기가전(후드/환풍기)",
    details: {
      level1: { type: "official", images: ["/images/catalog/himpel/himpel_page_39.jpg"] },
      level2: { type: "custom", html: "", images: [] },
      level3: { type: "condition", text: "" }
    }
  }
];

async function main() {
  try {
    // Read existing data
    const dataPath = '../data.json';
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    // Add new products to data.json
    for (const np of newProducts) {
      const idx = data.products.findIndex(p => p.id === np.id);
      if (idx >= 0) data.products[idx] = np;
      else data.products.push(np);
    }
    
    // Also update existing products to have isHandled and details structure
    for (let p of data.products) {
      if (p.isHandled === undefined) p.isHandled = true;
      if (!p.brand) p.brand = p.name.includes("하츠") ? "하츠" : "기타";
      if (!p.details) {
        p.details = {
          level1: { type: "official", images: [p.detailLink || "/images/catalog/placeholder.jpg"] },
          level2: { type: "custom", html: "", images: [] },
          level3: { type: "condition", text: "" }
        };
      }
      p.detailLink = `./catalog_detail.html?id=${p.id}`;
    }
    
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    console.log("✅ data.json updated with new products and 3-level structure.");

    // Sync to Notion
    const searchRes = await fetch('https://api.notion.com/v1/search', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        filter: { value: 'database', property: 'object' }
      })
    });
    const searchData = await searchRes.json();
    const productDb = searchData.results.find(db => db.title[0]?.plain_text === "제품 카탈로그 DB");
    
    if (!productDb) {
      console.log("Could not find '제품 카탈로그 DB' in Notion.");
      return;
    }

    for (const np of newProducts) {
      console.log(`Syncing to Notion: ${np.name}`);
      await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          parent: { database_id: productDb.id },
          properties: {
            "제품명": { title: [{ text: { content: np.name || "-" } }] },
            "FirebaseID": { rich_text: [{ text: { content: np.id || "-" } }] },
            "모델명": { rich_text: [{ text: { content: np.model || "-" } }] },
            "특징": { rich_text: [{ text: { content: np.features || "-" } }] },
            "기본가격텍스트": { rich_text: [{ text: { content: np.defaultPriceText || "-" } }] },
            "상세페이지URL": { url: `https://example.com/catalog_detail.html?id=${np.id}` }
          }
        })
      });
    }
    console.log("✅ Notion Sync Complete!");

  } catch (error) {
    console.error(error);
  }
}

main();
