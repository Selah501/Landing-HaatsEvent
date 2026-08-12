import os
import sys
import time
import subprocess
from datetime import datetime

HEARTBEAT_FILE = os.path.join(os.path.dirname(__file__), "crm_daemon_heartbeat.txt")
DAEMON_SCRIPT = os.path.join(os.path.dirname(__file__), "crm_daemon.py")

# 로깅은 단순하게 파일로 직접 기록 (check_health.log)
LOG_FILE = os.path.join(os.path.dirname(__file__), "logs", "check_health.log")

def log(msg):
    ts = time.strftime('%Y-%m-%d %H:%M:%S')
    log_msg = f"[{ts}] {msg}\n"
    try:
        os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(log_msg)
        print(log_msg, end="")
    except:
        pass

def check_and_restart():
    current_time = time.time()
    needs_restart = False
    
    if not os.path.exists(HEARTBEAT_FILE):
        log("하트비트 파일이 없습니다. 데몬이 실행되지 않았거나 비정상 종료되었습니다.")
        needs_restart = True
    else:
        mtime = os.path.getmtime(HEARTBEAT_FILE)
        diff = current_time - mtime
        if diff > 600:  # 10분 이상 갱신 안됨
            log(f"하트비트가 {int(diff/60)}분 전부터 멈췄습니다. 데몬이 응답하지 않습니다.")
            needs_restart = True
        else:
            log(f"하트비트 정상 (마지막 갱신: {int(diff)}초 전)")
            
    if needs_restart:
        log("crm_daemon.py를 백그라운드로 재시작합니다...")
        
        # 이전 PID 파일이 있다면 해당 프로세스 강제 종료
        pid_file = os.path.join(os.path.dirname(__file__), "crm_daemon.pid")
        if os.path.exists(pid_file):
            try:
                with open(pid_file) as f:
                    old_pid = f.read().strip()
                if old_pid:
                    subprocess.run(["taskkill", "/F", "/PID", old_pid], capture_output=True)
                    log(f"기존 프로세스(PID: {old_pid}) 강제 종료 완료.")
            except Exception as e:
                log(f"기존 프로세스 종료 실패: {e}")
                
        # 새 데몬 시작 (Windows용)
        try:
            # CREATE_NO_WINDOW = 0x08000000 (Windows에서 창 띄우지 않고 백그라운드 실행)
            # CREATE_NEW_PROCESS_GROUP = 0x00000200
            creationflags = 0x08000000 | 0x00000200
            
            subprocess.Popen(
                [sys.executable, DAEMON_SCRIPT],
                creationflags=creationflags,
                cwd=os.path.dirname(__file__)
            )
            log("데몬 재시작 명령을 성공적으로 호출했습니다.")
        except Exception as e:
            log(f"데몬 재시작 실패: {e}")

if __name__ == "__main__":
    check_and_restart()
