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
  return campPage ? campPage.id : "8836c02d-fc56-4629-be58-3858bccd61ce";
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
  console.log("Creating additional databases in Notion...");
  const pageId = await getPageId();

  // 1. 담당자(시공자/관리자) DB
  await createDatabase("담당자(관리자/시공자) DB", {
    "이름": { title: {} }, 
    "역할": { select: {} }, // 관리자, 시공자
    "연락처": { rich_text: {} },
    "주 활동지역": { multi_select: {} },
    "상태": { status: {} }, // 재직, 퇴사, 휴가
    "비고": { rich_text: {} }
  }, pageId);

  // 2. 거래처 DB
  await createDatabase("거래처(매입/협력사) DB", {
    "거래처명": { title: {} },
    "분류": { select: {} }, // 제조사, 자재상, 하청업체
    "담당자명": { rich_text: {} },
    "연락처": { rich_text: {} },
    "주소": { rich_text: {} },
    "비고": { rich_text: {} }
  }, pageId);

  console.log("🎉 Additional databases successfully created in Notion!");
}

main();
