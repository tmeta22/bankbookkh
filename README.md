# Bankbook — Cambodia Commercial Bank Directory

## Project goal
A polished, responsive, bilingual frontend for exploring Cambodia's commercial banks. The design uses warm ivory, forest green, editorial typography, and a lightweight SVG banking illustration.

## Features
- **57 banks** from the National Bank of Cambodia's List of Commercial Banks (as at 31 May 2026)
- Bilingual interface: English/Khmer with localStorage persistence
- Instant search across names, Khmer names, addresses, phone numbers
- Filter by bank type: Locally incorporated / Foreign branches
- Save banks locally (localStorage with session fallback)
- Sort: A–Z, Z–A, directory order
- Grid/list views with pagination (12 per page)
- Accessible detail dialogs: address, phone, Google Maps link, save action
- Click-to-call phone numbers
- Filter-aware UTF-8 CSV export
- Keyboard shortcuts (`/` to search), full accessibility support
- Responsive: desktop, tablet, mobile

## Data source
National Bank of Cambodia — List of Commercial Banks  
https://www.nbc.gov.kh/english/supervision/commercial_banks.php  
Directory date: 31 May 2026

*This data has not been independently verified. This site is not affiliated with or endorsed by the NBC.*

## Files
- `index.html` — semantic application shell and SVG hero illustration
- `css/style.css` — design tokens, layouts, cards, dialogs, responsive rules
- `js/main.js` — data loading, validation, UI rendering, localization, event handling, search, export, persistence
- `bankbook-cambodia-directory.csv` — source data (57 records)
- `.github/workflows/deploy.yml` — GitHub Pages deployment

## Local development
Serve over HTTP(S) (required for fetch-based data loading):
```bash
npx serve .
# or
python3 -m http.server 8000
```

## Deployment
Push to `main` branch triggers GitHub Actions workflow to deploy to GitHub Pages.

## Data model
Original CSV columns: Bank name (English), Bank name (Khmer), Address, Phone numbers, Type, Directory date  
Runtime object: `{id, name, km, address, phone, type}` where `type` is `"local"` or `"branch"`

## localStorage keys
- `bankbook-saved`: JSON array of saved bank indices
- `bankbook-language`: `"en"` or `"km"`

## Limitations
- Not an official NBC product
- All addresses are in Phnom Penh (not a retail branch/ATM locator)
- Initial badges are directory identifiers, not official bank logos
- Saved banks are browser/device local only
- No backend, analytics, or external tracking

## License
MIT