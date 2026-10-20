'use strict';
const frame = document.getElementById('app');
const output = document.getElementById('test-results');
const lines = [];
function check(condition, label) { if (!condition) throw new Error(label); lines.push('PASS: ' + label); console.log('PASS:', label); output.textContent = lines.join('\n'); }
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function runTests() {
  let doc;
  try {
    for (let i = 0; i < 100; i++) { doc = frame.contentDocument; if (doc?.querySelector('.bank-card')) break; await delay(200); }
    const $ = selector => doc.querySelector(selector);
    const $$ = selector => [...doc.querySelectorAll(selector)];
    const click = selector => $(selector).click();
    const input = value => { $('#search-input').value = value; $('#search-input').dispatchEvent(new Event('input', {bubbles:true})); };
    const result = () => $('#result-count').textContent;
    const wasKhmer = doc.documentElement.lang === 'km';
    if (wasKhmer) click('#language-button');
    check($$('.bank-card').length === 12 && result().includes('55'), 'All 55 source records load, 12 cards on first page');
    check($('#local-stat').textContent === '44' && $('#branch-stat').textContent === '11', 'Category totals calculated from source');
    check($('.bank-card h3').textContent.includes('ACLEDA'), 'Default alphabetical sorting');
    click('[data-filter="local"]'); check(result().includes('44') && $$('.type-badge').every(el => el.classList.contains('local')), 'Local filter returns 44 local banks');
    click('[data-filter="branch"]'); check(result().includes('11') && $$('.bank-card').length === 11, 'Foreign branch filter returns 11 banks');
    click('[data-filter="all"]');
    input('ABA'); check($$('.bank-card').some(el => el.textContent.includes('Advanced Bank')), 'Common bank initials are searchable');
    input('អេស៊ីលីដា'); check($$('.bank-card').length === 1 && $('.bank-card h3').textContent.includes('ACLEDA'), 'Khmer bank-name search');
    input('023 998 777'); check($$('.bank-card').length === 1, 'Phone number search');
    input('zz-no-such-bank-zz'); check(!$('#empty-state').hidden && $$('.bank-card').length === 0, 'Empty search has recovery action');
    click('#reset-filters'); check($$('.bank-card').length === 12 && $('#search-input').value === '', 'Reset restores all banks');
    click('#list-view'); check($('#bank-grid').classList.contains('list-view') && $('#list-view').getAttribute('aria-pressed') === 'true', 'List view switches layout and accessible state');
    click('#grid-view'); check(!$('#bank-grid').classList.contains('list-view'), 'Grid view restores layout');
    $('#sort-select').value = 'za'; $('#sort-select').dispatchEvent(new Event('change')); check($('.bank-card h3').textContent.includes('Woori'), 'Reverse alphabetical sorting');
    $('#sort-select').value = 'az'; $('#sort-select').dispatchEvent(new Event('change'));
    click('[data-page="2"]'); check($('#page-summary').textContent.startsWith('13–24'), 'Pagination advances to correct record range');
    click('[data-page="1"]');
    const save = $('[data-save]'); const id = save.dataset.save; const savedBefore = save.getAttribute('aria-pressed') === 'true';
    click(`[data-save="${id}"]`); check($(`[data-save="${id}"]`).getAttribute('aria-pressed') === String(!savedBefore), 'Bookmark toggles and updates accessible state');
    const stored = JSON.parse(frame.contentWindow.localStorage.getItem('bankbook-saved')); check(stored.includes(Number(id)) === !savedBefore, 'Saved state persists in browser storage');
    click('#saved-nav'); check($('#directory-title').textContent === 'Your saved banks' && $$('.bank-card').every(el => stored.includes(Number(el.dataset.bankId))), 'Saved-bank navigation filters records');
    click('#saved-nav'); click(`[data-save="${id}"]`);
    click('[data-details]'); check($('#bank-dialog').open && $('#dialog-title').textContent.includes('ACLEDA'), 'Details modal opens for selected bank');
    check($('#dialog-content').textContent.includes('Building No. 61') && $('#dialog-content a[href^="tel:"]') && $('#dialog-content a[href^="https://www.google.com/maps/"]'), 'Modal includes full source address, dialable contact, and map link');
    click('#close-dialog'); check(!$('#bank-dialog').open, 'Modal closes');
    click('#language-button'); check(doc.documentElement.lang === 'km' && $('#directory-title').textContent.includes('ធនាគារ'), 'Khmer interface toggle');
    click('#language-button'); check(doc.documentElement.lang === 'en', 'English interface toggle');
    const win = frame.contentWindow;
    let exportBlob;
    const create = win.URL.createObjectURL;
    win.URL.createObjectURL = blob => { exportBlob = blob; return create.call(win.URL, blob); };
    const preventDownload = event => { if (event.target.closest('a[download]')) event.preventDefault(); };
    doc.addEventListener('click', preventDownload, true);
    click('#download-button');
    const csv = await exportBlob.text();
    check(csv.split('\r\n').length === 56 && csv.includes('ធនាគារ') && csv.includes('2026-08-31'), 'CSV export contains all 55 bilingual records and source date');
    input('ACLEDA'); click('#download-button'); const filteredCsv = await exportBlob.text(); check(filteredCsv.split('\r\n').length === 2 && filteredCsv.includes('ACLEDA'), 'Export respects active search');
    win.URL.createObjectURL = create; doc.removeEventListener('click', preventDownload, true);
    click('#reset-filters');
    click('#about-button'); check($('#bank-dialog').open && $('#dialog-content').textContent.includes('not been independently verified'), 'Source panel accurately discloses attribution and verification status');
    click('#close-dialog');
    check(doc.documentElement.scrollWidth <= doc.documentElement.clientWidth + 1, 'No horizontal overflow at test viewport');
    if (wasKhmer) click('#language-button');
    output.dataset.complete = 'true'; lines.push('\nAll 26 interaction checks passed.'); output.textContent = lines.join('\n'); console.log('ALL INTERACTION CHECKS PASSED');
  } catch (error) { output.dataset.failed = 'true'; output.textContent += '\nFAIL: ' + error.message; console.error('TEST FAILURE:', error.message); }
}
runTests();
