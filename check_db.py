import urllib.request
import json

try:
    resp = urllib.request.urlopen('https://flyer-event-page-2026-default-rtdb.firebaseio.com/reservations.json')
    data = json.loads(resp.read())
    
    if data:
        print(f"Total days: {len(data)}")
        total_slots = sum(len(d) for d in data.values() if isinstance(d, dict))
        print(f"Total slots: {total_slots}")
        
        # 예약 ID 기준으로 중복 체크
        res_ids = set()
        for day, slots in data.items():
            if not isinstance(slots, dict): continue
            for time, slot_data in slots.items():
                if isinstance(slot_data, dict):
                    rid = slot_data.get('reservationId')
                    if rid:
                        res_ids.add(rid)
        print(f"Unique Reservation IDs: {len(res_ids)}")
    else:
        print("No data found")
except Exception as e:
    print(f"Error: {e}")
