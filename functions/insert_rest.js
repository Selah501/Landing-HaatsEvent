const url = "https://flyer-event-page-2026-default-rtdb.firebaseio.com/reservations/2026-08-06/14:00.json";

const testData = {
    reservationId: "test_voice_report_001",
    status: "confirmed",
    type: "test",
    customerInfo: {
        name: "AI 음성비서 테스트 고객",
        phone: "010-1234-5678",
        apt: "푸르지오 101동 101호",
        items: ["테스트 환풍기 신청"],
        notes: "테스트를 위해 에이전트가 자동 생성한 데이터입니다."
    }
};

fetch(url, {
    method: 'PUT',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(testData)
})
.then(res => res.json())
.then(data => {
    console.log("✅ Success:", data);
})
.catch(err => {
    console.error("❌ Error:", err);
});
