// SKIP: requires auth helper. See setup notes in test body.
//
// This spec documents the Floor / Shift Huddle happy path. It is intentionally
// skipped by default because it requires:
//   - Dev server running (npm run dev)
//   - Database accessible with seed data (npm run db:seed) — at minimum the
//     8 default stations and a member who can be a test user.
//   - A test user that can log in via Supabase. The other e2e spec
//     (`tests/e2e/happy-path.spec.ts`) creates a Supabase user via the admin
//     client at `beforeAll`; copy that pattern when you're ready to enable
//     this test (add NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY to
//     env, then call `adminClient.auth.admin.createUser`).
//   - Knack data (or the Phase 1 mock at `src/server/floor-knack.ts`) so the
//     "Now running" panel has a current job for Press 1 — without a current
//     job the Start/Pause/Resume/Complete buttons are disabled.
//
// To enable: remove `test.describe.skip(` (use `.describe(`) and replace the
// auth stub in `beforeEach` with the same `signIn` helper used in
// `happy-path.spec.ts`. Run with: npx playwright test tests/e2e/floor.spec.ts
import { test, expect } from '@playwright/test';

test.describe.skip('Floor / Shift Huddle Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the system clock to 2026-05-07T07:30 Central (12:30 UTC) — mid 1st shift.
    await page.clock.install({ time: new Date('2026-05-07T12:30:00Z') });

    // TODO(test): replace with project's actual auth helper.
    // The other e2e spec uses a service-role admin client to create a Supabase
    // user, then signs in via /login (Password tab). Mirror that pattern here:
    //
    //   await page.goto('/login');
    //   await page.click('text=Password');
    //   await page.fill('#pw-email', TEST_EMAIL);
    //   await page.fill('#pw-password', TEST_PASSWORD);
    //   await page.click('button:has-text("Sign in")');
    //   await page.waitForURL('/', { timeout: 15_000 });
    await page.goto('/login');
  });

  test('shift huddle happy path', async ({ page }) => {
    test.setTimeout(120_000);

    await page.goto('/floor');

    // 1. Header reads "1st Shift".
    await expect(page.getByText(/1st Shift/i)).toBeVisible();

    // 2. 8 station tiles render. The grid uses station.name for the label;
    //    the default seed includes Press 1 and Shipping among the 8 stations.
    //    Tiles are buttons (rendered as <button> for keyboard activation).
    await expect(page.getByRole('button', { name: /Press 1/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Shipping/i }).first()).toBeVisible();

    // 3. Click first station tile -> modal opens.
    await page.getByRole('button', { name: /Press 1/i }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // 4. Click "Start job" -> event appears in the live feed.
    //    Button text in station-modal.tsx is exactly "Start job".
    await page.getByRole('button', { name: /^Start job$/ }).click();
    // Close modal so we can read the events feed beneath.
    await page.keyboard.press('Escape');
    await expect(page.getByText(/Started/i).first()).toBeVisible({ timeout: 30_000 });

    // 5. Re-open Press 1, Pause with reason 'Material'.
    //    Pause flow: click "Pause" -> reason picker pills open -> select
    //    "Material" -> click "Confirm pause".
    await page.getByRole('button', { name: /Press 1/i }).first().click();
    await page.getByRole('button', { name: /^Pause$/ }).click();
    await page.getByRole('button', { name: /^Material$/ }).click();
    await page.getByRole('button', { name: /^Confirm pause$/ }).click();
    await page.keyboard.press('Escape');
    await expect(page.getByText(/Paused/i).first()).toBeVisible({ timeout: 30_000 });

    // 6. Resume.
    await page.getByRole('button', { name: /Press 1/i }).first().click();
    await page.getByRole('button', { name: /^Resume$/ }).click();
    await page.keyboard.press('Escape');
    await expect(page.getByText(/Resumed/i).first()).toBeVisible({ timeout: 30_000 });

    // 7. Complete with sheets=5000.
    //    Complete flow: click "Complete job" -> the Confirm completion drawer
    //    appears with a "Final sheets" number input pre-filled -> overwrite
    //    with 5000 -> click "Confirm complete".
    await page.getByRole('button', { name: /Press 1/i }).first().click();
    await page.getByRole('button', { name: /^Complete job$/ }).click();
    const finalSheets = page.getByRole('spinbutton');
    await finalSheets.fill('5000');
    await page.getByRole('button', { name: /^Confirm complete$/ }).click();
    await page.keyboard.press('Escape');
    await expect(page.getByText(/Completed.*5,000/).first()).toBeVisible({
      timeout: 30_000,
    });

    // 8. Advance clock to 15:30 Central (20:30 UTC) -> 2nd shift.
    await page.clock.setSystemTime(new Date('2026-05-07T20:30:00Z'));
    await page.reload();
    await expect(page.getByText(/2nd Shift/i)).toBeVisible({ timeout: 30_000 });

    // 9. Visit handoff for previous (1st) shift and confirm recap counters.
    await page.goto('/floor/handoff?date=2026-05-07&shift=1');
    await expect(page.getByText(/1 jobs? completed/i)).toBeVisible();
    await expect(page.getByText(/5,000 sheets/i)).toBeVisible();
  });
});
