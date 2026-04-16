import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const TEST_EMAIL = `e2e-test-${Date.now()}@colorhub.test`;
const TEST_PASSWORD = 'TestPassword123!';

test.describe('EOS Hub happy path', () => {
  let adminClient: ReturnType<typeof createClient>;
  let testUserId: string;

  test.beforeAll(async () => {
    adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await adminClient.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
    });
    if (error) throw new Error(`Failed to create test user: ${error.message}`);
    testUserId = data.user.id;
  });

  test.afterAll(async () => {
    if (testUserId) {
      await adminClient.auth.admin.deleteUser(testUserId);
    }
  });

  test('login → dashboard → rocks → meeting → settings', async ({ page }) => {
    test.setTimeout(120_000);

    // --- Login via password tab ---
    await page.goto('/login');
    await page.click('text=Password');
    await page.fill('#pw-email', TEST_EMAIL);
    await page.fill('#pw-password', TEST_PASSWORD);
    await page.click('button:has-text("Sign in")');

    // Wait for redirect to dashboard
    await page.waitForURL('/', { timeout: 15_000 });
    await expect(page.locator('h1')).toContainText('Dashboard');

    // --- Dashboard has content ---
    await expect(page.locator('h1')).toContainText('Dashboard');

    // --- Navigate to Rocks ---
    await page.click('a[href="/rocks"]');
    await expect(page.locator('h1')).toContainText('Rock');

    // --- Navigate to Todos ---
    await page.click('a[href="/todos"]');
    await expect(page.locator('h1')).toContainText('To-Do');

    // --- Navigate to Scorecard ---
    await page.click('a[href="/scorecard"]');
    await expect(page.locator('h1')).toContainText('Scorecard');

    // --- Navigate to Issues ---
    await page.click('a[href="/issues"]');
    await expect(page.locator('h1')).toContainText('Issue');

    // --- Start a meeting ---
    await page.click('a[href="/meeting/live"]');
    const startBtn = page.getByRole('button', { name: /start meeting/i });
    if (await startBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await startBtn.click();
      await page.waitForTimeout(2_000);
    }

    // --- Meeting history ---
    await page.click('a[href="/meeting/history"]');
    await expect(page.locator('body')).toBeVisible();

    // --- Settings page ---
    await page.click('a[href="/settings"]');
    await expect(page.locator('h1')).toContainText('Settings');

    // --- P2 pages ---
    await page.click('a[href="/core-values"]');
    await expect(page.locator('h1')).toContainText('Core Values');

    await page.click('a[href="/vto"]');
    await expect(page.locator('h1')).toContainText('V/TO');

    await page.click('a[href="/accountability"]');
    await expect(page.locator('h1')).toContainText('Accountability');

    await page.click('a[href="/people"]');
    await expect(page.locator('h1')).toContainText('People');

    await page.click('a[href="/processes"]');
    await expect(page.locator('h1')).toContainText('Process');
  });
});
