import { chromium } from "playwright";

const url = process.argv[2] ?? "http://localhost:8090/admin";
const out = process.argv[3] ?? "/tmp/admin.png";

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
await page.goto(url, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(800);
await page.screenshot({ path: out, fullPage: false, timeout: 60000, animations: "disabled" });
await browser.close();
console.log("saved", out);
