'use strict';

const icons = {
  bank: '<path d="m3 9 9-5 9 5M4 10h16M5 19h14M3 21h18M6 12v5m4-5v5m4-5v5m4-5v5"/><path d="M11 7h2"/>',
  building: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7h1m4 0h1M9 11h1m4 0h1M9 15h1m4 0h1M10 21v-3h4v3"/>',
  globe: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18m-14 4h3m4 0h3"/>',
  bookmark: '<path d="M6 4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17l-6-4-6 4V4Z"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  list: '<path d="M9 5h12M9 12h12M9 19h12M3 5h1M3 12h1M3 19h1"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  download: '<path d="M12 3v12m-4-4 4 4 4-4M4 16v4h16v-4"/>',
  shield: '<path d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3Z"/><path d="m8 12 3 3 5-6"/>',
  pin: '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/>',
  phone: '<path d="m8 3 3 5-3 2c1 3 3 5 6 6l2-3 5 3-1 4C11 23 1 13 4 4l4-1Z"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>'
};
const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.bank}</svg>`;
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const storage = {
  get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } }
};
const initialSaved = storage.get('bankbook-saved', []);
const state = { banks: [], query: '', filter: 'all', savedOnly: false, saved: new Set(Array.isArray(initialSaved) ? initialSaved.filter(Number.isInteger) : []), sort: 'az', view: 'grid', page: 1, pageSize: 12, lang: storage.get('bankbook-language', 'en') === 'km' ? 'km' : 'en' };
const english = {};
const khmer = {
  directory:'បញ្ជីធនាគារ', saved:'ធនាគារបានរក្សាទុក', about:'អំពីបញ្ជីនេះ ↗', eyebrow:'ព័ត៌មានធនាគារនៅកម្ពុជា', hero:'ស្វែងរកធនាគាររបស់អ្នក។<br><em>ឆ្ពោះទៅជំហានបន្ទាប់។</em>', description:'ស្វែងយល់អំពីធនាគារពាណិជ្ជនៅកម្ពុជា។<br>ស្វែងរកព័ត៌មាន និងទំនាក់ទំនងដែលអ្នកត្រូវការ។', explore:'ស្វែងរកធនាគារ', commercial:'ធនាគារពាណិជ្ជ', local:'បង្កើតឡើងក្នុងស្រុក', localShort:'បង្កើតឡើងក្នុងស្រុក', branch:'សាខាធនាគារបរទេស', asof:'ព័ត៌មានគិតត្រឹម', exploreLabel:'បញ្ជីធនាគារ', allBanks:'ធនាគារពាណិជ្ជទាំងអស់', directoryDescription:'ព័ត៌មានដែលអ្នកត្រូវការ នៅកន្លែងតែមួយ។', download:'ទាញយកបញ្ជី', bankType:'ប្រភេទធនាគារ', all:'ធនាគារទាំងអស់', sourceTitle:'ប្រភពព័ត៌មាន', sourceDescription:'ផ្អែកលើបញ្ជីធនាគារពាណិជ្ជរបស់ធនាគារជាតិនៃកម្ពុជា ដូចបានដកស្រង់ក្នុងឯកសារដើម។', sourceLink:'អំពីទិន្នន័យ', sort:'តម្រៀបតាម៖', noResults:'រកមិនឃើញធនាគារ', noResultsHint:'សាកល្បងឈ្មោះ ឬអាសយដ្ឋានផ្សេងទៀត ឬសម្អាតតម្រង។', reset:'កំណត់តម្រងឡើងវិញ', disclaimer:'សម្រាប់ជាព័ត៌មាន មិនមែនជាដំបូន្មានហិរញ្ញវត្ថុទេ។ សូមបញ្ជាក់ព័ត៌មានទំនាក់ទំនង និងសេវាកម្មដោយផ្ទាល់ជាមួយធនាគារ។', backTop:'ទៅខាងលើ ↑', footerText:'បង្កើតទំនាក់ទំនងកាន់តែប្រសើរ។<br>មគ្គុទ្ទេសក៍ឯករាជ្យអំពីធនាគារនៅកម្ពុជា។'
};
const text = (en, km) => state.lang === 'km' ? km : en;
const typeLabel = type => type === 'local' ? text('Locally incorporated', 'បង្កើតឡើងក្នុងស្រុក') : text('Foreign branch', 'សាខាធនាគារបរទេស');
const specialNames = { 'ADVANCED BANK OF ASIA LIMITED': 'Advanced Bank of Asia Limited', 'ACLEDA BANK PLC.': 'ACLEDA Bank Plc.', 'AGRICULTURAL AND RURAL DEVELOPMENT BANK': 'Agricultural and Rural Development Bank' };
function displayName(name) {
  return specialNames[name] || name.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()).replace(/\b(Plc|Ltd|Co)\b/g, '$1').replace(/\b(Icbc|Mb|Rhb|Cimb|Sbi|Dgb|Hh|Ccu|Kb|Ipu|Amk|Sme|Ibank)\b/g, c => c.toUpperCase());
}
function monogram(bank) {
  const aliases = {12:'ABA',16:'AC',41:'ARDB',14:'C',15:'V',18:'S',20:'PPC',21:'CP',24:'M',48:'W',55:'KB',57:'AMK'};
  return aliases[bank.id] || bank.name.replace(/[^A-Z ]/g,'').split(/\s+/).filter(word => !['BANK','OF','THE','BRANCH','PLC','LIMITED','LTD','CO','CAMBODIA','COMMERCIAL'].includes(word)).slice(0,2).map(word => word[0]).join('') || 'B';
}
function applyLanguage() {
  document.documentElement.lang = state.lang;
  $$('[data-i18n]').forEach(el => { const key = el.dataset.i18n; if (!(key in english)) english[key] = el.innerHTML; el.innerHTML = state.lang === 'km' ? (khmer[key] || english[key]) : english[key]; });
  $('#language-button').innerHTML = text('EN <span>⌄</span>', 'ខ្មែរ <span>⌄</span>');
  $('#language-button').setAttribute('aria-label', text('Switch to Khmer', 'Switch to English'));
  $('#search-input').placeholder = text('Search by bank name or address…', 'ស្វែងរកតាមឈ្មោះ ឬអាសយដ្ឋាន…');
  $('#sort-select').options[0].text = text('Name (A–Z)', 'ឈ្មោះ (A–Z)');
  $('#sort-select').options[1].text = text('Name (Z–A)', 'ឈ្មោះ (Z–A)');
  $('#sort-select').options[2].text = text('Directory order', 'លំដាប់ដើម');
}
function getFilteredBanks() {
  const query = state.query.toLocaleLowerCase().trim();
  return state.banks.filter(bank => (state.filter === 'all' || bank.type === state.filter) && (!state.savedOnly || state.saved.has(bank.id)) && (!query || `${bank.name} ${bank.km} ${bank.address} ${bank.phone} ${monogram(bank)}`.toLocaleLowerCase().includes(query))).sort((a, b) => state.sort === 'original' ? a.id - b.id : a.name.localeCompare(b.name) * (state.sort === 'za' ? -1 : 1));
}
function cardMarkup(bank) {
  const saved = state.saved.has(bank.id);
  const name = escapeHtml(displayName(bank.name));
  const firstPhone = bank.phone.split('/')[0].trim();
  return `<article class="bank-card" data-bank-id="${bank.id}"><div class="card-body"><div class="card-top"><span class="bank-monogram tone-${bank.id % 6}" aria-hidden="true">${monogram(bank)}</span><button class="bookmark-button ${saved ? 'is-saved' : ''}" data-save="${bank.id}" aria-label="${saved ? 'Unsave' : 'Save'} ${name}" aria-pressed="${saved}">${icon('bookmark')}</button></div><h3><button data-details="${bank.id}">${name}</button></h3><p class="bank-km" lang="km">${escapeHtml(bank.km)}</p><span class="type-badge ${bank.type}">${typeLabel(bank.type)}</span><div class="card-address">${icon('pin')}<p>${escapeHtml(bank.address)}</p></div><a class="card-phone" href="tel:${firstPhone.split('-')[0].replace(/[^\d+]/g, '')}">${icon('phone')}${escapeHtml(firstPhone)}</a></div><div class="card-footer"><span>${icon('pin')}Phnom Penh</span><button data-details="${bank.id}" aria-label="${text('View details for', 'មើលព័ត៌មាន')} ${name}">${text('View details', 'មើលព័ត៌មាន')} <span>↗</span></button></div></article>`;
}
function render() {
  const filtered = getFilteredBanks();
  const pages = Math.ceil(filtered.length / state.pageSize);
  state.page = Math.max(1, Math.min(state.page, pages || 1));
  const start = (state.page - 1) * state.pageSize;
  const shown = filtered.slice(start, start + state.pageSize);
  $('#bank-grid').innerHTML = shown.map(cardMarkup).join('');
  $('#bank-grid').classList.toggle('list-view', state.view === 'list');
  $('#bank-grid').setAttribute('aria-busy', 'false');
  $('#empty-state').hidden = filtered.length > 0;
  $('#result-count').innerHTML = text(`Showing <strong>${filtered.length}</strong> of ${state.banks.length} banks`, `បង្ហាញ <strong>${filtered.length}</strong> នៃ ${state.banks.length} ធនាគារ`);
  $('#clear-search').hidden = !state.query;
  $('#directory-title').textContent = state.savedOnly ? text('Your saved banks', 'ធនាគារបានរក្សាទុក') : state.filter === 'local' ? text('Locally incorporated banks', 'ធនាគារបង្កើតឡើងក្នុងស្រុក') : state.filter === 'branch' ? text('Foreign bank branches', 'សាខាធនាគារបរទេស') : text('All commercial banks', 'ធនាគារពាណិជ្ជទាំងអស់');
  $$('.filter-options .filter-button').forEach(button => { const active = button.dataset.filter === state.filter; button.classList.toggle('selected', active); button.setAttribute('aria-pressed', active); });
  $('#saved-filter').classList.toggle('selected', state.savedOnly);
  $('#saved-filter').setAttribute('aria-pressed', state.savedOnly);
  $('#saved-nav').classList.toggle('active', state.savedOnly);
  $('a.nav-link').classList.toggle('active', !state.savedOnly);
  $('#saved-count').textContent = state.saved.size;
  $('#sidebar-saved-count').textContent = state.saved.size;
  $('#grid-view').classList.toggle('selected', state.view === 'grid');
  $('#list-view').classList.toggle('selected', state.view === 'list');
  $('#grid-view').setAttribute('aria-pressed', state.view === 'grid');
  $('#list-view').setAttribute('aria-pressed', state.view === 'list');
  $('#pagination').hidden = !filtered.length;
  $('#page-summary').textContent = text(`${start + 1}–${Math.min(start + state.pageSize, filtered.length)} of ${filtered.length} banks`, `${start + 1}–${Math.min(start + state.pageSize, filtered.length)} នៃ ${filtered.length} ធនាគារ`);
  $('#page-buttons').innerHTML = `<button data-page="${state.page - 1}" aria-label="Previous page" ${state.page === 1 ? 'disabled' : ''}>←</button>${Array.from({ length: pages }, (_, i) => `<button data-page="${i + 1}" aria-label="Page ${i + 1}" ${state.page === i + 1 ? 'class="selected" aria-current="page"' : ''}>${i + 1}</button>`).join('')}<button data-page="${state.page + 1}" aria-label="Next page" ${state.page >= pages ? 'disabled' : ''}>→</button>`;
  $('#download-button').disabled = !filtered.length;
}
let toastTimer;
function notify(message) {
  $('#toast').textContent = message;
  $('#toast').classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 2800);
}
function toggleSave(id) {
  const saved = state.saved.has(id);
  if (saved) state.saved.delete(id); else state.saved.add(id);
  const persisted = storage.set('bankbook-saved', [...state.saved]);
  notify(persisted ? saved ? text('Bank removed from saved banks', 'បានដកធនាគារចេញពីបញ្ជីរក្សាទុក') : text('Bank saved on this device', 'បានរក្សាទុកធនាគារនៅលើឧបករណ៍នេះ') : text('Saved for this visit only — browser storage is unavailable', 'រក្សាទុកសម្រាប់ការចូលមើលនេះតែប៉ុណ្ណោះ'));
  render();
  const modalButton = $('#dialog-content [data-dialog-save]');
  if (modalButton && Number(modalButton.dataset.dialogSave) === id) {
    modalButton.innerHTML = `${icon('bookmark')}${state.saved.has(id) ? text('Saved bank', 'បានរក្សាទុក') : text('Save bank', 'រក្សាទុក')}`;
    modalButton.setAttribute('aria-pressed', state.saved.has(id));
  }
}
let dialogOpener;
function openDialog() {
  dialogOpener = document.activeElement;
  $('#bank-dialog').showModal();
  document.body.style.overflow = 'hidden';
}
function showDetails(id) {
  const bank = state.banks.find(item => item.id === id);
  if (!bank) return;
  const phones = bank.phone.split('/').map(part => part.trim());
  // Preserve abbreviated/ranged contact entries as text; only unambiguous numbers are dialable.
  const phoneLinks = phones.map(phone => /^[\d\s]+$/.test(phone) && phone.replace(/\s/g, '').length >= 9 ? `<a class="dialog-phone" href="tel:${phone.replace(/\s/g, '')}">${icon('phone')}${escapeHtml(phone)}</a>` : `<span class="dialog-phone">${escapeHtml(phone)}</span>`).join('');
  $('#dialog-content').innerHTML = `<span class="bank-monogram tone-${bank.id % 6}">${monogram(bank)}</span><h2 id="dialog-title">${escapeHtml(displayName(bank.name))}</h2><p class="dialog-km" lang="km">${escapeHtml(bank.km)}</p><span class="type-badge ${bank.type}">${typeLabel(bank.type)}</span><section class="dialog-section"><h3>${text('Registered address', 'អាសយដ្ឋាន')}</h3><p>${escapeHtml(bank.address)}</p></section><section class="dialog-section"><h3>${text('Contact numbers', 'លេខទំនាក់ទំនង')}</h3>${phoneLinks}</section><div class="dialog-actions"><a class="primary-button" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(bank.name + ' ' + bank.address)}" target="_blank" rel="noopener noreferrer">${icon('pin')}${text('Open in Maps ↗', 'មើលផែនទី ↗')}</a><button class="outline-button" data-dialog-save="${bank.id}" aria-pressed="${state.saved.has(bank.id)}">${icon('bookmark')}${state.saved.has(bank.id) ? text('Saved bank', 'បានរក្សាទុក') : text('Save bank', 'រក្សាទុក')}</button></div><section class="dialog-section"><p>${text('Directory dated 31 May 2026. Source: NBC commercial banks list. Please verify details directly with the bank.', 'បញ្ជីគិតត្រឹមថ្ងៃទី៣១ ខែឧសភា ឆ្នាំ២០២៦។ ប្រភព៖ បញ្ជីធនាគារពាណិជ្ជរបស់ធនាគារជាតិ។ សូមបញ្ជាក់ព័ត៌មានដោយផ្ទាល់ជាមួយធនាគារ។')}</p></section>`;
  openDialog();
}
function showAbout() {
  $('#dialog-content').innerHTML = `<div class="source-copy"><span class="source-icon">${icon('shield')}</span><p class="eyebrow">BANKBOOK · CAMBODIA</p><h2 id="dialog-title">${text('A little clarity goes a long way.', 'ព័ត៌មានច្បាស់លាស់សម្រាប់អ្នក។')}</h2><p>${text('Bankbook is an independent, bilingual directory that makes it easier to explore Cambodia’s commercial banks. It is not affiliated with or endorsed by the National Bank of Cambodia.', 'Bankbook គឺជាបញ្ជីធនាគារឯករាជ្យដែលមានពីរភាសា។ មិនមានទំនាក់ទំនង ឬការគាំទ្រពីធនាគារជាតិនៃកម្ពុជាទេ។')}</p><p>${text('All 58 bank records are preserved from the supplied directory, which cites the National Bank of Cambodia’s List of Commercial Banks, as at 31 May 2026. This source attribution and date have not been independently verified.', 'ព័ត៌មានធនាគារទាំង ៥៨ ត្រូវបានរក្សាពីឯកសារដើម ដែលដកស្រង់បញ្ជីធនាគារពាណិជ្ជរបស់ធនាគារជាតិនៃកម្ពុជា គិតត្រឹមថ្ងៃទី៣១ ខែឧសភា ឆ្នាំ២០២៦។ ប្រភព និងកាលបរិច្ឆេទនេះមិនត្រូវបានផ្ទៀងផ្ទាត់ដោយឯករាជ្យទេ។')}</p><p>${text('“Locally incorporated” describes a bank’s legal incorporation in Cambodia, not its ownership. “Foreign branch” describes a branch of an overseas bank. All listed addresses are in Phnom Penh; this is not a directory of every retail branch.', '«បង្កើតឡើងក្នុងស្រុក» សំដៅលើការបង្កើតតាមច្បាប់នៅកម្ពុជា មិនមែនកម្មសិទ្ធិទេ។ «សាខាធនាគារបរទេស» សំដៅលើសាខារបស់ធនាគារក្រៅប្រទេស។ អាសយដ្ឋានក្នុងបញ្ជីនេះស្ថិតនៅភ្នំពេញ។')}</p><p>${text('Saved banks stay in your browser on this device. Exports include the current search and filters. Initial badges are directory identifiers, not official bank logos. Please confirm services and contact details directly with each bank.', 'ធនាគារដែលបានរក្សាទុកនឹងនៅក្នុងកម្មវិធីរុករកលើឧបករណ៍នេះ។ ការទាញយករួមបញ្ចូលលទ្ធផលតាមតម្រងបច្ចុប្បន្ន។ សញ្ញាអក្សរកាត់មិនមែនជារូបសញ្ញាផ្លូវការរបស់ធនាគារទេ។')}</p><div class="dialog-actions"><a class="primary-button" href="https://www.nbc.gov.kh/" target="_blank" rel="noopener noreferrer">${text('Visit the NBC website ↗', 'ចូលគេហទំព័រធនាគារជាតិ ↗')}</a><a class="outline-button" href="original.html" target="_blank" rel="noopener">${text('View original directory ↗', 'មើលឯកសារដើម ↗')}</a></div></div>`;
  openDialog();
}
function exportCsv() {
  const rows = [['Bank name (English)', 'Bank name (Khmer)', 'Address', 'Phone numbers', 'Type', 'Directory date'], ...getFilteredBanks().map(bank => [bank.name, bank.km, bank.address, bank.phone, bank.type === 'local' ? 'Locally Incorporated' : 'Foreign Branch', '2026-05-31'])];
  const csv = '\uFEFF' + rows.map(row => row.map(value => '"' + String(value).replace(/"/g, '""') + '"').join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a'); link.href = url; link.download = 'bankbook-cambodia-directory.csv'; document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  notify(text(`Exported ${rows.length - 1} banks`, `បានទាញយក ${rows.length - 1} ធនាគារ`));
}
async function loadBanks() {
  $('#load-error').hidden = true;
  $('#empty-state').hidden = true;
  $('#bank-grid').setAttribute('aria-busy', 'true');
  $('#result-count').textContent = text('Loading banks…', 'កំពុងផ្ទុក…');
  try {
    const response = await fetch('bankbook-cambodia-directory.csv');
    if (!response.ok) throw new Error(`Directory request failed (${response.status})`);
    const csvText = await response.text();
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const rows = lines.slice(1).map(line => {
      const values = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      return values;
    });
    state.banks = rows.map((row, id) => ({
      id,
      name: row[0].replace(/^"|"$/g, ''),
      km: row[1].replace(/^"|"$/g, ''),
      address: row[2].replace(/^"|"$/g, ''),
      phone: row[3].replace(/^"|"$/g, ''),
      type: row[4].replace(/^"|"$/g, '') === 'Locally Incorporated' ? 'local' : 'branch'
    }));
    state.saved = new Set([...state.saved].filter(id => id >= 0 && id < state.banks.length));
    const local = state.banks.filter(bank => bank.type === 'local').length;
    $('#total-stat').textContent = $('#count-all').textContent = state.banks.length;
    $('#local-stat').textContent = $('#count-local').textContent = local;
    $('#branch-stat').textContent = $('#count-branch').textContent = state.banks.length - local;
    render();
  } catch (error) {
    console.error('Bankbook directory:', error.message);
    $('#load-error').hidden = false;
    $('#result-count').textContent = text('Directory unavailable', 'មិនអាចផ្ទុកបញ្ជីបាន');
    $('#bank-grid').setAttribute('aria-busy', 'false');
    $('#pagination').hidden = true;
    $('#download-button').disabled = true;
  }
}
$$('[data-icon]').forEach(el => el.innerHTML = icon(el.dataset.icon));
applyLanguage();
$('#search-input').addEventListener('input', event => { state.query = event.target.value; state.page = 1; render(); });
$('#clear-search').addEventListener('click', () => { state.query = ''; $('#search-input').value = ''; state.page = 1; render(); $('#search-input').focus(); });
$$('[data-filter]').forEach(button => button.addEventListener('click', () => { state.filter = button.dataset.filter; state.page = 1; render(); }));
$('#sort-select').addEventListener('change', event => { state.sort = event.target.value; state.page = 1; render(); });
function showSaved() { state.savedOnly = !state.savedOnly; state.page = 1; render(); $('#directory').scrollIntoView({behavior:'smooth'}); }
$('#saved-nav').addEventListener('click', showSaved);
$('#saved-filter').addEventListener('click', showSaved);
$('a.nav-link').addEventListener('click', () => { state.savedOnly = false; state.filter = 'all'; state.page = 1; render(); });
$('#reset-filters').addEventListener('click', () => { state.query = ''; state.filter = 'all'; state.savedOnly = false; state.page = 1; $('#search-input').value = ''; render(); });
$('#grid-view').addEventListener('click', () => { state.view = 'grid'; render(); });
$('#list-view').addEventListener('click', () => { state.view = 'list'; render(); });
$('#language-button').addEventListener('click', () => { state.lang = state.lang === 'en' ? 'km' : 'en'; storage.set('bankbook-language', state.lang); applyLanguage(); if (state.banks.length) render(); });
$('#bank-grid').addEventListener('click', event => {
  const save = event.target.closest('[data-save]');
  const details = event.target.closest('[data-details]');
  if (save) { const id = Number(save.dataset.save); toggleSave(id); $(`[data-save="${id}"]`)?.focus({preventScroll:true}); }
  if (details) showDetails(Number(details.dataset.details));
});
$('#page-buttons').addEventListener('click', event => { const button = event.target.closest('[data-page]'); if (!button || button.disabled) return; state.page = Number(button.dataset.page); render(); $('.search-wrap').scrollIntoView({behavior:'smooth',block:'start'}); $(`[data-page="${state.page}"]`)?.focus({preventScroll:true}); });
$('#dialog-content').addEventListener('click', event => { const save = event.target.closest('[data-dialog-save]'); if (save) toggleSave(Number(save.dataset.dialogSave)); });
$('#close-dialog').addEventListener('click', () => $('#bank-dialog').close());
$('#bank-dialog').addEventListener('click', event => { if (event.target !== $('#bank-dialog')) return; const rect = event.target.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) event.target.close(); });
$('#bank-dialog').addEventListener('close', () => { document.body.style.overflow = ''; if (dialogOpener?.isConnected) dialogOpener.focus({preventScroll:true}); });
$('#about-button').addEventListener('click', showAbout);
$('#source-button').addEventListener('click', showAbout);
$('#download-button').addEventListener('click', exportCsv);
$('#retry-button').addEventListener('click', loadBanks);
document.addEventListener('keydown', event => { if (event.key === '/' && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName) && !$('#bank-dialog').open) { event.preventDefault(); $('#search-input').focus(); $('#search-input').scrollIntoView({behavior:'smooth',block:'center'}); } });
loadBanks();
