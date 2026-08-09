import urllib.request
import json

url = "https://belchthacupzpgxevecx.supabase.co/rest/v1/"
headers = {
    "apikey": "sb_publishable_weMvIv-69PgtXwzGlgweLg_NEJfOACN",
    "Authorization": "Bearer sb_publishable_weMvIv-69PgtXwzGlgweLg_NEJfOACN"
}
req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        print(data)
except Exception as e:
    print(f"Error: {e}")
