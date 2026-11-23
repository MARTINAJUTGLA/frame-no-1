The redesigned section pages are now the main website. Navigation uses the primary URLs; film and director profiles share its typography and colours. Earlier design studies remain available for reference.

# FRAME No. 1 — homepage prototype

The homepage previews the approved typographic direction: oversized black lettering on white, hairline grids, a vermilion edge and three credited film images. Colour / Black & white controls compare photography treatments. Other pages remain plain pending review. Functionality and browser journal data are retained.

Homepage-only files: `css/home-editorial.css` and `js/home-editorial.js`. Anton and Roboto Condensed are hosted locally with their Open Font License files in `assets/fonts/`. Film imagery is sourced, not generated; source records do not imply blanket rights clearance.

## Interior design studies

Open `design-preview.html` for five separate section mockups. They share uppercase condensed headings, sentence-case monospace text, fine borders and red accents. Original interior pages remain unchanged; My Frames preview is now connected to the real local journal, with working filter tabs.

## Retained

- HTML pages for the six sections, 129 films, 75 director profiles and three attributed articles.
- Local film posters, director photographs and their source/rights records.
- Film search, filters, sorting and director search.
- Watched films, favourites, watchlist, ratings and notes saved in LocalStorage.
- Curated, director and genre checklists; personal lists accepting archive films or manually entered titles.
- Shared archive watched status and automatic progress. Personal entries also appear in My Frames.
- Journal/list backup code, validation, storage error handling and cross-tab updates.
- Semantic HTML, page metadata, relative paths, tests and GitHub Pages workflow.

Personal lists support up to 20 lists with 100 entries each. Existing film IDs and browser-storage keys were retained. No browser journal was cleared by the design reset.

## Local use

Serve this folder with `python3 -m http.server 8000`, then open `http://localhost:8000`. Static content can be opened directly from `index.html`; use HTTP for reliable journal behaviour.

## Organisation

- `*.html`, `films/`, `directors/`, `articles/`: content and semantic structure.
- `css/foundation.css`: neutral working layout only.
- `js/app.js`: archive, journal, navigation and backup behaviour.
- `js/checklists.js`: director/genre collections, custom lists and manual movie entries.
- `data/films.json`, `data/films.js`: catalogue copies; keep these and the static pages consistent when editing.
- `data/directors.json`, `data/collections.js`: profiles and curated collection membership.
- `assets/movies/`, `assets/directors/`, `data/media-credits.json`: content imagery and provenance.
- `tests/`: repeatable integrity and behaviour checks.
- `DEVELOPMENT-NOTES.md`: factual history, including the design reset. It is not the student's project memory.

## Checks

```sh
python3 tests/check_static.py
node --check js/app.js
node --check js/checklists.js
node --check data/films.js
node --check data/collections.js
node tests/check_journal.cjs
node tests/check_lists.cjs
```

Optional: `python3 tests/check_media.py` checks image decoding, dimensions and source records, requiring Pillow. Visitors need no development runtime.

## GitHub Pages

Put this folder's contents at the repository root, including `.github` and `.nojekyll`. In Settings → Pages, select GitHub Actions. The workflow targets `main`; update it if your branch differs. It packages public site files only. No deployment has been performed and no public URL or Lighthouse score is claimed. Add canonical/OG URLs and a sitemap after the real public address is known.

## Content, privacy and limitations

Film information follows the linked reference sources; prose is AI-assisted and attributed. Posters and portraits retain their individual rights records at `image-credits.html`. Copyrighted posters and some portraits are not freely licensed; public reuse rights clearance remains incomplete.

Journal and personal lists remain in the visitor's browser/origin. They do not sync between devices. Export before clearing browser data or moving to another origin. The separate `frame-personal-watched.json` file outside this folder contains the owner's optional 20-film starter and is not published or automatically imported.

The design reset removed styling and decorative assets only. Earlier development-note observations about branded layouts, fonts, stickers or filters are historical, not current presentation claims.


## Film News

`news.html` contains 12 dated headline links from The Guardian Film RSS feed, without article bodies or publisher imagery. `scripts/update_news.py` refreshes the saved page and `data/news.json`. The Pages workflow refreshes on deployment and is configured to run twice daily (07:20 and 19:20 UTC); this requires the project to be pushed to GitHub with Actions and Pages enabled. Scheduled runs may be delayed or disabled by GitHub. Source failure retains the last snapshot and its original check time. Local browsing does not poll a live feed. Reporting may include reviews and require registration/subscription. No API secrets are needed.


Personal checklists include a Print checklist button. The browser print window can print or save as PDF. Print includes watched status and manual entries; it does not change the saved journal. Test: `node tests/check_print.cjs`.
