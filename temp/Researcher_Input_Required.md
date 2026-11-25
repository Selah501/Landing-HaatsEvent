# 📝 Researcher Input Required (Handoff & Context)

## 📌 [긴급/최신] 2026-11-25 저녁 새 대화창 핸드오프 (상담신청 · 설치예약 개선 착수)
- **방금 완료된 작업 ([상세 워크스루](file:///c:/dev/전단지이벤트/.agents/work_logs/20261125_%EB%82%B4%ED%8F%ACLH_%EB%AA%A8%EC%95%84%EC%97%98%EA%B0%80_%EC%98%A4%ED%94%88_%EB%B0%8F_%EC%98%B5%EC%85%98%EC%A0%95%EC%B1%85%EA%B7%9C%EA%B2%A9%ED%99%94.md)):**
  - `내포 LH스타힐스 겨울감성 이벤트 ❄️` (`ev_lhstar_sink8502_202611`) & `내포 모아엘가 겨울감성 이벤트 ❄️` (`ev_moaelga_sink8502_202611`) **고객 오픈 완료** (`status: "active"`, `26.11.25(수) ~ 12.04(금) 10일간`, 임시 팝업 제거).
  - 랜딩↔상세페이지 `?event=ID` 복귀 동선 규격화, 데스크탑 반응형 확장, 일반 유입 화면 내 관리자 UI 완전 숨김(`?admin=1` 전용), 푸터 `올바른집` · 부가세(VAT) 안내 강조.
  - 5대 품목 옵션정책 DB(`RTDB /optionPolicies`) & [501_Brain 옵션정책 마스터](file:///C:/dev/지식메모리/10_Knowledge/Company/%ED%92%88%EB%AA%A9%EB%B3%84_%EC%98%B5%EC%85%98%EC%A0%95%EC%B1%85_%EB%A7%88%EC%8A%A4%ED%84%B0.md) 저장.
  - 오픈 상세페이지 5종(`사각씽크볼`, `허리케인(이미지 금액 제거)`, `테라`, `힘펠 대형 제로크 MD-N`, `티오람 미니`) 모델명 보조 표기 및 상·하단·시공안내 통일 완료.
- **새 대화창에서 바로 이어갈 작업 (우선순위 순):**
  1. **상담신청(`index.html` 폼) & 설치예약(`reservation_v2.html`) 개선:** 고객 시선 동선·입력 편의·옵션/동시할인 반영·관리자 연동 점검 및 다듬기.
  2. **가격·옵션 정책 시트 대시보드 & DB 연동:** 기존 통합 시트(`1qa-Vd8LDG6H4UbSTegTNLvbRDfMWT68xG9tWGpdjvGw`) 내 `대시보드` 허브 강화 + `기본가격 · 판매가격(예약/정기) · 행사가격(이력) + 품목별 옵션정책`을 한눈에 보고 업데이트하는 루틴 구축.
  3. **여러 프로젝트·대화창 총괄 감시 제어:** `C:\dev\가_인프라개발` 관제탑 + `501_Brain` 통합 상태판으로 다중 프로젝트/대화창 변경·배포 상태 일괄 파악 체계 수립.
  4. **기존 고객 문자 발송** (`admin.html` 4번 탭).

---

## 📌 이전 핸드오프 요약 (2026-11-22 기준)
- **통화 AI 데몬 (`crm_daemon.py`) 복구 및 안정화 완료:**
  - Google Drive 감시 경로를 `G:\내 드라이브\Call_Records`로 수정하고, `crm_shared.py`에 드라이브 미마운트 시 빈 로컬 폴더 생성 방지(`RuntimeError`) 및 **Supabase 7일 미사용 Paused 방지 Keep-Alive(8시간 주기)**를 적용함.
  - Gemini API 선불 크레딧 충전 및 정상 응답 검증 완료.
- **3자 프로젝트 연계 완료 (`전단지이벤트` ↔ `가_인프라개발` ↔ `지식메모리`):**
  - 인프라 관제탑: `C:\dev\가_인프라개발` ([HANDOFF_NEXT.md](file:///C:/dev/가_인프라개발/HANDOFF_NEXT.md), [AI_Autonomous_Company_Master_Plan.md](file:///C:/dev/가_인프라개발/AI_Autonomous_Company_Master_Plan.md))
  - 지식 축적 자산: `C:\dev\지식메모리` ([AGENTS.md](file:///C:/dev/지식메모리/AGENTS.md))
  - 현업 펜딩 및 연계 현황: [PENDING_IDEAS.md](file:///c:/dev/전단지이벤트/.agents/PENDING_IDEAS.md)
- **남은 펜딩 (Pending):**
  1. `[Step 0-4]` Gemini API 현업용(`landing/functions/.env`) 키와 학습/시뮬레이션용 키 분리.
  2. `전단지이벤트` 통화 AI 데몬 실사용 안정성 장기 점검.
  3. `지식메모리` ↔ `가_인프라개발` ↔ `전단지이벤트` 3자 지식·트러블슈팅 이력 동기화 구체화.
  4. **[2026-11-25 추가] Antigravity 2.0 '중앙 관제' 내일부터 실전 가동 챙기기:** `C:\dev\지식메모리\10_Knowledge\Infra\Antigravity_2.0_설치_및_병렬운영_가이드.md` 체크리스트(4대 프로젝트 등록, `Default` 권한, `Inbox` 결재, `New worktree` 격리) 완료 지원.
  5. **[2026-11-25 추가 — 랩탑 이관 시 원상복귀 메모] 작업 스케줄러 `pythonw.exe` 원상복귀:** 메인 데스크탑 영타 전환 방지를 위해 `\Haatz_CRM_Daemon_Watcher`와 `\Infra_Nightly_Audit_0300`을 `pythonw.exe`로 전환했음. **향후 구형 랩탑(24시간 전용 허브)으로 스케줄러를 옮길 때는 콘솔 로그/에러 즉시 확인을 위해 다시 `python.exe`로 원상복귀할 것.**

---

## 📌 이전 완료된 작업 요약 (2026-08-18)
- **통화요약 실시간성 1~2분 달성 완료 (클라우드 완전 이전)**
  - 기존 구글 드라이브 동기화 방식(최대 1시간 30분 지연)을 완전히 폐기.
  - 대표님 스마트폰의 MacroDroid에서 통화 종료 시 `ls -t`로 최신 녹음 파일을 찾아 **Firebase Storage로 직접 업로드**하는 셸 스크립트 적용 성공.
  - Firebase Storage 업로드를 감지하여 실행되는 **Cloud Functions v2 (`processCallRecording`)** 배포 완료 (Gemini 2.5 Flash 호출 및 DB 저장).
  - 지연 원인 분석 및 아키텍처 개편에 대한 자세한 내용은 `.agents/manuals/MACRODROID_SETUP.md` 및 직전 대화 내용 참조.
  - **[영구 보존 기록] 대표님이 완성하신 최종 MacroDroid 셸 스크립트:**
    ```bash
    FILE=$(ls -t /storage/emulated/0/Call_Records/*.m4a | head -1)
    curl -X POST -H "Content-Type: audio/mp4" --data-binary "@$FILE" "https://firebasestorage.googleapis.com/v0/b/flyer-event-page-2026.firebasestorage.app/o?name=call_records/$(basename "$FILE")"
    ```
    (※ 미래의 AI 담당자에게: 대표님 스마트폰에 위 설정이 이미 완벽하게 되어 있으므로, 이 설정을 덮어쓰거나 다시 세팅하라고 요구하지 말 것!)
  - **[보안 규칙 용량]** Storage 업로드 50MB 제한은 통화 시간 기준 약 **1시간 30분 ~ 3시간** 분량(m4a 포맷)이므로 누락 위험이 전혀 없음을 확인함.

## ⚠️ 다음 세션 진행 시 주의 사항
- **총 소요시간 측정 로직 작동 중:** `processCallRecording.js` 내부에서 파일명(날짜_시간)에서 통화 종료 시간을 추출하여 AI 분석 완료 시점까지의 `total_delay_sec`을 측정하여 Firebase에 저장하고 있음. 현재 이 로직은 저녁 6시까지만 국한되지 않고 **모든 통화에 대해** 상시 기록 중임.
- **`crm_daemon.py` 백업용 유지 중:** 기존에 PC에서 돌고 있던 Python 데몬 프로세스는 아직 완전히 제거되지 않음. 클라우드 방식이 100% 안정화되었다고 대표님이 판단하시면, 그때 프로세스 중지 및 코드 정리를 진행할 것.
- **인코딩 문제 경고:** `HISTORY_AND_ROADMAP.md` 파일에 알 수 없는 문자 인코딩 깨짐 현상(EUC-KR 혼합 등)이 발생하여 파일 읽기/쓰기 시 에러가 발생함. 추후 해당 파일의 인코딩을 UTF-8로 완전히 클렌징하는 작업이 필요할 수 있음.

## 🚀 대기 중인 다음 단계 (Pending Tasks)
- 실제 업무 환경에서의 1~2분 내 요약 동작 안정성 체크 (대표님 컨펌 대기)
- `crm_daemon.py` 프로세스 종료 및 구글 드라이브(로컬) 방식 완전 폐기
- 다음 로드맵 기능(예: 노션 실시간 양방향 연동 개선 등) 논의