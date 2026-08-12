const fs = require('fs');
const path = require('path');

const oldHtml = fs.readFileSync('c:/dev/전단지이벤트/landing/temp_admin.html', 'utf16le');
let curHtml = fs.readFileSync('c:/dev/전단지이벤트/landing/public/admin.html', 'utf8');

// 1. Extract missing functions from oldHtml
const oldLines = oldHtml.split('\n');
const startIndex = oldLines.findIndex(l => l.includes('window.addMasterRow = function'));
const endIndex = oldLines.findIndex(l => l.includes('window.renderEventList = function'));

if (startIndex === -1 || endIndex === -1) {
    console.error("Could not find missing functions in oldHtml");
    process.exit(1);
}

const missingFunctions = oldLines.slice(startIndex, endIndex).join('\n');

// 2. Fix the renderMasterList buttons in curHtml
// Currently, my curHtml has:
// <button class="btn-primary" style="padding: 6px 12px; font-size:12px; margin-bottom: 4px; display:block; width:100%;" onclick="updateMasterRow(${idx})">수정(저장)</button>
// <button class="btn-danger" style="padding: 6px 12px; font-size:12px; display:block; width:100%;" onclick="deleteMasterRow(${idx})">삭제</button>
curHtml = curHtml.replace(
    /<button class="btn-primary"[\s\S]*?onclick="updateMasterRow\(\$\{idx\}\)">.*?<\/button>/g,
    `<button class="btn-info" style="padding: 6px 12px; font-size:12px; margin-bottom: 4px; display:block; width:100%;" onclick="openAssignModal('\${prod.id}')">현장 배정</button>`
);

// 3. Inject missing functions into curHtml right before window.renderEventList = function
// Let's make sure we don't inject multiple times
if (!curHtml.includes('window.addMasterRow = function')) {
    curHtml = curHtml.replace(
        /window\.renderEventList = function\(\)/,
        missingFunctions + '\n    window.renderEventList = function()'
    );
}

fs.writeFileSync('c:/dev/전단지이벤트/landing/public/admin.html', curHtml, 'utf8');
console.log("Restored missing functions and fixed buttons.");
