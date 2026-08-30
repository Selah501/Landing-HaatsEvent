const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { getStorage } = require("firebase-admin/storage");

exports.diagnoseCallStatus = onCall(
    {
        region: "asia-northeast3",
        cors: true,
    },
    async (request) => {
        try {
            // 기본 버킷 가져오기
            const bucket = getStorage().bucket();
            const [files] = await bucket.getFiles({ prefix: "call_records" });
            
            let latestFile = null;
            for (const file of files) {
                if (file.name.endsWith('/')) continue;
                if (!file.name.match(/\.(m4a|mp3|wav|amr|aac|ogg)$/i)) continue;

                const timeCreated = new Date(file.metadata.timeCreated).getTime();
                if (!latestFile || timeCreated > latestFile.timeCreated) {
                    latestFile = {
                        name: file.name,
                        timeCreated: timeCreated,
                        folder: file.name.split('/')[0] // call_records, call_records_failed, call_records_done
                    };
                }
            }

            const now = Date.now();
            // 20분 내의 파일만 최근 파일로 간주
            const isRecent = latestFile && (now - latestFile.timeCreated < 20 * 60 * 1000);

            if (!latestFile || !isRecent) {
                return { 
                    status: "NOT_UPLOADED", 
                    message: "클라우드(서버)에 최근 업로드된 파일이 없습니다." 
                };
            }

            if (latestFile.folder === "call_records_failed") {
                // 에러난 파일을 재시도하기 위해 원래 폴더로 이동 (processCallRecording 함수 재트리거)
                const fileNameOnly = latestFile.name.split('/').pop();
                const newPath = `call_records/${fileNameOnly}`;
                await bucket.file(latestFile.name).move(newPath);
                
                return { 
                    status: "RETRYING", 
                    message: "오류가 발생한 파일(failed)을 발견하여 재시도를 시작했습니다." 
                };
            }

            if (latestFile.folder === "call_records") {
                return { 
                    status: "PROCESSING", 
                    message: "서버에서 AI 분석이 현재 진행 중입니다." 
                };
            }

            if (latestFile.folder === "call_records_done") {
                return { 
                    status: "DONE", 
                    message: "분석이 정상적으로 완료되었습니다." 
                };
            }

            return { 
                status: "UNKNOWN",
                message: "알 수 없는 상태입니다."
            };

        } catch (error) {
            console.error("진단 API 오류:", error);
            throw new HttpsError("internal", error.message);
        }
    }
);
