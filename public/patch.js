const fs = require('fs');
let html = fs.readFileSync('admin_v2.html', 'utf8');

// Replace the onclick with an alert wrap
html = html.replace(
  /onclick="startVoiceReport\('\$\{task\.rId\}'\)"/g, 
  'onclick="try{ window.startVoiceReport(\\'${task.rId}\\'); }catch(e){ alert(\\'에러 발생: \\' + e.message); console.error(e); }"'
);

// Also add a console log to startVoiceReport itself just in case
html = html.replace(
  'window.startVoiceReport = function(rId) {',
  'window.startVoiceReport = function(rId) {\n            alert("startVoiceReport called with rId: " + rId);\n'
);

fs.writeFileSync('admin_v2.html', html);
console.log('HTML Updated.');
