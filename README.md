# MISSPELLED

A single-file React app for finding misspelled eBay listings. Drop the HTML anywhere static and it just works.

The whole thing is one self-contained `index.html` (~58 KB). React 18, ReactDOM, and lucide-react are pulled from esm.sh at runtime via an import map. No build step, no dependencies, no package.json.

## Deploy to GitHub Pages

Three options depending on how minimal you want the repo.

### Option 1: Dedicated repo (simplest)

```bash
mkdir misspelled && cd misspelled
git init
cp /path/to/index.html .
git add index.html
git commit -m "Initial commit"
git branch -M main
gh repo create misspelled --public --source=. --push
gh repo edit --enable-pages --pages-branch main
```

Site goes live at `https://<username>.github.io/misspelled/`. Takes 1-2 minutes after the first push.

If you don't use the `gh` CLI: create the repo through the web UI, push, then in Settings, Pages, set Source to "Deploy from a branch", Branch: main, Folder: /.

### Option 2: Add to an existing repo under /docs

```bash
cp /path/to/index.html your-repo/docs/index.html
cd your-repo
git add docs/index.html
git commit -m "Add MISSPELLED typo search"
git push
```

Then in repo Settings, Pages, set Source to "Deploy from a branch", Branch: main (or whatever), Folder: /docs. Lives at `https://<username>.github.io/<repo>/`.

### Option 3: gh-pages branch

```bash
cd your-repo
git checkout --orphan gh-pages
git rm -rf .
cp /path/to/index.html .
git add index.html
git commit -m "MISSPELLED"
git push -u origin gh-pages
git checkout main
```

Then enable Pages on the gh-pages branch.

## Files in this drop

- `index.html` is the production build. Self-contained, deploy as-is.
- `MisspelledApp.jsx` is the readable React source if you want to modify and rebuild.

## Rebuilding from source

If you want to tweak the source and regenerate the HTML:

```bash
# Strip the React/Lucide imports and the export default (they live in the wrapper)
sed 's|^import React.*from .react.;|// |; s|^import {.*} from .lucide-react.;|// |; s|^export default function MisspelledApp|function MisspelledApp|' MisspelledApp.jsx > build_input.jsx

# Compile JSX to JS
npx esbuild build_input.jsx --format=esm --target=es2020 > app.js

# Then paste app.js into the <script type="module"> block in index.html,
# after the import statements and before the createRoot(...) call.
```

## Local dev

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

That's it. The import-map approach means no Node, no Webpack, no Vite. Browsers fetch React directly from esm.sh on page load.

## Caveats

- esm.sh is a third-party CDN. If it's down, the page won't load. For belt-and-suspenders you could self-host the bundled React from a local /vendor folder, but that costs you the single-file simplicity.
- Popup blockers may interfere when "OPEN ALL N IN TABS" tries to open more than 5-8 tabs at once. The fallback link list below the button works one-click-at-a-time.
- eBay rate-limits searches from the same IP. Don't fire all 25 tabs in rapid succession across many different searches or you'll get throttled briefly.
