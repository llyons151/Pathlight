import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => {
  // Keep the suite offline: no font provider, account service, or email requests.
  await page.route('**/*', (route) =>
    new URL(route.request().url()).origin === 'http://127.0.0.1:4173'
      ? route.continue()
      : route.abort(),
  );
  page.on('pageerror', (error) => {
    throw error;
  });
});

test('demo metrics, insights, and sample answers respond to input', async ({
  page,
}) => {
  await page.goto('/');
  await page.locator('#demo > summary').click();
  await page.getByLabel('Reporting period').selectOption('month');
  await expect(page.locator('#visitors')).toHaveText('48,219');
  await expect(page.locator('#funnel-purchase')).toHaveText('1,741');
  await page.getByLabel('Reporting period').selectOption('week');
  await expect(page.locator('#visitors')).toHaveText('12,846');
  await page.getByRole('button', { name: 'Explore another insight' }).click();
  await expect(page.locator('#insight-number')).toHaveText('02 / 03');
  for (const [question, answer] of [
    ['mobile checkout', '2.1×'],
    ['journal traffic', '38%'],
    ['returning visitors', '3.4×'],
    ['hello', '1,038'],
  ]) {
    await page.getByLabel('Ask about the sample analytics').fill(question);
    await page.getByRole('button', { name: 'Ask Pathlight' }).click();
    await expect(page.locator('#answer')).toContainText(answer);
    await expect(page.locator('#answer')).toContainText('not connected AI');
  }
});

test('password visibility and account navigation work', async ({ page }) => {
  await page.goto('/login/');
  await page.getByLabel('Password', { exact: true }).fill('example-password');
  await page
    .getByRole('button', { name: 'Show password', exact: true })
    .click();
  await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute(
    'type',
    'text',
  );
  await page
    .getByRole('button', { name: 'Hide password', exact: true })
    .click();
  await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute(
    'type',
    'password',
  );
  await page.getByRole('link', { name: 'Forgot your password?' }).click();
  await expect(page).toHaveURL(/\/forgot-password\/$/);
});

test('FAQ supports keyboard input and reduced motion hides animation control', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('#motion-toggle')).toBeHidden();
  const summary = page.locator('.faq summary').first();
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.faq details').first()).toHaveAttribute(
    'open',
    '',
  );
  await page.keyboard.press('Enter');
  await expect(page.locator('.faq details').first()).not.toHaveAttribute(
    'open',
  );
});

for (const path of [
  '/',
  '/login/',
  '/signup/',
  '/forgot-password/',
  '/reset-password/',
  '/auth/callback/',
  '/account/',
  '/contact/',
  '/terms/',
  '/privacy/',
  '/cookies/',
  '/acceptable-use/',
  '/missing-page',
]) {
  test(`accessibility and responsive layout: ${path}`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator('h1')).toBeVisible();
    if (path === '/') await page.locator('#demo > summary').click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}
