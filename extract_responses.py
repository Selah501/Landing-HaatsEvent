import json

log_path = r"C:\Users\user\.gemini\antigravity-ide\brain\9df1e9ee-af7b-48e8-ab22-010d15abefde\.system_generated\logs\transcript_full.jsonl"
out_path = r"C:\dev\전단지이벤트\landing\extracted_responses.txt"

output = []
with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            obj = json.loads(line)
            if obj.get('type') == 'TOOL_RESPONSE':
                text = obj.get('output', '')
                if text and len(text) > 500:
                    output.append(f"--- LENGTH {len(text)} ---\n{text[:5000]}\n")
        except:
            pass

with open(out_path, 'w', encoding='utf-8') as out:
    out.write('\n'.join(output))

print(f"Extracted to {out_path}")
