import json

log_path = r"C:\Users\user\.gemini\antigravity-ide\brain\9df1e9ee-af7b-48e8-ab22-010d15abefde\.system_generated\logs\transcript_full.jsonl"
out_path = r"C:\dev\전단지이벤트\landing\extracted_transcript_diff.txt"

output = []
try:
    with open(log_path, 'r', encoding='utf-8') as f:
        for line in f:
            obj = json.loads(line)
            content = obj.get('content', '')
            output_text = obj.get('output', '')
            if 'admin_v2.html' in content or 'admin_v2.html' in output_text or 'diff' in content or 'git' in content:
                # Let's save the steps that are relevant
                output.append(f"Step {obj.get('step_index')}: {obj.get('source')} - {obj.get('type')}")
                if output_text:
                    output.append(output_text[:2000] + "\n...[truncated]...\n")
                elif content:
                    output.append(content[:2000] + "\n...[truncated]...\n")
                if 'tool_calls' in obj:
                    output.append(json.dumps(obj['tool_calls'], ensure_ascii=False)[:2000] + "\n")
                
    with open(out_path, 'w', encoding='utf-8') as out:
        out.write('\n'.join(output))
    print(f"Extracted to {out_path}")
except Exception as e:
    print(f"Error: {e}")
