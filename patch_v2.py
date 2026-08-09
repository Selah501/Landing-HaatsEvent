import os
import re

FILE_PATH = "public/admin_v2.html"

with open(FILE_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add Supabase script
head_tag = '</head>'
supabase_script = '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>\n</head>'
if '@supabase/supabase-js' not in content:
    content = content.replace(head_tag, supabase_script)

# 2. Replace onValue fetch with Supabase fetch
old_fetch = r'''        // Load master_products globally
        onValue\(ref\(db, 'master_products'\), \(snapshot\) => \{
            const data = snapshot\.val\(\);
            if\(data\) \{
                window\.masterProducts = Array\.isArray\(data\) \? data : Object\.values\(data\);
            \}
        \}\);'''

new_fetch = '''        // Initialize Supabase
        const SUPABASE_URL = 'https://belchthacupzpgxevecx.supabase.co';
        const SUPABASE_ANON_KEY = 'sb_publishable_weMvIv-69PgtXwzGlgweLg_NEJfOACN';
        window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        // Load master_products globally from Supabase
        (async () => {
            try {
                const { data, error } = await window.supabaseClient.from('products').select('*');
                if (data) {
                    window.masterProducts = data.map(p => ({
                        id: p.id,
                        name: p.name,
                        model: p.model,
                        brandCategory: p.brand || p.category,
                        category: p.category,
                        costPrice: p.price_purchase,
                        sellPrice: p.price_selling,
                        imageUrl: (p.details && p.details.level1 && p.details.level1.images && p.details.level1.images[0]) ? p.details.level1.images[0] : ''
                    }));
                } else if (error) {
                    console.error("Supabase fetch error:", error);
                }
            } catch(e) {
                console.error("Supabase fetch exception:", e);
            }
        })();'''

content = re.sub(old_fetch, new_fetch, content)

# 3. Replace populateBrandCategories
old_cat = r'''        function populateBrandCategories\(\) \{
            const catSelect = document\.getElementById\('modal-brand-cat'\);
            catSelect\.innerHTML = '<option value="">-- 분류 선택 --</option>';
            const brands = new Set\(\);
            window\.masterProducts\.forEach\(p => \{
                const bc = p\.brandCategory \|\| p\.category;
                if\(bc\) brands\.add\(bc\);
            \}\);
            Array\.from\(brands\)\.sort\(\)\.forEach\(b => \{
                catSelect\.innerHTML \+= `<option value="\$\{b\}">\$\{b\}</option>`;
            \}\);
            document\.getElementById\('modal-prod-select'\)\.innerHTML = '<option value="">-- 먼저 분류를 선택 --</option>';
        \}'''

new_cat = '''        const FIXED_CATEGORIES = [
            '하츠후드 엘리카', '하츠후드 플래티늄', '하츠후드 데코', '하츠후드 시스템',
            '하츠 전기레인지', '하츠 가스레인지', '하츠 수전빌트인', '하츠 씽크볼', '하츠 기타빌트인'
        ];

        function populateBrandCategories() {
            const catSelect = document.getElementById('modal-brand-cat');
            catSelect.innerHTML = '<option value="">-- 분류 선택 --</option>';
            
            FIXED_CATEGORIES.forEach(c => {
                catSelect.innerHTML += `<option value="${c}">${c}</option>`;
            });
            catSelect.innerHTML += `<option value="비분류카테고리">비분류카테고리</option>`;
            
            document.getElementById('modal-prod-select').innerHTML = '<option value="">-- 먼저 분류를 선택 --</option>';
        }'''

content = re.sub(old_cat, new_cat, content)

# 4. Replace updateModalProductList
old_update = r'''        window\.updateModalProductList = function\(\) \{
            const cat = document\.getElementById\('modal-brand-cat'\)\.value;
            const pSelect = document\.getElementById\('modal-prod-select'\);
            pSelect\.innerHTML = '<option value="">-- 상품 선택 --</option>';
            
            if\(!cat\) return;
            
            window\.masterProducts\.forEach\(p => \{
                const bc = p\.brandCategory \|\| p\.category;
                if\(bc === cat && p\.name\) \{
                    pSelect\.innerHTML \+= `<option value="\$\{p\.name\}">\$\{p\.name\} \(\$\{p\.model\|\|''\}\)</option>`;
                \}
            \}\);
        \};'''

new_update = '''        window.updateModalProductList = function() {
            const cat = document.getElementById('modal-brand-cat').value;
            const pSelect = document.getElementById('modal-prod-select');
            pSelect.innerHTML = '<option value="">-- 상품 선택 --</option>';
            
            if(!cat) return;
            
            window.masterProducts.forEach(p => {
                const bc = p.category;
                
                let matchesCategory = false;
                if (cat === '비분류카테고리') {
                    matchesCategory = !FIXED_CATEGORIES.includes(bc);
                } else {
                    matchesCategory = (bc === cat);
                }
                
                if (matchesCategory && p.name) {
                    pSelect.innerHTML += `<option value="${p.name}">${p.name} (${p.model||''})</option>`;
                }
            });
        };'''

content = re.sub(old_update, new_update, content)

with open(FILE_PATH, 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch applied to admin_v2.html successfully.")
