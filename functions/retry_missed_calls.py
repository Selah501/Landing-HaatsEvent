# =====================================================================
# retry_missed_calls.py
# 목적: API 장애 기간(260809~260811) 동안 처리 실패한 통화 녹음 파일
#       소급 재처리 스크립트 (1회성 실행용)
# 실행 전 crm_daemon.py를 반드시 종료할 것
# =====================================================================

import os
import sys

if sys.stdout is None:
    import io
    sys.stdout = io.StringIO()
    sys.stderr = io.StringIO()
elif sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

import re
import time
from crm_shared import WATCH_DIR, process_audio_file, logger

SLEEP_BETWEEN = 10  # API Rate Limit 방지용 대기 시간(초)

# 장애 기간 날짜 범위 (파일명 기준, 6자리 YYMMDD 포맷)
DATE_FROM = "260809"
DATE_TO   = "260811"  # 포함

def get_missed_files():
    """장애 기간에 해당하는 미처리(non-.done) .m4a 파일 리스트 반환"""
    missed = []
    for filename in os.listdir(WATCH_DIR):
        # .done이 붙은 파일 제외, temp 파일 제외
        if filename.endswith(".done") or filename.startswith("temp_upload_"):
            continue
        ext = os.path.splitext(filename)[1].lower()
        if ext not in ['.m4a', '.mp3', '.wav', '.amr']:
            continue
        # 파일명에서 날짜 추출 (YYMMDD 형식)
        match = re.search(r'_(\d{6})_', filename)
        if match:
            file_date = match.group(1)
            if DATE_FROM <= file_date <= DATE_TO:
                missed.append(os.path.join(WATCH_DIR, filename))
        # 날짜 패턴 없는 파일은 안전하게 제외 (소급 대상 아님)
    return sorted(missed)

def main():
    missed_files = get_missed_files()
    total = len(missed_files)
    
    if total == 0:
        logger.info("✅ 소급 처리할 파일이 없습니다. 이미 모두 처리되었습니다.")
        return

    logger.info(f"\n🔍 총 {total}건의 누락 파일 발견. 소급 처리를 시작합니다...\n")
    success_count = 0
    fail_count = 0

    for i, filepath in enumerate(missed_files, 1):
        logger.info(f"\n[{i}/{total}] 처리 중: {os.path.basename(filepath)}")
        try:
            process_audio_file(filepath)
            success_count += 1
        except Exception as e:
            logger.error(f"  ❌ 실패: {e}")
            fail_count += 1
        
        if i < total:  # 마지막 파일 처리 후에는 대기 불필요
            logger.info(f"  ⏳ Rate Limit 방지 대기 중 ({SLEEP_BETWEEN}초)...")
            time.sleep(SLEEP_BETWEEN)

    logger.info(f"\n{'='*50}")
    logger.info(f"✅ 소급 처리 완료 결과:")
    logger.info(f"   성공: {success_count}건 / 실패: {fail_count}건 / 전체: {total}건")
    logger.info(f"{'='*50}")

if __name__ == "__main__":
    main()
