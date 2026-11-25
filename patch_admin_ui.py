import re

path = r"c:\dev\전단지이벤트\landing\public\admin.html"

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Insert renderProdRow before addMainProduct
render_prod_row = """    window.renderProdRow = function(type, pId, customText, customLink, prod) {
        const isMain = type === 'main';
        const rowId = isMain ? `mainrow-${pId}` : `addonrow-${pId}`;
        const priceId = isMain ? `price-main-${pId}` : `price-addon-${pId}`;
        const linkId = isMain ? `link-main-${pId}` : `link-addon-${pId}`;
        const removeFunc = isMain ? `removeMainProduct('${pId}')` : `removeAddonProduct('${pId}')`;
        const nameStr = prod ? prod.name : pId;
        
        let defaultPrice = customText || '';
        let defaultLink = customLink || '';
        
        // 새로 추가하는 시점 (기존 값이 둘 다 빈 경우)에만 기본값 적용
        if (prod && !customText && !customLink) {
            if (prod.prices && prod.prices.sell_total) {
                defaultPrice = prod.prices.sell_total;
            }
            if (prod.detail_pages && prod.detail_pages.length > 0) {
                defaultLink = `./product.html?id=${pId}&version=${prod.detail_pages[0].id}`;
            } else if (prod.detail_urls && prod.detail_urls.length > 0) {
                defaultLink = prod.detail_urls[0];
            }
        }

        let priceOptions = '<option value="">선택 (기존유지)</option>';
        if (prod && prod.prices) {
            if (prod.prices.sell_total) priceOptions += `<option value="${prod.prices.sell_total}">총 판매가 (${prod.prices.sell_total.toLocaleString()}원)</option>`;
            if (prod.prices.purchase) priceOptions += `<option value="${prod.prices.purchase}">원가 (${prod.prices.purchase.toLocaleString()}원)</option>`;
            if (prod.prices.sell_install) priceOptions += `<option value="${prod.prices.sell_install}">시공비 (${prod.prices.sell_install.toLocaleString()}원)</option>`;
        }
        
        let linkOptions = '<option value="">선택 (기존유지)</option>';
        if (prod && prod.detail_pages && prod.detail_pages.length > 0) {
            prod.detail_pages.forEach(dp => {
                linkOptions += `<option value="./product.html?id=${pId}&version=${dp.id}">📄 ${dp.title}</option>`;
            });
        }
        if (prod && prod.detail_urls && prod.detail_urls.length > 0) {
            prod.detail_urls.forEach(url => {
                if (url) linkOptions += `<option value="${url}">🔗 ${url}</option>`;
            });
        }

        return `<div id="${rowId}" style="display:flex; flex-direction:column; gap:4px; margin-bottom:12px; background:#f9fafb; padding:8px; border:1px solid #e5e7eb; border-radius:6px;">
            <div style="display:flex; align-items:center; justify-content:space-between;">
                <span style="font-weight:bold; font-size:14px; color:#1f2937;">${nameStr}</span>
                <button type="button" onclick="${removeFunc}" style="color:white; background:#ef4444; border:none; border-radius:4px; cursor:pointer; padding:3px 10px; font-size:12px;">삭제</button>
            </div>
            <div style="display:flex; flex-wrap:wrap; gap:12px; align-items:flex-end; margin-top:4px;">
                <div style="flex:1; display:flex; flex-direction:column; gap:4px; min-width:200px;">
                    <label style="font-size:12px; color:#4b5563; font-weight:600;">단가</label>
                    <div style="display:flex; gap:6px;">
                        <input type="text" id="${priceId}" placeholder="현장가" value="${defaultPrice}" style="flex:1; padding:6px; border:1px solid #d1d5db; border-radius:4px; font-size:13px;">
                        <select onchange="if(this.value) document.getElementById('${priceId}').value = this.value" style="padding:6px; border:1px solid #d1d5db; border-radius:4px; font-size:13px; min-width:140px;">
                            ${priceOptions}
                        </select>
                    </div>
                </div>
                <div style="flex:1.5; display:flex; flex-direction:column; gap:4px; min-width:300px;">
                    <label style="font-size:12px; color:#4b5563; font-weight:600;">상세링크</label>
                    <div style="display:flex; gap:6px;">
                        <input type="text" id="${linkId}" placeholder="상세링크" value="${defaultLink}" style="flex:1; padding:6px; border:1px solid #d1d5db; border-radius:4px; font-size:13px;">
                        <select onchange="if(this.value) document.getElementById('${linkId}').value = this.value" style="padding:6px; border:1px solid #d1d5db; border-radius:4px; font-size:13px; max-width:150px;">
                            ${linkOptions}
                        </select>
                        <button type="button" onclick="const url=document.getElementById('${linkId}').value; if(url) window.open(url, '_blank'); else alert('링크가 없습니다.');" style="background:#3b82f6; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-size:13px; white-space:nowrap;">미리보기</button>
                    </div>
                </div>
            </div>
        </div>`;
    };

    window.addMainProduct"""

if "window.renderProdRow =" not in content:
    content = content.replace("    window.addMainProduct", render_prod_row)

# 2. Update openEventModal for main products
main_list_pattern = re.compile(
    r'\$\{\s*selectedMain\.map\(\(p,i\)\s*=>\s*\{.*?\n.*?return `.*?<div id="mainrow-\$\{p\.id\}".*?</div>`;\n.*?\}\)\.join\(\'\'\)\s*\}', 
    re.DOTALL
)
main_list_replace = "${selectedMain.map(p => window.renderProdRow('main', p.id, p.customText, p.customLink, window.currentProducts.find(x=>x.id===p.id))).join('')}"
content = main_list_pattern.sub(main_list_replace, content)

# 3. Update openEventModal for addon products
addon_list_pattern = re.compile(
    r'\$\{\s*selectedAddon\.map\(\(p,i\)\s*=>\s*\{.*?\n.*?return `.*?<div id="addonrow-\$\{p\.id\}".*?</div>`;\n.*?\}\)\.join\(\'\'\)\s*\}', 
    re.DOTALL
)
addon_list_replace = "${selectedAddon.map(p => window.renderProdRow('addon', p.id, p.customText, p.customLink, window.currentProducts.find(x=>x.id===p.id))).join('')}"
content = addon_list_pattern.sub(addon_list_replace, content)


# 4. Update addMainProduct
add_main_pattern = re.compile(
    r"window\._editMainProds\.push\(\{id, customText:'', customLink:''\}\);\s*const list = document\.getElementById\('main-prod-list'\);\s*list\.innerHTML \+= `<div id=\"mainrow-\$\{id\}\".*?</div>`;",
    re.DOTALL
)
add_main_replace = """window._editMainProds.push({id, customText:'', customLink:''});
        const list = document.getElementById('main-prod-list');
        const prod = window.currentProducts.find(p=>p.id===id);
        list.insertAdjacentHTML('beforeend', window.renderProdRow('main', id, '', '', prod));"""
content = add_main_pattern.sub(add_main_replace, content)

# 5. Update addAddonProduct
add_addon_pattern = re.compile(
    r"window\._editAddonProds\.push\(\{id, customText:'', customLink:''\}\);\s*const list = document\.getElementById\('addon-prod-list'\);\s*list\.innerHTML \+= `<div id=\"addonrow-\$\{id\}\".*?</div>`;",
    re.DOTALL
)
add_addon_replace = """window._editAddonProds.push({id, customText:'', customLink:''});
        const list = document.getElementById('addon-prod-list');
        const prod = window.currentProducts.find(p=>p.id===id);
        list.insertAdjacentHTML('beforeend', window.renderProdRow('addon', id, '', '', prod));"""
content = add_addon_pattern.sub(add_addon_replace, content)

# 6. Update removeMainProduct (the fallback map)
remove_main_pattern = re.compile(
    r"if\(el\) el\.remove\(\);\s*else\s*\{\s*const list = document\.getElementById\('main-prod-list'\);\s*list\.innerHTML = window\._editMainProds\.map\(p=>\{\s*const prod=window\.currentProducts\.find\(x=>x\.id===p\.id\);\s*return `<div id=\"mainrow-\$\{p\.id\}\".*?</div>`;\s*\}\)\.join\(''\);\s*\}"
)
remove_main_replace = "if(el) el.remove(); else { document.getElementById('main-prod-list').innerHTML = window._editMainProds.map(p => window.renderProdRow('main', p.id, p.customText, p.customLink, window.currentProducts.find(x=>x.id===p.id))).join(''); }"
content = remove_main_pattern.sub(remove_main_replace, content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch applied.")
