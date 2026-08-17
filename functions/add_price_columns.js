/**
 * Supabase products 테이블에 price_install, price_options 컬럼 추가
 * 1회성 실행 스크립트
 */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://belchthacupzpgxevecx.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlbGNodGhhY3VwenBneGV2ZWN4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTgwNTUwNiwiZXhwIjoyMTAxMzgxNTA2fQ.cjEfiENLjNwl5dudDTU_ylppF_SIhQCmx9lb_gXh8bo';

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function addColumns() {
  console.log('🔧 Supabase products 테이블 컬럼 추가 시작...\n');

  // Supabase JS SDK에서 DDL 직접 실행은 rpc 또는 pg 직접 사용 필요
  // pg 모듈로 직접 실행
  const { Pool } = require('pg');
  
  // Supabase connection string (pooler)
  // .env에서 DB URL 없으므로 REST 방식으로 시도
  // 대신 rpc 방식 시도
  
  const sqls = [
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS price_install integer DEFAULT 0`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS price_options integer DEFAULT 0`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS price_notes text`,
  ];

  for (const sql of sqls) {
    const { data, error } = await sb.rpc('exec_sql', { sql_text: sql }).maybeSingle();
    if (error) {
      console.log(`⚠️  RPC 방식 실패 (exec_sql 없을 수 있음): ${error.message}`);
      console.log('→ Supabase 대시보드 SQL Editor에서 직접 실행하세요:\n');
      break;
    }
  }
  
  console.log('\n📋 Supabase SQL Editor에서 아래 SQL을 실행하세요:');
  console.log('='.repeat(60));
  console.log(`ALTER TABLE products ADD COLUMN IF NOT EXISTS price_install integer DEFAULT 0;`);
  console.log(`ALTER TABLE products ADD COLUMN IF NOT EXISTS price_options integer DEFAULT 0;`);
  console.log(`ALTER TABLE products ADD COLUMN IF NOT EXISTS price_notes text;`);
  console.log('='.repeat(60));
  
  // 현재 컬럼 확인
  console.log('\n✅ 현재 컬럼 확인:');
  const { data, error } = await sb.from('products').select('*').limit(1);
  if (data && data[0]) {
    console.log('현재 컬럼:', Object.keys(data[0]).join(', '));
    const hasPriceInstall = 'price_install' in data[0];
    const hasPriceOptions = 'price_options' in data[0];
    console.log(`price_install: ${hasPriceInstall ? '✅ 존재' : '❌ 없음'}`);
    console.log(`price_options: ${hasPriceOptions ? '✅ 존재' : '❌ 없음'}`);
  }
}

addColumns();
