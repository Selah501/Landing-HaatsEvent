export async function injectTestData(db, ref, set, push) {
    if (!confirm('현재 예약 및 ERP 데이터를 덮어쓰거나 추가하시겠습니까? (테스트 데이터 3건 생성)')) return;

    try {
        const today = new Date();
        const yy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const dateStr = `${yy}-${mm}-${dd}`;

        // 1. 예약 데이터 생성 (reservations)
        const reservationsRef = ref(db, `reservations/${dateStr}`);
        const mockReservations = {
            "09:00": {
                customerInfo: {
                    apt: "래미안 퍼스티지", phone: "010-1234-5678",
                    items: ["하츠 침니후드 (프리미엄)"], notes: "[테스트] 당일 연락 요망"
                },
                source: "온라인", status: "confirmed", reservationId: "res_test_1"
            },
            "13:00": {
                customerInfo: {
                    apt: "자이 아파트 201-304", phone: "010-9876-5432",
                    items: ["가스쿡탑 3구"], notes: "[테스트] 추가 비용 상담"
                },
                source: "전화", status: "confirmed", reservationId: "res_test_2"
            },
            "16:00": {
                customerInfo: {
                    apt: "힐스테이트 305-1004", phone: "010-5555-4444",
                    items: ["테라 주방후드 (가성비)"], notes: "[테스트] 배관 연장 가능성"
                },
                source: "온라인", status: "confirmed", reservationId: "res_test_3"
            }
        };
        await set(reservationsRef, mockReservations);

        // 2. 일일 보고서 데이터 생성 (daily_reports)
        const reportRef = ref(db, `daily_reports/${dateStr}/09:00`);
        const mockReport = {
            customerInfo: "홍길동 / 래미안 퍼스티지 101동 102호",
            usedProducts: [{ name: "하츠 침니후드 (프리미엄)", qty: 1, cost: 200000, sellPrice: 350000 }],
            techNotes: "[테스트] 현장 설치 완료. 특이사항 없음.",
            paymentMethod: "계좌이체",
            totalCost: 200000,
            totalSales: 350000,
            status: "완료",
            timestamp: new Date().toISOString()
        };
        await set(reportRef, mockReport);

        // 3. 매입 장부 데이터 생성 (ledger)
        const ledgerRef = ref(db, 'ledger');
        const newLedgerPush = push(ledgerRef);
        await set(newLedgerPush, {
            date: dateStr,
            category: "자재비",
            description: "테라 주방후드 10대 도매 매입",
            amount: 1500000,
            type: "expense",
            vendor: "하츠 본사",
            timestamp: new Date().toISOString()
        });

        alert('테스트 데이터가 성공적으로 생성되었습니다!\n- 예약 3건\n- 완료 보고서 1건\n- 매입 장부 1건');
        window.location.reload();
    } catch (error) {
        console.error("데이터 생성 중 오류:", error);
        alert('테스트 데이터 생성 실패: ' + error.message);
    }
}
