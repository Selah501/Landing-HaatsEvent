import os
import sys

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

import time
import json
import requests
from google import genai
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path=env_path)

API_KEY = os.getenv("GEMINI_API_KEY")
WATCH_DIR = os.getenv("AUDIO_WATCH_DIR")
FIREBASE_DB_URL = "https://flyer-event-page-2026-default-rtdb.firebaseio.com/crm_pending.json"

print("1. API Key loaded:", bool(API_KEY))
print("2. Watch Dir:", WATCH_DIR)

client = genai.Client(api_key=API_KEY)

# 폴더 안의 파일 하나 찾기
files = [f for f in os.listdir(WATCH_DIR) if f.endswith('.m4a') and not f.endswith('.done')]
if not files:
    print("처리할 파일이 없습니다.")
    sys.exit(0)

filepath = os.path.join(WATCH_DIR, files[0])
print(f"3. 파일 발견: {filepath}")

print("4. Gemini에 업로드 중...")
try:
    myfile = client.files.upload(file=filepath)
    print("5. 업로드 성공! 분석 요청...")
    
    PROMPT = """이것은 환풍기, 렌지후드 설치 업체의 고객 통화 녹음입니다. 다음 항목을 JSON 형태로만 출력하세요.
    {"category": "예약|상담", "summary": "내용 요약", "site_info": "아파트/주소", "contact_info": "연락처", "booking_info": "예약희망일", "purchase_info": "희망제품", "payment_info": "결제", "promises": "답변"}"""
    
    response = client.models.generate_content(
        model='gemini-2.5-pro',
        contents=[myfile, PROMPT]
    )
    
    print("6. 분석 결과:")
    print(response.text)
    
except Exception as e:
    print(f"오류 발생: {e}")
