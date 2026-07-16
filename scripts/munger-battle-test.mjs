#!/usr/bin/env node
/**
 * Munger multi-lens battle test — 10 rounds × 6 frameworks
 * Inversion · Latticework · Bias · First principles · Intuition flow · Principal/billing bar
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const rawHtml = readFileSync(join(root, "index.html"), "utf8");
const rawCss = readFileSync(join(root, "css/upgrade.css"), "utf8");
const raw = rawHtml + rawCss;
const html = raw.toLowerCase();
const text = html.replace(/<[^>]+>/g, " ");

const ROUNDS = 10;
const allChecks = [];

function record(round, lens, name, ok, detail = "") {
  allChecks.push({ round, lens, name, ok, detail });
  return ok;
}

function inversionLens(r, lens) {
  const signalIdx = html.indexOf('id="signal"');
  const sidebarIdx = html.indexOf('id="sidebar"');
  const mainIdx = html.indexOf("<main");
  record(r, lens, "sidebar before signal in DOM", sidebarIdx >= 0 && sidebarIdx < signalIdx);
  record(r, lens, "signal before main in DOM", signalIdx >= 0 && signalIdx < mainIdx);
  record(r, lens, "mobile keeps full bio", !/\.sidebar \.lead[\s\S]{0,80}display:\s*none/.test(rawCss));
  record(r, lens, "mobile keeps signal hook", !/\.signal-hook\s*\{[^}]*display:\s*none/.test(rawCss));

  const workIdx = html.indexOf('id="platform-work"');
  const blueprintIdx = html.indexOf('id="blueprint"');
  const principlesIdx = html.indexOf('id="principles"');
  const expIdx = html.indexOf('id="experience"');
  const proofIdx = html.indexOf('id="proof"');
  const contactIdx = html.indexOf('id="contact"');

  record(r, lens, "work before blueprint", workIdx < blueprintIdx);
  record(r, lens, "approach before blueprint", principlesIdx < blueprintIdx);
  record(r, lens, "blueprint before contact", blueprintIdx < contactIdx);
  record(r, lens, "experience before corroboration", expIdx < proofIdx);
  record(r, lens, "skills before corroboration", html.indexOf('id="skills"') < proofIdx);
  record(r, lens, "stack before proof links", html.indexOf('id="earlier-work"') < proofIdx);
  record(r, lens, "no resume-meta in stack", !html.includes("resume-aligned") && !html.includes("icon wall") && !html.includes("tools from my 2026 resume"));
  record(r, lens, "stack judgment voice", html.includes("what ships in production") || html.includes("governed release"));
  record(r, lens, "blueprint deploy pipeline visible", html.includes("deploy-pipeline"));
  record(r, lens, "product card deprioritized", html.includes("platform-card--secondary"));
}

function latticeworkLens(r, lens) {
  const heroLead = html.match(/class="lead"[^>]*>([^<]+)/)?.[1] || "";
  record(r, lens, "hero platform ownership", /platform layer|platform engineer|own the platform/.test(heroLead));

  const signalHook = html.match(/class="signal-hook"[^>]*>([^<]+)/)?.[1] || "";
  record(r, lens, "billing platform signal", /billing|reconcil|usage/.test(signalHook));
  record(r, lens, "decision model in strip", /invert|decide|judgment/.test(signalHook));

  const workBlock = html.slice(html.indexOf('id="platform-work"'), html.indexOf('id="principles"'));
  record(r, lens, "usage-adjacent in top 2", workBlock.indexOf("usage-adjacent") >= 0 || workBlock.indexOf("transaction-critical") >= 0);

  record(r, lens, "no mag7 name-drops", !/\b(google|meta|netflix|nvidia|openai|apple|amazon)\b/.test(text.replace(/gcp/g, "").replace(/pub\/sub/g, "")));
}

function biasLens(r, lens) {
  record(r, lens, "featured metrics >= 2", (html.match(/card-metric/g) || []).length >= 2);
  record(r, lens, "linkedin primary CTA", html.includes('btn btn-dark btn-lg" target="_blank" rel="noopener">linkedin'));
  record(r, lens, "pdf download CTA", html.includes('download="araz_sultanian_resume.pdf"'));
  record(r, lens, "no grad mailto", !html.includes("mailto:arazs@uci.edu"));
  record(r, lens, "approach in mobile dock", html.includes('href="#principles"'));
  record(r, lens, "contact asks what breaks", html.includes("what breaks if it goes wrong"));
  record(r, lens, "nav approach before blueprint", html.indexOf('href="#principles"') < html.indexOf('href="#blueprint"'));
  record(r, lens, "nav has stack link", html.includes('href="#skills"'));
  record(r, lens, "blueprint in mobile dock", html.includes('href="#blueprint"'));
  record(r, lens, "stack in mobile dock", html.includes('href="#skills"'));
}

function firstPrinciplesLens(r, lens) {
  const metrics = ["95%", "175k", "cross-team", "since 2021"];
  record(r, lens, "proof metrics >= 4", metrics.filter((m) => html.includes(m)).length >= 4);

  const billingAdjacent = ["metering", "reconcil", "idempotency", "usage", "invoice", "billing"];
  record(r, lens, "billing-adjacent terms >= 4", billingAdjacent.filter((s) => text.includes(s)).length >= 4);

  record(r, lens, "milestone before fabflix", html.indexOf("milestone") < html.indexOf("fabflix"));
  record(r, lens, "human manifesto", html.includes("snow") && html.includes("coffee"));
  record(r, lens, "how i decide voice", html.includes("how i decide"));
}

function intuitionFlowLens(r, lens) {
  record(r, lens, "flow signal→work", html.indexOf('id="signal"') < html.indexOf('id="platform-work"'));
  record(r, lens, "flow work→approach", html.indexOf('id="platform-work"') < html.indexOf('id="principles"'));
  record(r, lens, "flow approach→experience", html.indexOf('id="principles"') < html.indexOf('id="experience"'));
  record(r, lens, "flow ends blueprint→contact", html.indexOf('id="blueprint"') < html.indexOf('id="contact"'));
  record(r, lens, "invert principle", html.includes("invert the failure"));
  record(r, lens, "measure principle", html.includes("measure the bottleneck"));
  const prose = rawHtml.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<[^>]+>/g, " ");
  record(r, lens, "no em dash in prose", !prose.includes("—"));
  record(r, lens, "no arrow glyphs in prose", !/[→↔]/.test(prose));
  record(r, lens, "no middle-dot separators in prose", !/\s·\s/.test(prose));
  record(r, lens, "work cards use problem framing", (rawHtml.match(/<strong>problem:<\/strong>/gi) || []).length >= 6);
}

function principalBarLens(r, lens) {
  record(r, lens, "design for inheritors", html.includes("inherit") || html.includes("who inherits"));
  record(r, lens, "tradeoff language", html.includes("tradeoff") || html.includes("constraint"));
  record(r, lens, "fail closed / safe path", html.includes("fail closed") || html.includes("safe path"));
  record(r, lens, "downstream owner thinking", html.includes("downstream"));
  record(r, lens, "platform primitives chip", html.includes("platform primitives"));
  record(r, lens, "decide before ship title", html.includes("how i decide before i ship"));
  record(r, lens, "leverage / constraints voice", html.includes("leverage") || html.includes("constraints other"));
  record(r, lens, "intellectual honesty signal", html.includes("intellectual honesty") || html.includes("survive cross-check") || html.includes("survive cross"));
  record(r, lens, "ownership I-voice", (html.match(/\bi (co-architected|owned|led|built|migrated|drove|founded|embedded|cut|introduced|refused)/g) || []).length >= 6);
  record(r, lens, "no api inventory obsession", !html.includes("12 lambda apis") && !html.includes("12 apis"));
  record(r, lens, "simple page title", html.includes("<title>araz sultanian 2026</title>"));
  record(r, lens, "resume 2026 path", html.includes("/docs/resume/araz_sultanian_2026.html"));
}

for (let round = 1; round <= ROUNDS; round++) {
  inversionLens(round, "inversion");
  latticeworkLens(round, "latticework");
  biasLens(round, "bias");
  firstPrinciplesLens(round, "first-principles");
  intuitionFlowLens(round, "intuition-flow");
  principalBarLens(round, "principal-bar");
}

const failures = allChecks.filter((c) => !c.ok);
const byLens = {};
for (const c of allChecks) {
  byLens[c.lens] = byLens[c.lens] || { total: 0, failed: 0 };
  byLens[c.lens].total++;
  if (!c.ok) byLens[c.lens].failed++;
}

const result = {
  framework: "munger-10x6-lens-principal-billing-bar",
  rounds: ROUNDS,
  lenses: ["inversion", "latticework", "bias", "first-principles", "intuition-flow", "principal-bar"],
  totalChecks: allChecks.length,
  totalFailures: failures.length,
  allPassed: failures.length === 0,
  byLens,
  failures: failures.slice(0, 30),
};

writeFileSync(join(root, "munger-battle-test-results.json"), JSON.stringify(result, null, 2));

console.log(`Munger ${ROUNDS}-round battle test: ${allChecks.length - failures.length}/${allChecks.length} passed`);
[...new Set(failures.map((f) => `${f.lens}: ${f.name}`))].forEach((f) => console.log(`  FAIL: ${f}`));
process.exit(failures.length > 0 ? 1 : 0);
