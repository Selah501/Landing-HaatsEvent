import fitz
import os
import json
import re

doc = fitz.open('catalogs/[공유용] 2026 하츠 유통 소매점 카다로그_F.pdf')
out_dir = 'catalog_images'
os.makedirs(out_dir, exist_ok=True)

categories = [
    {"name": "하츠후드 엘리카", "pages": range(20, 29)},
    {"name": "하츠후드 플래티늄", "pages": range(30, 34)},
    {"name": "하츠후드 시스템", "pages": range(50, 59)},
    {"name": "하츠 전기레인지", "pages": range(61, 70)},
    {"name": "하츠 가스레인지", "pages": range(70, 75)},
    {"name": "하츠 수전빌트인", "pages": range(76, 80)},
    {"name": "하츠 씽크볼", "pages": range(80, 94)},
    {"name": "하츠 기타빌트인", "pages": range(96, 106)},
]

# Full pages that should not be sliced horizontally
FULL_PAGES = [33, 61]

results = []

for cat in categories:
    cat_name = cat["name"]
    for printed_page in cat["pages"]:
        idx = printed_page // 2
        is_right = (printed_page % 2 != 0)
        
        page = doc[idx]
        w, h = page.rect.width, page.rect.height
        
        # Determine the column boundaries
        x_min = w / 2 if is_right else 0
        x_max = w if is_right else w / 2
        
        # Get all text blocks
        blocks = page.get_text('dict')['blocks']
        text_blocks = []
        for b in blocks:
            if b['type'] == 0:
                text = ''
                max_size = 0
                for l in b['lines']:
                    for s in l['spans']:
                        text += s['text'] + ' '
                        if s['size'] > max_size:
                            max_size = s['size']
                
                x, y = b['bbox'][0], b['bbox'][1]
                # Only consider blocks in this column
                if x_min <= x + (b['bbox'][2]-b['bbox'][0])/2 <= x_max:
                    text_blocks.append({
                        'x': x,
                        'y': y,
                        'text': text.strip(),
                        'size': round(max_size, 1),
                        'bbox': b['bbox']
                    })

        # Find product titles (size between 18.0 and 23.0)
        titles = []
        for b in text_blocks:
            if 18.0 <= b['size'] <= 23.0:
                # ignore some banner texts
                txt = b['text'].strip()
                if not txt or '본 카타로그' in txt or 'SYSTEM' in txt or 'ELECTRIC' in txt or 'COOKTOP' in txt:
                    continue
                if 'WALL MOUNTED' in txt or 'ISLAND' in txt or 'BUILT-IN' in txt or '연동 시스템' in txt:
                    continue
                # If there are duplicate titles at roughly same Y, skip
                if any(abs(t['y'] - b['y']) < 20 for t in titles):
                    continue
                titles.append(b)

        titles.sort(key=lambda b: b['y'])
        
        if not titles:
            continue

        if printed_page in FULL_PAGES:
            titles = [titles[0]]

        for i, t in enumerate(titles):
            # Find the model name (size ~9.5) directly below this title
            model_name = ""
            for b in text_blocks:
                if 8.5 <= b['size'] <= 11.5:
                    if b['y'] > t['y'] and (i == len(titles)-1 or b['y'] < titles[i+1]['y']):
                        model_txt = b['text'].strip()
                        if 'W ' in model_txt and 'D ' in model_txt: continue
                        if '연동 시스템' in model_txt or '전기쿡탑' in model_txt or '가스쿡탑' in model_txt: continue
                        
                        if len(model_txt) < 30 and 'kg' not in model_txt and '본 카타로그' not in model_txt:
                            model_name = model_txt
                            break
            
            # Determine crop box
            crop_y_min = t['y'] - 30
            if crop_y_min < 0: crop_y_min = 0
            if i == 0 and printed_page in FULL_PAGES:
                crop_y_min = 0
            
            if i < len(titles) - 1:
                crop_y_max = titles[i+1]['y'] - 30
            else:
                crop_y_max = h
                
            crop_rect = fitz.Rect(x_min, crop_y_min, x_max, crop_y_max)
            
            product_name = t['text'].replace('\n', ' ').strip()
            product_name = re.sub(r'^[\d\.]+\s*(kg)\s*[\d\.]*\s*(W)\s*', '', product_name)
            
            full_name = f"{product_name} {model_name}".strip()
            
            img_filename = f'catalog_{cat_name.replace(" ", "_")}_p{printed_page}_{i}.png'
            img_path = os.path.join(out_dir, img_filename)
            
            pix = page.get_pixmap(clip=crop_rect, dpi=150)
            pix.save(img_path)
            
            results.append({
                'name': full_name,
                'model': model_name,
                'category': cat_name,
                'image_path': img_path,
                'image_file': img_filename,
                'printed_page': printed_page
            })

with open('extracted_all.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print(f"Extracted {len(results)} products.")
