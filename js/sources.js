'use strict';

// The NBC supervision documents are parsed into institution records so the new
// data is searchable as data. The raw page text stays available as a fallback
// for anything the table parse could not attribute to a record.
(() => {
  const PAGE_SIZE = 24;

  const searchInput = $('#source-search');
  const results = $('#source-results');
  const status = $('#source-results-status');
  const categoryBar = $('#source-categories');
  const moreButton = $('#source-more');
  const clearButton = $('#source-clear');
  const modeButtons = $$('#source-mode [data-mode]');

  const state = { institutions: [], pages: [], query: '', category: 'all', mode: 'records', shown: PAGE_SIZE, lang: 'en' };

  const copy = {
    en: {
      eyebrow: 'NBC supervision lists',
      heading: 'More regulated entities',
      description: 'Search the National Bank of Cambodia supervision lists: microfinance institutions, rural credit institutions, leasing companies, audit firms and more.',
      placeholder: 'Search by institution, address or phone…',
      records: 'Institutions',
      pages: 'Page text',
      all: 'All lists',
      showMore: 'Show more',
      matched: 'institutions match',
      total: n => `${n} institutions across 12 NBC lists`,
      empty: 'No institutions found. Try another name, address or phone number.',
      pageEmpty: 'No pages match. Try another word, or browse the original PDFs.',
      loading: 'Loading records…',
      failed: 'NBC records could not be loaded. Refresh the page to try again.',
      asAt: 'as at',
      page: 'page',
      clear: 'Clear search',
      mode: 'Search mode',
      filter: 'Filter by source list',
      downloadRecords: 'Download records',
      downloadPages: 'Page text CSV',
      searchLabel: 'Search NBC institutions',
      notice: 'Source dates vary by list. Addresses and contacts are transcribed from the NBC PDFs; check the original document before relying on a detail.'
    },
    km: {
      eyebrow: 'បញ្ជីត្រៀមបន្ទាន់របស់ធនាគារជាតិ',
      heading: 'ស្ថានភតិសនាបន្ថែម',
      description: 'ស្វែងរកក្នុងបញ្ជីត្រៀមបន្ទាន់របស់ធនាគារជាតិនៃកម្ពុជា៖ ស្ថានភតិសនាមីគរូ, ស្ថានភតិសនាឥណទានជនបទ, ក្រុមហ៊ុនវតាុ, ក្រុមហ៊ុនសវនរមម និងផ្សេងៗ។',
      placeholder: 'ស្វែងរកតាមឈ្មោះ អាសយដ្ឋាន ឬលេខទំនាក់ទំនង…',
      records: 'ស្ថានភតិសនា',
      pages: 'អត្ថបទទំព័រ',
      all: 'បញ្ជីទាំងអស់',
      showMore: 'បង្ហាញបន្ថែម',
      matched: 'ស្ថានភតិសនាត្រូវគ្រោះ',
      total: n => `${n} ស្ថានភតិសនាក្នុងបញ្ជី ១២ ប្រភពរបស់ធនាគារជាតិ`,
      empty: 'រកមិនឃើញស្ថានភតិសនា។ សូមសាកល្បងឈ្មោះ អាសយដ្ឋាន ឬលេខទំនាក់ទំនងផ្សេង។',
      pageEmpty: 'រកមិនឃើញទំព័រ។ សូមសាកល្បងពាក្សផ្សេង ឬមើលឯកសារ PDF ដើម។',
      loading: 'កំពុងផ្ទុប…',
      failed: 'មិនអាចផ្ទុបស្ថានភតិសនាបាន។ សូមផ្ទុកទំព័រម្ដងទៀត។',
      asAt: 'គិតត្រឹម',
      page: 'ទំព័រ',
      clear: 'សម្អាតការស្វែងរក',
      mode: 'រប្រភពនៃការស្វែងរក',
      filter: 'ប្រង្ហេតតាមបញ្ជីប្រភព',
      downloadRecords: 'ទាញយកកំណត់',
      downloadPages: 'CSV អត្ថបទទំព័រ',
      searchLabel: 'ស្វែងរកស្ថានភតិសនារបស់ធនាគារជាតិ',
      notice: 'កាលបរិច្ឆេទប្រភពខុសគ្នាតាមបញ្ជី។ អាសយដ្ឋាន និងលេខទំនាក់ទំនងត្រូវបានចម្លងពីឯកសារ PDF របស់ធនាគារជាតិ សូមពិនិត្យឯកសារដើមមុននឹងប្រើប្រាក់។'
    }
  };

  const t = () => copy[state.lang] || copy.en;
  // Khmer extraction can split or join words, so search a space-free variant too.
  const squeeze = text => text.replace(/([\u1780-\u17FF])[ ]+(?=[\u1780-\u17FF])/g, '$1');

  function prepare(records) {
    return records.map(record => {
      const haystack = [record.name, record.nameKm, record.address, record.addressKm, record.contact, record.category]
        .filter(Boolean).join(' ').toLocaleLowerCase();
      return { ...record, haystack, compact: squeeze(haystack) };
    });
  }

  function matches(record, query) {
    if (!query) return true;
    return record.haystack.includes(query) || record.compact.includes(squeeze(query));
  }

  function formatDate(iso) {
    const date = new Date(`${iso}T00:00:00Z`);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleDateString(state.lang === 'km' ? 'km-KH' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  }

  function contactMarkup(contact) {
    if (!contact) return '';
    return contact.split('·').map(part => part.trim()).filter(Boolean).map(part => {
      const digits = part.replace(/\D/g, '');
      const dialable = /^[\d\s+()\-/]+$/.test(part) && digits.length >= 8;
      const body = `${icon('phone')}${escapeHtml(part)}`;
      return dialable
        ? `<a class="nbc-institution-phone" href="tel:${digits}">${body}</a>`
        : `<span class="nbc-institution-phone">${body}</span>`;
    }).join('');
  }

  function recordMarkup(record) {
    const pdf = `data/nbc-sources/${encodeURIComponent(record.sourcePdf)}#page=${record.page}`;
    const km = record.nameKm && record.nameKm !== record.name
      ? `<p class="nbc-institution-km" lang="km">${escapeHtml(record.nameKm)}</p>` : '';
    const kmAddress = record.addressKm
      ? `<p class="nbc-institution-address-km" lang="km">${escapeHtml(record.addressKm)}</p>` : '';
    const address = record.address
      ? `<div class="nbc-institution-address">${icon('pin')}<p>${escapeHtml(record.address)}</p></div>` : '';
    const contact = record.contact
      ? `<div class="nbc-institution-contact">${contactMarkup(record.contact)}</div>` : '';
    const date = record.sourceDate
      ? ` · ${escapeHtml(t().asAt)} ${escapeHtml(formatDate(record.sourceDate))}` : '';
    return `<article class="nbc-institution">
      <div class="nbc-institution-top">
        <h3>${escapeHtml(record.name)}</h3>
        <span class="nbc-institution-number">${escapeHtml(record.no)}</span>
      </div>
      ${km}
      <span class="nbc-institution-category">${escapeHtml(record.category)}</span>
      ${address}${kmAddress}${contact}
      <a class="nbc-institution-source" href="${pdf}" target="_blank" rel="noopener noreferrer">${escapeHtml(record.sourcePdf)} · ${escapeHtml(t().page)} ${record.page}${date} ↗</a>
    </article>`;
  }

  function renderCategories() {
    const counts = new Map();
    for (const record of state.institutions) counts.set(record.category, (counts.get(record.category) || 0) + 1);
    const chips = [
      ['all', t().all, state.institutions.length],
      ...[...counts.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([key, count]) => [key, key, count])
    ];
    categoryBar.innerHTML = chips.map(([key, label, count]) => {
      const active = key === state.category;
      return `<button class="nbc-chip${active ? ' selected' : ''}" data-category="${escapeHtml(key)}" aria-pressed="${active}">${escapeHtml(label)}<span class="nbc-chip-count">${count}</span></button>`;
    }).join('');
  }

  function renderRecords() {
    const query = state.query.trim().toLocaleLowerCase();
    const found = state.institutions.filter(record =>
      (state.category === 'all' || record.category === state.category) && matches(record, query));
    const shown = found.slice(0, state.shown);
    results.innerHTML = shown.length
      ? `<div class="nbc-institution-grid">${shown.map(recordMarkup).join('')}</div>`
      : `<p class="nbc-source-empty">${escapeHtml(t().empty)}</p>`;
    status.innerHTML = query || state.category !== 'all'
      ? `<strong>${found.length}</strong> ${escapeHtml(t().matched)}`
      : escapeHtml(t().total(state.institutions.length));
    moreButton.hidden = shown.length >= found.length;
    moreButton.textContent = t().showMore;
  }

  function renderPages() {
    const query = state.query.trim().toLocaleLowerCase();
    const found = state.pages.filter(page =>
      !query || `${page.Category} ${page['Extracted text']}`.toLocaleLowerCase().includes(query));
    const grouped = new Map();
    for (const page of found) {
      const key = page['Source PDF'];
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(page);
    }
    results.innerHTML = found.length
      ? [...grouped.values()].map(group => {
        const first = group[0];
        const links = group.map(page => `<a href="data/nbc-sources/${encodeURIComponent(page['Source PDF'])}#page=${Number(page.Page)}" target="_blank" rel="noopener noreferrer">${escapeHtml(t().page)} ${Number(page.Page)} ↗</a>`).join('');
        return `<article class="nbc-page"><div><h3>${escapeHtml(first.Category)}</h3><p>${escapeHtml(first['Source date'])}</p></div><div class="nbc-page-links">${links}</div></article>`;
      }).join('')
      : `<p class="nbc-source-empty">${escapeHtml(t().pageEmpty)}</p>`;
    status.innerHTML = query
      ? `<strong>${found.length}</strong> ${escapeHtml(t().matched)}`
      : escapeHtml(t().total(state.institutions.length));
    moreButton.hidden = true;
  }

  function render() {
    if (state.mode === 'pages') renderPages(); else renderRecords();
    clearButton.hidden = !state.query;
    modeButtons.forEach(button => {
      const active = button.dataset.mode === state.mode;
      button.classList.toggle('selected', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function applyCopy() {
    $('#nbc-eyebrow').textContent = t().eyebrow;
    $('#nbc-sources-title').textContent = t().heading;
    $('#nbc-description').textContent = t().description;
    $('#nbc-notice').textContent = t().notice;
    $('#nbc-download-records').textContent = t().downloadRecords;
    $('#nbc-download-pages').textContent = t().downloadPages;
    $('#nbc-search-label').textContent = t().searchLabel;
    $('#nbc-records-tab').textContent = t().records;
    $('#nbc-pages-tab').textContent = t().pages;
    $('#source-mode').setAttribute('aria-label', t().mode);
    categoryBar.setAttribute('aria-label', t().filter);
    clearButton.setAttribute('aria-label', t().clear);
    searchInput.placeholder = t().placeholder;
    moreButton.textContent = t().showMore;
  }

  searchInput.addEventListener('input', event => {
    state.query = event.target.value;
    state.shown = PAGE_SIZE;
    render();
  });

  clearButton.addEventListener('click', () => {
    state.query = '';
    searchInput.value = '';
    state.shown = PAGE_SIZE;
    render();
    searchInput.focus();
  });

  categoryBar.addEventListener('click', event => {
    const chip = event.target.closest('[data-category]');
    if (!chip) return;
    state.category = chip.dataset.category;
    state.shown = PAGE_SIZE;
    renderCategories();
    render();
  });

  moreButton.addEventListener('click', () => {
    state.shown += PAGE_SIZE;
    renderRecords();
  });

  modeButtons.forEach(button => button.addEventListener('click', () => {
    state.mode = button.dataset.mode;
    state.shown = PAGE_SIZE;
    render();
  }));

  document.addEventListener('bankbook:language', event => {
    state.lang = event.detail === 'km' ? 'km' : 'en';
    applyCopy();
    renderCategories();
    render();
  });

  state.lang = document.documentElement.lang === 'km' ? 'km' : 'en';
  applyCopy();

  Promise.all([
    fetch('data/nbc-institutions.json').then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    }),
    fetch('data/nbc-source-pages.json').then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
  ]).then(([institutions, pages]) => {
    state.institutions = prepare(institutions);
    state.pages = pages;
    renderCategories();
    render();
  }).catch(error => {
    status.textContent = t().failed;
    console.error('NBC source records:', error);
  });
})();
