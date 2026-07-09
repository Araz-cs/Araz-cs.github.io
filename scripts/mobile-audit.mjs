#!/usr/bin/env node
import { chromium } from "playwright";
import { createServer } from "http";
import { readFileSync, existsSync } from "fs";
import { join, dirname, extname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const mime = { ".html": "text/html", ".css": "text/css", ".js": "application/javascript", ".jpg": "image/jpeg" };

const server = createServer((req, res) => {
  let p = req.url === "/" ? "/index.html" : req.url.split("?")[0];
  const file = join(root, p);
  if (!existsSync(file)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "Content-Type": mime[extname(file)] || "text/plain" });
  res.end(readFileSync(file));
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;

const viewports = [
  { name: "iphone-14", width: 390, height: 844 },
  { name: "iphone-se", width: 375, height: 667 },
  { name: "pixel-7", width: 412, height: 915 },
];

const browser = await chromium.launch();
const issues = [];

for (const vp of viewports) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "networkidle" });

  const top = await page.evaluate(() => {
    const signal = document.getElementById("signal");
    const sidebar = document.getElementById("sidebar");
    const main = document.querySelector(".main-content");
    const dock = document.querySelector(".mobile-dock");
    const html = document.documentElement;
    const body = document.body;
    const sr = signal?.getBoundingClientRect();
    const br = sidebar?.getBoundingClientRect();
    const mr = main?.getBoundingClientRect();
    const dr = dock?.getBoundingClientRect();
    const mainStyle = main ? getComputedStyle(main) : null;
    const bodyStyle = getComputedStyle(body);
    const firstVisible = [signal, sidebar, main].filter(Boolean).sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)[0]?.id;
    return {
      firstVisible,
      signalTop: sr?.top,
      sidebarTop: br?.top,
      mainTop: mr?.top,
      mainOrder: mainStyle?.order,
      bodyDisplay: bodyStyle.display,
      dockVisible: dock && getComputedStyle(dock).display !== "none",
      dockH: dr?.height,
      mainPadBottom: mainStyle?.paddingBottom,
      hScroll: html.scrollWidth > html.clientWidth + 1,
      scrollH: html.scrollHeight,
      vh: window.innerHeight,
      signalOpacity: signal ? getComputedStyle(signal).opacity : null,
      workOpacity: document.getElementById("platform-work") ? getComputedStyle(document.getElementById("platform-work")).opacity : null,
    };
  });

  console.log(`\n=== ${vp.name} TOP ===`);
  console.log(JSON.stringify(top, null, 2));

  if (top.firstVisible !== "signal") issues.push(`${vp.name}: first visible is ${top.firstVisible}, not signal`);
  if (top.hScroll) issues.push(`${vp.name}: horizontal scroll`);
  if (top.signalOpacity === "0") issues.push(`${vp.name}: signal hidden (opacity 0)`);
  if (top.workOpacity === "0") issues.push(`${vp.name}: work section hidden at load`);

  // scroll to bottom
  await page.evaluate(() => window.scrollTo({ top: 99999, behavior: "instant" }));
  await page.waitForTimeout(300);

  const bottom = await page.evaluate(() => {
    const btn = document.querySelector('button[type="submit"]');
    const dock = document.querySelector(".mobile-dock");
    const bb = btn?.getBoundingClientRect();
    const db = dock?.getBoundingClientRect();
    const html = document.documentElement;
    const maxScroll = html.scrollHeight - window.innerHeight;
    return {
      maxScroll,
      scrollY: window.scrollY,
      btnVisible: bb ? bb.top < window.innerHeight && bb.bottom > 0 : false,
      btnAboveDock: bb && db ? bb.bottom <= db.top + 2 : false,
      deadSpace: html.scrollHeight - window.scrollY - window.innerHeight,
      dockCoversBtn: bb && db ? bb.bottom > db.top : false,
    };
  });

  console.log(`=== ${vp.name} BOTTOM ===`);
  console.log(JSON.stringify(bottom, null, 2));

  if (!bottom.btnVisible) issues.push(`${vp.name}: submit not visible at max scroll`);
  if (bottom.dockCoversBtn) issues.push(`${vp.name}: dock covers submit button`);
  if (bottom.deadSpace > 80) issues.push(`${vp.name}: dead scroll space ${bottom.deadSpace}px`);

  // nav click work
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "networkidle" });
  await page.locator('.mobile-dock a[href="#platform-work"]').click();
  await page.waitForTimeout(400);
  const navWork = await page.evaluate(() => {
    const work = document.getElementById("platform-work");
    const dock = document.querySelector(".mobile-dock");
    const wr = work?.getBoundingClientRect();
    const dockH = dock?.offsetHeight || 0;
    const titleVisible = wr && wr.top >= 0 && wr.top < window.innerHeight - dockH - 40;
    return { workTop: wr?.top, dockH, titleVisible, workOpacity: work ? getComputedStyle(work).opacity : null };
  });
  console.log(`=== ${vp.name} NAV WORK ===`);
  console.log(JSON.stringify(navWork, null, 2));
  if (!navWork.titleVisible) issues.push(`${vp.name}: work not visible after dock nav`);
  if (navWork.workOpacity === "0") issues.push(`${vp.name}: work invisible after nav (reveal)`);

  await page.close();
}

console.log("\n=== ISSUES ===");
issues.forEach((i) => console.log("FAIL:", i));
console.log(issues.length ? `\n${issues.length} issues` : "all checks passed");

await browser.close();
server.close();
process.exit(issues.length ? 1 : 0);
