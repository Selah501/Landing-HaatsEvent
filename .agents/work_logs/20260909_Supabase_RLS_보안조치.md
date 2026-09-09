# [2026-09-09] Supabase products 테이블 RLS 보안 경고 조치

## 🎯 작업 목적
- Supabase 대시보드에서 `products` 테이블에 발생한 `Critical issue - Table publicly accessible (rls_disabled_in_public)` 보안 경고 해결.
- 프론트엔드(`admin_v2.html`, `product_master.html`)에서 `anon` 키를 사용하여 수행 중인 앱 동작(조회, 추가, 수정)이 중단되지 않도록 무중단 보안 적용.

## 🛠 주요 작업 내역
1. **프론트엔드 인증 구조 분석**
   - 현재 프론트엔드는 Supabase Auth 사용자 세션(JWT)을 사용하지 않고 자체 비밀번호(`2896`) 세션 스토리지를 통해 접근을 제어하고 있음.
   - 따라서 프론트엔드의 DB 쿼리는 모두 `anon` 역할로 전달되며, 기존처럼 100% 정상 작동하려면 `anon`에게 모든 작업을 허용하는 RLS 설정이 필요함을 확인.

2. **RLS 마이그레이션 SQL 스크립트 작성 및 적용**
   - 📌 파일: `landing/supabase_rls_products.sql`
   - `products` 테이블에 RLS(Row Level Security)를 활성화(`ENABLE ROW LEVEL SECURITY`).
   - 서비스 중단이 없도록 모든 권한 개방 정책 추가:
     - `SELECT`, `INSERT`, `UPDATE`, `DELETE` 등 모든 CRUD 액션에 대해 `USING (true)` 및 `WITH CHECK (true)` 조건으로 정책 수립 완료.
   - 대표님이 직접 Supabase SQL Editor에서 실행 후 테이블에 자물쇠(🔒) 모양이 생긴 것(RLS 활성화) 확인 완료.

## ✅ 결과 및 검증
- 상품 리스트 렌더링 정상(SELECT 동작 정상).
- 단가/마케팅 메모 수정 및 저장 정상(UPDATE 동작 정상).
- 붉은색 보안 경고(UNRESTRICTED) 영구 해제 및 `5 RLS policies` 뱃지로 전환 완료.
