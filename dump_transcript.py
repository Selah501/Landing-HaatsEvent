import json

log_path = r"C:\Users\user\.gemini\antigravity-ide\brain\9df1e9ee-af7b-48e8-ab22-010d15abefde\.system_generated\logs\transcript_full.jsonl"
out_path = r"C:\dev\전단지이벤트\landing\transcript_dump.txt"

output = []
with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            obj = json.loads(line)
            t = obj.get('type')
            if t == 'EPHEMERAL_MESSAGE':
                continue
            
            output.append(f"----- {obj.get('source')} - {t} -----")
            if 'content' in obj:
                content = obj['content']
                if len(content) > 1000:
                    output.append(content[:500] + "\n...[TRUNCATED]...\n" + content[-500:])
                else:
                    output.append(content)
            if 'output' in obj:
                text = obj['output']
                if len(text) > 20000:
                    output.append(text[:10000] + "\n...[TRUNCATED_OUT]...\n" + text[-10000:])
                else:
                    output.append(text)
            if 'tool_calls' in obj:
                output.append(json.dumps(obj['tool_calls'], ensure_ascii=False))
            output.append("\n")
        except Exception:
            pass

with open(out_path, 'w', encoding='utf-8') as out:
    out.write('\n'.join(output))

print(f"Extracted to {out_path}")
