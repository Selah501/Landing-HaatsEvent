const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [key, val] = line.split('=');
  if (key && val) acc[key.trim()] = val.trim();
  return acc;
}, {});
process.env = { ...process.env, ...env };

const NOTION_API_KEY = process.env.NOTION_API_KEY;

const headers = {
  "Authorization": `Bearer ${NOTION_API_KEY}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json"
};

async function getPageId() {
  const searchRes = await fetch('https://api.notion.com/v1/search', {
    method: 'POST',
    headers,
    body: JSON.stringify({ filter: { value: 'page', property: 'object' } })
  });
  const searchData = await searchRes.json();
  const campPage = searchData.results.find(p => p.url && p.url.includes('8836c02dfc564629be583858bccd61ce'));
  return campPage ? campPage.id : "8836c02d-fc56-4629-be58-3858bccd61ce"; // Fallback from transcript
}

async function createDatabase(title, properties, pageId) {
  const payload = {
    parent: { type: "page_id", page_id: pageId },
    title: [{ type: "text", text: { content: title } }],
    properties: properties
  };
  
  const res = await fetch('https://api.notion.com/v1/databases', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });
  
  const data = await res.json();
  if (data.id) {
    console.log(`✅ Created DB: ${title} (ID: ${data.id})`);
    return data.id;
  } else {
    console.error(`❌ Failed to create DB: ${title}`, data);
    return null;
  }
}

async function main() {
  console.log("Creating new databases in Notion...");
  const pageId = await getPageId();

  // 1. 아파트 사전조사 DB
  await createDatabase("아파트 사전조사 영업 DB", {
    "현장약칭": { title: {} }, // Title is required
    "대분류(지역)": { select: {} },
    "소분류(마을)": { select: {} },
    "브랜드(시공사)": { select: {} },
    "입주년도": { number: {} },
    "적용가능 후드규격": { multi_select: {} },
    "특이사항": { rich_text: {} }
  }, pageId);

  // 2. 통합 고객/예약 CRM DB
  await createDatabase("통합 고객/예약 CRM DB", {
    "고객명": { title: {} },
    "연락처": { rich_text: {} },
    "아파트명": { rich_text: {} },
    "동/호수": { rich_text: {} },
    "예약경로": { select: {} },
    "선택제품": { rich_text: {} },
    "시공희망일": { date: {} },
    "상태": { status: {} },
    "담당 시공자": { select: {} }
  }, pageId);

  // 3. 일일 마감 / ERP 재무장부
  await createDatabase("스마트 일일 마감 (ERP)", {
    "결제/시공건명": { title: {} },
    "날짜": { date: {} },
    "구분": { select: {} }, // 수입 vs 지출
    "자재 매입비": { number: {} },
    "주유비/교통비": { number: {} },
    "식대": { number: {} },
    "기타 지출": { number: {} },
    "매출액": { number: {} },
    "순수익": { formula: { expression: "prop(\"매출액\") - (prop(\"자재 매입비\") + prop(\"주유비/교통비\") + prop(\"식대\") + prop(\"기타 지출\"))" } },
    "비고": { rich_text: {} }
  }, pageId);

  console.log("🎉 All databases successfully created in Notion!");
}

main();
