import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:5175', { waitUntil: 'networkidle' });

  // Check fonts
  const fontInfo = await page.evaluate(() => {
    const el = document.querySelector('.kb-display');
    if (!el) return 'no kb-display found';
    const s = getComputedStyle(el);
    return {
      fontFamily: s.fontFamily,
      fontSize: s.fontSize,
      fontWeight: s.fontWeight,
      fontVariationSettings: s.fontVariationSettings
    };
  });
  console.log('Display font info:', JSON.stringify(fontInfo, null, 2));

  // Check body copy
  const bodyInfo = await page.evaluate(() => {
    const el = document.querySelector('.kb-body');
    if (!el) return 'no kb-body found';
    const s = getComputedStyle(el);
    return {
      fontFamily: s.fontFamily,
      fontSize: s.fontSize,
      color: s.color
    };
  });
  console.log('Body font info:', JSON.stringify(bodyInfo, null, 2));

  // Check root background
  const rootInfo = await page.evaluate(() => {
    const el = document.querySelector('.kb-root');
    if (!el) return 'no kb-root found';
    const s = getComputedStyle(el);
    return {
      background: s.background,
      backgroundImage: s.backgroundImage,
      fontFamily: s.fontFamily,
      zIndex: s.zIndex
    };
  });
  console.log('Root info:', JSON.stringify(rootInfo, null, 2));

  // Check body
  const bodyStyles = await page.evaluate(() => {
    const s = getComputedStyle(document.body);
    return {
      fontFamily: s.fontFamily,
      background: s.backgroundImage || s.backgroundColor,
    };
  });
  console.log('Body styles:', JSON.stringify(bodyStyles, null, 2));

  // Check body::before
  const beforeStyles = await page.evaluate(() => {
    const before = document.querySelector('body::before') || document.body;
    // Can't access ::before via DOM, but check body background
    const s = getComputedStyle(document.body);
    return {
      background: s.background,
      backgroundImage: s.backgroundImage
    };
  });
  console.log('Body background:', JSON.stringify(beforeStyles, null, 2));

  // Check what the body::before is doing
  const hasBodyBefore = await page.evaluate(() => {
    // Check if body::before has content
    const style = getComputedStyle(document.body, '::before');
    return {
      content: style.content,
      background: style.background
    };
  });
  console.log('Body::before:', JSON.stringify(hasBodyBefore, null, 2));

  // Check the overall layout - measure key sections
  const layoutInfo = await page.evaluate(() => {
    const root = document.querySelector('.kb-root');
    const nav = document.querySelector('.kb-nav');
    const cover = document.querySelector('.kb-cover');
    const register = document.querySelector('.kb-register');
    const stage = document.querySelector('.kb-cover__stage');
    const fox = document.querySelector('.kb-foxfigure img');
    return {
      rootRect: root ? { width: root.offsetWidth, height: root.offsetHeight } : null,
      navHeight: nav ? nav.offsetHeight : null,
      coverRect: cover ? { width: cover.offsetWidth, height: cover.offsetHeight } : null,
      registerRect: register ? { width: register.offsetWidth, height: register.offsetHeight } : null,
      stageRect: stage ? { width: stage.offsetWidth, height: stage.offsetHeight } : null,
      foxRect: fox ? { width: fox.offsetWidth, height: fox.offsetHeight } : null,
    };
  });
  console.log('Layout info:', JSON.stringify(layoutInfo, null, 2));

  await browser.close();
})();
