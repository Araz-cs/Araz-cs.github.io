#!/usr/bin/env node
/**
 * Generate resume PDFs from canonical HTML (print layout, toolbar hidden).
 */
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const resumeDir = path.join(__dirname, '..', 'docs', 'resume');
const htmlPath = path.join(resumeDir, 'Araz_Sultanian_2026.html');
const outputs = [
  path.join(resumeDir, 'Araz_Sultanian_Resume.pdf'),
  path.join(resumeDir, 'Araz_Sultanian_2026.pdf'),
];

if (!fs.existsSync(htmlPath)) {
  console.error('Missing HTML resume:', htmlPath);
  process.exit(1);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle' });
await page.emulateMedia({ media: 'print' });

const pdfBuffer = await page.pdf({
  preferCSSPageSize: true,
  printBackground: true,
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
});

for (const out of outputs) {
  fs.writeFileSync(out, pdfBuffer);
  console.log(`Wrote ${out} (${pdfBuffer.length} bytes)`);
}

await browser.close();
