const globalProducts = [
    {
        "id": "p_tioram",
        "name": "티오람 미니",
        "model": "복합환풍기 ",
        "features": "배기/냄새차단/제습/온풍/자연풍",
        "cost": "",
        "defaultPriceText": "195,000원",
        "detailLink": "./products/tioram-mini.html",
        "remarks": ""
    },
    {
        "id": "p_terra",
        "name": "테라 주방후드",
        "model": "테라 DTR-90-MSHZ",
        "features": "주방 공기를 쾌적하게",
        "cost": "",
        "defaultPriceText": "350,000원",
        "detailLink": "./products/hood.html",
        "remarks": ""
    },
    {
        "id": "p_hurricane",
        "name": "허리케인 주방후드",
        "model": "허리케인 HRH90S",
        "features": "강력한 흡입력",
        "cost": "",
        "defaultPriceText": "350,000원",
        "detailLink": "./products/hood.html",
        "remarks": ""
    },
    {
        "id": "p_sink",
        "name": "사각씽크볼 세트",
        "model": "폰테사각볼엠보 세",
        "features": "올스텐 배수구, 폭포수전 세트",
        "cost": "",
        "defaultPriceText": "550000원",
        "detailLink": "./products/sink-faucet.html",
        "remarks": ""
    },
    {
        "id": "p_1784139265988",
        "name": "씽크볼 수전",
        "model": "폰테206",
        "features": "4웨이",
        "cost": "",
        "remarks": "",
        "defaultPriceText": "130000원 ",
        "detailLink": "./products/sink-faucet.html"
    },
    {
        "id": "p_vent_medium",
        "name": "일반 환풍기(중형)",
        "model": "플렉스댐퍼 (C2-100LFMD)",
        "features": "저소음 / 고기밀 모터댐퍼 / 냄새 완벽 차단",
        "cost": "",
        "defaultPriceText": "120,000원",
        "detailLink": "./products/basic-vent-medium.html",
        "remarks": "단순 고장 교체"
    },
    {
        "id": "p_vent_large",
        "name": "일반 환풍기(대형)",
        "model": "제로크 MD (HV3-80-X(MD-N))",
        "features": "정풍량 인증 / 2-WAY 확장배기(옵션) / 냄새 차단",
        "cost": "",
        "defaultPriceText": "140,000원",
        "detailLink": "./products/basic-vent-large.html",
        "remarks": "단순 고장 교체"
    }
];

const eventsData = [
    {
        "id": "ev_1784129533077",
        "title": "내포 이지더원 2차 핫썸머 스멜",
        "priceText": "복합환풍기 티오람미니 세일 195,000원",
        "periodText": "2026. 07/15(수) ~ 07/216(화)",
        "status": "active",
        "mainProducts": [
            {
                "id": "p_vent_medium",
                "customText": ""
            },
            {
                "id": "p_tioram",
                "customText": ""
            }
        ],
        "addonProducts": [
            {
                "id": "p_sink",
                "customText": ""
            },
            {
                "id": "p_hurricane",
                "customText": ""
            },
            {
                "id": "p_1784139265988",
                "customText": ""
            }
        ]
    },
    {
        "id": "ev_1783340698960",
        "title": "전원주택 빌라 핫썸머",
        "priceText": "하츠 복합환풍기 티오람미니 파격세일 195,000원",
        "periodText": "접수기간: 2026. 07. 07(화) ~ 07. 20(월)",
        "status": "active",
        "mainProducts": [
            {
                "id": "p_tioram",
                "customText": ""
            }
        ],
        "addonProducts": [
            {
                "id": "p_sink",
                "customText": ""
            },
            {
                "id": "p_terra",
                "customText": ""
            },
            {
                "id": "p_hurricane",
                "customText": ""
            },
            {
                "id": "p_1784139265988",
                "customText": ""
            },
            {
                "id": "p_vent_large",
                "customText": ""
            }
        ]
    },
    {
        "id": "ev_1783340698959",
        "title": "내포 LH스타힐스 핫썸머",
        "priceText": "하츠 복합환풍기 파격세일 195,000원",
        "periodText": "접수기간: 2026. 07. 06(월) ~ 07. 20(월)",
        "status": "active",
        "mainProducts": [
            {
                "id": "p_tioram",
                "customText": ""
            },
            {
                "id": "p_vent_large",
                "customText": ""
            }
        ],
        "addonProducts": [
            {
                "id": "p_sink",
                "customText": ""
            },
            {
                "id": "p_1784139265988",
                "customText": ""
            }
        ]
    },
    {
        "id": "ev_lotte",
        "title": "내포 롯데캐슬 핫썸머",
        "priceText": "하츠 복합환풍기 티오람미니 파격세일 195,000원",
        "periodText": "접수기간: 2026. 06. 30(화) ~ 07. 06(월)",
        "status": "ended",
        "mainProducts": [
            {
                "id": "p_tioram",
                "customText": ""
            }
        ],
        "addonProducts": [
            {
                "id": "p_sink",
                "customText": ""
            },
            {
                "id": "p_1784139265988",
                "customText": ""
            }
        ]
    },
    {
        "id": "ev_moa",
        "title": "내포 모아엘가 핫썸머",
        "priceText": "하츠 복합환풍기 티오람미니 파격세일 195,000원",
        "periodText": "접수기간: 2026. 06. 30(화) ~ 07. 06(월)",
        "status": "active",
        "mainProducts": [
            {
                "id": "p_tioram",
                "customText": ""
            },
            {
                "id": "p_vent_large",
                "customText": ""
            }
        ],
        "addonProducts": [
            {
                "id": "p_sink",
                "customText": ""
            },
            {
                "id": "p_terra",
                "customText": ""
            },
            {
                "id": "p_hurricane",
                "customText": ""
            },
            {
                "id": "p_1784139265988",
                "customText": ""
            }
        ]
    },
    {
        "id": "ev_eg1",
        "title": "내포 이지더원 1차 핫썸머 2026.6",
        "periodText": "~6/29",
        "status": "ended",
        "mainProducts": [
            {
                "id": "p_vent_medium",
                "customText": ""
            },
            {
                "id": "p_tioram",
                "customText": ""
            }
        ],
        "addonProducts": [
            {
                "id": "p_sink",
                "customText": ""
            },
            {
                "id": "p_hurricane",
                "customText": ""
            },
            {
                "id": "p_1784139265988",
                "customText": ""
            }
        ]
    },
    {
        "id": "ev_eg2",
        "title": "내포 이지더원 2차 핫썸머",
        "periodText": "~6/30",
        "status": "ended",
        "mainProducts": [
            {
                "id": "p_vent_medium",
                "customText": ""
            },
            {
                "id": "p_tioram",
                "customText": ""
            }
        ],
        "addonProducts": [
            {
                "id": "p_sink",
                "customText": ""
            },
            {
                "id": "p_hurricane",
                "customText": ""
            },
            {
                "id": "p_1784139265988",
                "customText": ""
            }
        ]
    }
];