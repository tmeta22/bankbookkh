/**
 * Parses the NBC supervision PDFs in data/nbc-sources/ into structured
 * institution records that the site can search as data.
 *
 * The PDFs are tables, so the parse is geometric rather than textual: every text
 * run is placed by its x/y position, grouped into rows, then assigned to a
 * column using the table grid measured from the source documents.
 *
 * Run with:  npm --prefix tools run extract
 */
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const sourceDir = new URL('data/nbc-sources/', root);

/**
 * Left edge (PDF points) of each table column, measured from the documents.
 * Boundaries between columns are the midpoints between neighbouring edges.
 */
const LAYOUTS = {
  'Audit_Firms.pdf': { no: 24, name: 40, address: 212, contact: 740 },
  'CBC.pdf': { no: 47, name: 60, address: 212, contact: 716 },
  'Leasing_Institutions.pdf': { no: 40, name: 60, address: 240, contact: 692 },
  'MDIs.pdf': { no: 36, name: 60, address: 272, contact: 672 },
  'MFIs.pdf': { no: 32, name: 48, address: 264, contact: 704 },
  'Precious_Metals_Stones_Companies.pdf': { no: 68, name: 92, address: 256, contact: 620 },
  'RCIs.pdf': { no: 44, name: 60, address: 272, contact: 680 },
  'Rep_Offices.pdf': { no: 80, name: 96, address: 364, contact: 720 },
  'Third_Party_Processors.pdf': { no: 96, name: 112, address: 312, contact: 664 },
  'feb_MFI.pdf': { no: 60, name: 72, address: 340, contact: 732 },
  'feb_commercial_bank.pdf': { no: 80, name: 92, address: 356, contact: 744 },
  'feb_legal_entities.pdf': { no: 64, name: 76, address: 380, contact: 748 },
};

const KHMER = /[\u1780-\u17FF]/;
const KHMER_DIGITS = { '០': '0', '១': '1', '២': '2', '៣': '3', '៤': '4', '៥': '5', '៦': '6', '៧': '7', '៨': '8', '៩': '9' };
const normaliseDigits = value => value.replace(/[០-៩]/g, char => KHMER_DIGITS[char]);
const clean = value => value.replace(/\s+/g, ' ').trim();

/**
 * Column boundaries. A cell starts at its column's left edge, so the boundary
 * between two columns sits just before the next column's edge: text that
 * overflows its own cell (a wrapped name, an address continuation) therefore
 * stays with the column it began in.
 */
function boundaries(layout) {
  const edges = [layout.no, layout.name, layout.address, layout.contact];
  return {
    no: (edges[0] + edges[1]) / 2,
    name: edges[2] - 12,
    address: edges[3] - 12,
  };
}

function columnOf(x, bounds) {
  if (x < bounds.no) return 'no';
  if (x < bounds.name) return 'name';
  if (x < bounds.address) return 'address';
  return 'contact';
}

/** Group text runs into visual rows, then split each row into table cells. */
function readRows(items, bounds) {
  const rows = [];
  for (const item of items) {
    if (!item.str.trim()) continue;
    let row = rows.find(candidate => Math.abs(candidate.y - item.y) <= 4);
    if (!row) { row = { y: item.y, items: [] }; rows.push(row); }
    row.items.push(item);
  }
  rows.sort((a, b) => b.y - a.y);
  for (const row of rows) {
    row.items.sort((a, b) => a.x - b.x);
    row.cells = { no: '', name: '', address: '', contact: '' };
    let previous = null;
    for (const item of row.items) {
      const column = columnOf(item.x, bounds);
      if (previous) {
        const gap = item.x - (previous.x + previous.w);
        // Runs inside one word touch; a wider gap is a real word space.
        if (gap > 1 && previous.w > 0 && item.w > 0) row.cells[column] += ' ';
      }
      row.cells[column] += item.str;
      previous = item;
    }
    for (const key of Object.keys(row.cells)) row.cells[key] = clean(row.cells[key]);
    // A few tables put a bank heading in the number column; it belongs to the name.
    if (row.cells.no && !/^\d{1,3}$/.test(normaliseDigits(row.cells.no).trim())) {
      row.cells.name = row.cells.name ? `${row.cells.no} ${row.cells.name}` : row.cells.no;
      row.cells.no = '';
    }
  }
  return rows;
}

const HEADER_CELLS = [
  /^(no\.?|n\.?o\.?)$/i,
  /^(.*\s)?name(\s.*)?$/i,
  /address/i,
  /contact/i,
  /ល\.រ/,
  /ឈ្មោះ/,
  /អាសយដ្ឋាន/,
  /ឈលខទូរស័ព្ទ/,
];

function isHeaderRow(row) {
  const hits = Object.values(row.cells).filter(value => value && HEADER_CELLS.some(pattern => pattern.test(value)));
  return hits.length >= 2;
}

const scriptOf = text => (KHMER.test(text) ? 'km' : /[A-Za-z]/.test(text) ? 'en' : 'other');

/**
 * Long names overflow their cell and wrap into the address column, leaving the
 * closing bracket behind. Move that fragment back onto the name.
 */
function repairOverflow(name, address) {
  const open = (name.match(/\(/g) || []).length - (name.match(/\)/g) || []).length;
  if (open <= 0 || !address) return [name, address];
  const words = address.split(' ');
  let moved = 0;
  while (moved < words.length && moved < 4) {
    const fragment = words.slice(0, moved + 1).join(' ');
    if (!fragment.includes(')')) { moved++; continue; }
    const rest = words.slice(moved + 1).join(' ');
    return [`${name} ${fragment}`, rest];
  }
  return [name, address];
}

function newRecord() {
  return { nameEn: '', nameKm: '', addressEn: '', addressKm: '', contacts: [], no: null, page: 1 };
}

const isComplete = record => Boolean(record.nameEn && record.nameKm);

function addName(record, row, script) {
  const prefix = script === 'km' ? 'Km' : 'En';
  let name = row.cells.name;
  let address = row.cells.address;
  [name, address] = repairOverflow(name, address);
  record[`name${prefix}`] = name;
  if (address) record[`address${prefix}`] = address;
}

function addContact(record, value) {
  if (!value) return;
  if (!record.contacts.includes(value)) record.contacts.push(value);
}

/**
 * A record is one institution: an English line and a Khmer line that share a
 * table band, plus the number and contact printed alongside them.
 */
function buildRecords(rows) {
  const records = [];
  let current = null;

  for (const row of rows) {
    const label = normaliseDigits(row.cells.no).trim();
    const number = /^\d{1,3}$/.test(label) ? Number(label) : null;
    const name = row.cells.name;

    if (name) {
      const script = scriptOf(name);
      if (current && current[`name${script === 'km' ? 'Km' : 'En'}`]) current = null;
      if (!current) { current = newRecord(); records.push(current); }
      addName(current, row, script);
      if (number !== null) current.no = number;
      addContact(current, row.cells.contact);
      continue;
    }

    // A row without a name carries the number, the contact, or a wrapped line.
    if (number !== null && current && isComplete(current)) {
      current = newRecord();
      records.push(current);
    }
    if (!current) { current = newRecord(); records.push(current); }
    if (number !== null) current.no = number;
    addContact(current, row.cells.contact);
    if (row.cells.address) {
      const key = scriptOf(row.cells.address) === 'km' ? 'addressKm' : 'addressEn';
      current[key] = current[key] ? `${current[key]} ${row.cells.address}` : row.cells.address;
    }
  }
  return records;
}

const pages = JSON.parse(readFileSync(new URL('data/nbc-source-pages.json', root), 'utf8'));
const meta = new Map();
for (const page of pages) {
  if (!meta.has(page['Source PDF'])) meta.set(page['Source PDF'], { category: page.Category, date: page['Source date'] });
}

const files = readdirSync(new URL('.', sourceDir)).filter(name => name.endsWith('.pdf')).sort();
const institutions = [];

for (const file of files) {
  const layout = LAYOUTS[file];
  if (!layout) { console.warn(`skip ${file}: no measured column layout`); continue; }
  const bounds = boundaries(layout);
  const bytes = new Uint8Array(readFileSync(new URL(file, sourceDir)));
  const doc = await getDocument({ data: bytes, useSystemFonts: true }).promise;
  const info = meta.get(file) || { category: file.replace(/\.pdf$/, ''), date: '' };
  const collected = [];

  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
    const page = await doc.getPage(pageNumber);
    const content = await page.getTextContent();
    const items = content.items.map(item => ({
      x: item.transform[4], y: item.transform[5], w: item.width || 0, str: item.str,
    }));
    const rows = readRows(items, bounds);

    // Everything up to and including the last header row is title material.
    let start = 0;
    for (let i = rows.length - 1; i >= 0; i--) {
      if (isHeaderRow(rows[i])) { start = i + 1; break; }
    }
    const pageRecords = buildRecords(rows.slice(start));
    for (const record of pageRecords) record.page = pageNumber;
    collected.push(...pageRecords);
  }

  let counter = 0;
  for (const record of collected) {
    counter++;
    const name = record.nameEn || record.nameKm;
    if (!name || !/[A-Za-z\u1780-\u17FF]/.test(name)) continue;
    institutions.push({
      id: `${file.replace(/\.pdf$/, '')}-${counter}`,
      no: counter,
      name,
      nameKm: record.nameKm,
      address: record.addressEn,
      addressKm: record.addressKm,
      contact: record.contacts.join(' · '),
      category: info.category,
      sourcePdf: file,
      sourceDate: info.date,
      page: record.page,
      pages: doc.numPages,
    });
  }
  console.log(`${file.padEnd(36)} ${String(collected.length).padStart(3)} records, ${doc.numPages} page(s)`);
}

institutions.sort((a, b) => a.category.localeCompare(b.category) || a.sourcePdf.localeCompare(b.sourcePdf) || a.no - b.no);
writeFileSync(new URL('data/nbc-institutions.json', root), JSON.stringify(institutions, null, 1));

const header = ['Category', 'No.', 'Name (English)', 'Name (Khmer)', 'Address', 'Address (Khmer)', 'Contact', 'Source PDF', 'Source date', 'Source page'];
const csvRows = institutions.map(item => [
  item.category, item.no, item.name, item.nameKm, item.address, item.addressKm, item.contact, item.sourcePdf, item.sourceDate, item.page,
]);
const csv = '\uFEFF' + [header, ...csvRows]
  .map(row => row.map(value => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
  .join('\r\n');
writeFileSync(new URL('data/nbc-institutions.csv', root), csv);

console.log(`\n${institutions.length} institutions -> data/nbc-institutions.json, data/nbc-institutions.csv`);
