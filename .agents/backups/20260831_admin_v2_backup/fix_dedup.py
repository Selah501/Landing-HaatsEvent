import re

with open('landing/public/admin_v2.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. searchArchiveTable 중복 제거 로직 수정
old_table_dedup = """                        // 중복 방지 (같은 날짜 + 연락처면 한 건으로 취급)
                        const uniqueKey = date + "_" + (phoneKeyword ? phone : title);
                        if (!results.find(r => r.uniqueKey === uniqueKey)) {
                            results.push({ date, slot, uniqueKey, ...evt });
                        }"""
new_table_dedup = """                        // 중복 방지 (하나의 예약이 여러 슬롯을 차지할 때 고유 reservationId로 중복 제거)
                        const uniqueKey = evt.reservationId || (date + "_" + slot);
                        if (!results.find(r => r.uniqueKey === uniqueKey)) {
                            results.push({ date, slot, uniqueKey, ...evt });
                        }"""
html = html.replace(old_table_dedup, new_table_dedup)

# 2. searchArchive (단순 검색) 중복 제거 로직 수정
old_card_dedup = """                                const uniqueKey = date + "_" + (slot.customerInfo ? slot.customerInfo.phone || slot.customerInfo.apt : time);
                                if (!results.find(r => r.uniqueKey === uniqueKey)) {
                                    results.push({
                                        date: date,
                                        time: time,
                                        rId: slot.reservationId || time,
                                        uniqueKey: uniqueKey,
                                        data: slot
                                    });
                                }"""
new_card_dedup = """                                const uniqueKey = slot.reservationId || (date + "_" + time);
                                if (!results.find(r => r.uniqueKey === uniqueKey)) {
                                    results.push({
                                        date: date,
                                        time: time,
                                        rId: slot.reservationId || time,
                                        uniqueKey: uniqueKey,
                                        data: slot
                                    });
                                }"""
html = html.replace(old_card_dedup, new_card_dedup)

with open('landing/public/admin_v2.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("Deduplication logic fixed.")
