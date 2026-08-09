const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  
  await page.goto('http://localhost:8904/admin_v2.html', { waitUntil: 'networkidle2' });
  
  // Wait for data to load
  await page.waitForTimeout(2000);
  
  // Find the button that has text "🎤 음성 보고"
  const buttons = await page.$$('button');
  let clicked = false;
  for (let btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('🎤 음성 보고')) {
          console.log('Found voice report button, clicking...');
          await btn.click();
          clicked = true;
          break;
      }
  }
  
  if (!clicked) {
      console.log('Button not found!');
  }
  
  await page.waitForTimeout(1000);
  
  await browser.close();
})();
