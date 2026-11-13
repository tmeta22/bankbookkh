/**
 * Headless browser check for the Bankbook site.
 *
 *   node tools/check-site.mjs [baseUrl]
 *
 * Loads the page, waits for the directory and the NBC source records to
 * render, and exercises the source-document search.
 */
import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';

const base = process.argv[2] || 'http://127.0.0.1:8765/index.html';
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

const results = [];
function check(condition, label) {
  results.push({ ok: Boolean(condition), label });
  console.log(`${condition ? 'PASS' : 'FAIL'}  ${label}`);
}

async function setQuery(page, value) {
  await page.evaluate(text => {
    const input = document.querySelector('#source-search');
    input.value = text;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
}

const browser = await puppeteer.launch({
  executablePath,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu']
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });

const consoleErrors = [];
page.on('console', message => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', error => consoleErrors.push(`pageerror: ${error.message}`));

await page.goto(base, { waitUntil: 'networkidle0' });
await page.waitForSelector('#bank-grid .bank-card', { timeout: 15000 });

check((await page.$$('#bank-grid .bank-card')).length === 12, 'Directory renders 12 cards on the first page');
check((await page.$eval('#total-stat', el => el.textContent)) === '55', 'Directory reports 55 banks');

await page.waitForSelector('#source-results .nbc-institution', { timeout: 15000 });
const cardCount = (await page.$$('#source-results .nbc-institution')).length;
check(cardCount === 24, `Source records render a first page of 24 (got ${cardCount})`);

const status = await page.$eval('#source-results-status', el => el.textContent);
check(status.includes('266'), `Source status reports the full record count (got "${status.trim()}")`);

const chips = await page.$$eval('#source-categories .nbc-chip', els => els.map(el => el.textContent.trim()));
check(chips.length === 13, `Category chips list 12 lists plus "All lists" (got ${chips.length})`);

// Search by an institution name that only exists in the parsed records.
await setQuery(page, 'KAMPUCHEA');
await page.waitForFunction(() => document.querySelectorAll('#source-results .nbc-institution').length === 1, { timeout: 5000 });
const found = await page.$eval('#source-results .nbc-institution', el => el.textContent);
check(found.includes('KAMPUCHEA'), 'Parsed institution is searchable by name');
check(await page.$('#source-results .nbc-institution-source') !== null, 'Result links back to the source PDF page');

// Search by contact number.
await setQuery(page, '023 231 567');
await page.waitForFunction(() => document.querySelectorAll('#source-results .nbc-institution').length >= 1, { timeout: 5000 });
const byPhone = await page.$eval('#source-results', el => el.textContent);
check(byPhone.includes('GROW MICROFINANCE'), 'Records are searchable by contact number');

// Khmer search, ignoring the spaces PDF extraction inserts between words.
await page.evaluate(() => {
  const input = document.querySelector('#source-search');
  input.value = '\u1782\u1784\u17d2\u1780\u17c1\u179f\u1783\u17d2\u1797\u17b8\u1790\u179b';
  input.dispatchEvent(new Event('input', { bubbles: true }));
});
await page.waitForFunction(() => document.querySelectorAll('#source-results .nbc-institution').length >= 1, { timeout: 5000 });
const khmerHit = await page.$eval('#source-results', el => el.textContent);
check(khmerHit.includes('CAM CAPITAL'), 'Khmer search matches across inserted word breaks');

// Category filter.
await setQuery(page, '');
await page.click('#source-categories .nbc-chip:nth-child(2)');
await page.waitForFunction(() => document.querySelectorAll('#source-results .nbc-institution').length > 0, { timeout: 5000 });
const filteredStatus = await page.$eval('#source-results-status', el => el.textContent);
const filteredChip = await page.$eval('#source-categories .nbc-chip.selected', el => el.textContent);
check(filteredStatus.includes('institutions match'), `Category filter narrows the list to ${filteredChip.replace(/\d+/g, '').trim()} (${filteredStatus.trim()})`);

// Page-text fallback still works.
await page.click('#source-mode [data-mode="pages"]');
await page.waitForSelector('#source-results .nbc-page', { timeout: 5000 });
check((await page.$$('#source-results .nbc-page')).length >= 1, 'Raw page text mode still lists source pages');

await page.click('#source-mode [data-mode="records"]');
await page.waitForSelector('#source-results .nbc-institution', { timeout: 5000 });

// Show more.
await page.click('#source-categories .nbc-chip:first-child');
await page.evaluate(() => document.querySelector('#source-more').click());
await page.waitForFunction(() => document.querySelectorAll('#source-results .nbc-institution').length === 48, { timeout: 5000 });
check(true, 'Show more appends the next batch of records');

// Khmer interface.
await page.click('#language-button');
await page.waitForFunction(() => document.querySelector('#nbc-sources-title').textContent.includes('ស្ថានភតិសនា'), { timeout: 5000 });
check(true, 'Khmer interface switch reaches the source section');
await page.click('#language-button');

check(consoleErrors.length === 0, `No console errors (${consoleErrors.join(' | ') || 'clean'})`);

const failed = results.filter(result => !result.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
await browser.close();
process.exit(failed.length ? 1 : 0);
