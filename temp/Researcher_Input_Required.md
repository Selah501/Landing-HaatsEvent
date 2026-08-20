# 📝 Researcher Input Required (Handoff & Context)

## 📌 최근 완료된 작업 요약 (2026-08-18)
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