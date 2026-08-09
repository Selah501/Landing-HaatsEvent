import fitz  # PyMuPDF
import os

def extract_pdf_images(pdf_path, output_dir, prefix):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    print(f"Opening {pdf_path}...")
    doc = fitz.open(pdf_path)
    for i in range(len(doc)):
        page = doc.load_page(i)
        pix = page.get_pixmap(dpi=150) # 150 dpi for decent web quality
        output_path = os.path.join(output_dir, f"{prefix}_page_{i+1}.jpg")
        pix.save(output_path)
        if i % 10 == 0:
            print(f"Processed {i+1} pages...")
    print(f"Finished extracting {len(doc)} pages to {output_dir}")

base_dir = r"c:\dev\전단지이벤트"
catalogs_dir = os.path.join(base_dir, "catalogs")

haatz_pdf = os.path.join(catalogs_dir, "[공유용] 2026 하츠 유통 소매점 카다로그_F.pdf")
himpel_pdf = os.path.join(catalogs_dir, "26년 3월 종합카다로그(대화형).pdf")

output_base = os.path.join(base_dir, "landing", "public", "images", "catalog")

extract_pdf_images(haatz_pdf, os.path.join(output_base, "haatz"), "haatz")
extract_pdf_images(himpel_pdf, os.path.join(output_base, "himpel"), "himpel")
