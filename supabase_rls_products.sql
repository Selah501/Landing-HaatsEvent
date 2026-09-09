-- Supabase products 테이블 RLS(Row Level Security) 활성화 및 정책 설정
-- 이 스크립트를 Supabase SQL Editor에서 실행해주세요.

-- 1. products 테이블 RLS 활성화
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 2. 기존 정책 삭제 (만약 이미 정책이 존재할 경우 충돌 방지)
DROP POLICY IF EXISTS "Enable read access for all users" ON products;
DROP POLICY IF EXISTS "Enable insert for all users" ON products;
DROP POLICY IF EXISTS "Enable update for all users" ON products;
DROP POLICY IF EXISTS "Enable delete for all users" ON products;
DROP POLICY IF EXISTS "Allow all operations for public" ON products;

-- 3. 정책(Policy) 작성
-- 현재 하츠 충남대리점 프로젝트는 프론트엔드 자체 패스워드 인증(auth.js의 2896)을 사용하며,
-- Supabase Auth를 통한 사용자 로그인(JWT 검증)을 사용하지 않습니다. 
-- 즉, 클라이언트(admin_v2.html, product_master.html 등)의 모든 요청은 anon 롤로 전달되므로, 
-- 기존 서비스(상품 마스터 등록/수정, 검색기 조회) 중단을 방지하기 위해 모든 CRUD 권한을 개방해야 합니다.
-- (다른 apartments, customers 테이블도 동일하게 동작 중일 것으로 추정됩니다.)

-- [조회(SELECT) 정책] 모든 접근 허용
CREATE POLICY "Enable read access for all users"
ON products FOR SELECT
USING (true);

-- [삽입(INSERT) 정책] 모든 접근 허용
CREATE POLICY "Enable insert for all users"
ON products FOR INSERT
WITH CHECK (true);

-- [수정(UPDATE) 정책] 모든 접근 허용
CREATE POLICY "Enable update for all users"
ON products FOR UPDATE
USING (true)
WITH CHECK (true);

-- [삭제(DELETE) 정책] 모든 접근 허용
CREATE POLICY "Enable delete for all users"
ON products FOR DELETE
USING (true);
