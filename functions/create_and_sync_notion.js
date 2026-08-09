const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [key, val] = line.split('=');
  if (key && val) acc[key.trim()] = val.trim();
  return acc;
}, {});
process.env = { ...process.env, ...env };

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const parentPageId = "8836c02d-fc56-4629-be58-3858bccd61ce";

const headers = {
  "Authorization": `Bearer ${NOTION_API_KEY}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json"
};

async function main() {
  try {
    // 1. Create '시공 완료 보고서' Database
    console.log("Creating '시공 완료 보고서' DB...");
    const reportDbRes = await fetch('https://api.notion.com/v1/databases', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        parent: { type: "page_id", page_id: parentPageId },
        title: [{ type: "text", text: { content: "시공 완료 보고서 (ERP)" } }],
        properties: {
          "이름": { title: {} },
          "시공일자": { date: {} },
          "고객명/아파트": { rich_text: {} },
          "연락처": { phone_number: {} },
          "시공품목": { rich_text: {} },
          "결제금액": { number: { format: "number_with_commas" } },
          "마진": { number: { format: "number_with_commas" } },
          "결제수단": { rich_text: {} }
        }
      })
    });
    const reportDb = await reportDbRes.json();
    if (reportDb.error) throw new Error(JSON.stringify(reportDb));
    console.log(`✅ Report DB Created! ID: ${reportDb.id}`);

    // Update .env with new NOTION_DATABASE_ID
    let envContent = fs.readFileSync('.env', 'utf8');
    envContent = envContent.replace(/NOTION_DATABASE_ID=.*/, `NOTION_DATABASE_ID=${reportDb.id}`);
    fs.writeFileSync('.env', envContent);
    console.log("✅ Updated .env with new Report DB ID");

    // 2. Create '제품 카탈로그' Database
    console.log("Creating '제품 카탈로그' DB...");
    const productDbRes = await fetch('https://api.notion.com/v1/databases', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        parent: { type: "page_id", page_id: parentPageId },
        title: [{ type: "text", text: { content: "제품 카탈로그 DB" } }],
        properties: {
          "제품명": { title: {} },
          "FirebaseID": { rich_text: {} },
          "모델명": { rich_text: {} },
          "특징": { rich_text: {} },
          "기본가격텍스트": { rich_text: {} },
          "상세페이지URL": { url: {} }
        }
      })
    });
    const productDb = await productDbRes.json();
    if (productDb.error) throw new Error(JSON.stringify(productDb));
    console.log(`✅ Product DB Created! ID: ${productDb.id}`);

    // 3. Sync existing data.json to Notion
    const data = JSON.parse(fs.readFileSync('../data.json', 'utf8'));
    for (const product of data.products) {
      console.log(`Syncing product: ${product.name}`);
      const pageRes = await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          parent: { database_id: productDb.id },
          properties: {
            "제품명": { title: [{ text: { content: product.name || "-" } }] },
            "FirebaseID": { rich_text: [{ text: { content: product.id || "-" } }] },
            "모델명": { rich_text: [{ text: { content: product.model || "-" } }] },
            "특징": { rich_text: [{ text: { content: product.features || "-" } }] },
            "기본가격텍스트": { rich_text: [{ text: { content: product.defaultPriceText || "-" } }] },
            "상세페이지URL": { url: product.detailLink ? `https://example.com${product.detailLink.replace('./', '/')}` : null }
          }
        })
      });
      const pageData = await pageRes.json();
      if (pageData.error) console.error("Error syncing product", product.name, pageData);
    }
    console.log("✅ Sync Complete!");

  } catch (error) {
    console.error(error);
  }
}

main();
