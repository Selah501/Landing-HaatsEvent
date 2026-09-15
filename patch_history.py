import io
import re

file_path = r"c:\dev\전단지이벤트\HISTORY_AND_ROADMAP.md"

try:
    with open(file_path, "r", encoding="utf-8", errors="replace") as f:
        content = f.read()
except Exception as e:
    print(f"Error reading file: {e}")
    content = ""

new_entry = """
## [2026-09-15] 아파트 DB 교체 품목 및 자료 첨부 기능 추가
### 주요 변경 사항
1. **아파트 DB UI 추가**: `apt_db.html` 내 교체 품목 및 관련 자료(문서/이미지) 관리 동적 테이블 추가
2. **이미지 뷰어 및 스토리지 연동**: Firebase Storage 연동으로 항목당 최대 5장 이미지 썸네일 및 모달 지원
3. **구분(카테고리) 커스텀 에디터**: Firebase RTDB 연동하여 카테고리 실시간 추가/삭제 관리 기능
4. **보안 및 스키마 업데이트**: Supabase `replacement_items` JSONB 컬럼 추가 및 Firebase `storage.rules` 권한 허용 배포
5. **작업 이력**:
   - Git Commit Message: `feat(apt_db): add replacement items UI, storage rules update, and category editor`
   - [상세 요약 워크스루](.agents/work_logs/20260915_아파트DB_품목저장_기능.md)
"""

if "## [Pending / Future Work]" in content:
    content = content.replace("## [Pending / Future Work]", new_entry + "\n## [Pending / Future Work]")
else:
    content += "\n" + new_entry

try:
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("History updated successfully!")
except Exception as e:
    print(f"Error writing file: {e}")
