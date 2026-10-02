import { expect, test, type Page } from '@playwright/test';

/** Elements whose right edge pokes past the viewport: the usual sign of a broken mobile layout. */
async function overflowing(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const w = window.innerWidth;
    return [...document.querySelectorAll('body *')]
      .filter((e) => e.getBoundingClientRect().right > w + 1)
      .map((e) => `${e.tagName.toLowerCase()}.${(e as HTMLElement).className?.toString().split(' ')[0] ?? ''}`)
      .filter((v, i, a) => a.indexOf(v) === i)
      .slice(0, 10);
  });
}

test('page has no horizontal overflow', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.preview svg')).toBeVisible();
  expect(await overflowing(page)).toEqual([]);
  const scroll = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(scroll).toBeLessThanOrEqual(0);
});

test('badge mode and QR panel stay inside the viewport', async ({ page }) => {
  await page.goto('/#m=E%3Dmc%5E2&f=badge&c=000&bg=ffd700');
  await expect(page.getByRole('radio', { name: 'Badge' })).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('.preview svg').first()).toBeVisible();
  await page.getByRole('button', { name: 'QR', exact: true }).click();
  await expect(page.locator('.qrcode svg')).toBeVisible();
  expect(await overflowing(page)).toEqual([]);
});

test('state round-trips through the URL hash', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Math' }).fill('a^2+b^2=c^2');
  await page.getByRole('radio', { name: 'PNG' }).click();
  await expect.poll(() => page.evaluate(() => location.hash)).toContain('f=png');
  const hash = await page.evaluate(() => location.hash);
  await page.goto('/' + hash);
  await expect(page.getByRole('textbox', { name: 'Math' })).toHaveValue('a^2+b^2=c^2');
  await expect(page.getByRole('radio', { name: 'PNG' })).toHaveAttribute('aria-checked', 'true');
});

test('bad TeX shows the API error inline', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Math' }).fill('\\frac{a');
  await expect(page.locator('.preview .err')).toContainText('Missing close brace');
});

test('generated URL reflects options and renders', async ({ page, request }) => {
  await page.goto('/#m=x%5E2&t=dark&s=3');
  const href = await page.locator('.url a').getAttribute('href');
  expect(href).toContain('theme=dark');
  expect(href).toContain('scale=3');
  const res = await request.get('http://127.0.0.1:8890' + href);
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('image/svg+xml');
});

test('API docs page loads the spec', async ({ page }) => {
  await page.goto('/docs/');
  await expect(page.locator('.swagger-ui .info .title')).toContainText('igmation API', { timeout: 20_000 });
  await expect(page.getByText('/badge', { exact: true }).first()).toBeVisible();
});
