# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: full-app.test.ts >> NBA Teammate Network - Full App E2E >> 10-step user journey
- Location: tests\e2e\full-app.test.ts:9:7

# Error details

```
TimeoutError: page.waitForSelector: Timeout 15000ms exceeded.
Call log:
  - waiting for locator('.sigma-container, canvas') to be visible

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e3]:
    - img "Next.js logo" [ref=e4]
    - generic [ref=e5]:
      - heading "To get started, edit the page.tsx file." [level=1] [ref=e6]
      - paragraph [ref=e7]:
        - text: Looking for a starting point or more instructions? Head over to
        - link "Templates" [ref=e8] [cursor=pointer]:
          - /url: https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app
        - text: or the
        - link "Learning" [ref=e9] [cursor=pointer]:
          - /url: https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app
        - text: center.
    - generic [ref=e10]:
      - link "Vercel logomark Deploy Now" [ref=e11] [cursor=pointer]:
        - /url: https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app
        - img "Vercel logomark" [ref=e12]
        - text: Deploy Now
      - link "Documentation" [ref=e13] [cursor=pointer]:
        - /url: https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app
  - button "Open Next.js Dev Tools" [ref=e19] [cursor=pointer]:
    - img [ref=e20]
  - alert [ref=e23]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('NBA Teammate Network - Full App E2E', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.goto('/');
> 6  |     await page.waitForSelector('.sigma-container, canvas', { timeout: 15000 });
     |                ^ TimeoutError: page.waitForSelector: Timeout 15000ms exceeded.
  7  |   });
  8  | 
  9  |   test('10-step user journey', async ({ page }) => {
  10 |     // Step 1: Page loads, graph renders
  11 |     const canvas = page.locator('canvas').first();
  12 |     await expect(canvas).toBeVisible();
  13 | 
  14 |     // Step 2: Search for a player, select from dropdown
  15 |     const searchInput = page.getByRole('textbox').first();
  16 |     await searchInput.fill('Jordan');
  17 |     await page.waitForTimeout(400);
  18 |     await page.locator('[role="option"]').first().click();
  19 | 
  20 |     // Step 3: Hover over a node; Step 4: Click a node, verify highlight
  21 |     await page.locator('canvas').click({ position: { x: 400, y: 300 } });
  22 |     await page.waitForTimeout(200);
  23 | 
  24 |     // Step 5: Apply era filter
  25 |     await page.locator('#era-filter').selectOption('2010s');
  26 |     await page.waitForTimeout(500);
  27 | 
  28 |     // Step 6: Apply team filter
  29 |     await page.locator('#team-filter').selectOption('LAL');
  30 |     await page.waitForTimeout(500);
  31 | 
  32 |     // Step 7: Apply position filter
  33 |     await page.locator('input[type="checkbox"]').first().check();
  34 |     await page.waitForTimeout(500);
  35 | 
  36 |     // Step 8: Reset filters
  37 |     await page.getByRole('button', { name: /reset/i }).click();
  38 |     await page.waitForTimeout(500);
  39 | 
  40 |     // Step 9: Use shortest path finder
  41 |     const fromInput = page.getByPlaceholder(/from player/i);
  42 |     const toInput = page.getByPlaceholder(/to player/i);
  43 |     await fromInput.fill('LeBron');
  44 |     await page.waitForTimeout(400);
  45 |     await page.locator('[role="option"]').first().click();
  46 |     await toInput.fill('Wade');
  47 |     await page.waitForTimeout(400);
  48 |     await page.locator('[role="option"]').first().click();
  49 |     await page.getByRole('button', { name: /find path/i }).click();
  50 |     await page.waitForTimeout(500);
  51 | 
  52 |     // Step 10: Clear path
  53 |     await page.getByRole('button', { name: /clear path/i }).click();
  54 |     await page.waitForTimeout(300);
  55 |   });
  56 | 
  57 |   test('graph renders with Sigma.js WebGL', async ({ page }) => {
  58 |     const canvas = page.locator('canvas').first();
  59 |     await expect(canvas).toBeVisible();
  60 |   });
  61 | });
```