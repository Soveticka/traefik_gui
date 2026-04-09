import { expect, test } from '@playwright/test';

const apiBase = process.env.PLAYWRIGHT_BACKEND_URL || 'http://127.0.0.1:3001/api/v1';
const healthUrl = process.env.PLAYWRIGHT_BACKEND_HEALTH_URL || 'http://127.0.0.1:3001/health';
const apiToken = process.env.PLAYWRIGHT_API_TOKEN;

function authHeaders(): Record<string, string> {
  return apiToken ? { 'x-api-key': apiToken } : {};
}

test('handles stale revision conflict and succeeds on retry with latest revision', async ({ request }) => {
  let healthOk = false;
  try {
    const health = await request.get(healthUrl, { timeout: 5000 });
    healthOk = health.ok();
  } catch {
    healthOk = false;
  }

  test.skip(!healthOk, `Backend health endpoint is not reachable at ${healthUrl}`);

  const routerName = `pw-conflict-${Date.now()}`;
  const headers = authHeaders();

  const configRes = await request.get(`${apiBase}/config`, { headers });
  expect(configRes.ok()).toBeTruthy();

  const revisionA = configRes.headers()['x-config-revision'];
  expect(revisionA).toBeTruthy();

  const firstSave = await request.post(`${apiBase}/routers/${routerName}`, {
    headers: {
      ...headers,
      'content-type': 'application/json',
      'x-config-revision': revisionA || '',
    },
    data: {
      entryPoints: ['web'],
      rule: 'Host(`playwright-initial.local`)',
      service: 'playwright-service',
    },
  });
  expect(firstSave.ok()).toBeTruthy();

  const staleSave = await request.post(`${apiBase}/routers/${routerName}`, {
    headers: {
      ...headers,
      'content-type': 'application/json',
      'x-config-revision': revisionA || '',
    },
    data: {
      entryPoints: ['web'],
      rule: 'Host(`playwright-stale.local`)',
      service: 'playwright-service',
    },
  });

  expect(staleSave.status()).toBe(409);
  const staleBody = (await staleSave.json()) as { currentRevision?: string };
  expect(staleBody.currentRevision).toBeTruthy();

  const retrySave = await request.post(`${apiBase}/routers/${routerName}`, {
    headers: {
      ...headers,
      'content-type': 'application/json',
      'x-config-revision': staleBody.currentRevision || '',
    },
    data: {
      entryPoints: ['web'],
      rule: 'Host(`playwright-retry.local`)',
      service: 'playwright-service',
    },
  });

  expect(retrySave.ok()).toBeTruthy();
  const latestRevision = retrySave.headers()['x-config-revision'];

  const cleanup = await request.delete(`${apiBase}/routers/${routerName}`, {
    headers: {
      ...headers,
      ...(latestRevision ? { 'x-config-revision': latestRevision } : {}),
    },
  });

  expect(cleanup.ok()).toBeTruthy();
});
