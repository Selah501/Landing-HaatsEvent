const fs = require('fs');
const path = require('path');

const oldHtml = fs.readFileSync('temp_admin.html', 'utf8');
const curHtml = fs.readFileSync('public/admin.html', 'utf8');

// The functions I deleted are window.addMasterRow, window.updateMasterRow, window.deleteMasterRow.
// Let's extract them from oldHtml.
const extractRegex = /(window\.addMasterRow = function\(\) \{[\s\S]*?)window\.renderEventList = function/g;
const match = extractRegex.exec(oldHtml);

if (match) {
    const missingFunctions = match[1];
    
    // Now inject it back into curHtml just before window.renderEventList = function
    const injectRegex = /(?=window\.renderEventList = function)/;
    const newHtml = curHtml.replace(injectRegex, missingFunctions);
    
    fs.writeFileSync('public/admin.html', newHtml, 'utf8');
    console.log("Restored missing functions.");
} else {
    console.log("Could not find the missing functions in temp_admin.html.");
}
