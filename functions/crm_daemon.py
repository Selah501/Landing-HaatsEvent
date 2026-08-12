import os
import sys
import time
import re
import ctypes
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# Windows 환경에서 한글 출력 오류 방지
if sys.stdout is None:
    import io
    sys.stdout = io.StringIO()
    sys.stderr = io.StringIO()
elif sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

# 공통 모듈 임포트
from crm_shared import WATCH_DIR, process_audio_file, logger

PID_FILE = os.path.join(os.path.dirname(__file__), "crm_daemon.pid")
HEARTBEAT_FILE = os.path.join(os.path.dirname(__file__), "crm_daemon_heartbeat.txt")

def is_already_running():
    if os.path.exists(PID_FILE):
        try:
            with open(PID_FILE) as f:
                old_pid = int(f.read().strip())
            
            # Windows에서 해당 PID가 살아있는지 확인
            kernel32 = ctypes.windll.kernel32
            # PROCESS_QUERY_LIMITED_INFORMATION = 0x1000
            handle = kernel32.OpenProcess(0x1000, 0, old_pid)
            if handle:
                # 프로세스가 살아 있음
                kernel32.CloseHandle(handle)
                return True
        except Exception as e:
            logger.error(f"기존 PID 확인 중 오류: {e}")
            pass
    return False

def write_pid():
    with open(PID_FILE, "w") as f:
        f.write(str(os.getpid()))

def cleanup_pid():
    if os.path.exists(PID_FILE):
        try:
            os.remove(PID_FILE)
        except:
            pass

def write_heartbeat():
    try:
        with open(HEARTBEAT_FILE, "w") as f:
            f.write(time.strftime('%Y-%m-%dT%H:%M:%S'))
    except Exception as e:
        logger.error(f"하트비트 기록 실패: {e}")


class AudioHandler(FileSystemEventHandler):
    def on_created(self, event):
        if event.is_directory:
            return
        
        filepath = event.src_path
        ext = os.path.splitext(filepath)[1].lower()
        if os.path.basename(filepath).startswith("temp_upload_"):
            return
            
        if ext in ['.m4a', '.mp3', '.wav', '.amr']:
            process_audio_file(filepath)

def scan_directory(first_run=False):
    if first_run:
        logger.info("기존 파일 스캔 중 (파일명 기준 2026년 8월 1일 이후 파일만 처리)...")
    
    current_time = time.time()
    
    for filename in os.listdir(WATCH_DIR):
        filepath = os.path.join(WATCH_DIR, filename)
        
        # 고아 temp 파일 삭제 로직 추가 (1시간 이상 된 임시 파일)
        if filename.startswith("temp_upload_"):
            try:
                if os.path.isfile(filepath):
                    mtime = os.path.getmtime(filepath)
                    if current_time - mtime > 3600: # 1시간 초과
                        os.remove(filepath)
                        logger.info(f"오래된 임시 파일 삭제됨: {filename}")
            except Exception as e:
                pass
            continue
            
        ext = os.path.splitext(filepath)[1].lower()
        if os.path.isfile(filepath) and ext in ['.m4a', '.mp3', '.wav', '.amr'] and not filename.endswith('.done'):
            
            # 파일명에서 260804 형식의 날짜 추출 (기본 통화녹음 앱 포맷: 통화녹음 01012345678_260804_143022.m4a)
            match = re.search(r'_(\d{6})_', filename)
            is_recent = False
            
            if match:
                file_date = match.group(1)
                # 2026년 8월 1일(260801) 이후 파일만 처리
                if file_date >= "260801":
                    is_recent = True
            else:
                # 날짜 패턴이 없는 파일은 혹시 모르니 그냥 처리
                is_recent = True
                
            if is_recent:
                process_audio_file(filepath)
            else:
                done_path = filepath + ".done"
                try:
                    os.rename(filepath, done_path)
                    if first_run:
                        logger.info(f"[스킵] 파일명 기준 오래된 파일: {filename}")
                except Exception:
                    pass

    if first_run:
        logger.info("\n새로운 통화 녹음 파일을 기다리고 있습니다... 누락 방지를 위해 매 5분마다 주기적으로 재검사합니다.\n")

def main():
    if is_already_running():
        logger.warning("❌ crm_daemon이 이미 실행 중입니다. 중복 실행을 방지하기 위해 종료합니다.")
        sys.exit(1)
        
    write_pid()
    write_heartbeat()
    
    logger.info("AI CRM system started!")
    logger.info(f"감시 폴더: {WATCH_DIR}")
    
    scan_directory(first_run=True)
    
    event_handler = AudioHandler()
    observer = Observer()
    observer.schedule(event_handler, WATCH_DIR, recursive=False)
    observer.start()
    
    try:
        count = 0
        while True:
            time.sleep(1)
            count += 1
            if count >= 300: # 5분(300초)마다 주기적 재검사 및 하트비트 갱신
                count = 0
                write_heartbeat()
                scan_directory(first_run=False)
    except KeyboardInterrupt:
        logger.info("종료 신호 수신. 데몬을 중지합니다.")
        observer.stop()
    except Exception as e:
        logger.error(f"예기치 않은 데몬 종료: {e}")
    finally:
        observer.join()
        cleanup_pid()

if __name__ == "__main__":
    main()
