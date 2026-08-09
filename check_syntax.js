const fs = require('fs');

function checkFile(file) {
    const html = fs.readFileSync(file, 'utf8');
    const scripts = html.match(/<script.*?>([\s\S]*?)<\/script>/gi);
    if (!scripts) return;
    scripts.forEach((s, i) => {
        let code = s.replace(/<script.*?>|<\/script>/g, '');
        if (code.trim().length === 0) return;
        // Basic eval for syntax check (using new Function)
        try {
            new Function(code);
        } catch (e) {
            // Check if it's module import syntax which new Function can't handle
            if (!code.includes('import ')) {
                console.error(`Syntax error in ${file} script #${i}:`, e.message);
            }
        }
    });
}

checkFile('public/admin.html');
checkFile('public/admin_v2.html');
console.log('Syntax check complete.');
