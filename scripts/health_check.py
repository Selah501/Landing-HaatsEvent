import os
import json
import re
import subprocess
import tempfile
import requests
from dotenv import load_dotenv

load_dotenv(r"c:\dev\전단지이벤트\landing\functions\.env")
SUPABASE_URL = "https://belchthacupzpgxevecx.supabase.co"
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
FIREBASE_BASE = "https://flyer-event-page-2026-default-rtdb.firebaseio.com"

PUBLIC_DIR = r"c:\dev\전단지이벤트\landing\public"
HTML_FILES = ["index.html", "admin.html", "admin_v2.html", "product_master.html", "erp.html", "reservation_v2.html", "apt_db.html", "photo_gallery.html"]

def check_js_syntax():
    print("=== 1. HTML 내 JavaScript 문법 검사 ===")
    errors = 0
    for fname in HTML_FILES:
        fpath = os.path.join(PUBLIC_DIR, fname)
        if not os.path.exists(fpath):
            continue
        with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
            html = f.read()
        scripts = re.findall(r"<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>", html, re.S | re.I)
        for idx, sc in enumerate(scripts):
            with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8") as tf:
                tf.write(sc)
                tpath = tf.name
            res = subprocess.run(["node", "--check", tpath], capture_output=True, text=True)
            os.remove(tpath)
            if res.returncode != 0:
                print(f"  [FAIL] {fname} (script #{idx+1}): {res.stderr.strip()}")
                errors += 1
        if errors == 0:
            print(f"  [OK] {fname} ({len(scripts)} inline scripts)")
    return errors

def check_db_integrity():
    print("\n=== 2. Supabase <-> Firebase 이벤트 상품 참조 무결성 검사 ===")
    headers = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
    prods = requests.get(f"{SUPABASE_URL}/rest/v1/products?select=id,name,is_active,is_set", headers=headers, timeout=15).json()
    prod_map = {p["id"]: p for p in prods}

    events = requests.get(f"{FIREBASE_BASE}/events.json", timeout=15).json() or []
    ev_list = events if isinstance(events, list) else list(events.values())

    missing = []
    for ev in ev_list:
        if not isinstance(ev, dict): continue
        if ev.get("status") == "ended": continue
        for p in (ev.get("mainProducts") or []) + (ev.get("addonProducts") or []):
            pid = p.get("id")
            if pid and pid not in prod_map:
                missing.append((ev.get("title"), pid))

    print(f"  Supabase 총 상품: {len(prods)}건 (판매중: {sum(1 for p in prods if p.get('is_active'))}건)")
    if missing:
        print(f"  [WARN] 진행중 이벤트 내 누락 상품 ID: {missing}")
    else:
        print("  [OK] 진행중 이벤트 참조 상품 누락 0건")
    return len(missing)

def check_live_urls():
    print("\n=== 3. 라이브 호스팅 HTTP 상태 검사 ===")
    base = "https://flyer-event-page-2026.web.app"
    fail = 0
    for fname in HTML_FILES:
        url = f"{base}/{fname}" if fname != "index.html" else base
        r = requests.get(url, timeout=10)
        status = "OK" if r.status_code == 200 else f"FAIL({r.status_code})"
        if r.status_code != 200: fail += 1
        print(f"  [{status}] {url}")
    return fail

if __name__ == "__main__":
    e1 = check_js_syntax()
    e2 = check_db_integrity()
    e3 = check_live_urls()
    print(f"\n=== HEALTH CHECK SUMMARY: JS={e1}, DB={e2}, LIVE={e3} ===")
    if e1 + e2 + e3 > 0:
        raise SystemExit(1)
