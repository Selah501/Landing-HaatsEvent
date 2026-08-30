import os
import time
import json
import logging
import requests
import re
import datetime
from dotenv import load_dotenv
from google import genai

# 환경 변수 로드
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path=env_path)

API_KEY = os.getenv("GEMINI_API_KEY")
WATCH_DIR = os.getenv("AUDIO_WATCH_DIR")
FIREBASE_DB_URL = "https://flyer-event-page-2026-default-rtdb.firebaseio.com/crm_pending.json"

if not API_KEY or not WATCH_DIR:
    raise RuntimeError("오류: .env 파일에 GEMINI_API_KEY 또는 AUDIO_WATCH_DIR이 설정되지 않았습니다.")

if not os.path.exists(WATCH_DIR):
    os.makedirs(WATCH_DIR, exist_ok=True)
    print(f"감시 폴더가 없어서 새로 생성했습니다: {WATCH_DIR}")

# 로깅 설정
LOG_DIR = os.path.join(os.path.dirname(__file__), "logs")
os.makedirs(LOG_DIR, exist_ok=True)

logger = logging.getLogger("crm")
logger.setLevel(logging.INFO)

if not logger.handlers:
    file_handler = logging.FileHandler(
        os.path.join(LOG_DIR, "crm.log"), encoding="utf-8"
    )
    file_handler.setFormatter(logging.Formatter(
        "[%(asctime)s] %(levelname)s: %(message)s"
    ))
    logger.addHandler(file_handler)
    
    stream_handler = logging.StreamHandler()
    stream_handler.setFormatter(logging.Formatter(
        "%(message)s"
    ))
    logger.addHandler(stream_handler)


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
  "contact_info": "전화번호 (숫자와 하이픈만, 예: 010-1234-5678). 반드시 오디오에서 최대한 추출하세요. 파일명에도 없고 오디오에서도 전혀 들리지 않으면 null",
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
        logger.error(f"DB 목록 가져오기 실패: {e}")
        return [], []

def extract_phone_from_filename(filename):
    """파일명에서 전화번호를 추출 (010xxxxxxxx 패턴 우선, 그 외 숫자 시퀀스도 시도)"""
    # 1순위: 010으로 시작하는 10~11자리 번호
    m = re.search(r'(01[016789]\d{7,8})', filename)
    if m:
        p = m.group(1)
        if len(p) == 10:
            return f"{p[:3]}-{p[3:6]}-{p[6:]}"
        elif len(p) == 11:
            return f"{p[:3]}-{p[3:7]}-{p[7:]}"
    # 2순위: 0으로 시작하는 9~11자리 숫자 (02, 031 등 지역번호)
    m2 = re.search(r'(0\d{8,10})', filename)
    if m2:
        p = m2.group(1)
        return p  # 하이픈 없이 그대로
    return None


def extract_caller_name_from_filename(filename):
    """파일명에서 발신자 이름 추출 (숫자가 없는 경우 이름으로 저장된 연락처)"""
    # '통화 녹음 NAME_YYMMDD_HHMMSS.m4a' 패턴에서 NAME 추출
    m = re.match(r'통화 녹음 (.+?)_(\d{6})_(\d{6})', filename)
    if m:
        name = m.group(1).strip()
        # 숫자만으로 이루어진 경우 제외 (전화번호이므로 이미 위에서 처리)
        if not re.match(r'^[0-9\-]+$', name):
            return name
    return None


def process_audio_file(filepath):
    logger.info(f"\n[AI 분석 시작] 새 녹음 파일 발견: {filepath}")
    try:
        # 파일이 완전히 쓰여질 때까지 대기
        time.sleep(2)
        initial_size = -1
        while initial_size != os.path.getsize(filepath):
            initial_size = os.path.getsize(filepath)
            time.sleep(2)
        
        # ★ 파일명에서 전화번호/발신자 이름 선행 추출 (AI와 무관하게 보장)
        base_filename = os.path.basename(filepath)
        pre_phone = extract_phone_from_filename(base_filename)
        pre_name  = extract_caller_name_from_filename(base_filename)
        pre_contact = pre_phone or pre_name  # 전화번호 우선, 없으면 이름
            
        logger.info("1. Firebase에서 DB 목록(현장, 제품) 동기화 중...")
        event_names, product_names = fetch_firebase_lists()
        
        dynamic_prompt = PROMPT + f"\n\n[필수 지침]\n"
        dynamic_prompt += f"1. 현장명(site_info)은 다음 목록 중 가장 일치하는 이름 하나만 선택하세요: {', '.join(event_names) if event_names else '목록 없음'}\n"
        dynamic_prompt += f"   - 일치하는 것이 확실치 않으면 '기타(추정)'이라고 적고 뒤에 추정한 이름을 괄호로 적으세요. (예: 기타(추정: 무슨아파트))\n"
        dynamic_prompt += f"   - 동호수가 언급되었다면 현장명과 결합하세요. (예: 효성 101-102)\n"
        dynamic_prompt += f"2. 구매품(purchase_info)은 다음 목록 중 가장 일치하는 이름들만 콤마로 나열하세요: {', '.join(product_names) if product_names else '목록 없음'}\n"
        dynamic_prompt += f"   - 일치하는 것이 확실치 않으면 '기타(추정)'이라고 적고 추정한 이름을 괄호로 적으세요.\n"
        # ★ 파일명에서 추출한 전화번호를 AI에게 힌트로 제공
        if pre_phone:
            dynamic_prompt += f"3. [중요] 연락처(contact_info)는 이미 파일명에서 추출되었습니다: '{pre_phone}'. 이 값을 contact_info에 반드시 그대로 기록하세요.\n"
        elif pre_name:
            dynamic_prompt += f"3. [중요] 이 통화의 발신자 이름은 파일명 기준 '{pre_name}'입니다. contact_info에 이름을 먼저 쓰고, 오디오에서 전화번호가 들리면 추가하세요.\n"
        else:
            dynamic_prompt += f"3. 연락처(contact_info)는 파일명({base_filename})에서 추출 불가. 오디오에서 전화번호를 최대한 찾아 '010-XXXX-XXXX' 형식으로 기록하세요.\n"

        logger.info("2. Gemini에 오디오 업로드 중...")
        
        import shutil
        temp_filepath = os.path.join(os.path.dirname(filepath), f"temp_upload_{int(time.time())}.m4a")
        shutil.copy2(filepath, temp_filepath)
        
        try:
            myfile = client.files.upload(file=temp_filepath)
        finally:
            if os.path.exists(temp_filepath):
                os.remove(temp_filepath)
        
        logger.info("3. Gemini 분석 중 (수십 초 소요될 수 있음)...")
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
        
        # ★ 핵심 보정: AI가 contact_info를 비워도 파일명 기반 값으로 덮어씀
        ai_contact = data.get('contact_info')
        if not ai_contact or str(ai_contact).lower() in ('null', 'none', '', '없음', 'n/a'):
            if pre_contact:
                data['contact_info'] = pre_contact
                logger.info(f"[연락처 보정] AI 누락 → 파일명 기반으로 보정: {pre_contact}")
        else:
            # AI가 추출했어도, 파일명 전화번호가 더 신뢰할 수 있으면 우선 적용
            if pre_phone and pre_phone not in str(ai_contact):
                # AI 값에 전화번호 없고 파일명에 있는 경우 파일명 번호를 앞에 추가
                data['contact_info'] = f"{pre_phone} / {ai_contact}"
                logger.info(f"[연락처 보정] AI값+파일명번호 병합: {data['contact_info']}")
        
        # [성능 측정] 통화 종료 후 요약 완료까지 총 소요시간 계산
        match = re.search(r'_(\d{6})_(\d{6})\.', data['filename'])
        if match:
            date_str, time_str = match.groups()
            try:
                # 파일명 예: 260817_190732 -> 2026-08-17 19:07:32
                call_end_time = datetime.datetime.strptime(f"{date_str} {time_str}", "%y%m%d %H%M%S")
                now_time = datetime.datetime.now()
                delay = now_time - call_end_time
                delay_sec = int(delay.total_seconds())
                
                # 업무시간(04시~18시) 통화 여부 확인
                if 4 <= call_end_time.hour < 18:
                    logger.info(f"[성능 측정] 업무시간(04~18시) 내 통화 ({call_end_time.strftime('%H:%M:%S')} 종료)")
                
                logger.info(f"[성능 측정] 통화 종료 후 요약 완료까지 총 소요시간: {delay_sec // 60}분 {delay_sec % 60}초 ({delay_sec}초)")
                data['total_delay_sec'] = delay_sec
            except Exception as e:
                logger.error(f"시간 측정 중 오류: {e}")

        logger.info("3. 분석 완료! Firebase로 전송합니다.")
        res = requests.post(FIREBASE_DB_URL, json=data)
        
        if res.status_code == 200:
            logger.info("성공적으로 Firebase 결재 대기판에 등록되었습니다!")
            done_path = filepath + ".done"
            os.rename(filepath, done_path)
            # 연속 호출로 인한 API 속도 제한(Rate Limit) 방지를 위해 4초 대기
            time.sleep(4)
        else:
            logger.error(f"Firebase 업로드 실패: {res.text}")
            raise Exception("Firebase Error")
            
    except Exception as e:
        error_msg = str(e)
        logger.error(f"오류 발생: {os.path.basename(filepath)} - {error_msg}")
        
        # Rate Limit 오류 시 더 길게 대기
        if "429" in error_msg or "quota" in error_msg.lower() or "rate" in error_msg.lower():
            logger.info("API 호출 한도 초과(Rate Limit). 30초 대기 후 진행합니다...")
            time.sleep(30)
        else:
            time.sleep(4)
        raise e
