#!/usr/bin/env node
/**
 * Full UX audit — click every nav link, dock link, accordion, and form
 * control on desktop + mobile. Verifies external links, checks for
 * console errors, broken images, and dead click zones.
 */
import { chromium } from "playwright";
import { createServer } from "http";
import { readFileSync, existsSync } from "fs";
import { join, dirname, extname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const mime = { ".html": "text/html", ".css": "text/css", ".js": "application/javascript", ".jpg": "image/jpeg", ".xml": "application/xml" };

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
const base = `http://127.0.0.1:${port}/`;
const browser = await chromium.launch();
const issues = [];
const notes = [];

function fail(msg) {
  issues.push(msg);
  console.log("FAIL:", msg);
}
function pass(msg) {
  notes.push(msg);
  console.log("PASS:", msg);
}

async function withPage(viewport, fn) {
  const page = await browser.newPage({ viewport });
  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(String(err)));
  await page.goto(base, { waitUntil: "networkidle" });
  await fn(page);
  if (consoleErrors.length) {
    fail(`${viewport.name || viewport.width}: console errors: ${consoleErrors.join(" | ")}`);
  } else {
    pass(`${viewport.name || viewport.width}: no console errors`);
  }
  await page.close();
}

// ---------- Desktop: click every top nav link ----------
await withPage({ width: 1440, height: 900, name: "desktop-1440" }, async (page) => {
  const navLinks = await page.locator(".site-nav a").all();
  pass(`desktop: found ${navLinks.length} site-nav links`);
  const signalHeight = await page.locator("#signal").evaluate((el) => el.offsetHeight);
  for (const link of navLinks) {
    const href = await link.getAttribute("href");
    const label = (await link.textContent()).trim();
    await link.click();
    // smooth-scroll duration scales with distance; wait for scrollY to settle
    let last = -1;
    for (let i = 0; i < 20; i++) {
      await page.waitForTimeout(150);
      const y = await page.evaluate(() => window.scrollY);
      if (y === last) break;
      last = y;
    }
    const target = await page.locator(href).first();
    const visible = await target.isVisible().catch(() => false);
    const box = await target.boundingBox().catch(() => null);
    // Nav scroll parks the section just below the sticky signal strip (its height + small clearance).
    const inViewport = box && box.y >= -20 && box.y < signalHeight + 80;
    if (!visible || !inViewport) {
      fail(`desktop nav "${label}" (${href}): target not scrolled into view (top=${box ? box.y.toFixed(0) : "n/a"}, expected < ${signalHeight + 80})`);
    } else {
      pass(`desktop nav "${label}" (${href}) scrolls target into view (top=${box.y.toFixed(0)})`);
    }
    const activeCount = await page.locator(`.site-nav a[href="${href}"].is-active`).count();
    if (!activeCount) fail(`desktop nav "${label}": link not marked is-active after click`);
  }

  // accordions
  const details = await page.locator(".platform-expand").all();
  pass(`desktop: found ${details.length} accordion(s)`);
  for (let i = 0; i < details.length; i++) {
    const d = details[i];
    const summary = d.locator("summary");
    const before = await d.evaluate((el) => el.hasAttribute("open"));
    await summary.click();
    await page.waitForTimeout(150);
    const after = await d.evaluate((el) => el.hasAttribute("open"));
    if (after === before) {
      fail(`desktop accordion #${i}: open state did not toggle on click`);
    } else {
      pass(`desktop accordion #${i}: toggled open=${after}`);
    }
    const bodyVisible = after ? await d.locator(".platform-expand-body").first().isVisible() : true;
    if (after && !bodyVisible) fail(`desktop accordion #${i}: body not visible when open`);
    await summary.click();
    await page.waitForTimeout(150);
  }

  // Contact form: fill every field, verify submit button clickable
  await page.locator('a[href="#contact"]').first().click();
  await page.waitForTimeout(400);
  await page.fill('input[name="name"]', "Test User");
  await page.fill('input[name="_replyto"]', "test@example.com");
  await page.fill('textarea[name="message"]', "Testing the contact form end to end.");
  const nameVal = await page.inputValue('input[name="name"]');
  const emailVal = await page.inputValue('input[name="_replyto"]');
  const msgVal = await page.inputValue('textarea[name="message"]');
  if (nameVal && emailVal && msgVal) {
    pass("desktop contact form: all fields accept input");
  } else {
    fail("desktop contact form: a field did not accept input");
  }
  const submitBtn = page.locator('button[type="submit"]');
  const submitVisible = await submitBtn.isVisible();
  const submitEnabled = await submitBtn.isEnabled();
  if (submitVisible && submitEnabled) {
    pass("desktop contact form: submit button visible + enabled");
  } else {
    fail("desktop contact form: submit button not visible/enabled");
  }
  const formAction = await page.locator("form").getAttribute("action");
  if (formAction && formAction.startsWith("https://")) {
    pass(`desktop contact form: action is valid https endpoint (${formAction})`);
  } else {
    fail(`desktop contact form: action looks broken (${formAction})`);
  }
});

// ---------- Desktop: external + internal link integrity ----------
await withPage({ width: 1440, height: 900, name: "link-audit" }, async (page) => {
  const links = await page.locator("a[href]").all();
  let emptyHrefs = 0;
  let externalMissingTarget = 0;
  let externalMissingRel = 0;
  const seen = new Set();
  for (const link of links) {
    const href = (await link.getAttribute("href")) || "";
    if (!href.trim() || href.trim() === "#") emptyHrefs++;
    if (href.startsWith("http")) {
      const target = await link.getAttribute("target");
      const rel = await link.getAttribute("rel");
      if (target !== "_blank") externalMissingTarget++;
      if (!rel || !rel.includes("noopener")) externalMissingRel++;
      seen.add(href);
    }
  }
  if (emptyHrefs) fail(`link audit: ${emptyHrefs} link(s) with empty/# href`);
  else pass("link audit: no empty hrefs");
  if (externalMissingTarget) fail(`link audit: ${externalMissingTarget} external link(s) missing target=_blank`);
  else pass("link audit: all external links open in new tab");
  if (externalMissingRel) fail(`link audit: ${externalMissingRel} external link(s) missing rel=noopener`);
  else pass("link audit: all external links have rel=noopener");
  pass(`link audit: ${seen.size} unique external destinations referenced`);

  // Buttons in sidebar
  const linkedinBtn = page.locator(".btn-row a", { hasText: "LinkedIn" });
  const resumeBtn = page.locator(".btn-row a", { hasText: "Resume" });
  if ((await linkedinBtn.count()) && (await linkedinBtn.getAttribute("href"))?.length) {
    pass("sidebar LinkedIn button has href");
  } else {
    fail("sidebar LinkedIn button missing or has no href");
  }
  if ((await resumeBtn.count()) && (await resumeBtn.getAttribute("href"))?.length) {
    pass("sidebar Resume button has href");
  } else {
    fail("sidebar Resume button missing or has no href");
  }

  // Images: check natural width > 0 (loaded, not broken)
  const brokenImages = await page.evaluate(() =>
    Array.from(document.images)
      .filter((img) => img.complete && img.naturalWidth === 0)
      .map((img) => img.src)
  );
  if (brokenImages.length) fail(`broken image(s): ${brokenImages.join(", ")}`);
  else pass(`all ${await page.evaluate(() => document.images.length)} images loaded`);

  // Horizontal scroll check
  const hScroll = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  if (hScroll) fail("desktop: horizontal scroll present");
  else pass("desktop: no horizontal scroll");
});

// ---------- Mobile: dock nav clicks + accordion + form ----------
for (const vp of [
  { width: 390, height: 844, name: "iphone-14" },
  { width: 412, height: 915, name: "pixel-7" },
]) {
  await withPage(vp, async (page) => {
    const dockLinks = await page.locator(".mobile-dock a").all();
    pass(`${vp.name}: found ${dockLinks.length} mobile dock links`);
    for (const link of dockLinks) {
      const href = await link.getAttribute("href");
      const label = (await link.textContent()).trim();
      await link.click();
      await page.waitForTimeout(500);
      const target = page.locator(href).first();
      const box = await target.boundingBox().catch(() => null);
      const dockBox = await page.locator(".mobile-dock").boundingBox();
      const visibleAboveDock = box && box.y < (dockBox ? dockBox.y : vp.height) && box.y > -100;
      if (!visibleAboveDock) {
        fail(`${vp.name} dock "${label}" (${href}): section not visible above dock (top=${box ? box.y.toFixed(0) : "n/a"})`);
      } else {
        pass(`${vp.name} dock "${label}" (${href}) scrolls into view`);
      }
    }

    // accordion on mobile (tap)
    const firstDetail = page.locator(".platform-expand").first();
    await page.locator('.mobile-dock a[href="#platform"]').click();
    await page.waitForTimeout(400);
    const beforeOpen = await firstDetail.evaluate((el) => el.hasAttribute("open"));
    await firstDetail.locator("summary").click();
    await page.waitForTimeout(150);
    const afterOpen = await firstDetail.evaluate((el) => el.hasAttribute("open"));
    if (afterOpen === beforeOpen) fail(`${vp.name} accordion: did not toggle on tap`);
    else pass(`${vp.name} accordion: toggled via tap`);

    // Contact form on mobile — fill fields, then scroll to true page bottom
    // (as a real user would to reach the button) and confirm dock never covers it.
    await page.locator('.mobile-dock a[href="#contact"]').click();
    await page.waitForTimeout(500);
    await page.fill('input[name="name"]', "Mobile Test");
    await page.fill('input[name="_replyto"]', "mobile@example.com");
    await page.fill('textarea[name="message"]', "Mobile form check.");
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
    await page.waitForTimeout(300);
    const submitBox = await page.locator('button[type="submit"]').boundingBox();
    const dockBox2 = await page.locator(".mobile-dock").boundingBox();
    const tappable = submitBox && dockBox2 && submitBox.y + submitBox.height <= dockBox2.y + 4;
    if (tappable) pass(`${vp.name}: submit button reachable above dock at max scroll`);
    else fail(`${vp.name}: submit button obscured by dock at max scroll`);

    const hScroll = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    if (hScroll) fail(`${vp.name}: horizontal scroll present`);
    else pass(`${vp.name}: no horizontal scroll`);
  });
}

console.log(`\n${issues.length ? issues.length + " ISSUES" : "ALL CHECKS PASSED"} (${notes.length} passed)`);
await browser.close();
server.close();
process.exit(issues.length ? 1 : 0);
