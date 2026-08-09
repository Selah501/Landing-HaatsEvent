import codecs
import re

with codecs.open('c:/dev/전단지이벤트/landing/public/admin_v2.html', 'r', 'utf-8') as f:
    text = f.read()

pattern_populate = r'function populateBrandCategories\(\) \{[\s\S]*?\}'
new_populate = '''function populateBrandCategories() {
            const catSelect = document.getElementById('modal-brand-cat');
            catSelect.innerHTML = '<option value="">-- 분류 선택 --</option>';
            
            const oldCats = ['욕실 환풍기', '환기 시스템', '주방 후드', '주방 가전', '생활 에어가전', '욕실 환기가전', '싱크볼/수전', '빌트인 수전/싱크볼', '가스/전기 쿡탑', '기타'];
            const allDbCats = Array.from(new Set(window.masterProducts.map(p => p.category).filter(Boolean)));
            
            let categoriesToShow = new Set();
            allDbCats.forEach(c => {
                if (!oldCats.includes(c)) {
                    categoriesToShow.add(c);
                }
            });
            categoriesToShow.add('기타카테고리');
            
            let sortedCats = Array.from(categoriesToShow).sort();
            
            sortedCats.forEach(b => {
                catSelect.innerHTML += `<option value="${b}">${b}</option>`;
            });
            document.getElementById('modal-prod-select').innerHTML = '<option value="">-- 먼저 분류를 선택 --</option>';
        }'''

# Replace populateBrandCategories
if re.search(pattern_populate, text):
    text = re.sub(pattern_populate, new_populate, text, count=1)
    print("populateBrandCategories replaced successfully.")
else:
    print("OLD populateBrandCategories NOT FOUND")

pattern_update = r'window\.updateModalProductList = function\(\) \{[\s\S]*?\};\n'
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
        };\n'''

# Replace updateModalProductList
if re.search(pattern_update, text):
    text = re.sub(pattern_update, new_update, text, count=1)
    print("updateModalProductList replaced successfully.")
else:
    print("OLD updateModalProductList NOT FOUND")

with codecs.open('c:/dev/전단지이벤트/landing/public/admin_v2.html', 'w', 'utf-8') as f:
    f.write(text)
