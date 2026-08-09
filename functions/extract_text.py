import fitz
import os

base_dir = r"c:\dev\전단지이벤트\catalogs"
haatz_pdf = os.path.join(base_dir, "[공유용] 2026 하츠 유통 소매점 카다로그_F.pdf")
himpel_pdf = os.path.join(base_dir, "26년 3월 종합카다로그(대화형).pdf")

def extract_text(pdf_path, out_txt):
    if not os.path.exists(pdf_path):
        print(f"File not found: {pdf_path}")
        return
    doc = fitz.open(pdf_path)
    with open(out_txt, "w", encoding="utf-8") as f:
        for i, page in enumerate(doc):
            text = page.get_text("text")
            f.write(f"--- PAGE {i+1} ---\n")
            f.write(text + "\n")
    print(f"Extracted text to {out_txt}")

extract_text(haatz_pdf, "haatz_text.txt")
extract_text(himpel_pdf, "himpel_text.txt")
