import re
import json

def parse_text(file_path, brand):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    products = []
    seen_models = set()
    
    # Model pattern: e.g., HSH-90WHCI, HRH90S, IH-360S
    model_pattern = re.compile(r'\b[A-Z]{2,5}-?\d+[A-Z0-9-]*\b')
    
    for i, line in enumerate(lines):
        line = line.strip()
        matches = model_pattern.findall(line)
        for m in matches:
            if "PAGE" in m or "NEW" in m or len(m) < 4:
                continue
                
            if m not in seen_models:
                seen_models.add(m)
                
                # Guess name by looking at the previous few lines
                # Usually name is right before the model in the text stream
                name = ""
                for j in range(1, 4):
                    if i - j >= 0:
                        prev = lines[i-j].strip()
                        # Avoid picking up other models or garbage
                        if prev and not model_pattern.search(prev) and "PAGE" not in prev:
                            name = prev
                            break
                if not name:
                    name = m + " (이름 확인 필요)"
                
                # Guess category based on keywords
                category = "기타"
                context = " ".join(lines[max(0, i-5):min(len(lines), i+5)]).lower()
                
                if brand == "하츠":
                    if any(k in context for k in ["후드", "침니", "아일랜드", "허리케인", "hood"]):
                        category = "주방 후드"
                    elif any(k in context for k in ["쿡탑", "인덕션", "가스", "하이브리드", "cooktop", "induction"]):
                        category = "가스/전기 쿡탑"
                    elif any(k in context for k in ["수전", "싱크볼", "사각볼", "faucet", "sink"]):
                        category = "싱크볼/수전"
                elif brand == "힘펠":
                    if any(k in context for k in ["환풍기", "휴젠뜨", "제로크", "플렉스댐퍼"]):
                        category = "욕실 환풍기"
                    elif any(k in context for k in ["환기", "휴벤", "전열교환기"]):
                        category = "환기 시스템"
                    elif any(k in context for k in ["제습", "공기청정"]):
                        category = "생활 에어가전"
                        
                products.append({
                    "id": f"p_{brand.lower()}_{m.lower().replace('-','')}",
                    "brand": brand,
                    "category": category,
                    "name": name,
                    "model": m,
                    "features": "",
                    "defaultPriceText": "상담문의",
                    "isHandled": True
                })
                
    return products

haatz_products = parse_text("haatz_text.txt", "하츠")
himpel_products = parse_text("himpel_text.txt", "힘펠")

all_products = haatz_products + himpel_products
print(f"Total parsed: {len(all_products)} products")

with open("parsed_catalog.json", "w", encoding="utf-8") as f:
    json.dump({"products": all_products}, f, ensure_ascii=False, indent=2)
