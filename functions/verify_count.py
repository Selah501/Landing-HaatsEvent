import os
import requests
from dotenv import load_dotenv

load_dotenv()
SUPABASE_URL = "https://belchthacupzpgxevecx.supabase.co"
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

res = requests.get(
    f"{SUPABASE_URL}/rest/v1/products?select=id",
    headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
)

if res.status_code == 200:
    print(f"Supabase products count: {len(res.json())}")
else:
    print("Error:", res.text)
