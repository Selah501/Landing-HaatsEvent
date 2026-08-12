import re

file_path = "public/admin_v2.html"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update populateBrandCategories
old_populate = r'''function populateBrandCategories\(\) \{
\s*const catSelect = document\.getElementById\('modal-brand-cat'\);
\s*catSelect\.innerHTML = '<option value="">-- [^<]+ --</option>';
\s*const predefinedCategories = \[.*?\];
\s*predefinedCategories\.forEach\(b => \{
\s*catSelect\.innerHTML \+= `<option value="\$\{b\}">\$\{b\}</option>`;
\s*\}\);
\s*document\.getElementById\('modal-prod-select'\)\.innerHTML = '<option value="">-- [^<]+ --</option>';
\s*\}'''

new_populate = '''function populateBrandCategories() {
            const catSelect = document.getElementById('modal-brand-cat');
            catSelect.innerHTML = '<option value="">-- 대분류 선택 --</option>';
            const predefinedCategories = [
                "하츠후드 엘리카", "하츠후드 플래티늄", "하츠후드 데코", "하츠후드 스템", 
                "하츠 전기레인지", "하츠 가스레인지", "하츠 수전빌트인", "하츠 씽크볼", 
                "하츠 기타빌트인", "기타카테고리"
            ];
            predefinedCategories.forEach(b => {
                catSelect.innerHTML += `<option value="${b}">${b}</option>`;
            });
            document.getElementById('modal-prod-select').innerHTML = '<option value="">-- 제품을 먼저 선택하세요 --</option>';
        }'''
content = re.sub(old_populate, new_populate, content, flags=re.DOTALL)

# 2. Update updateModalProductList
old_update = r'''window\.updateModalProductList = function\(\) \{
\s*const cat = document\.getElementById\('modal-brand-cat'\)\.value;
\s*const pSelect = document\.getElementById\('modal-prod-select'\);
\s*pSelect\.innerHTML = '<option value="">-- [^<]+ --</option>';
\s*if\(!cat\) return;
\s*window\.masterProducts\.forEach\(p => \{
\s*const b = p\.brand \|\| ".*?";
\s*const c = p\.category \|\| ".*?";
\s*let derivedCat = ".*?";
.*?if \(p\.brandCategory === cat\) derivedCat = cat;
\s*if\(derivedCat === cat && p\.name\) \{
\s*pSelect\.innerHTML \+= `<option value="\$\{p\.name\}">\$\{p\.name\} \(\$\{p\.model\|\|'.*?'\}\)</option>`;
\s*\}
\s*\}\);
.*?\}'''

new_update = '''window.updateModalProductList = function() {
            const cat = document.getElementById('modal-brand-cat').value;
            const pSelect = document.getElementById('modal-prod-select');
            pSelect.innerHTML = '<option value="">-- 상품 선택 --</option>';
            if(!cat) return;
            
            const validCategories = [
                "하츠후드 엘리카", "하츠후드 플래티늄", "하츠후드 데코", "하츠후드 스템", 
                "하츠 전기레인지", "하츠 가스레인지", "하츠 수전빌트인", "하츠 씽크볼", "하츠 기타빌트인"
            ];
            
            window.masterProducts.forEach(p => {
                let c = p.category || "";
                let derivedCat = "기타카테고리";
                
                if (validCategories.includes(c)) {
                    derivedCat = c;
                }
                
                if(derivedCat === cat && p.name) {
                    pSelect.innerHTML += `<option value="${p.name}">${p.name} (${p.model||'모델명없음'})</option>`;
                }
            });
            
            if (cat === "기타카테고리") {
                pSelect.innerHTML += `<option value="직접입력(메모)">직접입력(메모기재)</option>`;
            }
        }'''
content = re.sub(old_update, new_update, content, flags=re.DOTALL)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("admin_v2.html patched!")
