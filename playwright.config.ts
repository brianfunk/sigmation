import { defineConfig, devices } from '@playwright/test';

// Vite serves the site on 5600 and proxies API paths to the Hono dev server on 8890.
// Everything is pinned to 127.0.0.1: on Linux, `localhost` can resolve to ::1 for the probe while a server listens on IPv4 only.
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: 'http://127.0.0.1:5600', trace: 'retain-on-failure' },
  projects: [
    { name: 'phone', use: { ...devices['iPhone 13'], browserName: 'chromium' } },
    { name: 'tablet', use: { ...devices['iPad Mini'], browserName: 'chromium' } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: [
    { command: 'npm run dev:api', url: 'http://127.0.0.1:8890/api/health', reuseExistingServer: !process.env.CI, timeout: 120_000, stdout: 'pipe', stderr: 'pipe' },
    { command: 'npm run dev -- --host 127.0.0.1', url: 'http://127.0.0.1:5600/', reuseExistingServer: !process.env.CI, timeout: 120_000, stdout: 'pipe', stderr: 'pipe' },
  ],
});
