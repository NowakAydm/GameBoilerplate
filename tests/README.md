# Visual Regression Testing Example

This directory contains example tests and configuration for Playwright, Pixelmatch, and PNG.js.

- `playwright.config.ts`: Playwright configuration for running browser tests.
- `visual-regression.test.ts`: Example test that takes a screenshot, compares it to a baseline using Pixelmatch, and outputs a diff image if there are differences.

## Usage

1. Start your development server (e.g., `npm run dev` in the client package).
2. Run Playwright tests from this directory:
   
   ```sh
   npx playwright test
   ```
3. On first run, a baseline image will be created in `visual-baseline/`. On subsequent runs, screenshots will be compared to the baseline, and any differences will be output to `visual-diff/`.

## Dependencies
- [Playwright](https://playwright.dev/)
- [Pixelmatch](https://github.com/mapbox/pixelmatch)
- [PNG.js](https://github.com/lukeapage/pngjs)

You may need to install Playwright browsers:

```sh
npx playwright install
```

## Notes
- Update the URL in `visual-regression.test.ts` to match your local dev server.
- Add more tests as needed for other pages/components.
