# 하츠 전단지 이벤트 랜딩 페이지

하츠 충남대리점의 아파트 단지 타겟 한정 판매 이벤트를 위한 모바일 친화적 랜딩 페이지입니다.

## 주요 기능

- **메인 페이지 (`index.html`)**: 
  - 현재 진행 중인 아파트 이벤트 목록 확인
  - 간편 상담 예약 폼 제공 (Google Sheets 자동 연동)
- **제품 상세 페이지 (`products/tioram-mini.html`)**: 
  - 하츠 티오람 미니(Tioram Mini) 제품 스펙 및 핵심 기능 안내
  - 제품 홍보 영상 재생 (`<video>` 태그 활용)
  - 하단 고정(Sticky) 네비게이션 버튼 적용
- **안내 페이지 (`guide/work-and-payment.html`)**: 
  - 5단계 표준 시공 공정 안내
  - 결제 방식 및 특별가 표시

## 기술 스택

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend/DB**: Google Apps Script (폼 데이터 수집)
- **Deploy**: Firebase Hosting

## 폴더 구조

```text
├── public/
│   ├── index.html                  # 메인 이벤트 페이지
│   ├── style.css                   # 공통 스타일시트
│   ├── products/
│   │   └── tioram-mini.html        # 제품 상세 페이지
│   ├── guide/
│   │   └── work-and-payment.html   # 시공 및 결제 안내 페이지
│   └── videos/
│       └── tioram-mini.mp4         # 로컬 비디오 파일
├── firebase.json                   # Firebase 호스팅 설정 파일
└── README.md                       # 프로젝트 설명 문서
```

## 배포 방법

Firebase CLI를 사용하여 퍼블릭 디렉토리를 배포합니다.

```bash
firebase deploy --only hosting
```
