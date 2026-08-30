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
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

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

// =========================================================================
// Cloud Functions v2: 통화 녹음 자동 분석 (Firebase Storage 트리거)
// 스마트폰 → Firebase Storage 업로드 → Gemini AI 분석 → RTDB crm_pending 저장
// =========================================================================
const { processCallRecording } = require("./processCallRecording");
exports.processCallRecording = processCallRecording;

const { diagnoseCallStatus } = require("./diagnoseCallStatus");
exports.diagnoseCallStatus = diagnoseCallStatus;
