import fitz
import psycopg2
import os

pdf_haatz = r"C:\Users\user\.gemini\antigravity-ide\brain\d1a64dd4-4ea3-464d-b20b-1b118e6e30fd\.tempmediaStorage\media_d1a64dd4-4ea3-464d-b20b-1b118e6e30fd_1785810344587.pdf"
pdf_himpel = r"C:\Users\user\.gemini\antigravity-ide\brain\d1a64dd4-4ea3-464d-b20b-1b118e6e30fd\.tempmediaStorage\media_d1a64dd4-4ea3-464d-b20b-1b118e6e30fd_1785810409646.pdf"

conn = psycopg2.connect("postgresql://postgres.belchthacupzpgxevecx:lSUR7jziVlaqSAEz@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres")
cur = conn.cursor()
cur.execute("SELECT model FROM products WHERE model IS NOT NULL AND model != '-'")
models = [r[0] for r in cur.fetchall()]
print(f"Total models in DB: {len(models)}")

doc = fitz.open(pdf_haatz)
print(f"Haatz Pages: {len(doc)}")
for i in range(19, min(30, len(doc))):  # check pages 20 to 30
    page = doc[i]
    found = []
    for m in models:
        rects = page.search_for(m)
        if rects:
            found.append((m, rects[0].y0))
    # sort by y0
    found.sort(key=lambda x: x[1])
    if found:
        print(f"Page {i+1}: {[(m, round(y, 1)) for m, y in found]}")
