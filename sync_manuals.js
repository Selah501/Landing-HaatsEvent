const fs = require('fs');
const path = require('path');

const MANUALS_DIR = path.join(__dirname, '..', '.agents', 'manuals');
const HISTORY_FILE = path.join(__dirname, '..', 'HISTORY_AND_ROADMAP.md');
const OUTPUT_DIR = path.join(__dirname, 'public', 'data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'manual_data.json');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function formatDate(date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

function processMarkdownFile(filePath, category) {
    if (!fs.existsSync(filePath)) return null;
    
    const stat = fs.statSync(filePath);
    const lastModified = formatDate(stat.mtime);
    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);
    
    // 문서 첫 줄에 Latest Date(최신 수정일) 표기
    const contentWithDate = `> **Latest Date (최신 수정일): ${lastModified}**\n\n` + content;
    
    return {
        id: fileName.replace('.md', ''),
        title: fileName.replace('.md', '').replace(/_/g, ' '),
        category: category,
        content: contentWithDate,
        lastModified: lastModified
    };
}

const manualsData = [];

// 1. Process HISTORY_AND_ROADMAP.md (릴리스 노트 및 업데이트 로드맵)
const historyData = processMarkdownFile(HISTORY_FILE, '릴리스 노트 및 로드맵');
if (historyData) {
    manualsData.push(historyData);
}

// 2. Process all .md files in .agents/manuals
function readManualsRecursive(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            readManualsRecursive(fullPath);
        } else if (file.endsWith('.md')) {
            const data = processMarkdownFile(fullPath, '사용자 매뉴얼');
            if (data) {
                manualsData.push(data);
            }
        }
    }
}

if (fs.existsSync(MANUALS_DIR)) {
    readManualsRecursive(MANUALS_DIR);
}

// Write to JSON
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manualsData, null, 2), 'utf8');
console.log(`Successfully generated manual_data.json at ${OUTPUT_FILE}`);
console.log(`Total documents processed: ${manualsData.length}`);
