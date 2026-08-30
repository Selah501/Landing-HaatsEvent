import json
import io

with io.open(r'C:\Users\user\.gemini\antigravity-ide\brain\c67677b7-17c8-4db6-a2e7-5ab4d4a06d8b\.system_generated\logs\transcript.jsonl', encoding='utf-8') as f:
    inputs = [json.loads(line).get('content', '') for line in f if json.loads(line).get('type') == 'USER_INPUT']
    
with io.open('c67677b7_inputs.txt', 'w', encoding='utf-8') as out:
    out.write('\n\n---NEXT---\n\n'.join(inputs))
