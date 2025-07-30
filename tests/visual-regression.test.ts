import { test, expect } from '@playwright/test';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import fs from 'fs';

// Example: Visual regression test for a page screenshot

test('homepage visual regression', async ({ page }) => {
  await page.goto('http://localhost:3000'); // Change to your dev server URL
  const screenshot = await page.screenshot();

  // Load baseline image or create it if it doesn't exist
  const baselinePath = 'visual-baseline/homepage.png';
  const diffPath = 'visual-diff/homepage-diff.png';
  if (!fs.existsSync(baselinePath)) {
    fs.mkdirSync('visual-baseline', { recursive: true });
    fs.writeFileSync(baselinePath, screenshot);
    console.log('Baseline image created.');
    return;
  }

  const baseline = PNG.sync.read(fs.readFileSync(baselinePath));
  const current = PNG.sync.read(screenshot);
  const { width, height } = baseline;
  const diff = new PNG({ width, height });

  const numDiffPixels = pixelmatch(
    baseline.data,
    current.data,
    diff.data,
    width,
    height,
    { threshold: 0.1 }
  );

  if (numDiffPixels > 0) {
    fs.mkdirSync('visual-diff', { recursive: true });
    fs.writeFileSync(diffPath, PNG.sync.write(diff));
  }

  expect(numDiffPixels).toBe(0);
});
