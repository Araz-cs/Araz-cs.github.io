#!/usr/bin/env node
import { chromium } from "playwright";
import { createServer } from "http";
import { readFileSync, existsSync } from "fs";
import { join, dirname, extname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const server = createServer((req, res) => {
  let p = req.url === "/" ? "/index.html" : req.url.split("?")[0];
  const file = join(root, p);
  if (!existsSync(file)) { res.writeHead(404); res.end(); return; }
  res.end(readFileSync(file));
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto(`http://127.0.0.1:${port}/`);

const info = await page.evaluate(() => {
  const html = document.documentElement;
  const body = document.body;
  const hs = (el) => {
    const s = getComputedStyle(el);
    return { overflow: s.overflow, overflowY: s.overflowY, height: s.height, minHeight: s.minHeight, maxHeight: s.maxHeight, display: s.display, position: s.position };
  };
  return {
    html: { ...hs(html), scrollH: html.scrollHeight, clientH: html.clientHeight },
    body: { ...hs(body), scrollH: body.scrollHeight, clientH: body.clientHeight, offsetH: body.offsetHeight },
    win: { innerH: window.innerHeight, scrollY: window.scrollY, max: html.scrollHeight - window.innerHeight },
    sidebar: getComputedStyle(document.getElementById("sidebar")).display,
    children: Array.from(body.children).map((c) => ({ tag: c.tagName, id: c.id, display: getComputedStyle(c).display, offsetH: c.offsetHeight, rectH: c.getBoundingClientRect().height })),
  };
});
console.log(JSON.stringify(info, null, 2));

for (const y of [0, 3000, 6000, 9000, 12000]) {
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await page.waitForTimeout(100);
  const sy = await page.evaluate(() => window.scrollY);
  console.log(`requested ${y} -> scrollY ${sy}`);
}

await browser.close();
server.close();
