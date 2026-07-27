const dbUrl = "https://flyer-event-page-2026-default-rtdb.firebaseio.com/reservations.json";

const testReservations = {
    "2026-07-27": {
        "09:00": {
            reservationId: "test-res-2701",
            status: "confirmed",
            type: "customer",
            customerInfo: {
                phone: "010-2886-5086",
                apt: "내포 LH스타힐스 105동 1104호",
                notes: "기존 후드 탈거 후 설치 희망",
                items: ["티오람미니 1대", "제로크 1대"]
            }
        },
        "14:00": {
            reservationId: "test-res-2702",
            status: "confirmed",
            type: "customer",
            customerInfo: {
                phone: "010-1234-5678",
                apt: "반도유보라 203동 502호",
                notes: "공동구매 할인 적용 건",
                items: ["하츠 로빈 후드 RCH-90S 1대"]
            }
        }
    },
    "2026-07-29": {
        "10:00": {
            reservationId: "test-res-2901",
            status: "confirmed",
            type: "customer",
            customerInfo: {
                phone: "010-9988-7766",
                apt: "이지더원 2차 301동 1205호",
                notes: "오전 방문 필수 요청",
                items: ["프리미엄 싱크볼 1대", "거실 환풍기 2대"]
            }
        }
    },
    "2026-07-30": {
        "11:00": {
            reservationId: "test-res-3001",
            status: "confirmed",
            type: "customer",
            customerInfo: {
                phone: "010-5544-3322",
                apt: "중흥S클래스 102동 801호",
                notes: "부재시 비밀번호 공유 예정",
                items: ["티오람미니 1대"]
            }
        },
        "15:00": {
            reservationId: "test-res-3002",
            status: "confirmed",
            type: "customer",
            customerInfo: {
                phone: "010-1122-3344",
                apt: "모아엘가 108동 303호",
                notes: "결제는 현장에서 카드 결제 예정",
                items: ["제로크 환풍기 1대"]
            }
        }
    }
};

async function injectData() {
    console.log("=== Firebase REST API로 테스트 데이터 주입 시작 ===");
    try {
        const res = await fetch(dbUrl, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testReservations)
        });
        
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        console.log("✅ 7/27, 7/29, 7/30 테스트 일정 5건 주입 완료!", data);
        process.exit(0);
    } catch (e) {
        console.error("❌ 주입 실패:", e);
        process.exit(1);
    }
}

injectData();
