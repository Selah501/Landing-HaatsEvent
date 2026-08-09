import re

def count_models(file_path, brand):
    with open(file_path, 'r', encoding='utf-8') as f:
        text = f.read()

    # Model numbers usually have English letters, numbers, and hyphens. 
    # e.g., HSH-90WHCI, HRH90S, HDH-90S
    # Let's find patterns like 2-5 uppercase letters, optional hyphen, numbers, optional letters.
    pattern = r'\b[A-Z]{2,5}-?\d+[A-Z0-9-]*\b'
    matches = re.findall(pattern, text)
    
    # Filter out obvious non-models (like "NEW-2026", "PAGE-1")
    models = set()
    for m in matches:
        if "PAGE" not in m and "NEW" not in m and len(m) >= 4:
            models.add(m)
            
    print(f"[{brand}] Potential unique models found: {len(models)}")
    # Print first 20 for sanity check
    print(list(models)[:20])
    
count_models("haatz_text.txt", "Haatz")
count_models("himpel_text.txt", "Himpel")
