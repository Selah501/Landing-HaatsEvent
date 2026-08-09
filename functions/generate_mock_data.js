const { Client } = require('pg');

const connectionString = 'postgresql://postgres.belchthacupzpgxevecx:lSUR7jziVlaqSAEz@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres';

async function generateMockData() {
  const client = new Client({ connectionString });
  try {
    console.log('Connecting to Supabase...');
    await client.connect();

    // 1. Create a fake installer (시공자)
    console.log('Creating mock installer...');
    const installerRes = await client.query(`
      INSERT INTO installers (name, role, phone, regions, status) 
      VALUES ('A팀장 (가상)', '시공자', '010-1234-5678', '{"천안","아산"}', '재직')
      RETURNING id;
    `);
    const installerId = installerRes.rows[0].id;

    // 2. Create a fake apartment (아파트)
    console.log('Creating mock apartment...');
    const aptRes = await client.query(`
      INSERT INTO apartments (region_large, region_small, brand, name_alias, built_year)
      VALUES ('충남', '천안 서북구', '푸르지오', '불당 푸르지오', 2015)
      RETURNING id;
    `);
    const aptId = aptRes.rows[0].id;

    // 3. Create mock customers (예약 CRM 10건)
    console.log('Generating 10 mock customers...');
    const customerNames = ['김철수', '이영희', '박민수', '최지윤', '정성호', '강하늘', '윤보미', '임요환', '송지효', '오민석'];
    for (let i = 0; i < 10; i++) {
      const status = i < 3 ? '완료' : i < 6 ? '확정' : '접수';
      await client.query(`
        INSERT INTO customers (name, phone, apartment_id, unit_info, route, status, installer_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        customerNames[i], 
        `010-9999-000${i}`, 
        aptId, 
        `10${i}동 50${i}호`, 
        '네이버검색', 
        status, 
        installerId
      ]);
    }

    // 4. Create mock ledgers (일일 장부 ERP 5건)
    console.log('Generating 5 mock ledgers...');
    for (let i = 0; i < 5; i++) {
      await client.query(`
        INSERT INTO ledgers (title, ledger_date, type, material_cost, transport_cost, food_cost, revenue, profit, installer_id)
        VALUES ($1, CURRENT_DATE - CAST($2 AS INTEGER), '수입', $3, 10000, 8000, $4, $5, $6)
      `, [
        `${customerNames[i]} 고객 시공 완료 건`,
        i, // subtract days
        150000, // material cost
        350000, // revenue
        182000, // profit = 350000 - 150000 - 10000 - 8000
        installerId
      ]);
    }

    console.log('✅ Mock data generated successfully!');
  } catch (err) {
    console.error('❌ Mock Data Error:', err);
  } finally {
    await client.end();
  }
}

generateMockData();
