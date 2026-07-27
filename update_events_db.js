const dbUrl = "https://flyer-event-page-2026-default-rtdb.firebaseio.com/events.json";

async function updateEventsDB() {
    console.log("1. 이벤트 DB 조회 중...");
    const res = await fetch(dbUrl);
    const events = await res.json();
    
    if (!Array.isArray(events)) {
        console.log("이벤트 데이터가 배열이 아닙니다.");
        return;
    }

    const aptMapping = {
        "ev_1784707756905": "반도유보라",
        "ev_1784707448695": "경남아너스빌",
        "ev_1784632945753": "파크밸리 동일하이빌",
        "ev_1784129533077": "이지더원 2차",
        "ev_1783340698960": "전원주택 빌라",
        "ev_1783340698959": "LH스타힐스",
        "ev_lotte": "롯데캐슬",
        "ev_moa": "모아엘가",
        "ev_eg1": "이지더원 1차",
        "ev_eg2": "이지더원 2차"
    };

    const updatedEvents = events.map(ev => {
        if (!ev) return ev;
        let apt = aptMapping[ev.id];
        if (!apt) {
            // 매핑에 없으면 안전하게 추출
            apt = ev.title.replace(/(아파트|주방후드|환풍기|전동댐퍼|인덕션|수전|싱크볼|씽크볼|특가|이벤트|공동구매|교체|설치|핫써머|핫썸머|썸머|써머|여름|스멜|행사|할인|초특가|사전예약|모집|프로모션|패키지|혜택|지원|사은품|202\d).*$/i, '').trim();
            const words = apt.split(/\s+/);
            if (words.length >= 2) apt = words.slice(1).join(' ');
        }
        return {
            ...ev,
            aptName: apt || ""
        };
    });

    console.log("2. 변경된 DB 내용 미리보기 (일부):");
    updatedEvents.slice(0, 4).forEach(e => {
        console.log(` - [${e.id}] title: "${e.title}" -> aptName: "${e.aptName}"`);
    });

    console.log("3. Firebase RTDB 업데이트 중...");
    const updateRes = await fetch(dbUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedEvents)
    });

    if (updateRes.ok) {
        console.log("✅ 이벤트 DB(aptName 속성 구조화) 업데이트 성공!");
    } else {
        console.error("❌ DB 업데이트 실패:", await updateRes.text());
    }
}

updateEventsDB();
