import { chromium } from '@playwright/test';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:5175', { waitUntil: 'networkidle' });
  await page.screenshot({ path: '/tmp/homepage-desktop.png', fullPage: true });
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobile.goto('http://localhost:5175', { waitUntil: 'networkidle' });
  await mobile.screenshot({ path: '/tmp/homepage-mobile.png', fullPage: true });
  const login = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await login.goto('http://localhost:5175/login', { waitUntil: 'networkidle' });
  await login.screenshot({ path: '/tmp/login-desktop.png', fullPage: true });
  await browser.close();
  console.log('done');
})();
