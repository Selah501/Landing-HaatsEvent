import re
import collections

def analyze_catalog(file_path, brand, categories_keywords):
    with open(file_path, 'r', encoding='utf-8') as f:
        text = f.read()

    pattern = r'\b[A-Z]{2,5}-?\d+[A-Z0-9-]*\b'
    matches = re.findall(pattern, text)
    
    models = set()
    for m in matches:
        if "PAGE" not in m and "NEW" not in m and len(m) >= 4:
            models.add(m)
            
    # Count categories based on keywords in text
    cat_counts = collections.defaultdict(int)
    # Simple naive attribution: each model found might be near a keyword
    # We will just roughly estimate based on overall document keywords
    for cat, keywords in categories_keywords.items():
        count = sum(text.count(kw) for kw in keywords)
        cat_counts[cat] = count
        
    print(f"=== {brand} Catalog ===")
    print(f"Total Unique Models: {len(models)}")
    print(f"Category Keyword Frequency:")
    for cat, count in cat_counts.items():
        print(f"  - {cat}: {count} occurrences")
    print("\n")

haatz_cats = {
    "주방후드 (Hoods)": ["후드", "침니", "아일랜드", "허리케인"],
    "쿡탑/인덕션 (Cooktops)": ["쿡탑", "인덕션", "가스렌지", "하이브리드"],
    "수전/싱크볼 (Sinks)": ["수전", "싱크볼", "사각볼", "백조"],
    "환기시스템 (Ventilation)": ["환기"]
}

himpel_cats = {
    "욕실환풍기/휴젠뜨 (Bathroom)": ["환풍기", "휴젠뜨", "제로크", "플렉스댐퍼"],
    "환기시스템 (Ventilation)": ["환기시스템", "휴벤", "전열교환기"],
    "공기청정/제습기 (Air/Dehumidifier)": ["공기청정", "제습기"]
}

analyze_catalog("haatz_text.txt", "Haatz (하츠)", haatz_cats)
analyze_catalog("himpel_text.txt", "Himpel (힘펠)", himpel_cats)
