const fs = require('fs');

const dataPath = '../data.json';
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Generate catalog products from OCR data
const catalogProducts = [
  // --- HAATZ HOODS ---
  { id: "p_terra", brand: "하츠", category: "주방 후드", name: "테라 주방후드", model: "DTR-90-MSHZ", defaultPriceText: "350,000원", features: "주방 공기를 쾌적하게", isHandled: true },
  { id: "p_hurricane", brand: "하츠", category: "주방 후드", name: "허리케인 주방후드", model: "HRH90S", defaultPriceText: "350,000원", features: "강력한 흡입력", isHandled: true },
  { id: "p_haatz_hsh90", brand: "하츠", category: "주방 후드", name: "허리케인 스노우", model: "HSH-90WHCI", defaultPriceText: "상담문의", features: "심플함과 모던한 디자인으로 깨끗한 주방 연출", isHandled: true },
  { id: "p_haatz_madera", brand: "하츠", category: "주방 후드", name: "마데라", model: "PMA-90WHCI", defaultPriceText: "상담문의", features: "도장강판 (무광) + 우드 (화이트오크)", isHandled: true },
  { id: "p_haatz_castle", brand: "하츠", category: "주방 후드", name: "캐슬", model: "PCS-90WHCI", defaultPriceText: "상담문의", features: "도장강판 (무광) + 우레탄", isHandled: true },
  { id: "p_haatz_nova", brand: "하츠", category: "주방 후드", name: "노바", model: "INA-90WHCI", defaultPriceText: "상담문의", features: "세련된 디자인과 강력한 흡입력", isHandled: true },
  { id: "p_haatz_moa", brand: "하츠", category: "주방 후드", name: "모아", model: "SMA-60GCI", defaultPriceText: "상담문의", features: "플루티드 유리의 우아함", isHandled: true },
  { id: "p_haatz_elica_era", brand: "하츠", category: "주방 후드", name: "엘리카 ERA S 600/800", model: "ERA S 600/800", defaultPriceText: "상담문의", features: "이태리 감성과 기술력의 집약", isHandled: true },
  { id: "p_haatz_elica_illusion", brand: "하츠", category: "주방 후드", name: "엘리카 ILLUSION", model: "ILLUSION", defaultPriceText: "상담문의", features: "혁신적인 디자인의 엘리카 컬렉션", isHandled: true },
  { id: "p_haatz_elica_fold", brand: "하츠", category: "주방 후드", name: "엘리카 FOLD 600/800", model: "FOLD", defaultPriceText: "상담문의", features: "혁신적인 디자인의 엘리카 컬렉션", isHandled: true },
  
  // --- HAATZ COOKTOPS ---
  { id: "p_haatz_eic30", brand: "하츠", category: "주방 가전", name: "클레르 인덕션", model: "EIC-30HWR252", defaultPriceText: "상담문의", features: "공간에 자연스럽게 스며드는 화이트 감성", isHandled: true },
  { id: "p_haatz_alias", brand: "하츠", category: "주방 가전", name: "알리아스 인덕션 3구", model: "ALIAS 603 BM", defaultPriceText: "상담문의", features: "유럽 감성을 담아낸 프리미엄 인덕션", isHandled: true },
  { id: "p_haatz_sandwhite", brand: "하츠", category: "주방 가전", name: "샌드화이트 인덕션", model: "EIC-30HWR253", defaultPriceText: "상담문의", features: "공간에 자연스럽게 스며드는 샌드화이트 감성", isHandled: true },
  { id: "p_haatz_hybrid", brand: "하츠", category: "주방 가전", name: "하이브리드 3구", model: "IH-366DTL", defaultPriceText: "상담문의", features: "인덕션과 하이라이트의 조화", isHandled: true },
  { id: "p_haatz_gas_hybrid", brand: "하츠", category: "주방 가전", name: "가스 하이브리드 3구", model: "GIC-3602GARH-01", defaultPriceText: "상담문의", features: "요리를 즐겁게 만드는 가스 쿡탑", isHandled: true },
  
  // --- HAATZ BUILT-IN ---
  { id: "p_sink", brand: "하츠", category: "빌트인 수전/싱크볼", name: "사각씽크볼 세트", model: "폰테사각볼엠보 세트", defaultPriceText: "550,000원", features: "올스텐 배수구, 폭포수전 세트", isHandled: true },
  { id: "p_1784139265988", brand: "하츠", category: "빌트인 수전/싱크볼", name: "씽크볼 수전 폰테 206", model: "폰테206", defaultPriceText: "130,000원", features: "감각적인 디자인과 실용성", isHandled: true },
  { id: "p_haatz_faucet_301", brand: "하츠", category: "빌트인 수전/싱크볼", name: "폰테 수전 301", model: "FC-UB300", defaultPriceText: "상담문의", features: "감각적인 디자인과 실용성을 모두 담은 프리미엄 수전", isHandled: true },
  { id: "p_haatz_faucet_212", brand: "하츠", category: "빌트인 수전/싱크볼", name: "폰테 수전 212", model: "FC-US600", defaultPriceText: "상담문의", features: "감각적인 워싱존 완성", isHandled: true },
  { id: "p_haatz_sink_980", brand: "하츠", category: "빌트인 수전/싱크볼", name: "폰테 사각싱크볼 (엠보리폼980)", model: "HZ-EW9802SF", defaultPriceText: "상담문의", features: "은은한 엠보 텍스처로 스크래치 부담 줄임", isHandled: true },
  { id: "p_haatz_pantry_tall", brand: "하츠", category: "부자재 및 하드웨어", name: "하츠 팬트리 키큰 수납장", model: "팬트리장", defaultPriceText: "상담문의", features: "공간 효율을 높여주는 감각적인 수납 솔루션", isHandled: true },
  { id: "p_haatz_pantry_base", brand: "하츠", category: "부자재 및 하드웨어", name: "하츠 팬트리 하부 수납장 (땅콩장)", model: "하부수납장", defaultPriceText: "상담문의", features: "코너 공간까지 효율적으로 활용하는 스마트 수납", isHandled: true },

  // --- HIMPEL ---
  { id: "p_tioram", brand: "힘펠", category: "욕실 환기가전", name: "티오람 미니", model: "복합환풍기", defaultPriceText: "195,000원", features: "배기/냄새차단/제습/온풍/자연풍", isHandled: true },
  { id: "p_vent_medium", brand: "힘펠", category: "욕실 환기가전", name: "플렉스댐퍼 일반 환풍기(중형)", model: "C2-100LFMD", defaultPriceText: "120,000원", features: "저소음 / 고기밀 모터댐퍼 / 냄새 완벽 차단", isHandled: true },
  { id: "p_vent_large", brand: "힘펠", category: "욕실 환기가전", name: "제로크 MD 일반 환풍기(대형)", model: "HV3-80-X(MD-N)", defaultPriceText: "140,000원", features: "정풍량 인증 / 2-WAY 확장배기(옵션) / 냄새 차단", isHandled: true },
  { id: "p_himpel_fhd3", brand: "힘펠", category: "욕실 환기가전", name: "휴젠뜨 3", model: "FHD3-C150P", defaultPriceText: "상담문의", features: "음성안내, 블루투스 스피커 연동, 스마트 제어", isHandled: true },
  { id: "p_himpel_palette", brand: "힘펠", category: "욕실 환기가전", name: "휴젠뜨 팔레트", model: "FHD2-C150P_PALETTE", defaultPriceText: "상담문의", features: "5가지 컬러 그릴, 뮤직테라피", isHandled: true },
  { id: "p_himpel_lumi", brand: "힘펠", category: "욕실 환기가전", name: "휴젠뜨 루미", model: "FHD3-C150P_LUMI_T0000", defaultPriceText: "상담문의", features: "IoT 기술로 완성하는 스마트 욕실 솔루션", isHandled: true },
  { id: "p_himpel_nova", brand: "힘펠", category: "욕실 환기가전", name: "휴젠뜨 노바", model: "FHD2-C150P_NOVA", defaultPriceText: "상담문의", features: "365일 산뜻한 욕실공간", isHandled: true },
  { id: "p_himpel_zeroc_fabric", brand: "힘펠", category: "욕실 환기가전", name: "제로크 패브릭", model: "FZD1-C80M_F", defaultPriceText: "상담문의", features: "욕실 인테리어의 또 하나의 오브제", isHandled: true },
  { id: "p_himpel_zeroc_p", brand: "힘펠", category: "욕실 환기가전", name: "제로크 P", model: "FZD-C160N", defaultPriceText: "상담문의", features: "세계 최초 10단 제어 정풍량 구현", isHandled: true },
  { id: "p_himpel_hueven_eco", brand: "힘펠", category: "환기 시스템", name: "휴벤 Eco (천장형)", model: "HRD-200EPI", defaultPriceText: "상담문의", features: "환기 제품 1대로 전실 환기, 각실 맞춤 제어", isHandled: true },
  { id: "p_himpel_hueven_c3", brand: "힘펠", category: "환기 시스템", name: "휴벤 C3 (카세트형)", model: "HRD3-100PLC", defaultPriceText: "상담문의", features: "매일 신선한 공기로 모든 공간의 공기를 새롭게 디자인", isHandled: true },
  { id: "p_himpel_hueven_s", brand: "힘펠", category: "환기 시스템", name: "휴벤 S (스탠드형)", model: "HRD2-1000EGS", defaultPriceText: "상담문의", features: "다중이용시설을 위한 스탠드형 환기시스템", isHandled: true },
  { id: "p_himpel_dehumidifier", brand: "힘펠", category: "생활 에어가전", name: "빌트인 제습기", model: "DHV-5PCCU", defaultPriceText: "상담문의", features: "365일 냄새, 곰팡이 걱정없는 빌트인 제습기", isHandled: true },
  { id: "p_himpel_air_cleaner", brand: "힘펠", category: "생활 에어가전", name: "현관 청정시스템", model: "AD1-200ICV", defaultPriceText: "상담문의", features: "미세먼지 없는 우리집, 현관부터 쾌적하게!", isHandled: true },
  { id: "p_himpel_co2_monitor", brand: "힘펠", category: "생활 에어가전", name: "CO2 모니터 2", model: "HUEVEN-RS_W", defaultPriceText: "상담문의", features: "작고 간편하게 실내공기 관리", isHandled: true }
];

// Helper to determine image based on PDF pages
const getLevel1Image = (id) => {
  // Mapping logic:
  // p_terra -> haatz page 15
  // p_hurricane -> haatz page 41
  // p_haatz_hsh90 -> haatz page 5
  // p_haatz_madera -> haatz page 15
  // p_haatz_castle -> haatz page 15
  // p_haatz_nova -> haatz page 9
  // p_haatz_moa -> haatz page 9
  // p_haatz_elica_era -> haatz page 21
  // p_haatz_elica_illusion -> haatz page 21
  // p_haatz_elica_fold -> haatz page 21
  // p_haatz_eic30 -> haatz page 5
  // p_haatz_alias -> haatz page 11
  // p_haatz_sandwhite -> haatz page 11
  // p_haatz_hybrid -> haatz page 35
  // p_haatz_gas_hybrid -> haatz page 71
  // p_sink -> haatz page 83
  // p_1784139265988 -> haatz page 7
  // p_haatz_faucet_301 -> haatz page 7
  // p_haatz_faucet_212 -> haatz page 7
  // p_haatz_sink_980 -> haatz page 7
  // p_haatz_pantry_tall -> haatz page 7
  // p_haatz_pantry_base -> haatz page 7
  // p_tioram -> himpel page 31
  // p_vent_medium -> himpel page 67
  // p_vent_large -> himpel page 51
  // p_himpel_fhd3 -> himpel page 37
  // p_himpel_palette -> himpel page 41
  // p_himpel_lumi -> himpel page 35
  // p_himpel_nova -> himpel page 39
  // p_himpel_zeroc_fabric -> himpel page 45
  // p_himpel_zeroc_p -> himpel page 47
  // p_himpel_hueven_eco -> himpel page 13
  // p_himpel_hueven_c3 -> himpel page 19
  // p_himpel_hueven_s -> himpel page 29
  // p_himpel_dehumidifier -> himpel page 85
  // p_himpel_air_cleaner -> himpel page 87
  // p_himpel_co2_monitor -> himpel page 89
  
  const map = {
    "p_terra": "/images/catalog/haatz/haatz_page_15.jpg",
    "p_hurricane": "/images/catalog/haatz/haatz_page_41.jpg",
    "p_haatz_hsh90": "/images/catalog/haatz/haatz_page_5.jpg",
    "p_haatz_madera": "/images/catalog/haatz/haatz_page_15.jpg",
    "p_haatz_castle": "/images/catalog/haatz/haatz_page_15.jpg",
    "p_haatz_nova": "/images/catalog/haatz/haatz_page_9.jpg",
    "p_haatz_moa": "/images/catalog/haatz/haatz_page_9.jpg",
    "p_haatz_elica_era": "/images/catalog/haatz/haatz_page_21.jpg",
    "p_haatz_elica_illusion": "/images/catalog/haatz/haatz_page_21.jpg",
    "p_haatz_elica_fold": "/images/catalog/haatz/haatz_page_21.jpg",
    "p_haatz_eic30": "/images/catalog/haatz/haatz_page_5.jpg",
    "p_haatz_alias": "/images/catalog/haatz/haatz_page_11.jpg",
    "p_haatz_sandwhite": "/images/catalog/haatz/haatz_page_11.jpg",
    "p_haatz_hybrid": "/images/catalog/haatz/haatz_page_35.jpg",
    "p_haatz_gas_hybrid": "/images/catalog/haatz/haatz_page_71.jpg",
    "p_sink": "/images/catalog/haatz/haatz_page_83.jpg",
    "p_1784139265988": "/images/catalog/haatz/haatz_page_7.jpg",
    "p_haatz_faucet_301": "/images/catalog/haatz/haatz_page_7.jpg",
    "p_haatz_faucet_212": "/images/catalog/haatz/haatz_page_7.jpg",
    "p_haatz_sink_980": "/images/catalog/haatz/haatz_page_7.jpg",
    "p_haatz_pantry_tall": "/images/catalog/haatz/haatz_page_7.jpg",
    "p_haatz_pantry_base": "/images/catalog/haatz/haatz_page_7.jpg",
    
    "p_tioram": "/images/catalog/himpel/himpel_page_31.jpg",
    "p_vent_medium": "/images/catalog/himpel/himpel_page_67.jpg",
    "p_vent_large": "/images/catalog/himpel/himpel_page_51.jpg",
    "p_himpel_fhd3": "/images/catalog/himpel/himpel_page_37.jpg",
    "p_himpel_palette": "/images/catalog/himpel/himpel_page_41.jpg",
    "p_himpel_lumi": "/images/catalog/himpel/himpel_page_35.jpg",
    "p_himpel_nova": "/images/catalog/himpel/himpel_page_39.jpg",
    "p_himpel_zeroc_fabric": "/images/catalog/himpel/himpel_page_45.jpg",
    "p_himpel_zeroc_p": "/images/catalog/himpel/himpel_page_47.jpg",
    "p_himpel_hueven_eco": "/images/catalog/himpel/himpel_page_13.jpg",
    "p_himpel_hueven_c3": "/images/catalog/himpel/himpel_page_19.jpg",
    "p_himpel_hueven_s": "/images/catalog/himpel/himpel_page_29.jpg",
    "p_himpel_dehumidifier": "/images/catalog/himpel/himpel_page_85.jpg",
    "p_himpel_air_cleaner": "/images/catalog/himpel/himpel_page_87.jpg",
    "p_himpel_co2_monitor": "/images/catalog/himpel/himpel_page_89.jpg"
  };
  
  return map[id] || "/images/catalog/placeholder.jpg";
};

// Clear old products to fully replace, but we keep the new structure
data.products = [];

for (const np of catalogProducts) {
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
        images: [getLevel1Image(np.id)] 
      },
      level2: { 
        type: "custom", 
        html: "", 
        images: [],
        videoUrls: [] // For user requested video support
      },
      level3: { 
        type: "advanced", 
        text: "",
        threeJsModel: "" // For future 3D model support
      }
    }
  });
}

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
console.log(`✅ data.json replaced with ${catalogProducts.length} catalog products! (New schema included)`);
