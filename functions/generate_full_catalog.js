const fs = require('fs');

const dataPath = '../data.json';
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const fullCatalog = [
  // --- 기존 연동 필수 품목 (절대 ID 변경 금지) ---
  { id: "p_terra", brand: "하츠", category: "주방 후드", name: "테라 주방후드", model: "DTR-90-MSHZ", defaultPriceText: "350,000원", features: "주방 공기를 쾌적하게", isHandled: true },
  { id: "p_hurricane", brand: "하츠", category: "주방 후드", name: "허리케인 주방후드", model: "HRH90S", defaultPriceText: "350,000원", features: "강력한 흡입력", isHandled: true },
  { id: "p_sink", brand: "하츠", category: "빌트인 수전/싱크볼", name: "사각씽크볼 세트", model: "폰테사각볼엠보 세트", defaultPriceText: "550,000원", features: "올스텐 배수구, 폭포수전 세트", isHandled: true },
  { id: "p_1784139265988", brand: "하츠", category: "빌트인 수전/싱크볼", name: "씽크볼 수전 폰테 206", model: "폰테206", defaultPriceText: "130,000원", features: "감각적인 디자인과 실용성", isHandled: true },
  { id: "p_tioram", brand: "힘펠", category: "욕실 환기가전", name: "티오람 미니", model: "복합환풍기", defaultPriceText: "195,000원", features: "배기/냄새차단/제습/온풍/자연풍", isHandled: true },
  { id: "p_vent_medium", brand: "힘펠", category: "욕실 환기가전", name: "플렉스댐퍼 일반 환풍기(중형)", model: "C2-100LFMD", defaultPriceText: "120,000원", features: "저소음 / 고기밀 모터댐퍼 / 냄새 완벽 차단", isHandled: true },
  { id: "p_vent_large", brand: "힘펠", category: "욕실 환기가전", name: "제로크 MD 일반 환풍기(대형)", model: "HV3-80-X(MD-N)", defaultPriceText: "140,000원", features: "정풍량 인증 / 2-WAY 확장배기(옵션) / 냄새 차단", isHandled: true },

  // --- HAATZ HOODS (일반 후드 라인업) ---
  { id: "p_haatz_hsh90", brand: "하츠", category: "주방 후드", name: "허리케인 스노우", model: "HSH-90WHCI", defaultPriceText: "상담문의", features: "심플함과 모던한 디자인으로 깨끗한 주방 연출", isHandled: true },
  { id: "p_haatz_madera", brand: "하츠", category: "주방 후드", name: "마데라", model: "PMA-90WHCI", defaultPriceText: "상담문의", features: "도장강판 (무광) + 우드 (화이트오크)", isHandled: true },
  { id: "p_haatz_castle", brand: "하츠", category: "주방 후드", name: "캐슬", model: "PCS-90WHCI", defaultPriceText: "상담문의", features: "도장강판 (무광) + 우레탄", isHandled: true },
  { id: "p_haatz_slant", brand: "하츠", category: "주방 후드", name: "슬랜트", model: "PST-90WHCI", defaultPriceText: "상담문의", features: "사선형 구조로 공간 활용", isHandled: true },
  { id: "p_haatz_camino", brand: "하츠", category: "주방 후드", name: "까미노", model: "DCA-46SCI", defaultPriceText: "상담문의", features: "스탠드형 고급 후드", isHandled: true },
  { id: "p_haatz_boutique_arte", brand: "하츠", category: "주방 후드", name: "부띠크 아르떼", model: "BAR-90CI", defaultPriceText: "상담문의", features: "컬러풀한 감성의 부띠크 라인", isHandled: true },
  { id: "p_haatz_modern_square", brand: "하츠", category: "주방 후드", name: "모던 스퀘어", model: "MSH-90SCI", defaultPriceText: "상담문의", features: "모던한 박스형 디자인", isHandled: true },
  { id: "p_haatz_arc", brand: "하츠", category: "주방 후드", name: "아크", model: "DAC-90MSCI", defaultPriceText: "상담문의", features: "부드러운 곡선 디자인", isHandled: true },
  { id: "p_haatz_modern_metal", brand: "하츠", category: "주방 후드", name: "모던 메탈", model: "MMH-90MSCI", defaultPriceText: "상담문의", features: "메탈릭 텍스처 프리미엄 후드", isHandled: true },
  { id: "p_haatz_newchimney", brand: "하츠", category: "주방 후드", name: "뉴침니", model: "NCH-90SCI", defaultPriceText: "상담문의", features: "클래식 침니 스타일의 진화", isHandled: true },
  { id: "p_haatz_montblanc", brand: "하츠", category: "주방 후드", name: "몽블랑", model: "CPMB-90WHCI", defaultPriceText: "상담문의", features: "유려한 곡선 침니형 후드", isHandled: true },
  { id: "p_haatz_robin", brand: "하츠", category: "주방 후드", name: "로빈", model: "RNH-90CCI", defaultPriceText: "상담문의", features: "클래식 돔 스타일", isHandled: true },
  { id: "p_haatz_step", brand: "하츠", category: "주방 후드", name: "스텝", model: "CBST-90WHCI", defaultPriceText: "상담문의", features: "계단식 필터 구조로 흡입력 극대화", isHandled: true },
  { id: "p_haatz_moa", brand: "하츠", category: "주방 후드", name: "모아", model: "SMA-60GCI", defaultPriceText: "상담문의", features: "플루티드 유리의 우아함", isHandled: true },
  { id: "p_haatz_nova", brand: "하츠", category: "주방 후드", name: "노바", model: "INA-90WHCI", defaultPriceText: "상담문의", features: "세련된 디자인과 강력한 흡입력", isHandled: true },
  { id: "p_haatz_roche", brand: "하츠", category: "주방 후드", name: "로체", model: "CBLS-60SGCI", defaultPriceText: "상담문의", features: "슬림하고 컴팩트한 디자인", isHandled: true },
  { id: "p_haatz_slim_luna", brand: "하츠", category: "주방 후드", name: "슬림 루나", model: "SSL-60GLT", defaultPriceText: "상담문의", features: "LED 포인트가 아름다운 슬림 후드", isHandled: true },
  { id: "p_haatz_slim_dark", brand: "하츠", category: "주방 후드", name: "슬림 다크", model: "SSD-60GLT", defaultPriceText: "상담문의", features: "다크 글라스의 모던함", isHandled: true },
  { id: "p_haatz_slim_line", brand: "하츠", category: "주방 후드", name: "슬림 라인", model: "SLH-160SLT", defaultPriceText: "상담문의", features: "주방장 밑으로 완벽히 숨겨지는 빌트인", isHandled: true },
  { id: "p_haatz_new_shield", brand: "하츠", category: "주방 후드", name: "뉴쉴드라운드", model: "NSR-60S", defaultPriceText: "상담문의", features: "곡면 글라스가 기름튐을 방지", isHandled: true },
  { id: "p_haatz_boutique_glace", brand: "하츠", category: "주방 후드", name: "부띠크 글라쎄", model: "BGC-60S", defaultPriceText: "상담문의", features: "전면 통유리의 아름다움", isHandled: true },
  
  // --- HAATZ ELICA (프리미엄 수입 후드) ---
  { id: "p_haatz_elica_era", brand: "하츠", category: "주방 후드", name: "엘리카 ERA S", model: "ERA S 600", defaultPriceText: "상담문의", features: "빌트인 프리미엄 후드", isHandled: true },
  { id: "p_haatz_elica_illusion", brand: "하츠", category: "주방 후드", name: "엘리카 ILLUSION", model: "ILLUSION", defaultPriceText: "상담문의", features: "천장 매립형 하이엔드 뷰", isHandled: true },
  { id: "p_haatz_elica_fold", brand: "하츠", category: "주방 후드", name: "엘리카 FOLD", model: "FOLD", defaultPriceText: "상담문의", features: "주방장 일체형 디자인", isHandled: true },
  { id: "p_haatz_elica_grace", brand: "하츠", category: "주방 후드", name: "엘리카 그레이스", model: "GRACE", defaultPriceText: "상담문의", features: "우아한 조명형 아일랜드 후드", isHandled: true },
  { id: "p_haatz_elica_wave", brand: "하츠", category: "주방 후드", name: "엘리카 웨이브 II", model: "WAVE II", defaultPriceText: "상담문의", features: "물결 무늬가 돋보이는 샹들리에 후드", isHandled: true },
  { id: "p_haatz_elica_om", brand: "하츠", category: "주방 후드", name: "엘리카 오엠 에어", model: "OM AIR", defaultPriceText: "상담문의", features: "벽걸이형 원형 디자인", isHandled: true },
  { id: "p_haatz_elica_vertigo", brand: "하츠", category: "주방 후드", name: "엘리카 버티고", model: "VERTIGO", defaultPriceText: "상담문의", features: "전면 경사형 프리미엄", isHandled: true },
  
  // --- HAATZ COOKTOPS & OVENS ---
  { id: "p_haatz_eic30", brand: "하츠", category: "주방 가전", name: "클레르 인덕션", model: "EIC-30HWR252", defaultPriceText: "상담문의", features: "공간에 스며드는 화이트 감성", isHandled: true },
  { id: "p_haatz_alias", brand: "하츠", category: "주방 가전", name: "알리아스 인덕션 3구", model: "ALIAS 603 BM", defaultPriceText: "상담문의", features: "유럽 감성을 담아낸 프리미엄 인덕션", isHandled: true },
  { id: "p_haatz_smartwheel", brand: "하츠", category: "주방 가전", name: "스마트휠 인덕션", model: "IH-360S", defaultPriceText: "상담문의", features: "휠 컨트롤의 직관적인 조작", isHandled: true },
  { id: "p_haatz_sandwhite", brand: "하츠", category: "주방 가전", name: "샌드화이트 인덕션", model: "EIC-30HWR253", defaultPriceText: "상담문의", features: "포근한 샌드화이트 컬러", isHandled: true },
  { id: "p_haatz_ruin", brand: "하츠", category: "주방 가전", name: "루인 인덕션 3구", model: "IH-362RN", defaultPriceText: "상담문의", features: "미니멀 블랙 디자인", isHandled: true },
  { id: "p_haatz_vero", brand: "하츠", category: "주방 가전", name: "베로 인덕션 3구", model: "IH-361VR", defaultPriceText: "상담문의", features: "가성비 뛰어난 베이직 인덕션", isHandled: true },
  { id: "p_haatz_hybrid", brand: "하츠", category: "주방 가전", name: "하이브리드 3구", model: "IH-366DTL", defaultPriceText: "상담문의", features: "인덕션과 하이라이트의 조화", isHandled: true },
  { id: "p_haatz_gas_hybrid", brand: "하츠", category: "주방 가전", name: "가스 하이브리드 3구", model: "GIC-3602GARH-01", defaultPriceText: "상담문의", features: "요리를 즐겁게 만드는 가스 쿡탑", isHandled: true },
  { id: "p_haatz_oven_b3402", brand: "하츠", category: "주방 가전", name: "빌트인 전기오븐", model: "EV-B3402B", defaultPriceText: "상담문의", features: "빌트인 맞춤 대용량 오븐", isHandled: true },

  // --- HAATZ SINKS & FAUCETS ---
  { id: "p_haatz_faucet_301", brand: "하츠", category: "빌트인 수전/싱크볼", name: "폰테 수전 301", model: "FC-UB300", defaultPriceText: "상담문의", features: "감각적인 디자인과 실용성을 담은 프리미엄 수전", isHandled: true },
  { id: "p_haatz_faucet_212", brand: "하츠", category: "빌트인 수전/싱크볼", name: "폰테 수전 212", model: "FC-US600", defaultPriceText: "상담문의", features: "부드러운 실리콘 자바라", isHandled: true },
  { id: "p_haatz_sink_980", brand: "하츠", category: "빌트인 수전/싱크볼", name: "폰테 사각싱크볼 (엠보리폼 980)", model: "HZ-EW9802SF", defaultPriceText: "상담문의", features: "은은한 엠보 텍스처로 스크래치 방지", isHandled: true },
  { id: "p_haatz_sink_950", brand: "하츠", category: "빌트인 수전/싱크볼", name: "폰테 사각싱크볼 (엠보리폼 950)", model: "HZ-EW9502SF", defaultPriceText: "상담문의", features: "가장 인기있는 표준 규격 사각볼", isHandled: true },

  // --- HIMPEL (환기시스템 및 욕실 환풍기) ---
  { id: "p_himpel_hueven_eco", brand: "힘펠", category: "환기 시스템", name: "휴벤 Eco (천장형)", model: "HRD-200EPI", defaultPriceText: "상담문의", features: "전열교환기 환기 제품 1대로 전실 환기", isHandled: true },
  { id: "p_himpel_hueven_ebsn", brand: "힘펠", category: "환기 시스템", name: "휴벤 EBSN", model: "HRD-EP100IBSN", defaultPriceText: "상담문의", features: "고효율 에너지 회수 환기장치", isHandled: true },
  { id: "p_himpel_hueven_c3", brand: "힘펠", category: "환기 시스템", name: "휴벤 C3 (카세트형)", model: "HRD3-100PLC", defaultPriceText: "상담문의", features: "매일 신선한 공기로 모든 공간의 공기를 새롭게 디자인", isHandled: true },
  { id: "p_himpel_hueven_s", brand: "힘펠", category: "환기 시스템", name: "휴벤 S (스탠드형)", model: "HRD2-1000EGS", defaultPriceText: "상담문의", features: "다중이용시설을 위한 스탠드형 환기시스템", isHandled: true },
  { id: "p_himpel_fhd3", brand: "힘펠", category: "욕실 환기가전", name: "휴젠뜨 3", model: "FHD3-C150P", defaultPriceText: "상담문의", features: "음성안내, 블루투스 스피커 연동, 스마트 제어", isHandled: true },
  { id: "p_himpel_palette", brand: "힘펠", category: "욕실 환기가전", name: "휴젠뜨 팔레트", model: "FHD2-C150P_PALETTE", defaultPriceText: "상담문의", features: "5가지 컬러 그릴, 뮤직테라피", isHandled: true },
  { id: "p_himpel_lumi", brand: "힘펠", category: "욕실 환기가전", name: "휴젠뜨 루미", model: "FHD3-C150P_LUMI", defaultPriceText: "상담문의", features: "IoT 기술로 완성하는 스마트 욕실 솔루션", isHandled: true },
  { id: "p_himpel_nova", brand: "힘펠", category: "욕실 환기가전", name: "휴젠뜨 노바", model: "FHD2-C150P_NOVA", defaultPriceText: "상담문의", features: "365일 산뜻한 욕실공간 유지", isHandled: true },
  { id: "p_himpel_zeroc_fabric", brand: "힘펠", category: "욕실 환기가전", name: "제로크 패브릭", model: "FZD1-C80M_F", defaultPriceText: "상담문의", features: "욕실 인테리어의 또 하나의 오브제", isHandled: true },
  { id: "p_himpel_zeroc_p", brand: "힘펠", category: "욕실 환기가전", name: "제로크 P", model: "FZD-C160N", defaultPriceText: "상담문의", features: "세계 최초 10단 제어 정풍량 구현", isHandled: true },
  { id: "p_himpel_zeroc_zion", brand: "힘펠", category: "욕실 환기가전", name: "제로크 자이온", model: "FZD-C160", defaultPriceText: "상담문의", features: "강력한 배기 성능", isHandled: true },
  { id: "p_himpel_zeroc_libo", brand: "힘펠", category: "욕실 환기가전", name: "제로크 리보", model: "FZD-C80", defaultPriceText: "상담문의", features: "가성비 뛰어난 고정압 환풍기", isHandled: true },
  { id: "p_himpel_dehumidifier", brand: "힘펠", category: "생활 에어가전", name: "빌트인 제습기", model: "DHV-5PCCU", defaultPriceText: "상담문의", features: "365일 냄새, 곰팡이 걱정없는 빌트인 제습기", isHandled: true },
  { id: "p_himpel_air_cleaner", brand: "힘펠", category: "생활 에어가전", name: "현관 청정시스템", model: "AD1-200ICV", defaultPriceText: "상담문의", features: "미세먼지 없는 우리집, 현관부터 쾌적하게!", isHandled: true },
  { id: "p_himpel_co2_monitor", brand: "힘펠", category: "생활 에어가전", name: "CO2 모니터 2", model: "HUEVEN-RS_W", defaultPriceText: "상담문의", features: "작고 간편하게 실내공기 실시간 모니터링", isHandled: true }
];

// Helper to assign a fallback catalog image
const getLevel1Image = (brand) => {
  if (brand === "하츠") return "/images/catalog/haatz/haatz_page_15.jpg";
  if (brand === "힘펠") return "/images/catalog/himpel/himpel_page_37.jpg";
  return "/images/catalog/placeholder.jpg";
};

// Reset products array to ensure deduplication and proper mapping
data.products = [];

for (const np of fullCatalog) {
  // specific page mapping logic for known models
  let imgPath = getLevel1Image(np.brand);
  if (np.id === "p_haatz_hsh90") imgPath = "/images/catalog/haatz/haatz_page_5.jpg";
  if (np.id === "p_terra" || np.id === "p_haatz_madera") imgPath = "/images/catalog/haatz/haatz_page_15.jpg";
  if (np.id === "p_hurricane") imgPath = "/images/catalog/haatz/haatz_page_41.jpg";
  if (np.id === "p_haatz_eic30" || np.id === "p_haatz_alias") imgPath = "/images/catalog/haatz/haatz_page_11.jpg";
  if (np.id === "p_himpel_fhd3") imgPath = "/images/catalog/himpel/himpel_page_37.jpg";
  if (np.id === "p_tioram") imgPath = "/images/catalog/himpel/himpel_page_31.jpg";
  
  data.products.push({
    id: np.id,
    brand: np.brand,
    category: np.category,
    name: np.name,
    model: np.model,
    features: np.features,
    defaultPriceText: np.defaultPriceText,
    isHandled: np.isHandled,
    detailLink: `./catalog_detail.html?id=${np.id}`,
    details: {
      level1: { 
        type: "official", 
        images: [imgPath] 
      },
      level2: { 
        type: "custom", 
        html: "", 
        images: [],
        videoUrls: [] 
      },
      level3: { 
        type: "advanced", 
        text: "",
        threeJsModel: "" 
      }
    }
  });
}

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
console.log(`✅ SUCCESS: data.json completely updated with ${fullCatalog.length} catalog products! (100% Deduplicated, Preserved Legacy IDs)`);
