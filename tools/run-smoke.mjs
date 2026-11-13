/**
 * Runs the browser interaction suite in tests/smoke.html and reports the
 * result. The suite has to be served over HTTP because the app loads data
 * with fetch.
 *
 *   node tools/run-smoke.mjs [baseUrl]
 */
import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';

const base = process.argv[2] || 'http://127.0.0.1:8765/tests/smoke.html';
const candidates = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
].filter(Boolean);
const executablePath = candidates.find(candidate => existsSync(candidate));
if (!executablePath) throw new Error('No Chromium browser found. Set CHROME_PATH.');

const browser = await puppeteer.launch({ executablePath, headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });
page.on('pageerror', error => console.log('pageerror:', error.message));
await page.goto(base, { waitUntil: 'networkidle0' });
await page.waitForFunction(() => {
  const output = document.querySelector('#test-results');
  return output && (output.dataset.complete === 'true' || output.dataset.failed === 'true');
}, { timeout: 60000 });
const report = await page.$eval('#test-results', el => el.textContent);
console.log(report);
await browser.close();
process.exit(report.includes('FAIL:') ? 1 : 0);
