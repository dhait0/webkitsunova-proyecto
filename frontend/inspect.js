import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:5175', { waitUntil: 'networkidle' });

  // Check kb-register input padding
  const inputStyles = await page.evaluate(() => {
    const input = document.querySelector('.kb-register input');
    if (!input) return 'input not found';
    const styles = getComputedStyle(input);
    return {
      padding: styles.padding,
      paddingTop: styles.paddingTop,
      paddingBottom: styles.paddingBottom,
      fontSize: styles.fontSize,
      lineHeight: styles.lineHeight,
      height: styles.height,
      minHeight: styles.minHeight
    };
  });
  console.log('Register input styles:', JSON.stringify(inputStyles, null, 2));

  // Check kb-field__row input (password field)
  const rowInputStyles = await page.evaluate(() => {
    const input = document.querySelector('.kb-field__row input');
    if (!input) return 'password input not found';
    const styles = getComputedStyle(input);
    return {
      padding: styles.padding,
      paddingTop: styles.paddingTop,
      paddingBottom: styles.paddingBottom,
      fontSize: styles.fontSize,
      height: styles.height,
      minHeight: styles.minHeight
    };
  });
  console.log('Password input styles:', JSON.stringify(rowInputStyles, null, 2));

  // Check what has text-transform: uppercase
  const uppercaseElems = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('*'));
    return els
      .filter(el => {
        const s = getComputedStyle(el);
        return s.textTransform === 'uppercase' && el.textContent && el.textContent.trim().length > 10;
      })
      .map(el => ({
        tag: el.tagName,
        className: el.className,
        text: el.textContent?.trim().substring(0, 60),
        fontSize: getComputedStyle(el).fontSize
      }));
  });
  console.log('Uppercase elements with >10 chars:', JSON.stringify(uppercaseElems, null, 2));

  // Check what has transition: width
  const widthTransitionElems = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('*'));
    return els
      .filter(el => {
        const s = getComputedStyle(el);
        return s.transitionProperty.includes('width');
      })
      .map(el => ({
        tag: el.tagName,
        className: el.className,
        id: el.id,
        transitionProperty: getComputedStyle(el).transitionProperty,
        transitionDuration: getComputedStyle(el).transitionDuration
      }))
      .slice(0, 10);
  });
  console.log('Elements with transition: width:', JSON.stringify(widthTransitionElems, null, 2));

  // Check low contrast text
  const lowContrast = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('p, span, li, a, h1, h2, h3, h4, h5, h6'));
    const results = [];
    for (const el of els) {
      const s = getComputedStyle(el);
      const color = s.color;
      const bg = s.backgroundColor;
      const text = el.textContent?.trim().substring(0, 40);
      if (text && text.length > 5) {
        results.push({
          tag: el.tagName,
          className: el.className || el.id,
          text: text,
          color: color,
          bg: bg,
          fontSize: s.fontSize
        });
      }
    }
    return results;
  });
  // Find elements with light text
  const lightText = lowContrast.filter(r => {
    // Check if it's a light color on dark background
    const c = r.color;
    return c.includes('rgb') && !c.includes('250') && !c.includes('255');
  });
  console.log('Sample text elements:', JSON.stringify(lowContrast.slice(0, 15), null, 2));

  await browser.close();
})();
