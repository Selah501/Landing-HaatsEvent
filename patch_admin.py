import os
import re

FILE_PATH = "public/admin.html"

with open(FILE_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add Supabase script
head_tag = '</head>'
supabase_script = '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>\n</head>'
if '@supabase/supabase-js' not in content:
    content = content.replace(head_tag, supabase_script)

# 2. Add Supabase init and replace master_products fetch
old_fetch = r'''    // Load master_products globally
    onValue\(ref\(db, 'master_products'\), \(snapshot\) => \{
        const data = snapshot\.val\(\);
        if\(data\) \{
            window\.currentProducts = Array\.isArray\(data\) \? data : Object\.values\(data\);
            if \(document\.getElementById\('master-tbody'\)\) \{
                renderMasterList\(\);
            \}
        \}
    \}\);'''

new_fetch = '''    // Initialize Supabase
    const SUPABASE_URL = 'https://belchthacupzpgxevecx.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_weMvIv-69PgtXwzGlgweLg_NEJfOACN';
    window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Load master_products globally from Supabase
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
                    price_selling: p.price_selling
                }));
                if (document.getElementById('master-tbody')) {
                    renderMasterList();
                }
            } else if (error) {
                console.error("Supabase fetch error:", error);
            }
        } catch(e) {
            console.error("Supabase fetch exception:", e);
        }
    })();'''

content = re.sub(old_fetch, new_fetch, content)

# 3. Add 'Edit' (수정) button in renderMasterList and JS logic to update
old_render = r'''                    <td data-label="관리" style="text-align:center;">
                        <button class="btn-info" style="padding: 10px; font-size:14px; margin-bottom: 8px; display:block; width:100%;" onclick="openAssignModal\('\$\{prod\.id\}'\)">현장 배정</button>
                        <button class="btn-danger" style="padding: 10px; font-size:14px; display:block; width:100%;" onclick="deleteMasterRow\(\$\{idx\}\)">삭제</button>
                    </td>'''

new_render = '''                    <td data-label="관리" style="text-align:center;">
                        <button class="btn-info" style="padding: 10px; font-size:14px; margin-bottom: 8px; display:block; width:100%;" onclick="openAssignModal('${prod.id}')">현장 배정</button>
                        <button class="btn-primary" style="padding: 10px; font-size:14px; margin-bottom: 8px; display:block; width:100%;" onclick="updateMasterRow(${idx})">수정(저장)</button>
                        <button class="btn-danger" style="padding: 10px; font-size:14px; display:block; width:100%;" onclick="deleteMasterRow(${idx})">삭제</button>
                    </td>'''

content = re.sub(old_render, new_render, content)

# 4. Insert updateMasterRow function
update_func = '''    window.updateMasterRow = async function(idx) {
        const row = document.getElementById(`m-row-${idx}`);
        const prod = window.currentProducts[idx];
        
        const newName = row.querySelector('.m-name').value;
        const newModel = row.querySelector('.m-model').value;
        const newFeatures = row.querySelector('.m-features').value;
        const newDuration = row.querySelector('.m-duration').value;
        const newRemarks = row.querySelector('.m-remarks').value;
        const newPriceText = row.querySelector('.m-defaultPrice').value;
        const newLink = row.querySelector('.m-link').value;
        
        const { data, error } = await window.supabaseClient.from('products').update({
            name: newName,
            model: newModel,
            features: newFeatures,
            default_price_text: newPriceText,
            details: {
                ...prod.details,
                duration: newDuration,
                remarks: newRemarks,
                detailLink: newLink
            }
        }).eq('id', prod.id);
        
        if (error) {
            alert('수정 실패: ' + error.message);
        } else {
            alert('수정되었습니다.');
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
    # insert before window.deleteMasterRow
    content = content.replace('window.deleteMasterRow = function(idx)', update_func + '\n    window.deleteMasterRow = function(idx)')


with open(FILE_PATH, 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch applied to admin.html successfully.")
