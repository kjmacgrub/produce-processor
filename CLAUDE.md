# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start Vite dev server at http://localhost:5173
npm run build      # Build for production (outputs to dist/)
npm run preview    # Preview production build locally
```

No test framework or linter is configured — testing is manual.

## Architecture

**Single-page React app** for iPad-based produce processing with real-time Firebase sync.

- **`src/App.jsx`** — Monolithic main component (~3,700 lines). Contains all state, Firebase listeners, video/photo logic, CSV/PDF parsing, and UI rendering. All styles are inline JSX objects (no CSS modules).
- **`src/firebase.js`** — Firebase init; exports `db` (Realtime Database) and `storage` (Firebase Storage).
- **`src/main.jsx`** — React entry point.

**Key libraries:** React 19, Firebase 12, Lucide React (icons), Vite 7. PDF parsing uses pdf.js via CDN.

## Firebase Data

Realtime Database paths:
- `items` — active produce items to process
- `completedItems` — finished items (auto-cleaned after 10 days)
- `completionPhotos` — base64 photos stored in DB
- `timingData`, `timingEvents`, `historicalTimes` — processing metrics
- `pdfDate`, `totalCases` — metadata from loaded CSV

Storage paths:
- `produce-videos/{SKU}.webm` — instruction videos
- `produce-pdfs/{YYYY-MM-DD}.csv` — daily produce data files

## Device Modes

iPad and desktop behave differently — detected via:
```javascript
const isIPad = /iPad|Macintosh/.test(navigator.userAgent) && 'ontouchend' in document;
```
- **iPad:** Processing workflow (begin/complete items, record videos, capture photos)
- **Desktop:** Data management (load CSVs, view stats, reload data)

## Data Flow

1. Admin uploads a dated CSV to Firebase Storage
2. App fetches CSV, parses it with a custom regex parser (no CSV library), loads items into Firebase Realtime DB
3. Real-time `onValue()` listeners sync items across all connected devices
4. Videos and completion photos are stored in Firebase Storage/DB and cached locally in IndexedDB

## Environment

Firebase credentials go in `.env` (git-ignored). See `.env.example` for required `VITE_FIREBASE_*` keys.

Deployed on Netlify; `netlify.toml` sets build command and publish directory.
