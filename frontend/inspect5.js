import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:5175', { waitUntil: 'networkidle' });

  // Find the specific low-contrast element
  const lowContrastInfo = await page.evaluate(() => {
    // Find text containing "La anotación"
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while (node = walker.nextNode()) {
      if (node.textContent.includes('La anotación')) {
        const el = node.parentElement;
        const s = getComputedStyle(el);
        const parentCard = el.closest('.kb-card');
        const parentCardStyles = parentCard ? getComputedStyle(parentCard) : null;
        return {
          tag: el.tagName,
          className: el.className,
          text: node.textContent.trim().substring(0, 60),
          color: s.color,
          bg: s.backgroundColor,
          bgImage: s.backgroundImage,
          parentClassName: parentCard?.className,
          parentBg: parentCardStyles?.background?.substring(0, 80),
          parentColor: parentCardStyles?.color,
          parentHidden: parentCard?.hasAttribute('hidden'),
          display: parentCardStyles?.display,
          fontVariationSettings: s.fontVariationSettings
        };
      }
    }
    return 'text not found';
  });
  console.log('Low contrast element:', JSON.stringify(lowContrastInfo, null, 2));

  // Check all kb-record__note elements
  const notes = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.kb-record__note')).map(el => {
      const s = getComputedStyle(el);
      const card = el.closest('.kb-card');
      return {
        text: el.textContent.trim().substring(0, 40),
        color: s.color,
        bg: getComputedStyle(card).background.substring(0, 60),
        cardClass: card?.className,
        hidden: card?.hasAttribute('hidden')
      };
    });
  });
  console.log('All notes:', JSON.stringify(notes, null, 2));

  // Find ALL elements with 15px font that might have cramped padding
  const cramped = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('*'));
    return els
      .filter(el => {
        const s = getComputedStyle(el);
        const fs = parseFloat(s.fontSize);
        if (fs < 14 || fs > 16) return false;
        const pt = parseFloat(s.paddingTop);
        const pb = parseFloat(s.paddingBottom);
        const lineHeight = parseFloat(s.lineHeight) || fs * 1.2;
        const totalVerticalSpace = pt + pb + (fs < 14 ? 0 : 0);
        // Check if the element has a border, outline, or colored background
        const bg = s.backgroundColor;
        const hasBg = bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent';
        const border = s.border;
        const hasBorder = border && !border.includes('0px');
        return (pt + pb) < 8 && hasBg && hasBorder;
      })
      .slice(0, 20)
      .map(el => ({
        tag: el.tagName,
        className: el.className,
        text: el.textContent?.trim().substring(0, 30),
        fontSize: getComputedStyle(el).fontSize,
        paddingTop: getComputedStyle(el).paddingTop,
        paddingBottom: getComputedStyle(el).paddingBottom,
        bg: getComputedStyle(el).backgroundColor
      }));
  });
  console.log('Cramped elements (15px, <8px pad, has bg+border):', JSON.stringify(cramped, null, 2));

  // Also check footer links specifically
  const footerLinks = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.kb-footer a')).map(el => {
      const s = getComputedStyle(el);
      return {
        text: el.textContent?.trim(),
        paddingTop: s.paddingTop,
        paddingBottom: s.paddingBottom,
        fontSize: s.fontSize,
        lineHeight: s.lineHeight,
        bg: s.backgroundColor,
      };
    });
  });
  console.log('Footer links:', JSON.stringify(footerLinks, null, 2));

  await browser.close();
})();
