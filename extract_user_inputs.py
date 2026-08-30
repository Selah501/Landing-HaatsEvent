import json
import glob
import os

def extract_user_inputs():
    brains_dir = r"C:\Users\user\.gemini\antigravity-ide\brain"
    conversations = glob.glob(os.path.join(brains_dir, "*", ".system_generated", "logs", "transcript.jsonl"))
    
    with open("extracted_user_inputs.txt", "w", encoding="utf-8") as out:
        for conv in conversations:
            out.write(f"\n\n--- Conversation: {conv} ---\n")
            try:
                with open(conv, "r", encoding="utf-8") as f:
                    for line in f:
                        try:
                            data = json.loads(line)
                            if data.get("type") == "USER_INPUT":
                                out.write(f"{data.get('created_at')}: {data.get('content')}\n")
                        except:
                            pass
            except Exception as e:
                out.write(f"Error reading file: {e}\n")

extract_user_inputs()
