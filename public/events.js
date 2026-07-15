const globalProducts = [
    { id: 'p_tioram', name: '복합환풍기 (티오람 미니)', defaultPriceText: '195,000원' },
    { id: 'p_basic', name: '일반 환풍기 + 전동댐퍼', defaultPriceText: '12만~14만' },
    { id: 'p_terra', name: '하츠 테라 DTR-90-MSHZ', defaultPriceText: '350,000원' },
    { id: 'p_hurricane', name: '하츠 허리케인 HRH90S', defaultPriceText: '350,000원' },
    { id: 'p_sink', name: '사각씽크볼 & 폭포수전', defaultPriceText: '별도 문의' }
];

const defaultAvailableProducts = [
    { id: 'p_tioram', customText: '' },
    { id: 'p_basic', customText: '' },
    { id: 'p_terra', customText: '' },
    { id: 'p_sink', customText: '' }
];

const eventsData = [
    {
        "id": "ev_1784129533077",
        "title": "내포 이지더원 2차 핫썸머 스멜",
        "priceText": "복합환풍기 티오람미니 세일 195,000원",
        "periodText": "2026. 07/15(수) ~ 07/216(화)",
        "status": "active",
        "availableProducts": JSON.parse(JSON.stringify(defaultAvailableProducts))
    },
    {
        "id": "ev_1783340698960",
        "title": "전원주택 빌라 핫썸머",
        "priceText": "하츠 복합환풍기 티오람미니 파격세일 195,000원",
        "periodText": "접수기간: 2026. 07. 07(화) ~ 07. 20(월)",
        "status": "active",
        "availableProducts": JSON.parse(JSON.stringify(defaultAvailableProducts))
    },
    {
        "id": "ev_1783340698959",
        "title": "내포 LH스타힐스 핫썸머",
        "priceText": "하츠 복합환풍기 파격세일 195,000원",
        "periodText": "접수기간: 2026. 07. 06(월) ~ 07. 20(월)",
        "status": "active",
        "availableProducts": JSON.parse(JSON.stringify(defaultAvailableProducts))
    },
    {
        "id": "ev_lotte",
        "title": "내포 롯데캐슬 핫썸머",
        "priceText": "하츠 복합환풍기 티오람미니 파격세일 195,000원",
        "periodText": "접수기간: 2026. 06. 30(화) ~ 07. 06(월)",
        "status": "ended",
        "availableProducts": JSON.parse(JSON.stringify(defaultAvailableProducts))
    },
    {
        "id": "ev_moa",
        "title": "내포 모아엘가 핫썸머",
        "priceText": "하츠 복합환풍기 티오람미니 파격세일 195,000원",
        "periodText": "접수기간: 2026. 06. 30(화) ~ 07. 06(월)",
        "status": "active",
        "availableProducts": JSON.parse(JSON.stringify(defaultAvailableProducts))
    },
    {
        "id": "ev_eg1",
        "title": "내포 이지더원 1차 핫썸머 2026.6",
        "periodText": "~6/29",
        "status": "ended",
        "availableProducts": JSON.parse(JSON.stringify(defaultAvailableProducts))
    },
    {
        "id": "ev_eg2",
        "title": "내포 이지더원 2차 핫썸머",
        "periodText": "~6/30",
        "status": "ended",
        "availableProducts": JSON.parse(JSON.stringify(defaultAvailableProducts))
    }
];