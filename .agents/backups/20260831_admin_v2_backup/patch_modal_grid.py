import re

with open('landing/public/admin_v2.html', 'r', encoding='utf-8') as f:
    html = f.read()

old_modal = """        window.openPhotoModal = function(urls) {
            const modal = document.getElementById('photo-viewer-modal');
            const container = document.getElementById('photo-gallery-container');
            container.innerHTML = '';
            
            if(Array.isArray(urls)) {
                urls.forEach(url => {
                    const img = document.createElement('img');
                    img.src = url;
                    img.onclick = () => window.open(url, '_blank');
                    img.style.cursor = 'pointer';
                    // object-fit cover 등으로 깔끔하게 보이게 처리
                    img.style.width = '200px';
                    img.style.height = '200px';
                    img.style.objectFit = 'cover';
                    img.style.borderRadius = '8px';
                    container.appendChild(img);
                });
            }
            modal.style.display = 'flex';
        };"""

new_modal = """        window.openPhotoModal = function(urls) {
            const modal = document.getElementById('photo-viewer-modal');
            const container = document.getElementById('photo-gallery-container');
            container.innerHTML = '';
            
            if(Array.isArray(urls)) {
                container.style.flexWrap = 'wrap';
                urls.forEach(url => {
                    const a = document.createElement('a');
                    a.href = url;
                    a.target = '_blank';
                    a.style.display = 'inline-block';
                    a.style.border = '1px solid #555';
                    a.style.borderRadius = '8px';
                    a.style.overflow = 'hidden';
                    
                    const img = document.createElement('img');
                    img.src = url;
                    img.style.width = '120px';
                    img.style.height = '120px';
                    img.style.objectFit = 'cover';
                    img.onerror = function() {
                        this.onerror = null; 
                        this.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk1lZGlhPC90ZXh0Pjwvc3ZnPg==";
                    };
                    a.appendChild(img);
                    container.appendChild(a);
                });
            }
            modal.style.display = 'flex';
        };"""

html = html.replace(old_modal, new_modal)

with open('landing/public/admin_v2.html', 'w', encoding='utf-8') as f:
    f.write(html)
