import { test, expect } from '@playwright/test';
import { instant } from '@next/playwright';

async function waitForMintWizard(page: import('@playwright/test').Page) {
  await expect(page.getByTestId('mint-wizard-title')).toBeVisible({ timeout: 60_000 });
}

async function waitForVerifyPanel(page: import('@playwright/test').Page) {
  await expect(page.getByTestId('verify-panel-title')).toBeVisible({ timeout: 60_000 });
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('sonic_guardian_visited', 'true');
  });
});

test.describe('Instant navigation', () => {
  test('home renders mint wizard', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForMintWizard(page);
  });

  test('home shows instant UI on initial load', async ({ page, baseURL }) => {
    await instant(
      page,
      async () => {
        await page.goto('/', { waitUntil: 'commit' });
        await expect(
          page.getByTestId('app-loading-shell').or(page.getByTestId('mint-wizard-title')),
        ).toBeVisible({ timeout: 15_000 });
      },
      { baseURL },
    );

    await waitForMintWizard(page);
  });

  test('verify route shows instant UI on hard navigation', async ({ page, baseURL }) => {
    await instant(
      page,
      async () => {
        await page.goto('/verify', { waitUntil: 'commit' });
        await expect(
          page.getByTestId('app-loading-shell').or(page.getByTestId('verify-panel-title')),
        ).toBeVisible({ timeout: 15_000 });
      },
      { baseURL },
    );

    await waitForVerifyPanel(page);
  });

  test('verify → mint client navigation is instant', async ({ page }) => {
    await page.goto('/verify', { waitUntil: 'domcontentloaded' });
    await waitForVerifyPanel(page);

    await instant(page, async () => {
      await page.getByTestId('nav-to-mint').click();
      await page.waitForURL((url) => url.pathname === '/');
      await expect(page.getByTestId('mint-wizard-title')).toBeVisible({ timeout: 15_000 });
    });
  });

  test('mint → verify navigation shows instant shell or verify panel', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForMintWizard(page);

    await page.getByTestId('nav-to-verify').first().click();
    await page.waitForURL((url) => url.pathname === '/verify');

    await expect(
      page.getByTestId('app-loading-shell').or(page.getByTestId('verify-panel-title')),
    ).toBeVisible({ timeout: 15_000 });

    await waitForVerifyPanel(page);
  });
});
