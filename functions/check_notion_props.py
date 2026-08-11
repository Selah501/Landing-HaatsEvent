import os
import requests
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(env_path)

NOTION_TOKEN = os.getenv("NOTION_API_KEY")
NOTION_DB_ID = os.getenv("NOTION_DB_PRODUCT").replace("-", "")

headers = {
    "Authorization": f"Bearer {NOTION_TOKEN}",
    "Notion-Version": "2022-06-28"
}

res = requests.get(f"https://api.notion.com/v1/databases/{NOTION_DB_ID}", headers=headers)
if res.status_code == 200:
    data = res.json()
    props = data.get("properties", {})
    with open("props.txt", "w", encoding="utf-8") as f:
        for k, v in props.items():
            f.write(f"Property Name: {k}, Type: {v['type']}\n")
    print("Saved to props.txt")
else:
    print("Error:", res.text)

