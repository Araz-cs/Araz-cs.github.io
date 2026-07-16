#!/usr/bin/env node
/**
 * Pill/chip coherence — every work-card chip must trace to resume stack.
 * Munger inversion: mismatched pills guarantee "resume cosplay" failure.
 */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "index.html"), "utf8").toLowerCase();

const RESUME_SKILLS = new Set([
  "typescript", "javascript", "python", "java", "c", "c++", "react", "node.js",
  "vite", "redux", "mui", "dynamodb", "mongodb", "postgresql", "redis", "mysql",
  "github actions", "aws lambda", "aws cdk", "step functions", "api gateway",
  "cloudfront", "terraform", "cloudformation", "docker", "kubernetes",
  "microservices", "rest", "serverless", "event-driven", "module federation",
  "splunk", "aws x-ray", "cloudwatch", "salesforce", "mulesoft", "playwright",
  "jest", "gcp cloud run", "pub/sub", "grpc", "websocket", "spring boot", "tekton",
]);

const EXTRA_RESUME = new Set(["spring boot", "tekton", "gcp cloud run", "pub/sub", "grpc", "websocket", "salesforce", "mulesoft", "playwright", "jest"]);

const CARD_LABELS = ["SafeDeploy", "Bind", "Event", "Ford", "Scheduler", "Product"];

const checks = [];
const workBlock = html.slice(html.indexOf('id="platform-work"'), html.indexOf('id="principles"'));
const chipRows = [...workBlock.matchAll(/<div class="chip-row">([\s\S]*?)<\/div>/g)];

chipRows.forEach((row, i) => {
  const label = CARD_LABELS[i] || `card-${i}`;
  const chips = [...row[1].matchAll(/<span class="chip">([^<]+)</gi)].map((x) => x[1].trim().toLowerCase());
  checks.push({ card: label, name: "has chips", ok: chips.length > 0 });
  checks.push({
    card: label,
    name: "chip count 4-6",
    ok: chips.length >= 4 && chips.length <= 6,
    detail: String(chips.length),
  });
  for (const chip of chips) {
    checks.push({
      card: label,
      name: `chip: ${chip}`,
      ok: RESUME_SKILLS.has(chip) || EXTRA_RESUME.has(chip),
    });
  }
});

checks.push({ card: "work", name: "six work chip rows", ok: chipRows.length === 6 });

const skillsBlock = html.slice(html.indexOf('id="skills"'), html.indexOf('id="earlier-work"'));
const skillTags = [...skillsBlock.matchAll(/<span class="skill-tag">([^<]+)</gi)].map((x) => x[1].trim().toLowerCase());
const allowedSkills = new Set([...RESUME_SKILLS, ...EXTRA_RESUME]);

for (const tag of skillTags) {
  const normalized = tag === "c/c++" ? "c++" : tag;
  checks.push({
    card: "skills",
    name: `skill-tag: ${tag}`,
    ok: allowedSkills.has(normalized) || allowedSkills.has(tag),
  });
}

checks.push({
  card: "skills",
  name: "resume category groups >= 7",
  ok: (skillsBlock.match(/skill-group-label/g) || []).length >= 7,
});

checks.push({
  card: "page",
  name: "simple title Araz Sultanian 2026",
  ok: html.includes("<title>araz sultanian 2026</title>"),
});

checks.push({
  card: "page",
  name: "resume path Araz_Sultanian_2026",
  ok: html.includes("/docs/resume/araz_sultanian_2026.html"),
});

checks.push({
  card: "structure",
  name: "skills before proof",
  ok: html.indexOf('id="skills"') < html.indexOf('id="proof"'),
});

checks.push({
  card: "structure",
  name: "earlier-work before proof",
  ok: html.indexOf('id="earlier-work"') < html.indexOf('id="proof"'),
});

checks.push({
  card: "structure",
  name: "proof before blueprint",
  ok: html.indexOf('id="proof"') < html.indexOf('id="blueprint"'),
});

const failures = checks.filter((c) => !c.ok);
const result = {
  framework: "pill-coherence-resume-stack",
  totalChecks: checks.length,
  totalFailures: failures.length,
  allPassed: failures.length === 0,
  failures: failures.slice(0, 40),
};

writeFileSync(join(root, "pill-coherence-results.json"), JSON.stringify(result, null, 2));
console.log(`Pill coherence: ${checks.length - failures.length}/${checks.length} passed`);
failures.forEach((f) => console.log(`  FAIL [${f.card}] ${f.name}${f.detail ? ` (${f.detail})` : ""}`));
process.exit(failures.length > 0 ? 1 : 0);
