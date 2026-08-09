import fitz

doc = fitz.open('catalogs/[공유용] 2026 하츠 유통 소매점 카다로그_F.pdf')
for pno in [30, 38, 42]:
    page = doc[pno]
    blocks = page.get_text('dict')['blocks']
    print(f'--- Page {pno} (Printed {pno*2}) ---')
    for b in blocks:
        if b['type'] == 0:
            text = ''
            max_size = 0
            for l in b['lines']:
                for s in l['spans']:
                    text += s['text'] + ' '
                    if s['size'] > max_size:
                        max_size = s['size']
            if max_size > 14:
                print(f"[{b['bbox'][0]:.0f}, {b['bbox'][1]:.0f}] size: {max_size:.1f} text: {text.strip()}")
