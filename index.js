const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');
// const iPhone = devices['iPhone 6'];

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({width: 1280, height: 664});
  await page.tracing.start({path: 'trace.json'});
  await page.goto('https://shopback.sg');
  await page.tracing.stop();
  await page.screenshot({path: 'example.png'});

  await browser.close();
})();
