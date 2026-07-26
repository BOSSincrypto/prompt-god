import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['list']] : 'list',
  timeout: 30_000,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Lets a sandbox with a pre-installed Chromium point at it instead of
        // downloading a second copy. Unset in CI, where Playwright manages it.
        ...(process.env.PLAYWRIGHT_CHROMIUM_PATH
          ? { launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } }
          : {}),
      },
    },
  ],
  webServer: {
    // `--host 127.0.0.1` is load-bearing. Vite preview defaults to binding
    // `localhost`, which Node resolves to `::1` first on GitHub's runners, so
    // the server listened only on IPv6 while Playwright polled 127.0.0.1 and
    // timed out after three minutes — with the build itself taking 3 seconds.
    command: 'npm run build:only && npm run preview -- --port 4173 --strictPort --host 127.0.0.1',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // Surfaces the preview banner in the job log, so the next time a server
    // fails to come up it is visible rather than inferred from silence.
    stdout: 'pipe',
    stderr: 'pipe',
  },
})
