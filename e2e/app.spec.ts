import {
  _electron as electron,
  expect,
  test,
  type ElectronApplication,
  type Page,
} from '@playwright/test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

// The Vite build comes from `npm run package`. Packaged fuses disable the
// debugger Playwright needs, so tests launch the development Electron binary.
let app: ElectronApplication;
let page: Page;
let userDataRoot: string;

async function launchApp() {
  const env: Record<string, string> = {};
  for (const [name, value] of Object.entries(process.env)) {
    if (value !== undefined && name !== 'ELECTRON_RUN_AS_NODE')
      env[name] = value;
  }
  env.NODE_ENV = 'test';
  env.BOLJSEZNAM_TEST_USER_DATA_DIR = userDataRoot;
  env.APPDATA = userDataRoot;
  env.XDG_CONFIG_HOME = userDataRoot;
  env.HOME = userDataRoot;
  app = await electron.launch({
    args: ['.', '--no-sandbox'],
    env,
  });
  // The app opens DevTools when not packaged; select the application window.
  page = await app.firstWindow();
  if (page.url().startsWith('devtools://')) {
    page = await app.waitForEvent(
      'window',
      (w) => !w.url().startsWith('devtools://'),
    );
  }
  await page.waitForLoadState('domcontentloaded');
  const actualUserData = await app.evaluate(({ app }) =>
    app.getPath('userData'),
  );
  const relative = path.relative(userDataRoot, actualUserData);
  expect(
    relative === '' ||
      (!relative.startsWith('..') && !path.isAbsolute(relative)),
  ).toBe(true);
  await expect(
    page.getByRole('link', { name: 'Zgodovina', exact: true }),
  ).toBeVisible();
}

test.beforeAll(async () => {
  userDataRoot = mkdtempSync(path.join(tmpdir(), 'boljseznam-e2e-'));
  await launchApp();
});

test.afterAll(async () => {
  await app?.close();
  if (userDataRoot) rmSync(userDataRoot, { recursive: true, force: true });
});

/** Routes use a HashRouter, e.g. #/naloga/test/1990/3. */
async function goTo(hash: string) {
  await page.evaluate((route) => {
    window.location.hash = route;
  }, hash);
}

async function savedDraftState(key: string) {
  return page.evaluate(async (draftKey) => {
    const row = (await window.api.loadProgress()).drafts.find(
      (item) => item.draftKey === draftKey,
    );
    return row ? row.stateJson : null;
  }, key);
}

test('opens the main window with the navigation', async () => {
  await expect(page).toHaveTitle('BoljseZnam');
  for (const item of ['Domov', 'Po poglavjih', 'Celoten NPZ', 'Zgodovina']) {
    await expect(
      page.getByRole('link', { name: item, exact: true }),
    ).toBeVisible();
  }
});

test('loads the chapters from the data folder', async () => {
  await page.getByRole('link', { name: 'Po poglavjih', exact: true }).click();
  await expect(page.getByText('Kisline, baze in soli').first()).toBeVisible();
});

test('grades a correct multiple-choice answer', async () => {
  await goTo('#/naloga/test/1990/3');
  await expect(page.getByText(/pH vrednost manjšo od 7/)).toBeVisible();

  const check = page.getByRole('button', { name: 'Preveri' });
  await expect(check).toBeDisabled();
  await page.getByRole('button', { name: /Kis/ }).click();
  await expect(check).toBeEnabled();
  await check.click();

  await expect(page.getByText('Pravilno! Odlično.')).toBeVisible();
  await expect(page.getByText('+10 XP')).toBeVisible();
});

test('explains a wrong answer on a repeat attempt', async () => {
  // A different practice set gives this repeat attempt its own draft.
  await goTo('#/naloga/test/1990/3?vrsta=multiple-choice');
  await page.getByRole('button', { name: /Milnica/ }).click();
  await page.getByRole('button', { name: 'Preveri' }).click();

  await expect(page.getByText('Ni čisto prav')).toBeVisible();
  await expect(page.getByText('Pravilen odgovor je B.')).toBeVisible();
});

test('records individual attempts and XP in history', async () => {
  await page.getByRole('link', { name: 'Zgodovina', exact: true }).click();
  await expect(
    page.getByRole('row').filter({ hasText: 'NPZ 1990 · naloga 3' }),
  ).toHaveCount(2);
  await expect
    .poll(() =>
      page.evaluate(async () => (await window.api.loadProgress()).totalXp),
    )
    .toBe(12);
});

test('restores an unfinished answer and history after restarting', async () => {
  await goTo('#/naloga/test/1990/4');
  await page.getByRole('textbox', { name: 'Rezultat' }).fill('7');
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const drafts = (await window.api.loadProgress()).drafts;
        const draft = drafts.find((item) => item.draftKey === 'naloga:');
        return (
          draft &&
          JSON.parse(draft.stateJson).problems['test-1990-4']?.answers[0]?.value
        );
      }),
    )
    .toBe('7');

  await app.close();
  await launchApp();
  await goTo('#/naloga/test/1990/4');
  await expect(page.getByRole('textbox', { name: 'Rezultat' })).toHaveValue(
    '7',
  );
  await expect
    .poll(() =>
      page.evaluate(async () => (await window.api.loadProgress()).totalXp),
    )
    .toBe(12);
  await goTo('#/zgodovina');
  await expect(
    page.getByRole('row').filter({ hasText: 'NPZ 1990 · naloga 3' }),
  ).toHaveCount(2);
});

test('skipping an unfinished question does not add history or XP', async () => {
  await goTo('#/naloga/test/1990/4');
  await page.getByRole('button', { name: 'Preskoči' }).click();
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const progress = await window.api.loadProgress();
        return [progress.history.length, progress.totalXp];
      }),
    )
    .toEqual([2, 12]);
});

test('restores the same generated naming and equation problems', async () => {
  await goTo('#/spojine');
  await page.getByRole('textbox', { name: 'Ime spojine' }).fill('poskus');
  await expect
    .poll(
      async () =>
        JSON.parse((await savedDraftState('poimenovanje')) ?? 'null')?.answer,
    )
    .toBe('poskus');
  const namingState = await savedDraftState('poimenovanje');

  await goTo('#/reakcije');
  await page.getByRole('textbox', { name: 'Koeficient 1' }).fill('2');
  await expect
    .poll(
      async () =>
        JSON.parse((await savedDraftState('reakcija')) ?? 'null')?.values[0],
    )
    .toBe('2');
  const equationState = await savedDraftState('reakcija');

  await app.close();
  await launchApp();
  await goTo('#/spojine');
  await expect(page.getByRole('textbox', { name: 'Ime spojine' })).toHaveValue(
    'poskus',
  );
  expect(await savedDraftState('poimenovanje')).toBe(namingState);

  await goTo('#/reakcije');
  await expect(page.getByRole('textbox', { name: 'Koeficient 1' })).toHaveValue(
    '2',
  );
  expect(await savedDraftState('reakcija')).toBe(equationState);
});

test('loads a problem image from data/resources', async () => {
  await goTo('#/naloga/test/1990/3');
  const image = page.locator('img[src*="test-ph-lestvica.svg"]');
  await expect(image).toBeVisible();
  expect(
    await image.evaluate((img: HTMLImageElement) => img.naturalWidth),
  ).toBeGreaterThan(0);
});
