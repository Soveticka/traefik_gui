import { expect, test } from '@playwright/test';

test('syncs audit filters with URL and backend query params', async ({ page }) => {
  await page.route('**/health', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'ok' }) });
  });

  for (const endpoint of ['/api/v1/routers', '/api/v1/services', '/api/v1/middlewares']) {
    await page.route(`**${endpoint}`, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });
  }

  const auditRequestUrls: string[] = [];
  await page.route('**/api/v1/config/audit**', async (route) => {
    auditRequestUrls.push(route.request().url());
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        entries: [
          {
            timestamp: '2026-04-09T12:00:00.000Z',
            action: 'router.save',
            resourceName: 'edge-router',
            revision: 'abc',
            actorIp: '127.0.0.1',
            actorUserAgent: 'playwright',
          },
        ],
      }),
    });
  });

  await page.goto('/audit?action=router.save&resource=edge&sinceRange=24h&limit=25&autoRefresh=1');

  await expect(page.getByRole('heading', { name: 'Audit Log' })).toBeVisible();
  await expect(page.locator('select').first()).toHaveValue('router.save');
  await expect(page.getByPlaceholder('Resource contains...')).toHaveValue('edge');
  await expect(page.locator('input[type="number"]')).toHaveValue('25');
  await expect(page.getByLabel('Auto Refresh')).toBeChecked();

  await expect.poll(() => auditRequestUrls.length).toBeGreaterThan(0);

  const firstRequestUrl = new URL(auditRequestUrls[0]);
  expect(firstRequestUrl.searchParams.get('action')).toBe('router.save');
  expect(firstRequestUrl.searchParams.get('resource')).toBe('edge');
  expect(firstRequestUrl.searchParams.get('limit')).toBe('25');
  expect(firstRequestUrl.searchParams.get('since')).toBeTruthy();

  await page.getByPlaceholder('Resource contains...').fill('api-gateway');
  await page.getByRole('button', { name: 'Apply' }).click();

  await expect(page).toHaveURL(/resource=api-gateway/);
  await expect(page).toHaveURL(/action=router.save/);
});
