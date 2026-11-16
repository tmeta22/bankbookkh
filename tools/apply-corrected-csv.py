#!/usr/bin/env python3
"""Overlay user-supplied supervision CSVs on the PDF-derived records."""
import csv
import difflib
import json
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / 'data'
records_path = DATA / 'nbc-institutions.json'
pages_path = DATA / 'nbc-source-pages.json'
records = json.loads(records_path.read_text(encoding='utf-8'))
pages = json.loads(pages_path.read_text(encoding='utf-8'))
# Preserve previously applied place-name repairs in the two lists without CSVs.
repairs = {'េណ្ឌចំការមន': 'ខណ្ឌចំការមន', 'រាជធានីភនំលពញ': 'រាជធានីភ្នំពេញ', 'រាជធានីភនាំលរញ': 'រាជធានីភ្នំពេញ', 'រាជធានីភនំផេញ': 'រាជធានីភ្នំពេញ', 'រាជធានីភនំនេញ': 'រាជធានីភ្នំពេញ', 'រាជធាន៊ីភនំលេញ': 'រាជធានីភ្នំពេញ', 'រាជ្ ធានីភនំខេញ': 'រាជធានីភ្នំពេញ', 'រាជ្ធានីភំនខេញ': 'រាជធានីភ្នំពេញ', 'រាជ្ធានីភនំខេញ': 'រាជធានីភ្នំពេញ', 'សង្កាត់ទខនលបាសាក់': 'សង្កាត់ទន្លេបាសាក់', 'សង្កាត់ទលនាបាសាក់': 'សង្កាត់ទន្លេបាសាក់', 'ខណ្ឌទួលលគាក': 'ខណ្ឌទួលគោក', 'ខណ្ឌដ្ូនលពញ': 'ខណ្ឌដូនពេញ', 'ខណ្ឌ៧មររា': 'ខណ្ឌ៧មករា', 'ខណ្ឌសសនសុខ': 'ខណ្ឌសែនសុខ', 'កុងបាត់ដាំបង': 'ក្រុងបាត់ដំបង', 'លខតតបាត់ដាំបង': 'ខេត្តបាត់ដំបង', 'លខតតកាំរត': 'ខេត្តកំពត'}
by_pdf = defaultdict(list)
for record in records:
    if record['sourcePdf'] in ('MDIs.pdf', 'MFIs.pdf'):
        for key in ('nameKm', 'addressKm'):
            for original, corrected in repairs.items():
                record[key] = record[key].replace(original, corrected)
    by_pdf[record['sourcePdf']].append(record)


def normalize(value):
    return re.sub(r'[^a-z0-9]', '', value.lower())


def bilingual(value):
    parts = value.split(' / ', 1)
    if len(parts) == 2:
        return parts[0].strip(), parts[1].strip()
    if re.search(r'[\u1780-\u17ff]', value):
        return value.strip(), ''
    return '', value.strip()


for file in sorted((DATA / 'nbc-corrected-csv').glob('*.csv')):
    pdf = file.stem + '.pdf'
    old = by_pdf[pdf]
    if not old:
        raise ValueError(f'No matching PDF records: {pdf}')
    with file.open(encoding='utf-8-sig', newline='') as source:
        rows = list(csv.reader(source))[1:]
    corrected = []
    page_lines = defaultdict(list)
    for row in rows:
        if len(row) != 4:
            raise ValueError(f'Expected four columns in {file}: {row!r}')
        number, name, address, contact = row
        name_km, name_en = bilingual(name)
        address_km, address_en = bilingual(address)
        if not name_en and not name_km:
            raise ValueError(f'Missing name in {file}: {row!r}')
        key = normalize(name_en)
        best = max(old, key=lambda item: difflib.SequenceMatcher(None, key, normalize(item['name'])).ratio())
        score = difflib.SequenceMatcher(None, key, normalize(best['name'])).ratio()
        if score < 0.75:
            raise ValueError(f'Cannot confidently match PDF page for {pdf} row {number}: {name_en}')
        n = int(number)
        corrected.append({**best, 'id': f'{file.stem}-{n}', 'no': n,
                          'name': name_en or name_km, 'nameKm': name_km,
                          'address': address_en, 'addressKm': address_km,
                          'contact': contact})
        page_lines[best['page']].append(' | '.join(row))
    by_pdf[pdf] = corrected
    for page in pages:
        if page['Source PDF'] == pdf:
            page['Extracted text'] = '\n'.join(page_lines[int(page['Page'])])

records = sorted((record for group in by_pdf.values() for record in group),
                 key=lambda item: (item['category'], item['sourcePdf'], item['no']))
records_path.write_text(json.dumps(records, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
pages_path.write_text(json.dumps(pages, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
header = ['Category', 'No.', 'Name (English)', 'Name (Khmer)', 'Address', 'Address (Khmer)', 'Contact', 'Source PDF', 'Source date', 'Source page']
with (DATA / 'nbc-institutions.csv').open('w', encoding='utf-8-sig', newline='') as target:
    writer = csv.writer(target, quoting=csv.QUOTE_ALL, lineterminator='\r\n')
    writer.writerow(header)
    for item in records:
        writer.writerow([item['category'], item['no'], item['name'], item['nameKm'], item['address'], item['addressKm'], item['contact'], item['sourcePdf'], item['sourceDate'], item['page']])
with (DATA / 'nbc-source-pages.csv').open('w', encoding='utf-8-sig', newline='') as target:
    writer = csv.DictWriter(target, fieldnames=['Category', 'Source PDF', 'Source date', 'Page', 'Extracted text'], quoting=csv.QUOTE_ALL, lineterminator='\r\n')
    writer.writeheader()
    writer.writerows(pages)
print(f'Applied {len(list((DATA / "nbc-corrected-csv").glob("*.csv")))} corrected CSVs: {len(records)} records')
