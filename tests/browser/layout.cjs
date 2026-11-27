// Optional real-browser layout checks. All game screens use the offline preview.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
let activeCase = 'initialization';
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const context = await browser.newContext({ serviceWorkers: 'block' });
    await context.route('https://**', (route) => route.abort());
    const page = await context.newPage(),
      errors = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
      console.error(activeCase, error.message);
    });
    page.on('requestfailed', (request) => {
      if (
        request.url().startsWith('http://localhost:4173/') &&
        request.failure()?.errorText !== 'net::ERR_ABORTED'
      )
        console.error(activeCase, request.url(), request.failure()?.errorText);
    });
    const languages = ['en', 'zh', 'zh-TW', 'ru', 'es', 'pt', 'vi', 'ja', 'ko'];
    const routes = ['en', 'zh-cn', 'zh-tw', 'ru', 'es', 'pt', 'vi', 'ja', 'ko'];
    let checks = 0;
    for (const lang of languages)
      for (const theme of ['light', 'dark'])
        for (const [width, height] of [
          [320, 720],
          [390, 844],
          [844, 390],
          [1440, 1000],
        ]) {
          activeCase = `home ${lang} ${theme} ${width}`;
          await page.setViewportSize({ width, height });
          await page.goto(`http://localhost:4173/dev/ui-preview.html?state=home&lang=${lang}`);
          await page.waitForFunction(
            () =>
              typeof ME !== 'undefined' &&
              !!ME.pid &&
              !!window.AvalonShell &&
              !!document.querySelector('.av-header'),
          );
          await page.evaluate((theme) => {
            document.documentElement.dataset.theme = theme;
          }, theme);
          assert.ok(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
            `${lang} ${theme} ${width} home overflow`,
          );
          assert.equal(await page.locator('#nick').count(), 1, 'one nickname field');
          assert.equal(
            await page.locator('.home-submit').count(),
            1,
            'only the selected action has a submit button',
          );
          assert.equal(
            await page.locator('#joinCode').count(),
            0,
            'creation does not ask for a room code',
          );
          assert.equal(await page.locator('#homeTab-create').getAttribute('aria-selected'), 'true');
          const stage = await page.evaluate(() => ({
            hero: document.querySelector('.home-page>.hero').getBoundingClientRect().toJSON(),
            entry: document
              .querySelector('.home-page>.home-entry')
              .getBoundingClientRect()
              .toJSON(),
          }));
          if (width >= 1000) {
            assert.ok(
              Math.abs(stage.hero.top - stage.entry.top) < 1 &&
                Math.abs(stage.hero.bottom - stage.entry.bottom) < 1,
              'desktop artwork and operation panel share edges',
            );
            assert.ok(
              stage.hero.right < stage.entry.left,
              'desktop artwork and operation panel sit side by side',
            );
          } else
            assert.ok(
              stage.hero.bottom <= stage.entry.top,
              'smaller layouts retain the artwork-then-form stack',
            );
          const choices = await page
            .locator('.home-mode-tab')
            .evaluateAll((items) => items.map((item) => item.getBoundingClientRect().toJSON()));
          assert.ok(
            choices.every((rect) => rect.height >= 44),
            'both operation choices keep touch targets',
          );
          if (width <= 390 && height >= 720)
            assert.ok(
              choices.every((rect) => rect.bottom <= height),
              'both operation choices appear in the phone viewport',
            );
          await page.locator('#nick').fill('');
          await page.locator('#nick').press('Enter');
          assert.equal(
            await page.evaluate(() => S.code),
            null,
            'blank nickname never creates a room',
          );
          await page.locator('#nick').fill('Test');
          await page.locator('#homeTab-join').click();
          assert.equal(
            await page.locator('#nick').inputValue(),
            'Test',
            'changing operation preserves the nickname',
          );
          assert.ok(await page.locator('#joinCode').isVisible());
          assert.equal(await page.locator('.home-submit').getAttribute('data-a'), 'join');
          if (width >= 1000)
            assert.ok(
              await page.evaluate(
                () =>
                  Math.abs(
                    document.querySelector('.hero').getBoundingClientRect().bottom -
                      document.querySelector('.home-entry').getBoundingClientRect().bottom,
                  ) < 1,
              ),
              'joining retains aligned desktop panels',
            );
          await page.locator('#joinCode').fill('!');
          await page.locator('#nick').press('Enter');
          assert.equal(
            await page.evaluate(() => document.activeElement.id),
            'joinCode',
            'nickname Enter moves to the next joining field',
          );
          await page.locator('#joinCode').press('Enter');
          assert.equal(await page.evaluate(() => S.code), null, 'invalid code never opens a room');
          await page.locator('#homeTab-create').click();
          assert.equal(await page.locator('#joinCode').count(), 0);
          assert.equal(await page.locator('#nick').inputValue(), 'Test');
          await page.locator('#homeTab-join').click();
          assert.equal(
            await page.locator('#joinCode').inputValue(),
            '!',
            'switching back preserves the code',
          );
          await page.locator('#homeTab-join').press('ArrowLeft');
          assert.equal(await page.locator('#homeTab-create').getAttribute('aria-selected'), 'true');
          assert.equal(await page.evaluate(() => document.activeElement.id), 'homeTab-create');
          await page.locator('#homeTab-create').press('End');
          assert.equal(await page.locator('#homeTab-join').getAttribute('aria-selected'), 'true');
          assert.ok(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
            `${lang} ${theme} ${width} join overflow`,
          );
          checks++;
        }
    for (const route of routes)
      for (const theme of ['light', 'dark'])
        for (const [width, height] of [
          [320, 720],
          [844, 390],
          [1440, 1000],
        ]) {
          activeCase = `guide ${route} ${theme} ${width}`;
          await page.setViewportSize({ width, height });
          await page.goto(`http://localhost:4173/how-to-play/${route}/`);
          await page.evaluate((theme) => {
            document.documentElement.dataset.theme = theme;
          }, theme);
          const details = page.locator('details.guide-optional'),
            summary = details.locator('summary');
          await summary.focus();
          await summary.press('Enter');
          assert.equal(await details.getAttribute('open'), '');
          await summary.press('Enter');
          assert.equal(await details.getAttribute('open'), null);
          assert.ok(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
            `${route} ${theme} ${width} guide overflow`,
          );
          const locale = languages[routes.indexOf(route)];
          assert.ok(
            (await page.locator('.guide-play').getAttribute('href')).includes('lang=' + locale),
          );
          checks++;
        }
    // No-JS reading and deterministic fallback also work with a saved different language.
    const nojs = await browser.newContext({ javaScriptEnabled: false, serviceWorkers: 'block' });
    const staticPage = await nojs.newPage();
    await staticPage.goto('http://localhost:4173/how-to-play/en/');
    assert.equal(await staticPage.locator('.setup-table tbody tr').count(), 6);
    await staticPage.locator('.guide-optional summary').click();
    assert.ok(await staticPage.locator('.guide-optional [src$="cleric.webp"]').isVisible());
    await page.goto('http://localhost:4173/how-to-play/');
    await page.waitForURL('**/how-to-play/en/');
    await page.goto('http://localhost:4173/dev/render-stability.html');
    await page.waitForFunction(
      () => document.body.innerText.includes('PASS') || document.body.innerText.includes('FAIL'),
    );
    assert.match(await page.locator('body').innerText(), /PASS/);
    assert.deepEqual(errors, []);
    console.log(
      JSON.stringify(
        {
          passed: true,
          layoutCases: checks,
          languages: 9,
          themes: 2,
          renderStability: 'PASS',
          noJavaScript: 'PASS',
          errors,
        },
        null,
        2,
      ),
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(activeCase, error);
  process.exitCode = 1;
});
