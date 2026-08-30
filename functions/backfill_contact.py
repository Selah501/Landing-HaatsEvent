import requests
import re
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from crm_shared import extract_phone_from_filename, extract_caller_name_from_filename

RTDB_URL = "https://flyer-event-page-2026-default-rtdb.firebaseio.com/crm_pending.json"

def main():
    print("Fetching CRM data from Firebase...")
    resp = requests.get(RTDB_URL)
    if resp.status_code != 200:
        print(f"Failed to fetch data: {resp.text}")
        return

    data = resp.json()
    if not data:
        print("No data found.")
        return

    updated_count = 0
    for key, item in data.items():
        contact = item.get("contact_info", "")
        filename = item.get("filename", "")
        
        if not contact or str(contact).lower() in ("null", "none", "", "없음", "n/a"):
            if not filename:
                continue
                
            pre_phone = extract_phone_from_filename(filename)
            pre_name = extract_caller_name_from_filename(filename)
            pre_contact = pre_phone or pre_name
            
            if pre_contact:
                print(f"[{key}] Found missing contact for filename '{filename}'. Extracted: {pre_contact}")
                update_url = f"https://flyer-event-page-2026-default-rtdb.firebaseio.com/crm_pending/{key}/contact_info.json"
                
                # Update specific field
                res = requests.put(update_url, json=pre_contact)
                if res.status_code == 200:
                    print(f"  -> Successfully updated.")
                    updated_count += 1
                else:
                    print(f"  -> Failed to update: {res.text}")

    print(f"Backfill complete! Updated {updated_count} items.")

if __name__ == "__main__":
    main()
