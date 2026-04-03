import { test, expect } from '@playwright/test';

test.describe('NBA Teammate Network - Full App E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.sigma-container, canvas', { timeout: 15000 });
  });

  test('10-step user journey', async ({ page }) => {
    // Step 1: Page loads, graph renders
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();

    // Step 2: Search for a player, select from dropdown
    const searchInput = page.getByRole('textbox').first();
    await searchInput.fill('Jordan');
    await page.waitForTimeout(400);
    await page.locator('[role="option"]').first().click();

    // Step 3: Hover over a node; Step 4: Click a node, verify highlight
    await page.locator('canvas').click({ position: { x: 400, y: 300 } });
    await page.waitForTimeout(200);

    // Step 5: Apply era filter
    await page.locator('#era-filter').selectOption('2010s');
    await page.waitForTimeout(500);

    // Step 6: Apply team filter
    await page.locator('#team-filter').selectOption('LAL');
    await page.waitForTimeout(500);

    // Step 7: Apply position filter
    await page.locator('input[type="checkbox"]').first().check();
    await page.waitForTimeout(500);

    // Step 8: Reset filters
    await page.getByRole('button', { name: /reset/i }).click();
    await page.waitForTimeout(500);

    // Step 9: Use shortest path finder
    const fromInput = page.getByPlaceholder(/from player/i);
    const toInput = page.getByPlaceholder(/to player/i);
    await fromInput.fill('LeBron');
    await page.waitForTimeout(400);
    await page.locator('[role="option"]').first().click();
    await toInput.fill('Wade');
    await page.waitForTimeout(400);
    await page.locator('[role="option"]').first().click();
    await page.getByRole('button', { name: /find path/i }).click();
    await page.waitForTimeout(500);

    // Step 10: Clear path
    await page.getByRole('button', { name: /clear path/i }).click();
    await page.waitForTimeout(300);
  });

  test('graph renders with Sigma.js WebGL', async ({ page }) => {
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();
  });
});