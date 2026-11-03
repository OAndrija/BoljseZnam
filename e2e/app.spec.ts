import {
  _electron as electron,
  expect,
  test,
  type ElectronApplication,
  type Page,
} from '@playwright/test';

// Runs the Vite build from `npm run package` (.vite/build/main.cjs) with the
// Electron binary from node_modules. The packaged app can't be used here,
// because its fuses disable the debugger Playwright needs to connect.
let app: ElectronApplication;
let page: Page;

test.beforeAll(async () => {
  app = await electron.launch({
    args: ['.', '--no-sandbox'],
    env: { ...process.env, NODE_ENV: 'production' },
  });
  // the app opens DevTools when not packaged; pick the app window itself
  page = await app.firstWindow();
  if (page.url().startsWith('devtools://')) {
    page = await app.waitForEvent('window', (w) => !w.url().startsWith('devtools://'));
  }
  await page.waitForLoadState('domcontentloaded');
});

test.afterAll(async () => {
  await app?.close();
});

/** Routes use a HashRouter, e.g. #/naloga/test/1990/3 */
async function goTo(hash: string) {
  await page.evaluate((h) => {
    window.location.hash = h;
  }, hash);
}

test('opens the main window with the navigation', async () => {
  await expect(page).toHaveTitle('BoljseZnam');
  for (const item of ['Domov', 'Po poglavjih', 'Celoten NPZ', 'Zgodovina']) {
    await expect(page.getByRole('link', { name: item, exact: true })).toBeVisible();
  }
});

test('loads the chapters from the data folder', async () => {
  await page.getByRole('link', { name: 'Po poglavjih', exact: true }).click();
  // chapter from data/categories.json, read through IPC from the main process
  await expect(page.getByText('Kisline, baze in soli').first()).toBeVisible();
});

test('grades a correct multiple-choice answer', async () => {
  await goTo('#/naloga/test/1990/3');
  await expect(page.getByText('pH vrednost manjšo od 7')).toBeVisible();

  const check = page.getByRole('button', { name: 'Preveri' });
  await expect(check).toBeDisabled();

  await page.getByRole('button', { name: /Kis/ }).click();
  await expect(check).toBeEnabled();
  await check.click();

  await expect(page.getByText('Pravilno! Odlično.')).toBeVisible();
  await expect(page.getByText('+10 XP')).toBeVisible();
});

test('explains a wrong multiple-choice answer', async () => {
  // a different route first, so the problem page mounts with fresh answers
  await goTo('#/');
  await goTo('#/naloga/test/1990/3');

  await page.getByRole('button', { name: /Milnica/ }).click();
  await page.getByRole('button', { name: 'Preveri' }).click();

  await expect(page.getByText('Ni čisto prav')).toBeVisible();
  await expect(page.getByText('Pravilen odgovor je B.')).toBeVisible();
});

test('records the attempts in the history', async () => {
  await page.getByRole('link', { name: 'Zgodovina', exact: true }).click();
  await expect(page.getByText('NPZ 1990 · naloga 3').first()).toBeVisible();
});

test('loads the image of a problem from data/resources', async () => {
  await goTo('#/');
  await goTo('#/naloga/test/1990/3');
  const image = page.locator('img[src*="test-ph-lestvica.svg"]');
  await expect(image).toBeVisible();
  // naturalWidth is 0 when the npz-resource:// protocol fails to serve it
  expect(await image.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
});