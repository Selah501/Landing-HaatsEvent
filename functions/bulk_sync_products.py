# =====================================================================
# bulk_sync_products.py
# 목적: Notion 상품 마스터 DB -> Supabase products 테이블 1회성 전체 동기화
# 실행 전 notion_sync_daemon.py 가 떠 있다면 반드시 종료 후 실행할 것
# =====================================================================

import os, re, time, json
import requests
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(env_path)

NOTION_TOKEN   = os.getenv("NOTION_API_KEY")
NOTION_DB_ID   = os.getenv("NOTION_DB_PRODUCT").replace("-", "")
SUPABASE_URL   = "https://belchthacupzpgxevecx.supabase.co"
# 반드시 Service Role Key로 교체
SUPABASE_KEY   = os.getenv("SUPABASE_SERVICE_KEY", "키를_.env에_SUPABASE_SERVICE_KEY로_넣어주세요")

NOTION_HEADERS = {
    "Authorization": f"Bearer {NOTION_TOKEN}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json"
}

SUPA_HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates"  # UPSERT를 위해 필요
}

def fetch_all_notion_products():
    """노션 DB에서 전체 상품 목록 페이지네이션으로 수집"""
    all_pages = []
    has_more = True
    next_cursor = None
    while has_more:
        body = {"page_size": 100}
        if next_cursor:
            body["start_cursor"] = next_cursor
        res = requests.post(
            f"https://api.notion.com/v1/databases/{NOTION_DB_ID}/query",
            headers=NOTION_HEADERS,
            json=body
        )
        if res.status_code != 200:
            print("Notion API 에러:", res.text)
            break
        data = res.json()
        all_pages.extend(data.get("results", []))
        has_more = data.get("has_more", False)
        next_cursor = data.get("next_cursor")
    return all_pages

def notion_page_to_supabase_row(page):
    """
    Notion 페이지 속성 -> Supabase products 테이블 행 변환
    """
    props = page.get("properties", {})
    def get_text(prop_name):
        prop = props.get(prop_name, {})
        t = prop.get("type")
        if t == "title":
            return "".join([r["plain_text"] for r in prop.get("title", [])])
        if t == "rich_text":
            return "".join([r["plain_text"] for r in prop.get("rich_text", [])])
        if t == "select":
            sel = prop.get("select")
            return sel["name"] if sel else None
        if t == "number":
            return prop.get("number")
        return None

    return {
        "id":             page["id"],
        "notion_page_id": page["id"],
        "name":           get_text("제품명"),
        "model":          get_text("모델명"),
        "brand":          get_text("브랜드"),
        "category":       get_text("대분류"),
        "price_purchase": get_text("매입가(원가)"),
        "price_selling":  get_text("최종판매가"),
        "price_online":   get_text("인터넷가(배송비포함)"),
        "price_local":    get_text("타업체추정가"),
        "last_synced_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }

def get_supabase_page_ids():
    """Supabase에서 현재 저장된 notion_page_id 목록 조회"""
    res = requests.get(
        f"{SUPABASE_URL}/rest/v1/products?select=id,notion_page_id",
        headers=SUPA_HEADERS
    )
    if res.status_code == 200:
        return {row["notion_page_id"]: row["id"] for row in res.json() if row.get("notion_page_id")}
    return {}

def delete_orphan_rows(orphan_page_ids):
    """Notion에서 삭제된 레코드를 Supabase에서도 일괄 삭제"""
    if not orphan_page_ids:
        return
    # Supabase REST API의 in 필터 사용
    ids_param = ",".join(orphan_page_ids)
    res = requests.delete(
        f'{SUPABASE_URL}/rest/v1/products?notion_page_id=in.("{ids_param}")',
        headers=SUPA_HEADERS
    )
    print(f"🗑️ 고아 레코드 {len(orphan_page_ids)}개 삭제 완료")

def upsert_products(rows):
    """Supabase에 상품 데이터 UPSERT (notion_page_id 기준으로 중복 방지)"""
    res = requests.post(
        f"{SUPABASE_URL}/rest/v1/products",
        headers={**SUPA_HEADERS, "Prefer": "resolution=merge-duplicates"},
        json=rows
    )
    if res.status_code not in [200, 201]:
        print("Supabase UPSERT 실패:", res.text)
    return res.status_code

def main():
    if SUPABASE_KEY == "키를_.env에_SUPABASE_SERVICE_KEY로_넣어주세요":
        print("❌ .env 파일에 SUPABASE_SERVICE_KEY가 없습니다. 먼저 추가해주세요.")
        return

    print("📥 Notion에서 전체 상품 데이터 수집 중...")
    notion_pages = fetch_all_notion_products()
    print(f"-> 총 {len(notion_pages)}개 항목 수집 완료")

    print("📋 Supabase 현재 상태 조회 중...")
    supa_map = get_supabase_page_ids()
    print(f"-> Supabase 현재 레코드: {len(supa_map)}개")

    notion_page_id_set = {p["id"] for p in notion_pages}
    orphan_ids = [pid for pid in supa_map if pid not in notion_page_id_set]
    print(f"-> 고아 레코드(삭제 대상): {len(orphan_ids)}개")

    delete_orphan_rows(orphan_ids)

    rows = [notion_page_to_supabase_row(p) for p in notion_pages]
    print(f"⬆️ Supabase에 {len(rows)}개 UPSERT 중...")
    
    # Supabase API는 한 번에 너무 많은 행을 보내면 안될 수 있으므로, 100개씩 나눠서 전송
    batch_size = 100
    for i in range(0, len(rows), batch_size):
        batch_rows = rows[i:i+batch_size]
        status = upsert_products(batch_rows)
        if status not in [200, 201]:
            print(f"❌ UPSERT 실패. (배치 {i}~{i+batch_size})")
            return
            
    print(f"✅ 동기화 완료! {len(rows)}개 레코드가 Supabase에 정상 반영됨")

if __name__ == "__main__":
    main()
