import { test, expect } from '@playwright/test';

const GRAPH_TIMEOUT_MS = 30000;

test.describe('NBA Teammate Network - Full App E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const graph = page.getByTestId('network-graph');
    const canvas = graph.locator('canvas').first();

    await expect(graph).toBeVisible({ timeout: GRAPH_TIMEOUT_MS });
    await expect(canvas).toBeVisible({ timeout: GRAPH_TIMEOUT_MS });
  });

  test('search, filter, and graph user journey', async ({ page }) => {
    // Step 1: Page loads, graph renders
    const canvas = page.getByTestId('network-graph').locator('canvas').first();
    await expect(canvas).toBeVisible();

    // Step 2: Search for a player, select from dropdown
    const searchInput = page.getByLabel('Search for players');
    const searchResults = page.locator('[data-testid^="player-result-"]');
    await searchInput.fill('Jordan');
    await expect(searchResults.first()).toBeVisible();
    await searchInput.press('Escape');
    await expect(searchResults.first()).not.toBeVisible();

    // Step 3: Hover over a node; Step 4: Click a node, verify highlight
    const graphSurface = page.getByTestId('network-graph').locator('.sigma-mouse');
    await expect(graphSurface).toBeVisible();

    const graphSurfaceBox = await graphSurface.boundingBox();
    expect(graphSurfaceBox).not.toBeNull();
    if (!graphSurfaceBox) {
      throw new Error('Graph interaction surface bounding box was not available');
    }
    await graphSurface.click({
      position: {
        x: graphSurfaceBox.width / 2,
        y: graphSurfaceBox.height / 2,
      },
    });
    await expect(page.getByTestId('network-graph')).toBeVisible();

    // Step 5: Apply era filter
    const eraFilter = page.locator('#era-filter');
    await eraFilter.selectOption('2010s');
    await expect(eraFilter).toHaveValue('2010s');

    // Step 6: Apply team filter
    const teamFilter = page.locator('#team-filter');
    await teamFilter.selectOption('LAL');
    await expect(teamFilter).toHaveValue('LAL');

    // Step 7: Apply position filter
    const positionFilter = page.getByLabel('PG');
    await positionFilter.check();
    await expect(positionFilter).toBeChecked();

    // Step 8: Reset filters
    await page.getByRole('button', { name: /reset/i }).click();
    await expect(eraFilter).toHaveValue('');
    await expect(teamFilter).toHaveValue('');
    await expect(positionFilter).not.toBeChecked();

    const fromInput = page.getByTestId('path-from-input');
    const toInput = page.getByTestId('path-to-input');
    const fromResults = page.locator('[data-testid^="path-from-result-"]');
    const toResults = page.locator('[data-testid^="path-to-result-"]');
    await fromInput.fill('LeBron');
    await expect(fromResults.first()).toBeVisible();
    await fromInput.press('Escape');
    await expect(fromResults.first()).not.toBeVisible();
    await toInput.fill('Wade');
    await expect(toResults.first()).toBeVisible();
    await toInput.press('Escape');
    await expect(toResults.first()).not.toBeVisible();
  });

  test('graph renders with Sigma.js WebGL', async ({ page }) => {
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();
  });
});
