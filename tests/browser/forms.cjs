// Optional browser form and short-viewport invitation regression.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
(async () => {
  const b = await chromium.launch({ channel: 'chrome', headless: true });
  const c = await b.newContext({ serviceWorkers: 'block' });
  await c.route('https://**', (r) => r.abort());
  const p = await c.newPage();
  p.on('pageerror', (e) => console.error('Browser error:', e.message));
  let cases = 0;
  for (const theme of ['light', 'dark'])
    for (const [width, height] of [
      [320, 350],
      [390, 400],
      [844, 390],
    ]) {
      await p.setViewportSize({ width, height });
      await p.goto('http://localhost:4173/dev/ui-preview.html?state=lobby&lang=ru');
      await p.waitForFunction(() => typeof S !== 'undefined' && !!S.game);
      await p.evaluate((theme) => {
        document.documentElement.dataset.theme = theme;
        Object.defineProperty(navigator, 'clipboard', {
          value: { writeText: () => Promise.reject(Error('denied')) },
          configurable: true,
        });
      }, theme);
      await p.locator('[data-a=copy]').click();
      await p.waitForFunction(() => document.activeElement.id === 'manualInvite');
      await p.evaluate(() =>
        Promise.all(
          document.getAnimations().map((a) => {
            a.finish();
          }),
        ),
      );
      const bounds = await p.evaluate(() => ({
        input: document.querySelector('#manualInvite').getBoundingClientRect().toJSON(),
        close: document.querySelector('.qr-close').getBoundingClientRect().toJSON(),
        width: innerWidth,
        height: innerHeight,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      assert.ok(
        bounds.input.top >= 0 && bounds.input.bottom <= height,
        'manual input stays visible',
      );
      assert.ok(
        bounds.close.top >= 0 && bounds.close.bottom <= height,
        'close button stays visible',
      );
      assert.ok(bounds.close.width >= 44 && bounds.close.height >= 44);
      assert.ok(bounds.scrollWidth <= width + 1);
      await p.keyboard.press('Escape');
      assert.equal(await p.locator('#manualInvite').count(), 0);
      cases++;
    }
  await p.setViewportSize({ width: 390, height: 844 });
  await p.goto('http://localhost:4173/dev/ui-preview.html?state=lobby&lang=ja');
  await p.waitForFunction(() => typeof S !== 'undefined' && !!S.game);
  await p.locator('[data-a=editName]').click();
  await p.locator('#renameInput').fill('Knight');
  await p.evaluate(() => {
    window.originalRename = document.querySelector('#renameInput');
    originalRename.setSelectionRange(1, 4);
    sync();
  });
  assert.ok(
    await p.evaluate(
      () =>
        document.querySelector('#renameInput') === window.originalRename &&
        document.activeElement === originalRename &&
        originalRename.selectionStart === 1 &&
        originalRename.selectionEnd === 4,
    ),
    'sync preserves the focused rename field',
  );
  for (let i = 0; i < 3; i++) await p.keyboard.press('Tab');
  assert.equal(
    await p.evaluate(() => document.activeElement.id),
    'renameInput',
    'rename dialog traps keyboard focus',
  );
  await p.locator('#renameInput').press('Enter');
  await p.waitForFunction(() => !S.ui.rename && S.seats[ME.pid].nick === 'Knight');
  assert.ok(
    await p.evaluate(() => document.activeElement?.dataset.a === 'editName'),
    'rename returns focus to its trigger',
  );
  console.log(
    JSON.stringify({
      passed: true,
      rename: 'acknowledgement, sync stability and keyboard focus passed',
      shortViewportCases: cases,
      manualCopy: 'selected and visible',
      closeTarget: '44px',
      keyboard: 'Escape closes',
    }),
  );
  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
