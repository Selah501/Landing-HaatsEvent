import json
import os

transcripts = [
    r"C:\Users\user\.gemini\antigravity-ide\brain\a921289b-088e-4d78-b663-1dff878fc945\.system_generated\logs\transcript_full.jsonl",
    r"C:\Users\user\.gemini\antigravity-ide\brain\d6541c36-153e-4d09-b8c8-a65e41bc28b0\.system_generated\logs\transcript_full.jsonl",
    r"C:\Users\user\.gemini\antigravity-ide\brain\9df1e9ee-af7b-48e8-ab22-010d15abefde\.system_generated\logs\transcript_full.jsonl"
]

files_of_interest = ['admin.html', 'admin_v2.html', 'erp.html', 'reservation.html', 'reservation_v2.html']

extracted_changes = []

for t_path in transcripts:
    if not os.path.exists(t_path):
        continue
    with open(t_path, 'r', encoding='utf-8') as f:
        for line in f:
            try:
                obj = json.loads(line)
                if 'tool_calls' in obj:
                    for tc in obj['tool_calls']:
                        func = tc.get('function', {})
                        name = func.get('name', '')
                        args = func.get('arguments', '')
                        if 'TargetFile' in args or 'AbsolutePath' in args or 'CommandLine' in args:
                            if any(f in args for f in files_of_interest):
                                extracted_changes.append({
                                    'time': t_path[-60:-40], # just approx
                                    'tool': name,
                                    'args': args
                                })
                if obj.get('type') == 'TOOL_RESPONSE':
                    output = obj.get('output', '')
                    if output and any(f in output[:200] for f in files_of_interest):
                        extracted_changes.append({
                            'tool': 'TOOL_RESPONSE',
                            'output': output[:1000] # save snippet
                        })
            except Exception:
                pass

with open(r"C:\dev\전단지이벤트\landing\ai_edits.json", 'w', encoding='utf-8') as out:
    json.dump(extracted_changes, out, ensure_ascii=False, indent=2)

print(f"Extracted {len(extracted_changes)} tool calls.")
