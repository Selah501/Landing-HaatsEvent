const admin = require('firebase-admin');
const { getDatabase } = require('firebase-admin/database');

admin.initializeApp({
    databaseURL: "https://flyer-event-page-2026-default-rtdb.firebaseio.com"
});

const db = getDatabase();

async function addTestData() {
    const today = new Date();
    const offset = today.getTimezoneOffset() * 60000;
    const localDate = new Date(today.getTime() - offset).toISOString().split('T')[0];

    const ref = db.ref(`reservations/${localDate}/14:00`);
    
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

    try {
        await ref.set(testData);
        console.log(`✅ Test data successfully inserted at reservations/${localDate}/14:00`);
    } catch (e) {
        console.error("❌ Error inserting test data:", e);
    } finally {
        process.exit();
    }
}

addTestData();
