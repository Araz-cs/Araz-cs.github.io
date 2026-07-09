#!/usr/bin/env node
/** UX smoke test — signal + work visible fast on mobile */
import { chromium } from "playwright";
import { createServer } from "http";
import { readFileSync, existsSync } from "fs";
import { join, dirname, extname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const mime = { ".html": "text/html", ".css": "text/css", ".js": "application/javascript", ".jpg": "image/jpeg" };

function serve(port) {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      let p = req.url === "/" ? "/index.html" : req.url.split("?")[0];
      const file = join(root, p);
      if (!existsSync(file)) {
        res.writeHead(404);
        res.end();
        return;
      }
      res.writeHead(200, { "Content-Type": mime[extname(file)] || "text/plain" });
      res.end(readFileSync(file));
    });
    server.listen(port, () => resolve(server));
  });
}

const server = await serve(0);
const port = server.address().port;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "networkidle" });

const signal = await page.locator("#signal .signal-value").first().isVisible();
const signalFirst = await page.evaluate(() => {
  const signal = document.getElementById("signal");
  const sidebar = document.getElementById("sidebar");
  return signal && sidebar ? signal.compareDocumentPosition(sidebar) & Node.DOCUMENT_POSITION_FOLLOWING : false;
});
const principlesBeforePlatform = await page.evaluate(() => {
  const p = document.getElementById("principles");
  const plat = document.getElementById("platform");
  return p && plat ? p.offsetTop < plat.offsetTop : false;
});
const workTitle = await page.locator("#platform-work .section-title").isVisible();
const workTop = await page.locator("#platform-work").evaluate((el) => el.getBoundingClientRect().top);
const platformTop = await page.locator("#platform").evaluate((el) => el.getBoundingClientRect().top);
const featured = await page.locator(".platform-card--featured").count();
const noBlueprintAbove = workTop < platformTop;

await page.locator('.mobile-dock a[href="#contact"]').click();
await page.waitForTimeout(300);
const submitVisible = await page.locator('button[type="submit"]').isVisible();
const submitBox = await page.locator('button[type="submit"]').boundingBox();
const dockBox = await page.locator(".mobile-dock").boundingBox();
const submitAboveDock = submitBox && dockBox ? submitBox.y + submitBox.height <= dockBox.y + 2 : false;

const checks = [
  ["signal visible", signal],
  ["signal before sidebar in DOM", signalFirst],
  ["mobile work visible", workTitle],
  ["approach before platform", principlesBeforePlatform],
  ["work before platform", noBlueprintAbove],
  ["featured cards >= 2", featured >= 2],
  ["contact submit visible", submitVisible],
  ["submit above dock", submitAboveDock],
];

const failed = checks.filter(([, ok]) => !ok);
checks.forEach(([n, ok]) => console.log(`${ok ? "PASS" : "FAIL"}: ${n}`));

await browser.close();
server.close();
process.exit(failed.length ? 1 : 0);
