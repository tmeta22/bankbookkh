// These results link to the supplied documents; extracted page text is not a
// verified, institution-by-institution directory.
(async () => {
  const input = document.querySelector('#source-search');
  const results = document.querySelector('#source-results');
  const status = document.querySelector('#source-results-status');
  const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  try {
    const response = await fetch('data/nbc-source-pages.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const pages = await response.json();
    const render = () => {
      const query = input.value.trim().toLocaleLowerCase();
      const matches = pages.filter(page => !query || `${page.Category} ${page['Extracted text']}`.toLocaleLowerCase().includes(query));
      const grouped = new Map();
      for (const page of matches) {
        const filename = page['Source PDF'];
        if (!grouped.has(filename)) grouped.set(filename, []);
        grouped.get(filename).push(page);
      }
      status.textContent = query ? `${grouped.size} documents match. Open a page to see the source.` : `${grouped.size} source documents`;
      results.innerHTML = [...grouped.values()].map(group => {
        const first = group[0];
        const pdf = `data/nbc-sources/${encodeURIComponent(first['Source PDF'])}`;
        const links = group.map(page => `<a href="${pdf}#page=${Number(page.Page)}" target="_blank" rel="noopener noreferrer">Page ${Number(page.Page)} ↗</a>`).join('');
        return `<article class="nbc-source-item"><div><h3>${escape(first.Category)}</h3><p>Source date: ${escape(first['Source date'])}</p></div><div class="nbc-source-links">${links}</div></article>`;
      }).join('') || '<p class="nbc-source-empty">No documents found. Try another search or browse the original PDFs.</p>';
    };
    input.addEventListener('input', render);
    render();
  } catch (error) {
    status.textContent = 'Documents could not be loaded. Refresh the page to try again.';
    console.error('NBC source documents:', error);
  }
})();
