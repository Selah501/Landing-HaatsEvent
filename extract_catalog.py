import fitz
import os
import re
import json

doc = fitz.open('catalogs/[공유용] 2026 하츠 유통 소매점 카다로그_F.pdf')
out_dir = 'catalog_images'
os.makedirs(out_dir, exist_ok=True)

# pages 35 to 48 (indices 34 to 47)
# 14 pages total
results = []
for pno in range(34, 48):
    page = doc[pno]
    w, h = page.rect.width, page.rect.height
    
    quads = [
        ('top_left', fitz.Rect(0, 0, w/2, h/2)),
        ('top_right', fitz.Rect(w/2, 0, w, h/2)),
        ('bottom_left', fitz.Rect(0, h/2, w/2, h)),
        ('bottom_right', fitz.Rect(w/2, h/2, w, h)),
    ]
    
    for name, rect in quads:
        if (pno == 34 or pno == 38) and 'top' in name:
            continue # Skip top of page 35 and 39
            
        text = page.get_textbox(rect).strip()
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        if not lines:
            continue
            
        # filter out icon texts like "13 kg", "95 W", "220V/60Hz"
        clean_lines = []
        for line in lines:
            if re.match(r'^[\d\.]+\s*(kg|W|V|Hz|A|mm|cm)', line):
                continue
            if 'GOOD DESIGN' in line:
                continue
            if line == 'KOREA':
                continue
            clean_lines.append(line)
            
        if len(clean_lines) >= 2:
            product_name = clean_lines[0]
            model_name = clean_lines[1]
        elif len(clean_lines) == 1:
            product_name = clean_lines[0]
            model_name = ""
        else:
            product_name = "알수없음"
            model_name = ""
            
        # Clean up model name
        if model_name and len(model_name) > 30:
             model_name = clean_lines[1][:30]
             
        # Render image
        pix = page.get_pixmap(clip=rect, dpi=150)
        img_filename = f'page_{pno+1}_{name}.png'
        img_path = os.path.join(out_dir, img_filename)
        pix.save(img_path)
        
        results.append({
            'product_name': product_name,
            'model': model_name,
            'image_path': img_path,
            'image_file': img_filename,
            'page': pno + 1,
            'quad': name
        })

with open('extracted_catalog.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)
print(f"Extracted {len(results)} products.")
