# Bankbook — Cambodia Commercial Bank Directory

## Project goal
Refactor the uploaded commercial bank directory into a polished, responsive, bilingual frontend that makes Cambodia’s bank information easier to find and use. The design uses warm ivory, forest green, editorial typography, and a lightweight original SVG banking illustration.

## Completed features
- Complete redesigned header, hero, statistics, navigation, filters, cards, footer, and dialogs.
- Preserves all 58 supplied records: 47 locally incorporated banks and 11 foreign branches.
- English/Khmer bank names, supplied addresses, phone numbers, bank classifications, and source date retained.
- English/Khmer interface switch, persisted locally.
- Instant case-insensitive search across names, Khmer names, addresses, phone numbers, and generated short identifiers (including ABA).
- Bank-type filters and saved-bank filtering with accurate counts.
- Alphabetical/reverse-alphabetical/source-order sorting.
- Grid/list views, 12-record pagination, result counts, empty-state reset, loading/error recovery.
- Saved banks persisted in localStorage, with a session-only fallback if browser storage is unavailable.
- Native accessible details dialog: complete address, phone numbers, Google Maps search, save action, Escape/backdrop/close-button dismissal.
- Click-to-call primary phone numbers. Ranged numbers use their first base number on cards; abbreviated or ranged entries remain text in the detail dialog rather than inventing additional phone numbers.
- Filter-aware UTF-8 CSV export generated entirely in the browser, including original names and all original phone entries.
- Keyboard search shortcut (`/`), focus styling, labeled controls, live result announcements, semantic markup, reduced-motion support.
- Responsive desktop/tablet/mobile layouts, including a one-column card layout on small phones.
- About/source disclosure: independent directory, supplied source attribution, unverified data/date, explanation of legal incorporation vs ownership, local-only saved state, and nonofficial initial badges.

## Functional entry URIs
| Path | Function | Parameters |
| --- | --- | --- |
| `/` or `/index.html` | Main redesigned directory | None |
| `/#directory` | Direct link to search, filters and bank listings | Hash anchor only |
| `/original.html` | Untouched uploaded source directory | None |
| `/tests/smoke.html` | Browser interaction regression checks | None |

Search, filters, selected page, display mode, and open dialog are in-memory state; they are not URL parameters. Language and saved banks persist on the current browser/device.

## Files and architecture
- `index.html`: semantic application shell and SVG hero illustration.
- `css/style.css`: design tokens, layouts, cards, dialogs, responsive rules.
- `js/main.js`: data loading, validation, UI rendering, localization, event handling, search, export and persistence.
- `original.html`: original user upload, preserved without alteration as the single data source.
- `tests/smoke.html`, `tests/smoke.js`: automated browser interaction checks.

At startup, `js/main.js` fetches `original.html`, extracts the literal `banks` JSON array, parses it with `JSON.parse`, and validates every row. It does **not** execute or inject the source page’s scripts or styles. Preserving the upload avoids manual transcription changes. Serve this project over HTTP(S); opening `index.html` with a `file://` URL is not supported by the fetch-based data loader. The `original.html` asset must remain available when publishing.

## Data model and storage
Original row structure:
```text
[English name, Khmer name, full address, phone string, "local" | "branch"]
```
Runtime bank object:
```text
{id: original zero-based index, name, km, address, phone, type}
```
Client state includes banks, query, bank-type filter, saved-only flag, saved ID Set, sort, view, page (size 12), and language.

localStorage keys:
- `bankbook-saved`: JSON array of original record indices.
- `bankbook-language`: `"en"` or `"km"`.

No database, Table API, authentication, backend, analytics, or server upload storage is used. No visitor data is sent to a custom service. Google Fonts loads typography; Google Maps and NBC links open externally when clicked. CSV files are built with a browser Blob and temporary object URL.

## Data provenance and limitations
The supplied file attributes its data to the National Bank of Cambodia’s List of Commercial Banks as at **31 May 2026**. Neither this attribution nor the date or records have been independently verified. This website is not an official NBC product or an endorsement of any bank. All supplied addresses are in Phnom Penh; this is not a retail-branch/ATM locator. Generated initial badges are directory identifiers, not official bank logos.

## Public URLs and external services
- Production URL: not yet published/provided.
- Supplied input: https://www.genspark.ai/api/files/s/uWEmSP75 (copied locally; not a runtime dependency).
- Data asset: same-origin `original.html`.
- No backend or public data API endpoints.
- NBC website: https://www.nbc.gov.kh/
- Map search: https://www.google.com/maps/search/?api=1&query=…
- Fonts: https://fonts.googleapis.com and https://fonts.gstatic.com.

## Validation completed
- Main page browser console: no errors/output.
- Desktop screenshot at 1280×800: reviewed header, hero, stats, filters and cards; no visible overlap/clipping.
- Mobile screenshot at 390px viewport: reviewed responsive layout and cards; no horizontal overflow or overlapping content.
- All 26 browser interaction checks passed: record/category counts, English/Khmer/phone/alias search, filters, empty recovery, view switching, sorting, pagination, bookmarks and persistence, saved navigation, detail contents and closing, language switching, complete and filtered CSV generation, source disclosure, and horizontal overflow.

The regression test temporarily changes UI and local saved/language state, then restores the original saved membership and language on success. It prevents actual CSV downloads while inspecting their Blob contents.

## Not yet implemented
- Independently verified or automatically refreshed regulatory data.
- Official bank logos, bank websites, service comparisons, interest-rate data, and retail-branch/ATM locations (not provided by the source).
- Account-based or cross-device saved banks.
- Backend/admin content management.
- Shareable query/filter/detail URLs.
- Automated screen-reader or comprehensive cross-browser testing.

## Recommended next steps
1. Verify all records and source date against the current official NBC directory before relying on them publicly.
2. Have a native Khmer editor review interface translations.
3. If frequent updates are needed, migrate the preserved dataset to a dedicated JSON file and introduce stable IDs before reordering records; saved IDs currently refer to original positions.
4. Optionally add verified bank websites and official assets with appropriate permission.
5. Publish through the Publish tab when ready. No Hosted Deploy has been performed during this refactor.
