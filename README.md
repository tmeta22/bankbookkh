# Bankbook — Cambodia Commercial Bank Directory

## Project goal
A polished, responsive, bilingual frontend for exploring Cambodia's commercial banks. The design uses warm ivory, forest green, editorial typography, and a lightweight SVG banking illustration.

## Features
- **55 banks** (44 locally incorporated, 11 foreign branches) from the National Bank of Cambodia's List of Commercial Banks (as at 31 August 2026)
- Bilingual interface: English/Khmer with localStorage persistence
- Official Khmer bank names shown alongside English names
- Instant search across names, Khmer names, addresses, phone numbers
- Filter by bank type: Locally incorporated / Foreign branches
- Save banks locally (localStorage with session fallback)
- Sort: A–Z, Z–A, directory order
- Grid/list views with pagination (12 per page)
- Accessible detail dialogs: address, phone, Google Maps link, save action
- Click-to-call phone numbers
- Filter-aware UTF-8 CSV export
- Full removal history: banks removed from the NBC list stay visible in a dedicated, downloadable history section with last-listed and removal dates
- Complete icon set (SVG + multi-size ICO/PNG, Apple touch, maskable, Windows tile), installable web manifest, and 1200×630 Open Graph/Twitter artwork
- Keyboard shortcuts (`/` to search), full accessibility support
- Responsive: desktop, tablet, mobile

## Data source
National Bank of Cambodia — List of Commercial Banks  
https://www.nbc.gov.kh/english/supervision/commercial_banks.php  
Directory date: 31 August 2026

The August 2026 NBC export refreshes the official Khmer legal names and expands them with their registered suffixes (for example, `ធនាគារ អេស៊ីលីដា ភីអិលស៊ី` for ACLEDA Bank Plc.). English names, addresses, and contact numbers are unchanged from the previous listing apart from minor source formatting; the directory keeps the cleaned English addresses used by the site.

*This data has not been independently verified. This site is not affiliated with or endorsed by the NBC.*

## Data updates
### 31 August 2026
- Refreshed the directory from the NBC `Commercial_Banks.csv` export.
- Updated all Khmer bank names to the NBC's current official legal names.
- Removed three banks no longer present in the NBC list: CCU Commercial Bank PLC., Heng Feng (Cambodia) Bank PLC., and HH Bank (Cambodia) PLC.
- Confirmed the remaining 55 banks, their addresses, and phone numbers; the directory date is now 31 August 2026.
- Recalculated the totals shown in the interface (55 total / 44 local / 11 foreign branches) and refreshed all UI/export date references.
- Added a removal history section and `bankbook-removal-history.csv` so banks that leave the NBC list remain documented with their last-listed and removal dates.

## Removal history
Banks are never silently deleted from the project. When a bank leaves the NBC list, its record is moved to `bankbook-removal-history.csv` and shown in the **Removed banks** section at the bottom of the directory. The history is also downloadable from that section.

| Bank | Type | Last listed | Removed |
| --- | --- | --- | --- |
| CCU Commercial Bank PLC. | Locally incorporated | 31 May 2026 | 31 August 2026 |
| Heng Feng (Cambodia) Bank PLC. | Locally incorporated | 31 May 2026 | 31 August 2026 |
| HH Bank (Cambodia) PLC. | Locally incorporated | 31 May 2026 | 31 August 2026 |

Removal history is tracked from the 31 May 2026 directory onward, the first CSV-based snapshot in this repository. Older revisions of the NBC list that predate this project's data files are not included.

## Files
- `index.html` — semantic application shell, metadata, SVG hero illustration
- `css/style.css` — design tokens, layouts, cards, dialogs, responsive rules
- `js/main.js` — data loading, validation, UI rendering, localization, event handling, search, export, persistence
- `bankbook-cambodia-directory.csv` — active directory data (55 records, 2026-08-31)
- `bankbook-removal-history.csv` — removed-bank records with last-listed and removal dates
- `favicon.ico`, `favicon.svg` — legacy and scalable favicons
- `apple-touch-icon.png` — 180×180 iOS home-screen icon
- `site.webmanifest` — install metadata, standard and maskable app icons
- `browserconfig.xml` — Windows tile configuration
- `og-image.png` — 1200×630 Open Graph/Twitter card
- `og-square.png` — 1200×1200 square social card
- `assets/icons/` — 16/32/48/192/512px PNG icons, maskable variants, Safari pinned tab, Windows tile
- `assets/brand/` — master SVGs, social-card layouts, and the asset build script
- `tests/smoke.html`, `tests/smoke.js` — browser-based interaction checks
- `.github/workflows/deploy.yml` — GitHub Pages deployment

## Brand assets
The favicon, app icons, and social cards share a single bank-mark design in the site's forest green (`#173f35`), ivory (`#f8f8e9`), and gold (`#ac8c53`) palette. Small icons use simplified, thicker geometry so the mark stays legible at 16px.

Social metadata is configured for the live GitHub Pages URL:
- Canonical/OG URL: `https://tmeta22.github.io/bankbookkh/`
- Open Graph/Twitter image: `https://tmeta22.github.io/bankbookkh/og-image.png` (1200×630)
- Square variant for social posts: `og-square.png` (1200×1200)

Rebuild everything after changing the mark or card copy:
```bash
node assets/brand/build-assets.js
```
The script renders the master SVGs at 512px, downsizes the larger icons with high-quality resampling, writes the multi-size `favicon.ico`, and renders both social cards. It requires Chrome or Edge (set `CHROME_PATH` if it is not in a standard location); on Windows it uses PowerShell/System.Drawing for resizing.

## Local development
Serve over HTTP(S) (required for fetch-based data loading):
```bash
npx serve .
# or
python3 -m http.server 8000
```

## Deployment
Push to `main` branch triggers GitHub Actions workflow to deploy to GitHub Pages. Live site: https://tmeta22.github.io/bankbookkh/

## Data model
Directory CSV columns: Bank name (English), Bank name (Khmer), Address, Phone numbers, Type, Directory date  
Runtime object: `{id, name, km, address, phone, type}` where `type` is `"local"` or `"branch"` and `id` is the 0-based directory index.

Removal history CSV columns: Bank name (English), Bank name (Khmer), Address, Phone numbers, Type, Last listed, Removed date. Runtime object: `{name, km, address, phone, type, lastListed, removed}`.

The NBC export also includes Khmer-language addresses; the application currently displays the English address and the official Khmer bank name.

## localStorage keys
- `bankbook-saved`: JSON array of saved bank indices
- `bankbook-language`: `"en"` or `"km"`

## Limitations
- Not an official NBC product
- All addresses are in Phnom Penh (not a retail branch/ATM locator)
- Initial badges are directory identifiers, not official bank logos
- Saved banks are browser/device local only and use directory indices, so a future data refresh may shift which bank a saved index refers to
- Removal history covers banks removed since the 31 May 2026 CSV snapshot; earlier NBC revisions are not tracked
- No backend, analytics, or external tracking

## License
MIT
