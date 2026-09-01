import re

html = open('landing/public/admin_v2.html', encoding='utf-8').read()
ids = ['btn-view-card', 'btn-view-table', 'search-basic-panel', 'search-detail-panel', 'search-grid', 'search-table-container', 'search-results-stats', 'search-date-start', 'search-date-end', 'search-grid-table', 'photo-viewer-modal']

for i in ids:
    count = html.count(f'id="{i}"') + html.count(f"id='{i}'")
    print(f"{i}: {count}")
