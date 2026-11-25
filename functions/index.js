const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { getDatabase } = require("firebase-admin/database");
const { Client } = require("@notionhq/client");

admin.initializeApp();

// Notion API Client initialization
const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

const notion = new Client({ auth: NOTION_API_KEY });

exports.syncReportToNotion = functions.database.ref("/reservations/{date}/{time}/report")
    .onWrite(async (change, context) => {
        // Only trigger on new report creation or if the report is updated
        const report = change.after.val();
        
        if (!report) {
            console.log("Report deleted, skipping.");
            return null;
        }

        // Fetch customer info from the sibling node
        const dbRef = getDatabase().ref();
        const customerInfoSnapshot = await dbRef.child(`reservations/${context.params.date}/${context.params.time}/customerInfo`).once('value');
        const customerInfo = customerInfoSnapshot.val() || {};

        if (!NOTION_API_KEY || !NOTION_DATABASE_ID) {
            console.error("Missing Notion API Key or Database ID in environment variables.");
            return null;
        }

        const date = context.params.date; // e.g. 2026-07-30
        const time = context.params.time;
        const apt = customerInfo.apt || "-";
        const phone = customerInfo.phone || "-";
        const usedProducts = report.usedProducts || [];
        const techNotes = report.techNotes || "-";
        const salesNotes = report.salesNotes || "-";
        const payAmount = report.payAmount || 0;
        const margin = report.margin || 0;
        const payMethod = report.payMethod || "-";
        const mediaUrls = report.mediaUrls || [];

        const title = `[완료] ${date} - ${apt}`;

        const productNames = usedProducts.map(p => {
            if (typeof p === 'string') return p;
            return `${p.name}(${p.qty}개)`;
        }).join(", ");

        // Build Notion blocks for rich content (RAG optimized)
        const childrenBlocks = [
            {
                object: "block",
                type: "heading_2",
                heading_2: {
                    rich_text: [{ type: "text", text: { content: "🛠️ 기술 및 시공 특이사항" } }]
                }
            },
            {
                object: "block",
                type: "paragraph",
                paragraph: {
                    rich_text: [{ type: "text", text: { content: techNotes } }]
                }
            },
            {
                object: "block",
                type: "heading_2",
                heading_2: {
                    rich_text: [{ type: "text", text: { content: "🤝 영업 및 고객 특이사항" } }]
                }
            },
            {
                object: "block",
                type: "paragraph",
                paragraph: {
                    rich_text: [{ type: "text", text: { content: salesNotes } }]
                }
            }
        ];

        // Append media as image blocks or bookmark blocks depending on type
        if (mediaUrls.length > 0) {
            childrenBlocks.push({
                object: "block",
                type: "heading_2",
                heading_2: {
                    rich_text: [{ type: "text", text: { content: "📷 시공 사진 및 미디어" } }]
                }
            });

            mediaUrls.forEach(url => {
                // Determine if it's an image. Notion API requires direct image URLs to end with image extensions usually,
                // but since it's Firebase storage, we'll embed as image block or a bookmark. We'll use image block.
                childrenBlocks.push({
                    object: "block",
                    type: "image",
                    image: {
                        type: "external",
                        external: {
                            url: url
                        }
                    }
                });
            });
        }

        try {
            console.log(`Syncing report to Notion for ${title}`);
            const response = await notion.pages.create({
                parent: { database_id: NOTION_DATABASE_ID },
                properties: {
                    "이름": { // Title property, assuming default name is "이름"
                        title: [
                            {
                                text: {
                                    content: title
                                }
                            }
                        ]
                    },
                    "시공일자": {
                        date: {
                            start: date
                        }
                    },
                    "고객명/아파트": {
                        rich_text: [
                            { text: { content: apt } }
                        ]
                    },
                    "연락처": {
                        phone_number: phone
                    },
                    "시공품목": {
                        rich_text: [
                            { text: { content: productNames } }
                        ]
                    },
                    "결제금액": {
                        number: Number(payAmount)
                    },
                    "마진": {
                        number: Number(margin)
                    },
                    "결제수단": {
                        rich_text: [
                            { text: { content: payMethod } }
                        ]
                    }
                },
                children: childrenBlocks
            });
            
            console.log("Successfully created Notion page:", response.id);
            
            // Optionally, save the Notion Page ID back to RTDB to avoid duplicates on future edits
            await change.after.ref.parent.child('notionPageId').set(response.id);

            return null;

        } catch (error) {
            console.error("Error creating Notion page:", error.body || error);
            throw error;
        }
    });

// Gemini AI Setup
const { GoogleGenerativeAI } = require("@google/generative-ai");
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // Firebase 환경 변수에서 로드 필요
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

exports.analyzeVoiceReport = functions.https.onCall(async (data, context) => {
    const { audioBase64, mimeType } = data;
    if (!audioBase64 || !mimeType) {
        throw new functions.https.HttpsError("invalid-argument", "audioBase64 and mimeType are required.");
    }
    
    if (!GEMINI_API_KEY) {
        throw new functions.https.HttpsError("internal", "Gemini API key is not configured.");
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro-latest" });
        
        const prompt = `
당신은 시공 기사의 현장 음성 보고를 분석하는 스마트 AI입니다.
아래의 현장 녹음 음성을 듣고, 다음 JSON 형식으로만 응답하세요. (마크다운 백틱 없이 순수 JSON만 출력)

{
  "matchedProduct": "음성에서 언급된 제품명 (예: 티오람, 허리케인 등)",
  "payMethod": "결제 수단 (현금, 카드, 계좌이체, 선결제 중 택 1)",
  "payAmount": 50000, // 숫자형태의 결제 금액, 만약 "5만원"이면 50000
  "notes": "기타 특이사항이나 제품 이외의 작업 내용 등 요약"
}
        `;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    mimeType: mimeType,
                    data: audioBase64
                }
            }
        ]);
        
        const responseText = result.response.text();
        console.log("Gemini Response:", responseText);
        
        // Extract JSON from response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        } else {
            throw new Error("Failed to parse JSON from Gemini response");
        }
        
    } catch (error) {
        console.error("Gemini AI Error:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});

exports.analyzeApartmentSpec = functions
    .runWith({ timeoutSeconds: 300, memory: '1GB' })
    .https.onCall(async (data, context) => {
    const { aptName, texts, mediaUrls } = data;
    if (!aptName || !texts) {
        throw new functions.https.HttpsError("invalid-argument", "aptName and texts are required.");
    }
    
    if (!GEMINI_API_KEY) {
        throw new functions.https.HttpsError("internal", "Gemini API key is not configured.");
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" }); 
        
        const promptText = `
당신은 아파트 시공 내역과 현장 사진을 분석하여 아파트 스펙 DB를 구축하는 보조 AI입니다.
대상 아파트명: ${aptName}
제공된 시공 이력 (텍스트 배열):
${JSON.stringify(texts, null, 2)}
(첨부된 현장 사진이 있다면 텍스트와 함께 분석하여 시공 환경과 기존 제품의 규격을 파악하세요.)

위 데이터를 바탕으로 다음 JSON 포맷에 맞게 아파트의 구조적 스펙을 추론하여 응답하세요. (마크다운 백틱 없이 순수 JSON만 출력)
만약 데이터나 사진에 없는 내용은 빈 문자열("")로 남겨두세요.

{
  "spec_bathroom": "욕실 관련 구조적 특성 요약 (예: 안방 타공 구멍이 큼, 아크릴 마감판 필수 등)",
  "spec_hood": "설치된 주방 후드 규격 요약 (예: 가로 900짜리 하츠 테라, 600짜리 슬라이딩 등)",
  "next_sales_notes": "다음 영업 시 참고할 만한 특이사항 (예: 사각 싱크볼 교체 수요 있음)"
}
        `;

        const promptParts = [promptText];

        if (mediaUrls && Array.isArray(mediaUrls)) {
            for (const url of mediaUrls) {
                try {
                    const imgRes = await fetch(url);
                    const arrayBuffer = await imgRes.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);
                    const mimeType = imgRes.headers.get('content-type') || 'image/jpeg';
                    
                    if (mimeType.startsWith('image/')) {
                        promptParts.push({
                            inlineData: {
                                mimeType: mimeType,
                                data: buffer.toString('base64')
                            }
                        });
                    }
                } catch(e) {
                    console.error("Image fetch failed for URL:", url, e);
                }
            }
        }

        const result = await model.generateContent(promptParts);
        const responseText = result.response.text();
        console.log("Gemini analyzeApartmentSpec Response:", responseText);
        
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        } else {
            throw new Error("Failed to parse JSON from Gemini response");
        }
    } catch (error) {
        console.error("Gemini AI Error in analyzeApartmentSpec:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});


// =========================================================================
// Cloud Functions v2: 통화 녹음 자동 분석 (Firebase Storage 트리거)
// 스마트폰 → Firebase Storage 업로드 → Gemini AI 분석 → RTDB crm_pending 저장
// =========================================================================
const { processCallRecording } = require("./processCallRecording");
exports.processCallRecording = processCallRecording;

const { diagnoseCallStatus } = require("./diagnoseCallStatus");
exports.diagnoseCallStatus = diagnoseCallStatus;

// =========================================================================
// Cloud Function: 문자발송 캠페인 AI 문구 초안 생성
// =========================================================================
exports.generateSmsDraft = functions
    .runWith({ timeoutSeconds: 30, memory: "256MB" })
    .https.onCall(async (data, context) => {
    const { scopeLabel, regionName, targetAudience, purposeSummary, eventTitle } = data || {};
    if (!purposeSummary || !String(purposeSummary).trim()) {
        throw new functions.https.HttpsError("invalid-argument", "발송 목적 개요를 입력해주세요.");
    }
    if (!GEMINI_API_KEY) {
        throw new functions.https.HttpsError("internal", "Gemini API 키가 설정되어 있지 않습니다.");
    }

    const OPT_OUT_LINE = '🚫 본 이벤트 알림을 원하지 않으시면 간단히 "수신거부" 문자를 보내주세요.';

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const promptText = `
당신은 충남 지역(내포, 홍성, 아산, 천안 등) 주방후드·욕실환풍기·사각싱크볼 공식 시공 전문점 '하츠 충남대리점'의 마케팅 실무자입니다.
대표님이 고객에게 보낼 안내 문자(LMS) 초안을 작성해주세요.

[캠페인 정보]
- 발송 범위: ${scopeLabel || '전체'}
- 대상 지역: ${regionName || '충남/내포'}
- 대상 고객군: ${targetAudience || '전체'}
- 연결 이벤트/링크명: ${eventTitle || '하츠 충남대리점 이벤트'}
- 대표님 발송 목적 개요: ${purposeSummary}

[작성 원칙]
1. 스팸처럼 과장되거나 딱딱한 광고 말투를 피하고, 동네 공식 대리점 대표가 직접 보내는 정중하고 신뢰감 있는 말투로 작성하세요.
2. 대상 고객군이 '시공고객(기존고객)'이면 기존 시공 감사 인사와 연계 혜택 톤으로, '상담고객'이면 지난 문의 감사 및 이번 행사 혜택 안내 톤으로 맞추세요.
3. 도입 문구(introText)는 '[하츠 충남대리점]'으로 시작하며 2~4줄로 간결하게 작성하세요.
4. 링크 제목(linkTitle)은 '▼ '로 시작하고 '👉 바로가기'로 끝나는 1줄로 작성하세요.
5. 맺음말(outroText)은 따뜻한 마무리 인사 1줄만 작성하세요. (수신거부 문구는 시스템이 자동으로 붙이므로 직접 쓰지 마세요.)
6. 반드시 마크다운 백틱 없이 순수 JSON 객체만 출력하세요.

{
  "introText": "...",
  "linkTitle": "...",
  "outroText": "..."
}
        `;

        const result = await model.generateContent(promptText);
        const responseText = result.response.text();
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("AI 응답에서 JSON을 파싱하지 못했습니다.");
        }
        const parsed = JSON.parse(jsonMatch[0]);
        const cleanOutro = String(parsed.outroText || "궁금하신 점은 편하게 답장이나 전화 주세요.").trim();

        return {
            introText: String(parsed.introText || "").trim(),
            linkTitle: String(parsed.linkTitle || "").trim(),
            outroText: `${cleanOutro}\n${OPT_OUT_LINE}`
        };
    } catch (error) {
        console.error("Gemini AI Error in generateSmsDraft:", error);
        throw new functions.https.HttpsError("internal", error.message || "AI 문구 생성 중 오류가 발생했습니다.");
    }
});
