#!/usr/bin/env node
import { chromium, devices } from "playwright";

const URL = process.argv[2] || "https://araz-cs.github.io/";
const browser = await chromium.launch();

const configs = [
  { name: "iphone-se", ...devices["iPhone SE"] },
  { name: "iphone-14", ...devices["iPhone 14"] },
  { name: "pixel-7", viewport: { width: 412, height: 915 }, userAgent: "pixel" },
];

const issues = [];

for (const cfg of configs) {
  const page = await browser.newPage({
    viewport: cfg.viewport,
    userAgent: cfg.userAgent,
    isMobile: true,
    hasTouch: true,
  });
  await page.goto(URL, { waitUntil: "networkidle", timeout: 30000 });

  const top = await page.evaluate(() => {
    const signal = document.getElementById("signal");
    const sidebar = document.getElementById("sidebar");
    const work = document.getElementById("platform-work");
    const lead = document.querySelector(".sidebar .lead");
    const manifesto = document.querySelector(".sidebar .manifesto");
    const hook = document.querySelector(".signal-hook");
    const photo = document.querySelector(".sidebar img.rounded-circle");
    const vh = window.innerHeight;
    const signalH = signal?.offsetHeight || 0;
    const sidebarH = sidebar?.offsetHeight || 0;
    const leadStyle = lead ? getComputedStyle(lead) : null;
    const hookStyle = hook ? getComputedStyle(hook) : null;
    return {
      vh,
      signalH,
      sidebarH,
      signalPct: Math.round((signalH / vh) * 100),
      introPct: Math.round(((sidebarH + signalH) / vh) * 100),
      workTop: work?.getBoundingClientRect().top,
      leadVisible: leadStyle ? leadStyle.display !== "none" && leadStyle.visibility !== "hidden" : false,
      manifestoVisible: manifesto ? getComputedStyle(manifesto).display !== "none" : false,
      hookVisible: hookStyle ? hookStyle.display !== "none" : false,
      photoH: photo?.getBoundingClientRect().height || 0,
      hScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      firstId: [sidebar, signal, work]
        .filter(Boolean)
        .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)[0]?.id,
    };
  });

  console.log(`\n[${cfg.name}] TOP`, JSON.stringify(top, null, 2));
  if (top.firstId !== "sidebar") issues.push(`${cfg.name}: first visible is ${top.firstId}, expected sidebar`);
  if (!top.leadVisible) issues.push(`${cfg.name}: bio lead hidden`);
  if (!top.manifestoVisible) issues.push(`${cfg.name}: manifesto hidden`);
  if (!top.hookVisible) issues.push(`${cfg.name}: signal hook hidden`);
  if (top.photoH < 90) issues.push(`${cfg.name}: profile photo too small (${top.photoH}px)`);
  if (top.signalPct > 55) issues.push(`${cfg.name}: signal alone eats ${top.signalPct}% of viewport`);
  if (top.hScroll) issues.push(`${cfg.name}: horizontal scroll`);

  for (const href of ["#platform-work", "#principles", "#experience", "#blueprint", "#contact"]) {
    await page.goto(URL, { waitUntil: "networkidle" });
    await page.locator(`.mobile-dock a[href="${href}"]`).tap();
    await page.waitForTimeout(350);
    const nav = await page.evaluate((id) => {
      const el = document.getElementById(id.slice(1));
      const dock = document.querySelector(".mobile-dock");
      const dockH = dock?.offsetHeight || 0;
      const r = el?.getBoundingClientRect();
      const title = el?.querySelector(".section-title, h2");
      const tr = title?.getBoundingClientRect();
      return {
        id: id.slice(1),
        elTop: r?.top,
        titleTop: tr?.top,
        titleVisible: tr ? tr.top >= 8 && tr.bottom <= window.innerHeight - dockH - 8 : false,
        opacity: el ? getComputedStyle(el).opacity : null,
      };
    }, href);
    if (!nav.titleVisible) issues.push(`${cfg.name}: nav ${href} title not visible (top=${nav.titleTop?.toFixed(0)})`);
    if (nav.opacity === "0") issues.push(`${cfg.name}: nav ${href} section invisible`);
  }

  await page.goto(URL, { waitUntil: "networkidle" });
  await page.evaluate(() => window.scrollTo({ top: 99999, behavior: "instant" }));
  await page.waitForTimeout(200);
  const bottom = await page.evaluate(() => {
    const btn = document.querySelector('button[type="submit"]');
    const bb = btn?.getBoundingClientRect();
    const dock = document.querySelector(".mobile-dock");
    const db = dock?.getBoundingClientRect();
    return {
      scrollY: window.scrollY,
      btnAboveDock: bb && db ? bb.bottom <= db.top + 2 : false,
      dead: document.documentElement.scrollHeight - window.scrollY - window.innerHeight,
    };
  });
  if (!bottom.btnAboveDock) issues.push(`${cfg.name}: submit covered at bottom`);
  if (bottom.dead > 40) issues.push(`${cfg.name}: dead scroll ${bottom.dead}px`);

  await page.close();
}

console.log("\n=== LIVE MOBILE ISSUES ===");
issues.forEach((i) => console.log("FAIL:", i));
console.log(issues.length ? `${issues.length} issues` : "all passed");
await browser.close();
process.exit(issues.length ? 1 : 0);
