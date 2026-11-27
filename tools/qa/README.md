# Site checker (27 Nov 2026)

Free, rules-based checks for theusefulmedia.com. No Claude usage.

- `node check.mjs pages.txt 6` renders every page at 375, 393, 430 and 1440 px (plus dark at 393) and flags: text covered by other elements, text off screen or cut off, squeezed titles, sideways scroll, narrow or off-screen fields, small tap targets, broken images, 404s, JS errors, em dashes, space before punctuation, ad-blocker trigger words in URLs and class names, unapproved fonts, contrast (axe-core), and the numbers each page states (apps, followers, categories). Writes results.json, screenshots in shots/, page text in texts/.
- `python3 analyze.py` groups results.json by root cause (component) with severity and prints number conflicts across pages.
- Setup: `npm i playwright @axe-core/playwright @ghostery/adblocker && npx playwright install --with-deps chromium`.
- Known false positives: count-up numbers mid-animation, scroll-reveal sections in full-page shots. Verify with a slow scroll before reporting.

## Nightly (27 Nov 2026)
`.github/workflows/nightly-qa.yml` runs `check.mjs` on every page in pages.txt at 3:07 AM IST, then `nightly.py` compares the problems with `known.json` and files 1 alert email (Watchdog) only for problems that are new since the night before. Free: this repo is public, so no Actions minutes are billed, and no Claude usage. Screenshots stay 7 days in the run's artifact.
