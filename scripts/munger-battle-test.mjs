#!/usr/bin/env node
/**
 * Munger-lens portfolio battle test
 * Passes: inversion (signal density), latticework (role alignment),
 * bias audit (no self-referential cards), first principles (60s scan)
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "index.html"), "utf8").toLowerCase();
const text = html.replace(/<[^>]+>/g, " ");

const checks = [];

function check(name, ok, detail = "") {
  checks.push({ name, ok, detail });
  return ok;
}

// —— Pass 1: INVERSION — avoid guaranteed failure ———
const workIdx = html.indexOf('id="platform-work"');
const platformIdx = html.indexOf('id="platform"');
check(
  "inversion: work before platform",
  workIdx > 0 && platformIdx > workIdx,
  `work@${workIdx} platform@${platformIdx}`
);

const signalIdx = html.indexOf('id="signal"');
check(
  "inversion: signal strip exists",
  signalIdx >= 0 && signalIdx < workIdx,
  "60s proof before depth"
);

check(
  "inversion: no see-blueprint-above",
  !html.includes("see blueprint above"),
  "work cards standalone"
);

check(
  "inversion: safe-deploy collapsible",
  html.includes("platform-expand") && html.includes("safe deploy"),
  "depth behind disclosure"
);

// —— Pass 2: LATTICEWORK — right mental model per surface ———
const heroLead = html.match(/class="lead"[^>]*>([^<]+)/)?.[1] || "";
check(
  "latticework: hero platform-first",
  /platform engineer/.test(heroLead) &&
    (heroLead.indexOf("product") === -1 || heroLead.indexOf("platform") < heroLead.indexOf("product")),
  heroLead.slice(0, 80)
);

const signalHook = html.match(/class="signal-hook"[^>]*>([^<]+)/)?.[1] || "";
check(
  "latticework: billing signal above fold",
  /billing|reconcil|metering/.test(signalHook),
  signalHook.slice(0, 80)
);

const workBlock = html.slice(workIdx, platformIdx);
check(
  "latticework: transaction card in top 2",
  workBlock.indexOf("transaction-critical") < workBlock.indexOf("event-driven"),
  "billing-adjacent before events"
);

check(
  "latticework: product card deprioritized",
  workBlock.includes("platform-card--secondary"),
  "secondary visual weight"
);

// —— Pass 3: BIAS AUDIT — avoid craft over signal ———
check(
  "bias: featured cards have metrics",
  (html.match(/card-metric/g) || []).length >= 2,
  `metrics=${(html.match(/card-metric/g) || []).length}`
);

check(
  "bias: linkedin primary contact",
  html.indexOf("linkedin.com") < html.indexOf("formspree") &&
    html.includes('btn btn-dark btn-lg" target="_blank" rel="noopener">linkedin'),
  "pro contact path"
);

check(
  "bias: no grad email in mailto",
  !html.includes("mailto:arazs@uci.edu"),
  "removed student email friction"
);

// —— Pass 4: FIRST PRINCIPLES — bare signal rebuild ———
const metrics = ["7 yrs", "95%", "175k", "cross-team", "cdk"];
const foundMetrics = metrics.filter((m) => html.includes(m));
check(
  "first-principles: proof metrics >= 4",
  foundMetrics.length >= 4,
  foundMetrics.join(", ")
);

const backendSignals = [
  "backend",
  "distributed",
  "event-driven",
  "lambda",
  "microservices",
  "reconcil",
  "idempotency",
  "cdk",
];
const foundBackend = backendSignals.filter((s) => text.includes(s));
check(
  "first-principles: backend signals >= 6",
  foundBackend.length >= 6,
  `found=${foundBackend.length}`
);

check(
  "first-principles: milestone before fabflix in earlier work",
  html.indexOf("milestone") < html.indexOf("fabflix") ||
    html.indexOf("175,000") < html.indexOf("21,000"),
  "analytical anchor first"
);

// —— Pass 5: UX structure ———
check(
  "structure: nav work first",
  html.indexOf('href="#platform-work"') < html.indexOf('href="#platform"'),
  "nav order"
);

check(
  "structure: mobile dock work first",
  html.includes('mobile-dock') &&
    html.indexOf('href="#platform-work"') < html.indexOf('href="#contact"'),
  "mobile nav"
);

check(
  "structure: all section ids",
  ["signal", "platform-work", "platform", "proof", "experience", "contact"].every(
    (id) => html.includes(`id="${id}"`)
  ),
  "sections present"
);

// —— Pass 6: Confidentiality ———
check(
  "confidential: no mag7 name-drops",
  !/\b(meta|google|netflix|nvidia|openai)\b/.test(text.replace(/gcp/g, "")),
  "indirect positioning"
);

check(
  "confidential: public-safe framing",
  html.includes("public-safe") || html.includes("internal repos stay private"),
  "nda-aware"
);

const failures = checks.filter((c) => !c.ok);
const result = {
  framework: "munger-inversion-latticework-bias-first-principles",
  totalChecks: checks.length,
  totalFailures: failures.length,
  allPassed: failures.length === 0,
  checks,
  failures,
};

writeFileSync(join(root, "munger-battle-test-results.json"), JSON.stringify(result, null, 2));

console.log(`Munger battle test: ${checks.length - failures.length}/${checks.length} passed`);
failures.forEach((f) => console.log(`  FAIL: ${f.name} — ${f.detail}`));
process.exit(failures.length > 0 ? 1 : 0);
