# Definition of done (Raja, plan A, 25 Nov 2026)

A page change is done only when all of these pass. No exceptions for "small" fixes.

1. Rendered with real data at 375, 393 and 430 px wide, plus 1440, light and dark. Look at the screenshot, not the code.
2. Nothing overlaps, nothing is cut off, no sideways scroll, no label squeezed to 1 or 2 words per line, tap targets at least 40 px.
3. Every number matches the rest of the site (apps listed, followers, prices). 78K is always "Medium followers" linked to https://medium.com/@theusefultech.
4. Design rules: no orange accents, no coloured top or left stripes on cards, no ticket-shaped tags, only Space Grotesk, JetBrains Mono and the system font, dark mode pitch black.
5. Copy passes scripts/slop_check.py from theusefulmedia/useful-posts (built pages also get the deslop pass). Quoted reviews keep their words.
6. No 404 links, no broken images, no JS errors, no ad-blocker trigger words in URLs or class names (never /advertise/, /ads/, .sponsor-banner).
7. A tour tip, toast or floating button never covers a paid spot (mark paid spots with data-paid).
8. Every bug Raja reports becomes an automatic check so it cannot come back.

Tools: tools/qa in theusefultech/useful-apps (branch qa-checker) renders pages and flags most of the above for free.
