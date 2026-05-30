# MISSPELLED

Find eBay bargains by searching for listings with typos in the title. Sellers who misspell their listings get fewer views, which means lower prices for you.

MISSPELLED generates hundreds of common misspellings for any search term, then builds eBay search URLs that find those overlooked listings.

## How to use it

**1. Enter a search term**

Type any item, brand, or model into the search box — e.g. `mamiya rb67`, `patek philippe`, or `iphone 14 pro max`. Multi-word queries are split into separate tokens, and typos are generated for each word independently.

**2. Pick your typo types**

Choose from 17 misspelling strategies:

| Type | Example |
|------|---------|
| Missing letter | `canon` → `anon` |
| Swapped letters | `canon` → `acnon` |
| Doubled letter | `canon` → `ccanon` |
| Neighbor key | `canon` → `xanon` |
| Phonetic swap | `canon` → `kanon` |
| Vowel swap | `mamiya` → `memiya` |
| Collapsed doubles | `philippe` → `philipe` |
| UK/US spelling | `aluminum` → `aluminium` |
| Visual lookalikes | `rn` → `m` (OCR errors) |
| Number/letter | `0` ↔ `o`, `1` ↔ `l` |
| …and more | spacing, plurals, hyphens, case |

**3. Set eBay filters**

Narrow results by region (10 eBay sites), category, price range, condition, listing type, and sort order. Supports QWERTY, QWERTZ, and AZERTY keyboard layouts for accurate neighbor-key typos.

**4. Select and search**

Review the generated variants, toggle individual typos on or off, add custom misspellings, then hit search. The app automatically splits long queries across multiple eBay searches (up to 25 tabs, 250 characters each) and warns if results would be truncated.

## Running locally

The whole app is a single self-contained `index.html` (~73 KB). No build step needed.

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Or with npm:

```bash
npm install
npm run serve
# http://localhost:8765
```

## Deploying

Drop `index.html` on any static host — GitHub Pages, Netlify, S3, whatever. React 18 and Lucide icons are loaded from [esm.sh](https://esm.sh) at runtime via an import map, so there's nothing to bundle.

For GitHub Pages, the quickest path:

```bash
gh repo create misspelled --public --source=. --push
gh repo edit --enable-pages --pages-branch main
```

Your site goes live at `https://<username>.github.io/misspelled/`.

## Modifying the source

Edit `MisspelledApp.jsx`, then rebuild:

```bash
npm run build
```

This compiles the JSX with esbuild and splices it into `index.html`.

## Good to know

- **Popup blockers** may interfere when opening many tabs at once. The fallback link list below the button works one at a time.
- **eBay rate-limits** searches from the same IP, so avoid firing all 25 tabs in rapid succession across many searches.
- **esm.sh** is a third-party CDN. If it goes down, the page won't load. You can self-host React from a `/vendor` folder if needed.
