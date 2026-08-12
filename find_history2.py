import os
import json
import glob
from datetime import datetime

history_dirs = [
    os.path.expandvars(r"%APPDATA%\Cursor\User\History"),
    os.path.expandvars(r"%APPDATA%\Code\User\History")
]

results = []

for history_dir in history_dirs:
    if not os.path.exists(history_dir):
        continue
    print(f"Scanning {history_dir}...")
    for entry_json in glob.glob(os.path.join(history_dir, "*", "entries.json")):
        try:
            with open(entry_json, 'r', encoding='utf-8') as f:
                data = json.load(f)
                file_uri = data.get('resource', '')
                if 'admin_v2.html' in file_uri or 'admin.html' in file_uri or 'erp.html' in file_uri or 'reservation_v2.html' in file_uri:
                    folder_path = os.path.dirname(entry_json)
                    entries = data.get('entries', [])
                    for entry in entries:
                        timestamp = entry.get('timestamp')
                        id_val = entry.get('id')
                        dt = datetime.fromtimestamp(timestamp / 1000.0)
                        results.append({
                            'file': file_uri,
                            'time': dt,
                            'path': os.path.join(folder_path, id_val)
                        })
        except Exception as e:
            pass

results.sort(key=lambda x: x['time'], reverse=True)
print(f"Found {len(results)} backups.")
for r in results[:20]:
    print(f"{r['time']} - {r['file']} - {r['path']}")
