import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:5175', { waitUntil: 'networkidle' });

  // Check kb-under element styles
  const underStyles = await page.evaluate(() => {
    const el = document.querySelector('.kb-under');
    if (!el) return 'not found';
    const s = getComputedStyle(el);
    return {
      display: s.display,
      visibility: s.visibility,
      background: s.background,
      backgroundColor: s.backgroundColor,
      color: s.color,
      hidden: el.hasAttribute('hidden'),
      zIndex: s.zIndex,
      textContent: el.textContent?.trim().substring(0, 80)
    };
  });
  console.log('kb-under:', JSON.stringify(underStyles, null, 2));

  // Check kb-body text inside kb-under
  const bodyInUnder = await page.evaluate(() => {
    const el = document.querySelector('.kb-under .kb-body');
    if (!el) return 'not found';
    const s = getComputedStyle(el);
    return {
      display: s.display,
      color: s.color,
      background: s.backgroundColor,
      fontSize: s.fontSize,
      hidden: el.hasAttribute('hidden'),
      parentHidden: el.closest('.kb-under')?.hasAttribute('hidden')
    };
  });
  console.log('kb-body in kb-under:', JSON.stringify(bodyInUnder, null, 2));

  // Check kb-footnote styles
  const footnoteStyles = await page.evaluate(() => {
    const el = document.querySelector('.kb-footnote');
    if (!el) return 'not found';
    const s = getComputedStyle(el);
    return {
      color: s.color,
      background: s.backgroundColor,
      fontSize: s.fontSize,
    };
  });
  console.log('kb-footnote:', JSON.stringify(footnoteStyles, null, 2));

  // Check the specific cramped-padding element - try different selectors
  const crampedElements = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('.kb-footer a, .kb-tab, .kb-modes button, .kb-register .kb-btn--quiet'));
    return els.map(el => {
      const s = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        tag: el.tagName,
        className: el.className,
        text: el.textContent?.trim().substring(0, 20),
        fontSize: s.fontSize,
        lineHeight: s.lineHeight,
        paddingTop: s.paddingTop,
        paddingBottom: s.paddingBottom,
        height: s.height,
        rectHeight: rect.height
      };
    });
  });
  console.log('Cramped check elements:', JSON.stringify(crampedElements, null, 2));

  await browser.close();
})();
