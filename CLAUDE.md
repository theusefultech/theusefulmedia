# theusefulmedia.com rules for every chat and task

- Visual rule (Raja, 17 Nov 2026): every page gets a visual element (image, chart, illustration, drawn SVG, canvas or a CSS mockup marked `data-visual`). Never a wall of text. `scripts/visual_check.py` runs on every push (`.github/workflows/visual-check.yml`) and fails for any page without one.
- `plans/visual-backlog.txt` lists the old pages that still need a visual. When you fix one, delete its line in the same commit. Never add a new page to it.
- Pull before you push. Other chats push often.
