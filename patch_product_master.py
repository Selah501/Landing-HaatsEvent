import re

path = r"c:\dev\전단지이벤트\landing\public\product_master.html"

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace the HTML UI for URL inputs and AI list with a single unified list
ui_pattern = re.compile(
    r'<div class="form-group">\s*<label>제품 이미지 1.*?</div>\s*</div>\s*<div class="form-group" style="border: 1px dashed #555; padding: 12px; border-radius: 8px; background: rgba\(0,0,0,0\.2\);">.*?</div>\s*</div>',
    re.DOTALL
)

unified_ui = """
        <div class="form-group" style="border: 1px solid #444; border-radius: 6px; padding: 12px; background: rgba(0,0,0,0.2); margin-bottom: 16px;">
            <label style="color: var(--color-interactive-lime); margin-bottom: 8px; display: block;">📑 상세페이지 리스트 (통합 보관함)</label>
            
            <div style="display:flex; gap:6px; margin-bottom: 12px; align-items:center;">
                <input type="text" id="newExternalUrl" placeholder="추가할 외부 이미지 또는 웹페이지 URL 입력..." style="flex:1; padding:8px; font-size:13px; border-radius:4px; border:1px solid #555; background:#222; color:white;">
                <button type="button" onclick="addExternalUrl()" style="background:var(--color-interactive-lime); color:#000; border:none; padding:8px 12px; border-radius:4px; cursor:pointer; font-size:13px; font-weight:bold; white-space:nowrap;">+ 외부 링크 추가</button>
            </div>

            <div id="detailPagesList" style="display: flex; flex-direction: column; gap: 8px; font-size: 13px;">
                데이터를 불러오는 중...
            </div>
            
            <div style="margin-top: 10px; font-size: 12px; color: #888;">
                💡 <b>힌트:</b> 새로운 상세페이지 생성이 필요하시면 안티그래비티 채팅창에 <b>"상세페이지 만들어줘"</b>라고 입력하세요!
            </div>
        </div>
"""

content = ui_pattern.sub(lambda m: unified_ui, content)

# 2-1: `openProductModal` variables
open_modal_pattern = re.compile(
    r"const urls = prod \? \(prod\.detail_urls \|\| \[\]\) : \[\];\s*document\.getElementById\('modalUrl1'\)\.value = urls\[0\] \|\| '';\s*document\.getElementById\('modalUrl2'\)\.value = urls\[1\] \|\| '';\s*document\.getElementById\('modalUrl3'\)\.value = urls\[2\] \|\| '';\s*// AI 상세페이지 리스트 렌더링\s*renderAiPagesList\(prod\);"
)
open_modal_replacement = """currentDetailUrls = prod ? (prod.detail_urls || []).filter(u => u) : [];
        renderDetailPagesList(prod);"""
content = open_modal_pattern.sub(lambda m: open_modal_replacement, content)

# 2-2: `saveProduct` payload
save_product_pattern = re.compile(
    r"detail_urls: \[\s*document\.getElementById\('modalUrl1'\)\.value\.trim\(\),\s*document\.getElementById\('modalUrl2'\)\.value\.trim\(\),\s*document\.getElementById\('modalUrl3'\)\.value\.trim\(\)\s*\]"
)
save_product_replacement = "detail_urls: currentDetailUrls"
content = save_product_pattern.sub(lambda m: save_product_replacement, content)

# 2-3: `renderAiPagesList` replacement + new logic
render_ai_pattern = re.compile(
    r"function renderAiPagesList\(prod\) \{.*?\}\s*(?=function goToCalculator\(\))",
    re.DOTALL
)

new_render_logic = r"""
    let currentDetailUrls = [];

    function addExternalUrl() {
        const urlInput = document.getElementById('newExternalUrl');
        const url = urlInput.value.trim();
        if (!url) {
            alert('URL을 입력해주세요.');
            return;
        }
        currentDetailUrls.push(url);
        urlInput.value = '';
        const prod = allProducts.find(p => p.id === currentEditProductId) || {};
        renderDetailPagesList(prod);
    }

    function deleteExternalUrl(idx) {
        if (!confirm('이 외부 링크를 리스트에서 삭제하시겠습니까?')) return;
        currentDetailUrls.splice(idx, 1);
        const prod = allProducts.find(p => p.id === currentEditProductId) || {};
        renderDetailPagesList(prod);
    }

    function renderDetailPagesList(prod) {
        const listEl = document.getElementById('detailPagesList');
        let html = '';
        
        // 1. AI 상세페이지 (detail_pages)
        if (prod && prod.detail_pages && prod.detail_pages.length > 0) {
            prod.detail_pages.forEach(dp => {
                let displayTitle = dp.title || '이름 없음';
                if (displayTitle.includes("Legacy")) {
                    displayTitle = "구형 병합본";
                }
                let dateStr = dp.created_at ? new Date(dp.created_at).toLocaleDateString('ko-KR', {year:'2-digit', month:'2-digit', day:'2-digit'}).replace(/\.\s/g, '.').replace(/\.$/, '') : '';
                const nameStr = `📄 ${displayTitle} ${dateStr ? `(${dateStr})` : ''}`;
                
                html += `
                <div style="display: flex; justify-content: space-between; align-items: center; background: #2c2c2e; padding: 8px 12px; border-radius: 6px;">
                    <span style="color: #fff;">${nameStr}</span>
                    <div style="display: flex; gap: 6px;">
                        <button type="button" onclick="previewAiVersion('${dp.id}')" style="background:#3b82f6; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:12px;">미리보기</button>
                        <button type="button" onclick="deleteAiVersion('${dp.id}')" style="background:#ef4444; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:12px;">삭제</button>
                    </div>
                </div>`;
            });
        }
        
        // 2. 외부 링크 (detail_urls)
        if (currentDetailUrls && currentDetailUrls.length > 0) {
            currentDetailUrls.forEach((url, idx) => {
                const isImg = url.toLowerCase().match(/\.(jpeg|jpg|gif|png|webp)$/);
                const label = isImg ? `🔗 이미지 원본 ${idx+1}` : `🔗 외부 링크 ${idx+1}`;
                
                html += `
                <div style="display: flex; justify-content: space-between; align-items: center; background: #334155; padding: 8px 12px; border-radius: 6px; margin-top: 4px;">
                    <span style="color: #94a3b8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 60%;" title="${url}">${label} <span style="font-size:11px; color:#64748b;">(${url})</span></span>
                    <div style="display: flex; gap: 6px;">
                        <button type="button" onclick="window.open('${url}', '_blank')" style="background:#3b82f6; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:12px;">미리보기</button>
                        <button type="button" onclick="deleteExternalUrl(${idx})" style="background:#ef4444; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:12px;">삭제</button>
                    </div>
                </div>`;
            });
        }
        
        if (!html) {
            html = '<div style="padding: 10px 0; color: #888;">보관된 상세페이지나 링크가 없습니다.</div>';
        }
        
        listEl.innerHTML = html;
    }

"""
content = render_ai_pattern.sub(lambda m: new_render_logic, content)

# 3. Modify deleteAiVersion so it updates renderDetailPagesList instead of renderAiPagesList
content = content.replace("renderAiPagesList(prod);", "renderDetailPagesList(prod);")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Patch successfully applied!")
