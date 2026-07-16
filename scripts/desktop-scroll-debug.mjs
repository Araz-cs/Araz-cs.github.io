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

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`http://127.0.0.1:${port}/`);

const issues = [];

async function snap(label, scrollY) {
  await page.evaluate((y) => window.scrollTo(0, y), scrollY);
  await page.waitForTimeout(200);
  const data = await page.evaluate(() => {
    const signal = document.getElementById("signal");
    const sidebar = document.getElementById("sidebar");
    const main = document.querySelector(".main-content");
    const sr = signal?.getBoundingClientRect();
    const br = sidebar?.getBoundingClientRect();
    const mr = main?.getBoundingClientRect();
    const html = document.documentElement;
    return {
      scrollY: window.scrollY,
      signal: sr ? { top: sr.top, bottom: sr.bottom, height: sr.height } : null,
      sidebar: br ? { top: br.top, bottom: br.bottom, height: br.height, position: getComputedStyle(sidebar).position } : null,
      main: mr ? { top: mr.top, left: mr.left, width: mr.width } : null,
      gap: br && mr ? mr.left - br.right : null,
      bodyH: html.scrollHeight,
      vh: window.innerHeight,
      hScroll: html.scrollWidth > html.clientWidth,
    };
  });
  console.log(`\n=== ${label} scroll=${scrollY} ===`);
  console.log(JSON.stringify(data, null, 2));
  if (data.gap !== null && Math.abs(data.gap) > 2) issues.push(`${label}: gap sidebar-main = ${data.gap}px`);
  if (data.signal && data.sidebar && data.signal.bottom > data.sidebar.top + 2 && scrollY > 50) {
    const xOverlap = data.signal.left < data.sidebar.right;
    if (xOverlap) issues.push(`${label}: signal overlaps sidebar horizontally`);
  }
  if (data.hScroll) issues.push(`${label}: horizontal scroll`);
}

await snap("top", 0);
await snap("mid", 1200);
await snap("deep", 3500);

const sidebarAccess = await page.evaluate(() => {
  const sidebar = document.getElementById("sidebar");
  const btnRow = document.querySelector(".sidebar .btn-row");
  if (!sidebar || !btnRow) return { ok: false, reason: "missing nodes" };
  const overflowY = getComputedStyle(sidebar).overflowY;
  sidebar.scrollTop = 0;
  const needsScroll = sidebar.scrollHeight > sidebar.clientHeight + 2;
  sidebar.scrollTop = sidebar.scrollHeight;
  const btnBottom = btnRow.getBoundingClientRect().bottom;
  const sidebarBottom = sidebar.getBoundingClientRect().bottom;
  return {
    overflowY,
    needsScroll,
    btnReachable: btnBottom <= sidebarBottom + 2,
  };
});

console.log("\nSIDEBAR ACCESS:", JSON.stringify(sidebarAccess, null, 2));
if (!["auto", "scroll", "overlay"].includes(sidebarAccess.overflowY)) {
  issues.push(`sidebar overflow-y is ${sidebarAccess.overflowY}, expected scrollable`);
}
if (sidebarAccess.needsScroll && !sidebarAccess.btnReachable) {
  issues.push("sidebar buttons not reachable after scroll");
}

console.log("\nISSUES:", issues.length ? issues.join("\n") : "none");
await browser.close();
server.close();
process.exit(issues.length ? 1 : 0);
