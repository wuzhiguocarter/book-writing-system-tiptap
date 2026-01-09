import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright 测试配置
 *
 * 文档: https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',

  /* 并行运行测试文件 */
  fullyParallel: true,

  /* 在 CI 环境中失败时重试测试 */
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,

  /* 并行工作线程数 */
  workers: process.env.CI ? 1 : undefined,

  /* 测试报告配置 */
  reporter: [
    ['html'],
    ['list'],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],

  /* 全局设置 */
  use: {
    /* 基础 URL */
    baseURL: 'http://localhost:3000',

    /* 收集失败测试的追踪信息 */
    trace: 'on-first-retry',

    /* 截图配置 */
    screenshot: 'only-on-failure',

    /* 视频录制 */
    video: 'retain-on-failure',
  },

  /* 测试项目配置 */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* 移动端测试 */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],

  /* 启动开发服务器 */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
