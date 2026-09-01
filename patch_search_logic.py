import sys
import re

with open('landing/public/admin_v2.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. toggleSearchView의 currentSearchMode 에러 수정
# window.toggleSearchView = function(mode) { currentSearchMode = mode; 
# 부분에서 currentSearchMode 앞에 window. 을 붙여주자.
html = html.replace('currentSearchMode = mode;', 'window.currentSearchMode = mode;')

# 2. searchArchiveTable 중복 제거 로직 추가
# results.push({ date, slot, ...evt });
dedup_logic = """
                        // 중복 방지 (같은 날짜 + 연락처면 한 건으로 취급)
                        const uniqueKey = date + "_" + (phoneKeyword ? phone : title);
                        if (!results.find(r => r.uniqueKey === uniqueKey)) {
                            results.push({ date, slot, uniqueKey, ...evt });
                        }
"""
html = html.replace('results.push({ date, slot, ...evt });', dedup_logic)

# 3. 기존 searchArchive 함수 내 중복 제거 로직 추가
old_push_logic = """results.push({
                                    date: date,
                                    time: time,
                                    rId: slot.reservationId || time,
                                    data: slot
                                });"""
new_push_logic = """
                                const uniqueKey = date + "_" + (slot.customerInfo ? slot.customerInfo.phone || slot.customerInfo.apt : time);
                                if (!results.find(r => r.uniqueKey === uniqueKey)) {
                                    results.push({
                                        date: date,
                                        time: time,
                                        rId: slot.reservationId || time,
                                        uniqueKey: uniqueKey,
                                        data: slot
                                    });
                                }
"""
html = html.replace(old_push_logic, new_push_logic)


with open('landing/public/admin_v2.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Fix applied")
