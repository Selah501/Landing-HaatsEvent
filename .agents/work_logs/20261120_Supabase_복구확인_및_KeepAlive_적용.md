# 2026-11-20 Supabase 복구 확인 및 7일 일시중지 방지(Keep-Alive) 적용

## 1. 작업 내용
- **Supabase 프로젝트(`haatz-crm` / `belchthacupzpgxevecx`) 복구 확인**:
  - `Resume` 후 `products` 테이블 REST API 정상 응답(`200 OK`) 확인.
- **무료 플랜 7일 미사용 일시중지(Paused) 방지 보완**:
  - `landing/functions/crm_shared.py`에 `ping_supabase_keepalive()` 함수 추가 (`products?select=id&limit=1` 경량 조회).
  - `landing/functions/crm_daemon.py`의 `write_heartbeat()`에서 8시간(28,800초) 주기 및 데몬 기동 시 자동 호출되도록 연결.
  - 데몬 재기동 후 `[Supabase Keep-Alive] 정상 응답 확인 (일시중지 방지 핑)` 로그 출력 검증 완료.
