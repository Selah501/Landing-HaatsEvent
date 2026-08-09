import os
import sys

# Windows 환경에서 한글 출력 오류 방지
if sys.stdout is None:
    import io
    sys.stdout = io.StringIO()
    sys.stderr = io.StringIO()
elif sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

import time
import json
import requests
from dotenv import load_dotenv
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from google import genai

# 환경 변수 로드 (스크립트가 위치한 폴더의 한 단계 위인 landing/.env)
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path=env_path)

API_KEY = os.getenv("GEMINI_API_KEY")
WATCH_DIR = os.getenv("AUDIO_WATCH_DIR")
FIREBASE_DB_URL = "https://flyer-event-page-2026-default-rtdb.firebaseio.com/crm_pending.json"

if not API_KEY or not WATCH_DIR:
    print("오류: .env 파일에 GEMINI_API_KEY 또는 AUDIO_WATCH_DIR이 설정되지 않았습니다.")
    exit(1)

if not os.path.exists(WATCH_DIR):
    os.makedirs(WATCH_DIR, exist_ok=True)
    print(f"감시 폴더가 없어서 새로 생성했습니다: {WATCH_DIR}")

# Gemini 클라이언트 초기화
client = genai.Client(api_key=API_KEY)

PROMPT = """
이것은 환풍기, 렌지후드 설치 및 B2B 판매를 하는 '하츠 충남' 대표님의 통화 녹음입니다.
오디오를 끝까지 듣고 다음 항목을 JSON 형태로만 출력하세요. 마크다운(` ```json `) 없이 순수 JSON 중괄호만 출력해야 합니다.
정보가 없으면 null 또는 빈 문자열을 사용하세요.

대표님의 영업 패턴상 통화는 다음 3가지 유형 중 하나일 확률이 높습니다. 이 맥락을 바탕으로 요약과 카테고리를 정확히 판단해주세요:
a. 초기 경계/단순 문의: 전단지를 보고 처음 건 전화. 고객이 개인 정보(동호수 등)를 숨김. 일정 미정.
b. QR 신청 후 재통화: 고객이 웹에 정보를 남겼고 대표님이 걸어서 세부 사항을 조율하는 통화.
c. 예약 후 최종 확인: 일정이 확정된 고객에게 다시 걸어 확인하는 통화.

{
  "category": "단순문의|상담(일정미정)|예약확정|스팸/기타",
  "summary": "어떤 유형의 통화인지, 주요 내용은 무엇인지 3~4줄 요약",
  "site_info": "지역, 아파트명, 동호수, 현관 비밀번호 등",
  "contact_info": "고객명, 전화번호 등",
  "booking_info": "희망 일시, 일정 변경 사항",
  "purchase_info": "제품명, 수량, 설치 위치(안방/거실 등)",
  "payment_info": "결제 방식(카드/이체 등)",
  "promises": "대표님이 답변한 내용이나 고객과 약속한 사항"
}
"""

def fetch_firebase_lists():
    try:
        events_res = requests.get("https://flyer-event-page-2026-default-rtdb.firebaseio.com/events.json")
        products_res = requests.get("https://flyer-event-page-2026-default-rtdb.firebaseio.com/products.json")
        
        event_names = []
        if events_res.status_code == 200 and events_res.json():
            event_names = [e.get('title') for e in events_res.json() if isinstance(e, dict) and e.get('title')]
            
        product_names = []
        if products_res.status_code == 200 and products_res.json():
            product_names = [p.get('name') for p in products_res.json() if isinstance(p, dict) and p.get('name')]
            
        return event_names, product_names
    except Exception as e:
        print("DB 목록 가져오기 실패:", e)
        return [], []

def process_audio_file(filepath):
    print(f"\n[AI 분석 시작] 새 녹음 파일 발견: {filepath}")
    try:
        # 파일이 완전히 쓰여질 때까지 대기
        time.sleep(2)
        initial_size = -1
        while initial_size != os.path.getsize(filepath):
            initial_size = os.path.getsize(filepath)
            time.sleep(2)
            
        print("1. Firebase에서 DB 목록(현장, 제품) 동기화 중...")
        event_names, product_names = fetch_firebase_lists()
        
        dynamic_prompt = PROMPT + f"\n\n[필수 지침]\n"
        dynamic_prompt += f"1. 현장명(site_info)은 다음 목록 중 가장 일치하는 이름 하나만 선택하세요: {', '.join(event_names) if event_names else '목록 없음'}\n"
        dynamic_prompt += f"   - 일치하는 것이 확실치 않으면 '기타(추정)'이라고 적고 뒤에 추정한 이름을 괄호로 적으세요. (예: 기타(추정: 무슨아파트))\n"
        dynamic_prompt += f"   - 동호수가 언급되었다면 현장명과 결합하세요. (예: 효성 101-102)\n"
        dynamic_prompt += f"2. 구매품(purchase_info)은 다음 목록 중 가장 일치하는 이름들만 콤마로 나열하세요: {', '.join(product_names) if product_names else '목록 없음'}\n"
        dynamic_prompt += f"   - 일치하는 것이 확실치 않으면 '기타(추정)'이라고 적고 추정한 이름을 괄호로 적으세요.\n"
        dynamic_prompt += f"3. 연락처(contact_info)는 파일명({os.path.basename(filepath)})에서 '010'으로 시작하는 11자리 숫자를 우선적으로 찾아 하이픈(-)을 넣어 기록하세요. (예: 010-1234-5678). 파일명에 없다면 오디오에서 추출하세요.\n"

        print("2. Gemini에 오디오 업로드 중...")
        
        import shutil
        temp_filepath = os.path.join(os.path.dirname(filepath), f"temp_upload_{int(time.time())}.m4a")
        shutil.copy2(filepath, temp_filepath)
        
        try:
            myfile = client.files.upload(file=temp_filepath)
        finally:
            if os.path.exists(temp_filepath):
                os.remove(temp_filepath)
        
        print("3. Gemini 분석 중 (수십 초 소요될 수 있음)...")
        response = client.models.generate_content(
            model='gemini-3.5-flash',
            contents=[myfile, dynamic_prompt]
        )

        
        result_text = response.text.strip()
        if result_text.startswith("```json"):
            result_text = result_text[7:-3].strip()
        elif result_text.startswith("```"):
            result_text = result_text[3:-3].strip()
            
        data = json.loads(result_text)
        data['filename'] = os.path.basename(filepath)
        data['created_at'] = time.strftime('%Y-%m-%dT%H:%M:%S%z')
        
        print("3. 분석 완료! Firebase로 전송합니다.")
        res = requests.post(FIREBASE_DB_URL, json=data)
        
        if res.status_code == 200:
            print("성공적으로 Firebase 결재 대기판에 등록되었습니다!")
            done_path = filepath + ".done"
            os.rename(filepath, done_path)
            # 연속 호출로 인한 API 속도 제한(Rate Limit) 방지를 위해 4초 대기
            time.sleep(4)
        else:
            print(f"Firebase 업로드 실패: {res.text}")
            with open("crm_error.log", "a", encoding="utf-8") as f:
                f.write(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Firebase Error on {os.path.basename(filepath)}: {res.text}\n")
            
    except Exception as e:
        error_msg = str(e)
        print(f"오류 발생: {error_msg}")
        with open("crm_error.log", "a", encoding="utf-8") as f:
            f.write(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Exception on {os.path.basename(filepath)}: {error_msg}\n")
        
        # Rate Limit 오류 시 더 길게 대기
        if "429" in error_msg or "quota" in error_msg.lower() or "rate" in error_msg.lower():
            print("API 호출 한도 초과(Rate Limit). 30초 대기 후 진행합니다...")
            time.sleep(30)
        else:
            time.sleep(4)

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

import re
from datetime import datetime, timedelta

def scan_directory(first_run=False):
    if first_run:
        print("기존 파일 스캔 중 (파일명 기준 2026년 8월 1일 이후 파일만 처리)...")
    
    for filename in os.listdir(WATCH_DIR):
        if filename.startswith("temp_upload_"):
            continue
            
        filepath = os.path.join(WATCH_DIR, filename)
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
                        print(f"[스킵] 파일명 기준 오래된 파일: {filename}")
                except Exception:
                    pass

    if first_run:
        print("\n새로운 통화 녹음 파일을 기다리고 있습니다... 누락 방지를 위해 매 5분마다 주기적으로 재검사합니다.\n")

def main():
    print(f"AI CRM system started!")
    print(f"감시 폴더: {WATCH_DIR}")
    
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
            if count >= 300: # 5분(300초)마다 주기적 재검사
                count = 0
                scan_directory(first_run=False)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()

if __name__ == "__main__":
    main()
