#!/usr/bin/env node
/**
 * Munger multi-lens battle test — 10 rounds × 4 frameworks
 * Inversion · Latticework · Bias audit · First principles
 * Plus intuition-flow checks (time-of-day agnostic scan path)
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const raw = readFileSync(join(root, "index.html"), "utf8");
const html = raw.toLowerCase();
const text = html.replace(/<[^>]+>/g, " ");

const ROUNDS = 10;
const allChecks = [];

function record(round, lens, name, ok, detail = "") {
  const entry = { round, lens, name, ok, detail };
  allChecks.push(entry);
  return ok;
}

function runLens(round, lens, fn) {
  fn(round, lens);
}

// —— INVERSION — guarantee failure paths eliminated ———
function inversionLens(r, lens) {
  const signalIdx = html.indexOf('id="signal"');
  const sidebarIdx = html.indexOf('id="sidebar"');
  record(r, lens, "signal before sidebar in DOM", signalIdx >= 0 && signalIdx < sidebarIdx, `signal@${signalIdx}`);

  const workIdx = html.indexOf('id="platform-work"');
  const platformIdx = html.indexOf('id="platform"');
  record(r, lens, "work before platform", workIdx > 0 && platformIdx > workIdx);

  const principlesIdx = html.indexOf('id="principles"');
  record(r, lens, "approach before platform depth", principlesIdx > 0 && principlesIdx < platformIdx, "intuition before architecture");

  record(r, lens, "no see-blueprint-above", !html.includes("see blueprint above"));
  record(r, lens, "depth behind disclosure", html.includes("platform-expand"));
  record(r, lens, "product card deprioritized", html.includes("platform-card--secondary"));
}

// —— LATTICEWORK — right model per surface ———
function latticeworkLens(r, lens) {
  const heroLead = html.match(/class="lead"[^>]*>([^<]+)/)?.[1] || "";
  record(r, lens, "hero platform-first", /platform engineer/.test(heroLead));

  const signalHook = html.match(/class="signal-hook"[^>]*>([^<]+)/)?.[1] || "";
  record(r, lens, "billing signal in strip", /billing|reconcil/.test(signalHook));
  record(r, lens, "invert failure in strip", /invert/.test(signalHook), "thinking model visible early");

  const workBlock = html.slice(html.indexOf('id="platform-work"'), html.indexOf('id="principles"'));
  record(r, lens, "transaction in top 2 cards", workBlock.indexOf("transaction-critical") < workBlock.indexOf("event-driven"));

  record(r, lens, "sticky signal bar", html.includes("signal-strip--global"), "scan path at any scroll hour");
}

// —— BIAS AUDIT — craft must not beat signal ———
function biasLens(r, lens) {
  record(r, lens, "featured cards have metrics", (html.match(/card-metric/g) || []).length >= 2);
  record(r, lens, "linkedin primary CTA", html.includes('btn btn-dark btn-lg" target="_blank" rel="noopener">linkedin'));
  record(r, lens, "no grad mailto", !html.includes("mailto:arazs@uci.edu"));
  record(r, lens, "approach in mobile dock", html.includes('href="#principles"') && html.includes("approach"));
  record(r, lens, "focus-over-motivation voice", html.includes("focus beats motivation"), "DSA discipline without sheet on page");
}

// —— FIRST PRINCIPLES — bare signal only ———
function firstPrinciplesLens(r, lens) {
  const metrics = ["7 yrs", "95%", "175k", "cross-team"];
  record(r, lens, "proof metrics >= 4", metrics.filter((m) => html.includes(m)).length >= 4);

  const backend = ["event-driven", "lambda", "reconcil", "idempotency", "cdk", "microservices"];
  record(r, lens, "backend signals >= 5", backend.filter((s) => text.includes(s)).length >= 5);

  record(r, lens, "milestone before fabflix", html.indexOf("milestone search") < html.indexOf("fabflix") || html.indexOf("175,000") < html.indexOf("21,000"));
  record(r, lens, "human manifesto present", html.includes("snow") && html.includes("coffee"), "intuition lifestyle anchor");
  record(r, lens, "public-safe framing", html.includes("internal repos stay private") || html.includes("public-safe"));
}

// —— INTUITION FLOW — scan path any time of day ———
function intuitionFlowLens(r, lens) {
  record(r, lens, "flow: signal→work", html.indexOf('id="signal"') < html.indexOf('id="platform-work"'));
  record(r, lens, "flow: work→approach", html.indexOf('id="platform-work"') < html.indexOf('id="principles"'));
  record(r, lens, "flow: approach→platform", html.indexOf('id="principles"') < html.indexOf('id="platform"'));
  record(r, lens, "four approach principles", (html.match(/principle-card/g) || []).length >= 4);
  record(r, lens, "invert principle named", html.includes("invert the failure"));
  record(r, lens, "measure principle named", html.includes("measure the bottleneck"));
}

for (let round = 1; round <= ROUNDS; round++) {
  runLens(round, "inversion", inversionLens);
  runLens(round, "latticework", latticeworkLens);
  runLens(round, "bias", biasLens);
  runLens(round, "first-principles", firstPrinciplesLens);
  runLens(round, "intuition-flow", intuitionFlowLens);
}

const failures = allChecks.filter((c) => !c.ok);
const byLens = {};
for (const c of allChecks) {
  byLens[c.lens] = byLens[c.lens] || { total: 0, failed: 0 };
  byLens[c.lens].total++;
  if (!c.ok) byLens[c.lens].failed++;
}

const result = {
  framework: "munger-10x5-lens-intuition-flow",
  rounds: ROUNDS,
  lenses: ["inversion", "latticework", "bias", "first-principles", "intuition-flow"],
  totalChecks: allChecks.length,
  totalFailures: failures.length,
  allPassed: failures.length === 0,
  byLens,
  failures: failures.slice(0, 20),
  checks: allChecks,
};

writeFileSync(join(root, "munger-battle-test-results.json"), JSON.stringify(result, null, 2));

const uniqueFailures = [...new Set(failures.map((f) => `${f.lens}: ${f.name}`))];
console.log(`Munger ${ROUNDS}-round battle test: ${allChecks.length - failures.length}/${allChecks.length} passed`);
if (uniqueFailures.length) {
  uniqueFailures.forEach((f) => console.log(`  FAIL: ${f}`));
}
process.exit(failures.length > 0 ? 1 : 0);
