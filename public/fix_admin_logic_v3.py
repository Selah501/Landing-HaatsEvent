import codecs
import re

with codecs.open('c:/dev/전단지이벤트/landing/public/admin_v2.html', 'r', 'utf-8') as f:
    text = f.read()

pattern_update = r'window\.updateModalProductList = function\(\) \{[\s\S]*?\}\s*\}\);\n        \};'

new_update = '''window.updateModalProductList = function() {
            const cat = document.getElementById('modal-brand-cat').value;
            const pSelect = document.getElementById('modal-prod-select');
            pSelect.innerHTML = '<option value="">-- 상품 선택 --</option>';
            
            if(!cat) return;
            
            const oldCats = ['욕실 환풍기', '환기 시스템', '주방 후드', '주방 가전', '생활 에어가전', '욕실 환기가전', '싱크볼/수전', '빌트인 수전/싱크볼', '가스/전기 쿡탑', '기타'];

            window.masterProducts.forEach(p => {
                const c = p.category || "";
                let derivedCat = "기타카테고리";
                
                if (c && !oldCats.includes(c)) {
                    derivedCat = c;
                }
                
                if (derivedCat === cat) {
                    pSelect.innerHTML += `<option value="${p.name}">${p.name} (${p.model || '-'})</option>`;
                }
            });
        };'''

if re.search(pattern_update, text):
    text = re.sub(pattern_update, new_update, text, count=1)
    with codecs.open('c:/dev/전단지이벤트/landing/public/admin_v2.html', 'w', 'utf-8') as f:
        f.write(text)
    print("SUCCESS")
else:
    print("OLD LOGIC NOT FOUND")
