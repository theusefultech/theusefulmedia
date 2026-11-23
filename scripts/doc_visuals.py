#!/usr/bin/env python3
"""Visuals for the app document pages (visual check, 24 Nov 2026, item 10): Wristkeeper privacy, terms, support, press,
cost-per-wear and watch-rotation, and the Tinystack privacy and support pages. Free, rules only. Run after editing any of them:  python3 scripts/doc_visuals.py
  - the app icon next to the page title, so the first screen has a picture of the product
  - real App Store screenshots of the app between sections, about 1 every 2 phone screens (each shot once per page)
  - paragraphs over 45 words split at a sentence break
Pages carry data-dv once done.
"""
import os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SENT = re.compile(r"(?<=[.!?])\s+(?=[A-Z\"“(])")
WK = "/wristkeeper/assets/shots/"
WK_SHOTS = {  # page: screenshots in the order they are used, the topic's own shot first
    "wristkeeper/privacy": ["08-private", "02-wear-log", "06-wrist-report"],
    "wristkeeper/terms": ["01-wear-the-whole-box", "07-dial-icons"],
    "wristkeeper/support": ["02-wear-log"],
    "wristkeeper/press": ["06-wrist-report"],
    "wristkeeper/cost-per-wear": ["03-cost-per-wear"],
    "wristkeeper/watch-rotation": ["04-rotation", "05-weather"],
}
# Tinystack pages use its own character illustrations (stack/i/ch-*.webp)
TS = {"stack/privacy": ["ch-calm", "ch-reader", "ch-maker"], "stack/support": ["ch-original"]}
ICONS = {"wristkeeper": '<img class="dv-icon" src="/wristkeeper/assets/icon-180.webp" alt="Wristkeeper app icon" width="88" height="88" data-visual>',
         "stack": '<img class="dv-icon" src="/stack/icon.svg" alt="Tinystack app icon" width="88" height="88" data-visual>'}


def words(s):
    return len(re.sub(r"<[^>]+>", " ", s).split())


def split_long(seg):
    def fix(m):
        attrs, inner = m.group(1) or "", m.group(2)
        if words(inner) <= 45 or re.search(r"<(p|div|ul|ol|img|br)\b", inner):
            return m.group(0)
        chunks, cur = [], ""
        for x in SENT.split(inner):
            if cur and words(cur + " " + x) > 35:
                chunks.append(cur); cur = x
            else:
                cur = (cur + " " + x).strip()
        if cur:
            chunks.append(cur)
        ok = lambda c: len(re.findall(r"<[a-z]", c)) == len(re.findall(r"</[a-z]", c))
        if len(chunks) < 2 or not all(ok(c) for c in chunks):
            return m.group(0)
        return "".join(f"<p{attrs}>{c}</p>" for c in chunks)
    return re.sub(r"<p((?:\s[^>]*)?)>(.*?)</p>", fix, seg, flags=re.S)


def shot(name):
    if name.startswith("ch-"):
        return f'<figure class="dv-shot dv-ch" data-visual><img src="/stack/i/{name}.webp" alt="" width="400" height="400" loading="lazy"></figure>\n'
    return (f'<figure class="dv-shot" data-visual><img src="{WK}{name}-480.webp" alt="Wristkeeper screen" width="480" height="1040" loading="lazy">'
            f'</figure>\n')


def process(rel, shots):
    path = os.path.join(ROOT, rel, "index.html")
    raw = open(path, encoding="utf-8").read()
    m = re.search(r"<main\b[^>]*>.*?</main>", raw, re.S)
    if not m or "data-dv" in m.group(0)[:200]:
        return False
    seg = m.group(0)
    seg = re.sub(r"(<h1\b[^>]*>.*?</h1>)", lambda x: f'<div class="dv-head">{ICONS[rel.split("/")[0]]}{x.group(1)}</div>', seg, count=1, flags=re.S)
    heads = [h.start() for h in re.finditer(r"<h2\b", seg)]
    n = len(shots)
    if heads:
        picks = sorted({heads[min(len(heads) - 1, max(0, round(len(heads) * (i + 1) / (n + 1))))] for i in range(n)}, reverse=True)
        for pos, name in zip(picks, reversed(shots[:len(picks)])):
            seg = seg[:pos] + shot(name) + seg[pos:]
    seg = split_long(seg)
    seg = re.sub(r"<main\b", '<main data-dv="1"', seg, count=1)
    open(path, "w", encoding="utf-8").write(raw[:m.start()] + seg + raw[m.end():])
    return True


if __name__ == "__main__":
    n = sum(process(rel, s) for rel, s in {**WK_SHOTS, **TS}.items() if os.path.exists(os.path.join(ROOT, rel, "index.html")))
    print(f"doc_visuals: {n} pages updated")
