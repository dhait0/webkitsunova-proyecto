import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:5175', { waitUntil: 'networkidle' });

  // Check if :has() is supported
  const hasSupport = await page.evaluate(() => {
    const div = document.createElement('div');
    div.innerHTML = '<style>body:has(.test) { background: red; }</style><div class="test"></div>';
    document.body.appendChild(div);
    const bg = getComputedStyle(document.body).backgroundColor;
    div.remove();
    return bg === 'rgb(255, 0, 0)';
  });
  console.log(':has() support:', hasSupport);

  // Check body::before visibility
  const bodyBefore = await page.evaluate(() => {
    const style = getComputedStyle(document.body, '::before');
    return {
      content: style.content,
      background: style.background,
      zIndex: style.zIndex,
      position: style.position
    };
  });
  console.log('body::before:', JSON.stringify(bodyBefore, null, 2));

  // Check if body has the background image from global.css
  const bodyStyles = await page.evaluate(() => {
    const s = getComputedStyle(document.body);
    return {
      background: s.background,
      fontFamily: s.fontFamily,
    };
  });
  console.log('Body styles:', JSON.stringify(bodyStyles, null, 2));

  // Check footer link padding
  const footerLinkStyles = await page.evaluate(() => {
    const el = document.querySelector('.kb-footer a');
    if (!el) return 'not found';
    const s = getComputedStyle(el);
    return {
      padding: s.padding,
      paddingTop: s.paddingTop,
      fontSize: s.fontSize,
      lineHeight: s.lineHeight
    };
  });
  console.log('Footer link styles:', JSON.stringify(footerLinkStyles, null, 2));

  // Check kb-stamp color on dark cards
  const stampColor = await page.evaluate(() => {
    const stamps = Array.from(document.querySelectorAll('.kb-stamp'));
    return stamps.map(el => {
      const s = getComputedStyle(el);
      const bg = s.backgroundColor;
      const color = s.color;
      // Determine if inside light card
      const card = el.closest('.kb-card');
      const isLight = card?.classList.contains('kb-card--light');
      return {
        text: el.textContent?.trim().substring(0, 30),
        color: color,
        bg: bg,
        isLightCard: isLight,
        parentClass: card?.className
      };
    });
  });
  console.log('Stamp colors:', JSON.stringify(stampColor, null, 2));

  // Check for visual overlay visibility - screenshot pixel analysis
  await page.goto('http://localhost:5175/login', { waitUntil: 'networkidle' });

  // Check login page elements
  const loginElements = await page.evaluate(() => {
    const register = document.querySelector('.kb-register');
    const nav = document.querySelector('.kb-nav');
    const root = document.querySelector('.kb-root');
    return {
      hasRegister: !!register,
      hasNav: !!nav,
      hasRoot: !!root,
      rootBg: getComputedStyle(root || {}).background?.substring(0, 80),
      navBg: getComputedStyle(nav || {}).background?.substring(0, 80),
    };
  });
  console.log('Login page elements:', JSON.stringify(loginElements, null, 2));

  await browser.close();
})();
