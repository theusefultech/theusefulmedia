"""Move the Useful Studio price ladder: python3 scripts/studio_ladder.py <new_price> <licences_left>.
Rewrites the price and 'licences left' lines on the Studio pages, llms.txt, products and links,
and saves the state in scripts/studio_ladder.json. Change the Gumroad price to match."""
import json, re, sys, glob
from pathlib import Path
root = Path(__file__).resolve().parent.parent
state_p = root / "scripts" / "studio_ladder.json"
st = json.loads(state_p.read_text())
new_price, left = int(sys.argv[1]), int(sys.argv[2])
steps = st["steps"]
nxt = steps[min(steps.index(new_price) + 1, len(steps) - 1)]
old = st["price"]
files = [Path(f) for f in glob.glob(str(root / "studio/**/index.html"), recursive=True)]
files += [root / "llms.txt", root / "products/index.html", root / "links/index.html",
          root / "tech/library/useful-studio-15-to-90-second-videos-made-inside-claude-code/index.html",
          root / "tech/library/the-useful-find-013-claude-code-can-now-make-your-launch-video/index.html"]
lic = "licence" if left == 1 else "licences"
for f in files:
    if not f.exists():
        continue
    s = o = f.read_text()
    # Studio lines only: "N licences left at $P, then $N" / "N left at $P" / "N licences left at this price, then $N"
    s = re.sub(r"\d+ licences? left at \$%d, then \$\d+" % old, f"{left} {lic} left at ${new_price}, then ${nxt}", s)
    s = re.sub(r"\d+ licences? left at \$%d(?!\d)" % old, f"{left} {lic} left at ${new_price}", s)
    s = re.sub(r"\d+ left at \$%d(?!\d)" % old, f"{left} left at ${new_price}", s)
    s = re.sub(r"\$%d one time, \d+ licences? left at this price, then \$\d+" % old, f"${new_price} one time, {left} {lic} left at this price, then ${nxt}", s)
    s = re.sub(r"for the next \d+ licences?", f"for the next {left} {lic}", s) if "studio" in str(f) else s
    s = re.sub(r"rises to \$\d+ after the next \d+ licences?", f"rises to ${nxt} after the next {left} {lic}", s)
    if new_price != old and ("studio" in str(f) or f.name == "llms.txt" or "products" in str(f)):
        s = re.sub(r"(?<![\d,])\$%d(?![\d,])" % old, f"${new_price}", s)
    if s != o:
        f.write_text(s)
st.update(price=new_price, next=nxt, left=left)
state_p.write_text(json.dumps(st, indent=1))
print("Studio ladder:", left, "left at $%d, then $%d" % (new_price, nxt))
