import re

file_path = "public/admin.html"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add Supabase script
head_tag = '</head>'
supabase_script = '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>\n</head>'
if '@supabase/supabase-js' not in content:
    content = content.replace(head_tag, supabase_script)

# 2. Add Supabase init and replace master_products fetch
old_fetch = r'''window\.currentProducts = \[\];'''
new_fetch = '''window.currentProducts = [];
    
    const SUPABASE_URL = 'https://belchthacupzpgxevecx.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_weMvIv-69PgtXwzGlgweLg_NEJfOACN';
    window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
'''
if 'window.supabaseClient' not in content:
    content = re.sub(old_fetch, new_fetch, content)

# 3. Replace Firebase fetch for products with Supabase fetch
old_db_fetch = r'''window\.currentProducts = data\.products \|\| \[\];'''
new_db_fetch = '''// window.currentProducts = data.products || []; // Now loaded from Supabase below'''
content = re.sub(old_db_fetch, new_db_fetch, content)

supabase_load = '''
    // Load products from Supabase
    (async () => {
        try {
            const { data, error } = await window.supabaseClient.from('products').select('*').order('name');
            if (data) {
                window.currentProducts = data.map(p => ({
                    id: p.id,
                    name: p.name,
                    model: p.model,
                    features: p.features,
                    duration: (p.details && p.details.duration) ? p.details.duration : '',
                    remarks: (p.details && p.details.remarks) ? p.details.remarks : '',
                    defaultPriceText: p.default_price_text,
                    detailLink: (p.details && p.details.detailLink) ? p.details.detailLink : '',
                    brandCategory: p.brand || p.category,
                    category: p.category,
                    price_purchase: p.price_purchase,
                    price_selling: p.price_selling,
                    costPrice: p.price_purchase,
                    sellPrice: p.price_selling
                }));
                if (document.getElementById('master-tbody')) {
                    renderMasterList();
                }
            }
        } catch(e) {
            console.error("Supabase fetch error:", e);
        }
    })();
'''
if '// Load products from Supabase' not in content:
    # insert before window.renderMasterList = function() {
    content = content.replace('window.renderMasterList = function() {', supabase_load + '\n    window.renderMasterList = function() {')


# 4. Add 'Edit' button in renderMasterList
old_render = r'''<tr>\s*<td><input type="text" class="m-name" value="\$\{prod\.name\}"></td>'''
new_render = '''<tr id="m-row-${idx}">
                    <td><input type="text" class="m-name" value="${prod.name}"></td>'''
content = re.sub(old_render, new_render, content)

old_btn = r'''<button class="btn-danger" style="padding: 6px 12px; font-size:12px;" onclick="deleteMasterRow\(\$\{idx\}\)">삭제</button>'''
new_btn = '''<button class="btn-primary" style="padding: 6px 12px; font-size:12px; margin-bottom: 4px; display:block; width:100%;" onclick="updateMasterRow(${idx})">수정(저장)</button>
                        <button class="btn-danger" style="padding: 6px 12px; font-size:12px; display:block; width:100%;" onclick="deleteMasterRow(${idx})">삭제</button>'''
content = re.sub(old_btn, new_btn, content)

# 5. Add updateMasterRow function
update_func = '''
    window.updateMasterRow = async function(idx) {
        const row = document.getElementById(`m-row-${idx}`);
        const prod = window.currentProducts[idx];
        
        const newName = row.querySelector('.m-name').value;
        const newModel = row.querySelector('.m-model').value;
        const newFeatures = row.querySelector('.m-features').value;
        const newDuration = row.querySelector('.m-duration').value;
        const newRemarks = row.querySelector('.m-remarks').value;
        const newPriceText = row.querySelector('.m-defaultPrice').value;
        const newLink = row.querySelector('.m-link').value;
        
        // If prod.id is missing (newly added row), we generate one
        if (!prod.id) {
            prod.id = 'prod_' + Date.now();
        }
        
        const { data, error } = await window.supabaseClient.from('products').upsert({
            id: prod.id,
            name: newName,
            model: newModel,
            features: newFeatures,
            default_price_text: newPriceText,
            category: prod.category || '기타카테고리',
            brand: prod.brandCategory || '기타',
            price_purchase: prod.price_purchase || 0,
            price_selling: prod.price_selling || 0,
            details: {
                ...prod.details,
                duration: newDuration,
                remarks: newRemarks,
                detailLink: newLink
            }
        });
        
        if (error) {
            alert('수정 실패: ' + error.message);
        } else {
            alert('수정되었습니다!');
            prod.name = newName;
            prod.model = newModel;
            prod.features = newFeatures;
            prod.duration = newDuration;
            prod.remarks = newRemarks;
            prod.defaultPriceText = newPriceText;
            prod.detailLink = newLink;
        }
    };
'''
if 'window.updateMasterRow = ' not in content:
    content = content.replace('window.deleteMasterRow = function(idx) {', update_func + '\n    window.deleteMasterRow = function(idx) {')


# 6. Remove Firebase sync for products in syncToServer
old_sync = r'''set\(ref\(db, '/products'\), window\.currentProducts\);'''
new_sync = '''// set(ref(db, '/products'), window.currentProducts); // Now handled by individual save buttons for Supabase'''
content = re.sub(old_sync, new_sync, content)


with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("admin.html patched!")
