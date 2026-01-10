// 简单的验证脚本
const { chromium } = require('./node_modules/@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');

  // 等待页面加载
  await page.waitForTimeout(2000);

  // 检查是否有"新建第一本书"按钮
  const createButton = page.getByText('新建第一本书');
  const hasCreateButton = await createButton.count();

  console.log('是否有"新建第一本书"按钮:', hasCreateButton > 0);

  if (hasCreateButton > 0) {
    // 注册对话框处理
    page.once('dialog', dialog => {
      console.log('对话框出现，文本:', dialog.message());
      dialog.accept('测试书籍');
    });

    // 点击按钮
    await createButton.click();
    console.log('已点击新建按钮');

    // 等待书籍创建
    await page.waitForTimeout(3000);

    // 检查是否创建了书籍
    const bookCard = page.locator('.rounded-2xl').filter({ hasText: '测试书籍' });
    const hasBook = await bookCard.count();
    console.log('是否创建了书籍:', hasBook > 0);

    if (hasBook > 0) {
      // 点击书籍
      await bookCard.first().click();
      console.log('已点击书籍');

      // 等待导航
      await page.waitForTimeout(2000);

      // 检查URL
      const url = page.url();
      console.log('当前URL:', url);
      console.log('是否进入编辑器:', url.includes('/editor/'));
    }
  }

  await browser.close();
})();
