-- Supabase products 테이블 스키마 업데이트 스크립트
-- 이 스크립트를 Supabase SQL Editor에서 실행해주세요.

-- 1. 기존 테이블에 누락된 컬럼 추가
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_set BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS set_components JSONB DEFAULT '[]'::JSONB,
  ADD COLUMN IF NOT EXISTS prices JSONB DEFAULT '{"purchase":0, "sell_product":0, "sell_install":0, "sell_total":0}'::JSONB,
  ADD COLUMN IF NOT EXISTS detail_urls JSONB DEFAULT '[]'::JSONB,
  ADD COLUMN IF NOT EXISTS detail_pages JSONB DEFAULT '[]'::JSONB,
  ADD COLUMN IF NOT EXISTS marketing_memo TEXT DEFAULT '';

-- 2. 기존 데이터 초기화 (null 방지)
UPDATE products SET is_active = FALSE WHERE is_active IS NULL;
UPDATE products SET is_set = FALSE WHERE is_set IS NULL;
UPDATE products SET set_components = '[]'::JSONB WHERE set_components IS NULL;
UPDATE products SET prices = '{"purchase":0, "sell_product":0, "sell_install":0, "sell_total":0}'::JSONB WHERE prices IS NULL;
UPDATE products SET detail_urls = '[]'::JSONB WHERE detail_urls IS NULL;
UPDATE products SET marketing_memo = '' WHERE marketing_memo IS NULL;
