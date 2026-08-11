import os
import requests
from dotenv import load_dotenv

load_dotenv()
SUPABASE_URL = "https://belchthacupzpgxevecx.supabase.co"
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

res = requests.delete(
    f"{SUPABASE_URL}/rest/v1/products?notion_page_id=is.null",
    headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
)

if res.status_code in [200, 204]:
    print("Deleted all records where notion_page_id is null.")
else:
    print("Error:", res.text)
