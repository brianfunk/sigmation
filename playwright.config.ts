import { defineConfig, devices } from '@playwright/test';

// Vite serves the site on 5600 and proxies API paths to the Hono dev server on 8890.
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: 'http://localhost:5600', trace: 'retain-on-failure' },
  projects: [
    { name: 'phone', use: { ...devices['iPhone 13'], browserName: 'chromium' } },
    { name: 'tablet', use: { ...devices['iPad Mini'], browserName: 'chromium' } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: [
    { command: 'npm run dev:api', url: 'http://localhost:8890/api/health', reuseExistingServer: !process.env.CI, timeout: 60_000 },
    { command: 'npm run dev', url: 'http://localhost:5600', reuseExistingServer: !process.env.CI, timeout: 60_000 },
  ],
});
