const { onObjectFinalized } = require("firebase-functions/v2/storage");
const { getDatabase } = require("firebase-admin/database");
const { getStorage } = require("firebase-admin/storage");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const admin = require("firebase-admin");
const path = require("path");
const os = require("os");
const fs = require("fs");

// Firebase Admin은 index.js에서 이미 초기화되므로 여기서는 초기화하지 않음

// Gemini API 설정 - Firebase 환경변수에서 로드
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const PROMPT = `
이것은 환풍기, 렌지후드 설치 및 B2B 판매를 하는 '하츠 충남' 대표님의 통화 녹음입니다.
오디오를 끝까지 듣고 다음 항목을 JSON 형태로만 출력하세요. 마크다운(\` \`\`\`json \`) 없이 순수 JSON 중괄호만 출력해야 합니다.
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
`;

/**
 * Cloud Functions v2: Firebase Storage에 음성 파일 업로드 시 자동 트리거
 * 
 * 흐름: 스마트폰(MacroDroid) → Firebase Storage 업로드 → 이 함수 자동 실행
 *       → Gemini AI 분석 → Firebase RTDB crm_pending에 저장
 * 
 * 예상 소요시간: 15~30초 (파일 다운로드 + Gemini 분석 + RTDB 저장)
 */
exports.processCallRecording = onObjectFinalized(
    {
        region: "asia-northeast3",
        timeoutSeconds: 120,
        memory: "512MiB",
    },
    async (event) => {
        const filePath = event.data.name;          // call_records/통화녹음_260818_143022.m4a
        const contentType = event.data.contentType; // audio/mp4, audio/mpeg 등
        const fileName = path.basename(filePath);

        // 음성 파일만 처리
        const audioExtensions = [".m4a", ".mp3", ".wav", ".amr", ".aac", ".ogg"];
        const ext = path.extname(fileName).toLowerCase();
        if (!audioExtensions.includes(ext)) {
            console.log(`[스킵] 음성 파일이 아닙니다: ${fileName}`);
            return null;
        }

        // call_records/ 폴더 내 파일만 처리
        if (!filePath.startsWith("call_records/")) {
            console.log(`[스킵] call_records/ 폴더가 아닙니다: ${filePath}`);
            return null;
        }

        const startTime = Date.now();
        console.log(`\n[AI 분석 시작] 새 녹음 파일: ${fileName}`);

        try {
            // 1. Firebase에서 현장/제품 목록 가져오기
            console.log("1. Firebase에서 DB 목록(현장, 제품) 동기화 중...");
            const db = getDatabase();
            const [eventsSnap, productsSnap] = await Promise.all([
                db.ref("events").once("value"),
                db.ref("products").once("value"),
            ]);

            const eventsData = eventsSnap.val() || [];
            const productsData = productsSnap.val() || [];
            const eventNames = eventsData
                .filter((e) => e && e.title)
                .map((e) => e.title);
            const productNames = productsData
                .filter((p) => p && p.name)
                .map((p) => p.name);

            // 2. 동적 프롬프트 구성
            let dynamicPrompt = PROMPT + "\n\n[필수 지침]\n";
            dynamicPrompt += `1. 현장명(site_info)은 다음 목록 중 가장 일치하는 이름 하나만 선택하세요: ${eventNames.join(", ") || "목록 없음"}\n`;
            dynamicPrompt += `   - 일치하는 것이 확실치 않으면 '기타(추정)'이라고 적고 뒤에 추정한 이름을 괄호로 적으세요. (예: 기타(추정: 무슨아파트))\n`;
            dynamicPrompt += `   - 동호수가 언급되었다면 현장명과 결합하세요. (예: 효성 101-102)\n`;
            dynamicPrompt += `2. 구매품(purchase_info)은 다음 목록 중 가장 일치하는 이름들만 콤마로 나열하세요: ${productNames.join(", ") || "목록 없음"}\n`;
            dynamicPrompt += `   - 일치하는 것이 확실치 않으면 '기타(추정)'이라고 적고 추정한 이름을 괄호로 적으세요.\n`;
            dynamicPrompt += `3. 연락처(contact_info)는 파일명(${fileName})에서 '010'으로 시작하는 11자리 숫자를 우선적으로 찾아 하이픈(-)을 넣어 기록하세요. (예: 010-1234-5678). 파일명에 없다면 오디오에서 추출하세요.\n`;

            // 3. Storage에서 임시 파일로 다운로드
            console.log("2. Storage에서 파일 다운로드 중...");
            const bucket = getStorage().bucket(event.data.bucket);
            const tempFilePath = path.join(os.tmpdir(), fileName);
            await bucket.file(filePath).download({ destination: tempFilePath });

            // 4. Gemini AI 분석
            console.log("3. Gemini 분석 중...");
            const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

            const audioData = fs.readFileSync(tempFilePath);
            const base64Audio = audioData.toString("base64");

            // MIME type 매핑
            const mimeMap = {
                ".m4a": "audio/mp4",
                ".mp3": "audio/mpeg",
                ".wav": "audio/wav",
                ".amr": "audio/amr",
                ".aac": "audio/aac",
                ".ogg": "audio/ogg",
            };

            const result = await model.generateContent([
                {
                    inlineData: {
                        mimeType: mimeMap[ext] || "audio/mp4",
                        data: base64Audio,
                    },
                },
                dynamicPrompt,
            ]);

            let resultText = result.response.text().trim();
            if (resultText.startsWith("```json")) {
                resultText = resultText.slice(7, -3).trim();
            } else if (resultText.startsWith("```")) {
                resultText = resultText.slice(3, -3).trim();
            }

            const data = JSON.parse(resultText);

            // 5. 성능 측정: 통화 종료 시각 추출
            const dateTimeMatch = fileName.match(/_(\d{6})_(\d{6})\./);
            if (dateTimeMatch) {
                const [, dateStr, timeStr] = dateTimeMatch;
                // YYMMDD_HHMMSS → Date 객체
                const year = 2000 + parseInt(dateStr.slice(0, 2));
                const month = parseInt(dateStr.slice(2, 4)) - 1;
                const day = parseInt(dateStr.slice(4, 6));
                const hour = parseInt(timeStr.slice(0, 2));
                const min = parseInt(timeStr.slice(2, 4));
                const sec = parseInt(timeStr.slice(4, 6));
                const callEndTime = new Date(year, month, day, hour, min, sec);
                const delaySec = Math.round((Date.now() - callEndTime.getTime()) / 1000);

                data.total_delay_sec = delaySec;
                console.log(`[성능 측정] 통화 종료 후 요약 완료까지: ${Math.floor(delaySec / 60)}분 ${delaySec % 60}초`);
            }

            // 6. Firebase RTDB에 저장
            data.filename = fileName;
            data.created_at = new Date().toISOString();
            data.source = "cloud_functions"; // PC daemon과 구분하기 위한 태그

            console.log("4. Firebase RTDB에 저장 중...");
            await db.ref("crm_pending").push(data);

            // 7. 처리 완료 후 Storage에서 원본을 processed/ 폴더로 이동
            const processedPath = `call_records_done/${fileName}`;
            await bucket.file(filePath).move(processedPath);

            const totalSec = Math.round((Date.now() - startTime) / 1000);
            console.log(`✅ 분석 완료! (Cloud Functions 처리 시간: ${totalSec}초)`);

            // 임시 파일 삭제
            fs.unlinkSync(tempFilePath);

            return null;
        } catch (error) {
            console.error(`❌ 오류 발생: ${fileName} - ${error.message}`);
            console.error(error.stack);

            // 실패한 파일을 별도 폴더로 이동 (무한 재시도 방지)
            try {
                const bucket = getStorage().bucket(event.data.bucket);
                const failedPath = `call_records_failed/${fileName}`;
                await bucket.file(filePath).move(failedPath);
                console.log(`실패 파일 이동: ${failedPath}`);
            } catch (moveErr) {
                console.error(`파일 이동 실패: ${moveErr.message}`);
            }

            return null; // 에러를 throw하면 무한 재시도되므로 null 반환
        }
    }
);
