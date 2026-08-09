import fitz
import os
import json

doc = fitz.open('catalogs/[공유용] 2026 하츠 유통 소매점 카다로그_F.pdf')
out_dir = 'catalog_images'
os.makedirs(out_dir, exist_ok=True)

results = []

# Index 17 to 23
for pno in range(17, 24):
    page = doc[pno]
    w, h = page.rect.width, page.rect.height
    
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
            text_blocks.append({
                'x': b['bbox'][0],
                'y': b['bbox'][1],
                'text': text.strip(),
                'size': round(max_size, 1)
            })

    quads = {
        'top_left': {'rect': fitz.Rect(0, 0, w/2, h/2), 'name': '', 'model': ''},
        'top_right': {'rect': fitz.Rect(w/2, 0, w, h/2), 'name': '', 'model': ''},
        'bottom_left': {'rect': fitz.Rect(0, h/2, w/2, h), 'name': '', 'model': ''},
        'bottom_right': {'rect': fitz.Rect(w/2, h/2, w, h), 'name': '', 'model': ''},
    }

    # Assign text blocks to quads
    for b in text_blocks:
        x, y = b['x'], b['y']
        quad_name = None
        if x < w/2 and y < h/2: quad_name = 'top_left'
        elif x >= w/2 and y < h/2: quad_name = 'top_right'
        elif x < w/2 and y >= h/2: quad_name = 'bottom_left'
        else: quad_name = 'bottom_right'
        
        # Product name is size 19.0
        if b['size'] == 19.0:
            if not quads[quad_name]['name']: # Take the first one
                quads[quad_name]['name'] = b['text']
        # Model name is size 9.5
        elif b['size'] == 9.5 and quads[quad_name]['name']:
            if not quads[quad_name]['model']: # Take the first one after name
                # some models have weird characters or prefix, clean them
                if len(b['text']) < 30:
                    quads[quad_name]['model'] = b['text']

    for quad_name, data in quads.items():
        if not data['name']:
            continue
            
        # Clean specific bad texts
        if "본 카타로그" in data['name'] or "완벽한 주방" in data['name']:
            continue

        product_name = data['name'].replace('\n', ' ').strip()
        model_name = data['model'].replace('\n', ' ').strip()
        
        # Merge product and model as requested
        full_name = f"{product_name} {model_name}".strip()
        
        rect = data['rect']
        pix = page.get_pixmap(clip=rect, dpi=150)
        img_filename = f'deco_page_{pno}_{quad_name}.png'
        img_path = os.path.join(out_dir, img_filename)
        pix.save(img_path)
        
        results.append({
            'name': full_name,
            'model': model_name,
            'category': '하츠후드 데코',
            'image_path': img_path,
            'image_file': img_filename,
            'page': pno
        })

with open('extracted_deco.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)
print(f"Extracted {len(results)} products for DECO.")
