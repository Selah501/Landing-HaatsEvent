# =====================================================================
# notion_sync_daemon.py
# 목적: 노션 상품 DB 변경 사항을 5분마다 감지하여 Supabase 자동 동기화
# bulk_sync_products.py 초기 동기화 완료 후 이 데몬을 실행할 것
# =====================================================================

import os, time, json
import requests
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(env_path)

NOTION_TOKEN   = os.getenv("NOTION_API_KEY")
NOTION_DB_ID   = os.getenv("NOTION_DB_PRODUCT").replace("-", "")
SUPABASE_URL   = "https://belchthacupzpgxevecx.supabase.co"
SUPABASE_KEY   = os.getenv("SUPABASE_SERVICE_KEY", "")  # Service Role Key 사용
POLL_INTERVAL  = 300  # 5분 (초 단위)
LAST_SYNC_FILE = os.path.join(os.path.dirname(__file__), "last_product_sync.txt")
ERROR_LOG      = os.path.join(os.path.dirname(__file__), "notion_sync_error.log")

NOTION_HEADERS = {
    "Authorization": f"Bearer {NOTION_TOKEN}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json"
}
SUPA_HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates"
}

def load_last_sync_time():
    """마지막 성공 동기화 시각 로드 (재시도 로직의 핵심)"""
    if os.path.exists(LAST_SYNC_FILE):
        with open(LAST_SYNC_FILE, "r") as f:
            return f.read().strip()
    # 최초 실행 시 1년 전을 기준으로 설정해 전체 데이터를 긁어옴
    return (datetime.now(timezone.utc) - timedelta(days=365)).strftime("%Y-%m-%dT%H:%M:%SZ")

def save_last_sync_time():
    with open(LAST_SYNC_FILE, "w") as f:
        f.write(datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"))

def log_error(msg):
    ts = time.strftime('%Y-%m-%d %H:%M:%S')
    with open(ERROR_LOG, "a", encoding="utf-8") as f:
        f.write(f"[{ts}] {msg}\n")

# bulk_sync_products.py의 함수들 재사용
from bulk_sync_products import (
    fetch_all_notion_products,
    notion_page_to_supabase_row,
    get_supabase_page_ids,
    delete_orphan_rows,
    upsert_products
)

def sync_once():
    if not SUPABASE_KEY:
        print("❌ .env 파일에 SUPABASE_SERVICE_KEY가 없습니다.")
        return

    try:
        print(f"\n[{time.strftime('%H:%M:%S')}] 🔄 동기화 시작...")
        last_sync = load_last_sync_time()

        # 1단계: 전체 page_id Diff -> 삭제 감지
        notion_pages = fetch_all_notion_products()
        notion_ids = {p["id"] for p in notion_pages}
        supa_map = get_supabase_page_ids()
        orphan_ids = [pid for pid in supa_map if pid not in notion_ids]
        delete_orphan_rows(orphan_ids)

        # 2단계: 최종 수정 시간 기반 변경분만 UPSERT
        changed = [p for p in notion_pages if p.get("last_edited_time", "") >= last_sync]
        if changed:
            rows = [notion_page_to_supabase_row(p) for p in changed]
            batch_size = 100
            for i in range(0, len(rows), batch_size):
                batch_rows = rows[i:i+batch_size]
                upsert_products(batch_rows)
            print(f"  ✅ 변경 {len(changed)}건 반영 완료")
        else:
            print("  ✅ 변경 사항 없음")

        save_last_sync_time()
    except Exception as e:
        msg = f"sync_once 에러: {e}"
        print(f"  ❌ {msg}")
        log_error(msg)

def main():
    print("🚀 노션 상품 동기화 데몬 시작 (5분 간격)")
    while True:
        sync_once()
        time.sleep(POLL_INTERVAL)

if __name__ == "__main__":
    main()
