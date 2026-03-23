import { defineConfig, devices } from '@playwright/test'

/**
 * I test puntano al server locale di default.
 * Per testare la produzione: BASE_URL=https://gameexchange-teal.vercel.app npx playwright test
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Non avvia il dev server automaticamente — lancialo tu con `npm run dev`
  // oppure usa BASE_URL per puntare alla produzione
  webServer: process.env.BASE_URL ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
