#!/usr/bin/env node
/**
 * Full-site audit — every work card body must justify every chip.
 * Munger inversion: if a pill isn't in the paragraph or resume stack, it fails.
 */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const raw = readFileSync(join(root, "index.html"), "utf8");
const html = raw.toLowerCase();

const BANNED_CONCEPT_CHIPS = [
  "idempotency", "reconciliation", "observability", "api design", "design systems",
  "platform primitives", "state machines", "multi-service", "microservices",
];

/** Resume-verified stack per card (one-pager + full resume) */
const RESUME_STACK = {
  SafeDeploy: ["aws cdk", "dynamodb", "cloudfront", "cloudformation", "github actions", "aws lambda", "api gateway"],
  Bind: ["typescript", "node.js", "aws lambda", "api gateway", "aws cdk", "mongodb", "github actions", "react", "redux"],
  Event: ["step functions", "aws lambda", "salesforce", "mulesoft", "splunk"],
  Ford: ["java", "spring boot", "gcp cloud run", "pub/sub", "grpc", "websocket", "tekton", "terraform"],
  Scheduler: ["typescript", "react", "aws lambda", "aws cdk", "salesforce", "mulesoft", "playwright", "splunk"],
  Product: ["react", "module federation", "vite", "mui"],
  Milestone: ["java", "python"],
  Fabflix: ["java", "mysql", "javascript"],
};

const CARD_MARKERS = [
  { label: "SafeDeploy", start: "governed release" },
  { label: "Bind", start: "bind &amp; reconciliation" },
  { label: "Event", start: "event intake" },
  { label: "Ford", start: "real-time orchestration" },
  { label: "Scheduler", start: "member scheduling" },
  { label: "Product", start: "greenfield surfaces" },
];

function sliceCard(workBlock, start, nextStart) {
  const i = workBlock.indexOf(start);
  const j = nextStart ? workBlock.indexOf(nextStart, i + 1) : workBlock.length;
  return workBlock.slice(i, j === -1 ? workBlock.length : j);
}

function extractChips(cardSlice) {
  const m = cardSlice.match(/<div class="chip-row">([\s\S]*?)<\/div>/);
  if (!m) return [];
  return [...m[1].matchAll(/<span class="chip">([^<]+)</gi)].map((x) => x[1].trim().toLowerCase());
}

function cardText(cardSlice) {
  return cardSlice.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").toLowerCase();
}

const checks = [];
const workBlock = html.slice(html.indexOf('id="platform-work"'), html.indexOf('id="principles"'));

for (let i = 0; i < CARD_MARKERS.length; i++) {
  const { label, start } = CARD_MARKERS[i];
  const next = CARD_MARKERS[i + 1]?.start;
  const slice = sliceCard(workBlock, start, next);
  const text = cardText(slice);
  const chips = extractChips(slice);
  const stack = RESUME_STACK[label];

  checks.push({ area: label, name: "card found", ok: slice.length > 50 });
  checks.push({ area: label, name: "has chips", ok: chips.length >= 4 && chips.length <= 6, detail: String(chips.length) });

  for (const chip of chips) {
    checks.push({ area: label, name: `resume stack: ${chip}`, ok: stack.some((s) => s === chip || chip.includes(s) || s.includes(chip)) });
    checks.push({ area: label, name: `not concept: ${chip}`, ok: !BANNED_CONCEPT_CHIPS.includes(chip) });
    const inBody = text.includes(chip) || (chip === "aws cdk" && text.includes("cdk")) || (chip === "gcp cloud run" && text.includes("cloud run")) || (chip === "spring boot" && text.includes("java microservices"));
    checks.push({ area: label, name: `body or resume justifies: ${chip}`, ok: inBody || stack.includes(chip) });
  }

  for (const req of stack.slice(0, 4)) {
    const inBody = text.includes(req) || (req === "aws cdk" && text.includes("cdk"));
    const inChips = chips.some((c) => c === req || c.includes(req));
    if (["salesforce", "mulesoft", "cloudformation", "terraform"].includes(req)) continue;
    checks.push({ area: label, name: `key stack surfaced: ${req}`, ok: inBody || inChips });
  }
}

checks.push({ area: "bind", name: "no java chip", ok: !workBlock.slice(workBlock.indexOf("bind"), workBlock.indexOf("event")).includes('class="chip">java</span>') });
checks.push({ area: "bind", name: "no spring chip", ok: !workBlock.slice(workBlock.indexOf("bind"), workBlock.indexOf("event")).includes("spring") });

const earlier = html.slice(html.indexOf('id="earlier-work"'), html.indexOf('id="proof"'));
const earlierRows = [...earlier.matchAll(/<div class="chip-row">([\s\S]*?)<\/div>/g)];
["Milestone", "Fabflix"].forEach((label, i) => {
  const chips = earlierRows[i] ? [...earlierRows[i][1].matchAll(/<span class="chip">([^<]+)</gi)].map((x) => x[1].trim().toLowerCase()) : [];
  for (const chip of chips) {
    checks.push({ area: label, name: `chip: ${chip}`, ok: RESUME_STACK[label].includes(chip) });
  }
});

checks.push({ area: "nav", name: "sidebar has stack link", ok: html.includes('href="#skills"') });
checks.push({ area: "nav", name: "munger featured metrics >= 2", ok: (html.match(/card-metric/g) || []).length >= 2 });
checks.push({ area: "nav", name: "section order skills before proof", ok: html.indexOf('id="skills"') < html.indexOf('id="proof"') });
checks.push({ area: "title", name: "Araz Sultanian 2026", ok: html.includes("<title>araz sultanian 2026</title>") });

const failures = checks.filter((c) => !c.ok);
const result = { totalChecks: checks.length, totalFailures: failures.length, allPassed: failures.length === 0, failures };
writeFileSync(join(root, "full-site-audit-results.json"), JSON.stringify(result, null, 2));
console.log(`Full-site audit: ${checks.length - failures.length}/${checks.length} passed`);
failures.forEach((f) => console.log(`  FAIL [${f.area}] ${f.name}${f.detail ? ` (${f.detail})` : ""}`));
process.exit(failures.length > 0 ? 1 : 0);
