import codecs
import re

with codecs.open('c:/dev/전단지이벤트/landing/public/admin_v2.html', 'r', 'utf-8') as f:
    text = f.read()

pattern = r'const b = p\.brand \|\| "기타";\s*const c = p\.category \|\| "기타";\s*let derivedCat = "기타";\s*if \(b\.includes\("하츠"\)\) \{[\s\S]*?\} else if \(b\.includes\("힘펠"\)\) \{[\s\S]*?\}'

new_logic = '''const b = p.brand || "";
                const c = p.category || "";
                let derivedCat = "기타";
                
                if (b.includes("하츠") || c.includes("하츠")) {
                    if (c.includes("후드") || c.includes("엘리카") || c.includes("플래티늄") || c.includes("데코") || c.includes("시스템") || c.includes("가스레인지") || c.includes("전기레인지") || c.includes("빌트인")) derivedCat = "하츠 후드";
                    else if (c.includes("욕실") || c.includes("환풍기")) derivedCat = "하츠 욕실";
                    else if (c.includes("씽크") || c.includes("싱크") || c.includes("수전")) derivedCat = "하츠 씽크";
                    else derivedCat = "하츠 기타";
                } else if (b.includes("힘펠") || c.includes("힘펠")) {
                    if (c.includes("욕실") || c.includes("환풍기")) derivedCat = "힘펠 욕실";
                    else derivedCat = "기타";
                } else if (c.includes("비등록")) {
                    derivedCat = "비등록제품서비스";
                }'''

if re.search(pattern, text):
    text = re.sub(pattern, new_logic, text)
    with codecs.open('c:/dev/전단지이벤트/landing/public/admin_v2.html', 'w', 'utf-8') as f:
        f.write(text)
    print("SUCCESS")
else:
    print("OLD LOGIC NOT FOUND")
