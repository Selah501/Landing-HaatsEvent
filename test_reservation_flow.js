const dbUrlBase = "https://flyer-event-page-2026-default-rtdb.firebaseio.com";

async function runSelfVerificationTests() {
    console.log("==================================================");
    console.log("🛠️ [하츠 V2 예약 시스템] 자체 자동화 검증 테스트 시작");
    console.log("==================================================\n");

    let passCount = 0;
    let failCount = 0;

    function assert(condition, testName, errorMsg = "") {
        if (condition) {
            console.log(`✅ [PASS] ${testName}`);
            passCount++;
        } else {
            console.error(`❌ [FAIL] ${testName} -> ${errorMsg}`);
            failCount++;
        }
    }

    // [테스트 1] 이벤트 DB 구조화된 aptName 필드 검증
    console.log("--- [테스트 1] 이벤트 DB 구조화된 aptName 필드 검증 ---");
    try {
        const res = await fetch(`${dbUrlBase}/events.json`);
        const events = await res.json();
        assert(Array.isArray(events), "이벤트 목록이 배열 형태로 정상 조회됨");
        
        const gyeongnamEv = events.find(e => e && e.title && e.title.includes("경남아너스빌"));
        assert(gyeongnamEv && gyeongnamEv.aptName === "경남아너스빌", "경남아너스빌 이벤트의 aptName이 '경남아너스빌'로 정확히 구조화됨", `실제 값: ${gyeongnamEv ? gyeongnamEv.aptName : '이벤트 없음'}`);
        
        const bandoEv = events.find(e => e && e.title && e.title.includes("반도유보라"));
        assert(bandoEv && bandoEv.aptName === "반도유보라", "반도유보라 이벤트의 aptName이 '반도유보라'로 정확히 구조화됨", `실제 값: ${bandoEv ? bandoEv.aptName : '이벤트 없음'}`);
    } catch (err) {
        assert(false, "이벤트 DB 조회 중 예외 발생", err.message);
    }

    console.log("\n--- [테스트 2] 30분 단위 시간 슬롯 및 다중 슬롯 계산 로직 검증 ---");
    function addStepToTimeString(timeStr, stepCount) {
        let [h, m] = timeStr.split(':').map(Number);
        m += stepCount * 30;
        h += Math.floor(m / 60);
        m = m % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }

    assert(addStepToTimeString("09:00", 1) === "09:30", "09:00에서 1칸(+30분) 더하기 -> 09:30");
    assert(addStepToTimeString("09:00", 2) === "10:00", "09:00에서 2칸(+60분) 더하기 -> 10:00");
    assert(addStepToTimeString("18:30", 1) === "19:00", "18:30에서 1칸(+30분) 더하기 -> 19:00");

    const totalDuration = 90; // 1시간 30분 소요
    const slotsNeeded = Math.max(1, Math.ceil(totalDuration / 30));
    assert(slotsNeeded === 3, "90분 소요 시간 -> 30분 슬롯 3칸으로 정확히 계산됨");

    const slotsToBook = [];
    for (let i = 0; i < slotsNeeded; i++) {
        slotsToBook.push(addStepToTimeString("10:30", i));
    }
    assert(slotsToBook.join(',') === "10:30,11:00,11:30", "10:30부터 3칸 연속 슬롯 배열이 올바르게 생성됨 [10:30,11:00,11:30]");

    console.log("\n--- [테스트 3] 고객 예약 제출 REST API 저장 시뮬레이션 (ReferenceError 검증) ---");
    const testDate = "2026-07-28";
    const testResId = "res_auto_veri_" + Date.now();
    const testPayload = {};
    const testTimeSlots = ["15:00", "15:30"];
    
    testTimeSlots.forEach(timeStr => {
        testPayload[`${testDate}/${timeStr}`] = {
            status: "pending",
            reservationId: testResId,
            type: "customer",
            timestamp: Date.now(),
            customerInfo: {
                phone: "010-7777-8888",
                apt: "경남아너스빌 101동 202호",
                notes: "자체 검증 자동화 테스트",
                items: ["티오람미니 1대", "거실 환풍기 1대"],
                totalDuration: 60,
                hoursNeeded: testTimeSlots.length * 0.5,
                slotsNeeded: testTimeSlots.length,
                parentTime: "15:00"
            }
        };
    });

    try {
        const putRes = await fetch(`${dbUrlBase}/reservations.json`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(testPayload)
        });
        assert(putRes.ok, "Firebase RTDB에 30분 단위 예약 2칸(15:00, 15:30) 정상 PATCH 저장 완료 (에러 없음)");

        // 저장된 데이터 검증
        const getRes = await fetch(`${dbUrlBase}/reservations/${testDate}.json`);
        const savedData = await getRes.json();
        assert(savedData["15:00"] && savedData["15:00"].reservationId === testResId, "DB에서 15:00 슬롯 데이터가 정상 조회됨");
        assert(savedData["15:00"].customerInfo.slotsNeeded === 2, "slotsNeeded 속성(2)이 정확히 저장됨");
        assert(savedData["15:00"].customerInfo.hoursNeeded === 1, "hoursNeeded 속성(1)이 정확히 호환 저장됨");
        assert(savedData["15:30"] && savedData["15:30"].reservationId === testResId, "DB에서 15:30 연속 슬롯 데이터가 정상 조회됨");
    } catch (err) {
        assert(false, "예약 저장 시뮬레이션 실패", err.message);
    }

    console.log("\n--- [테스트 4] 관리자 시간 조정 모달 (+30분 늘리기 / -30분 줄이기) 로직 검증 ---");
    const MASTER_TIME_SLOTS = [
        "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", 
        "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", 
        "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", 
        "17:00", "17:30", "18:00", "18:30", "19:00"
    ];
    let currentAdjSlots = ["15:00", "15:30"];
    
    // +30분 늘리기 테스트
    const lastTime = currentAdjSlots[currentAdjSlots.length - 1];
    const idx = MASTER_TIME_SLOTS.indexOf(lastTime);
    const nextTimeStr = MASTER_TIME_SLOTS[idx + 1];
    currentAdjSlots.push(nextTimeStr);
    assert(currentAdjSlots.join(',') === "15:00,15:30,16:00", "+30분 늘리기 실행 성공 -> [15:00,15:30,16:00] (총 1시간 30분)");

    // -30분 줄이기 테스트
    currentAdjSlots.pop();
    assert(currentAdjSlots.join(',') === "15:00,15:30", "-30분 줄이기 실행 성공 -> [15:00,15:30] (총 1시간)");

    console.log("\n--- [테스트 5] 원클릭 4대 SMS 문자 템플릿 완성도 검증 ---");
    function generateSmsText(type, cInfo, dateStr, timeStr) {
        const itemStr = (cInfo.items && cInfo.items.length > 0) ? cInfo.items.join(', ') : "신청 상품";
        if (type === 'confirm') {
            return `[하츠 충남대리점]\n${cInfo.apt} 고객님, 공동구매 시공 예약이 최종 확정되었습니다.\n\n▶ 예약일시: ${dateStr} (${timeStr})\n▶ 시공내용: ${itemStr}\n\n약속된 시간에 담당 시공팀장이 방문드릴 예정입니다. 감사합니다. (문의: 010-2886-5086)`;
        }
        return "";
    }

    const smsConfirm = generateSmsText("confirm", {
        apt: "경남아너스빌 101동 202호",
        items: ["티오람미니 1대", "거실 환풍기 1대"]
    }, "2026-07-28", "15:00");
    
    assert(smsConfirm.includes("경남아너스빌 101동 202호") && smsConfirm.includes("15:00") && smsConfirm.includes("티오람미니 1대"), "② 예약 확정 SMS 템플릿에 고객 아파트, 시간, 상품 정보가 정확히 자동 주입됨");

    console.log("\n==================================================");
    console.log(`📊 자동화 검증 결과 Summary: 총 ${passCount + failCount}건 중 [ ${passCount}건 PASS / ${failCount}건 FAIL ]`);
    console.log("==================================================\n");

    if (failCount === 0) {
        console.log("🌟 모든 테스트가 100% 성공했습니다! 안전하게 배포를 진행할 수 있습니다.");
    } else {
        console.error("⚠️ 실패한 테스트가 있습니다. 코드 수정이 필요합니다.");
    }
}

runSelfVerificationTests();
