#!/usr/bin/env python3
"""Drawn 'at a glance' icon strip for text-heavy pages like privacy and terms (visual rule, M42, 20 Nov 2026).
glance(tiles, bg, fg, acc, rule) returns 1 HTML block marked data-visual. Tiles are (icon, label)."""
I={
"eye-off":'<path d="M6 24s7-12 18-12 18 12 18 12-7 12-18 12S6 24 6 24z"/><circle cx="24" cy="24" r="5"/><path d="M9 39 39 9"/>',
"tag-off":'<path d="M8 22V10h12l18 18-12 12z"/><circle cx="15" cy="15" r="2.5"/><path d="M9 39 39 9"/>',
"cookie-off":'<circle cx="24" cy="24" r="15"/><circle cx="19" cy="18" r="1.8"/><circle cx="29" cy="27" r="1.8"/><circle cx="19" cy="30" r="1.8"/><path d="M9 39 39 9"/>',
"mail":'<rect x="7" y="12" width="34" height="24" rx="4"/><path d="m8 14 16 12 16-12"/>',
"refresh":'<path d="M37 18A14 14 0 0 0 11 15"/><path d="M10 8v8h8"/><path d="M11 30a14 14 0 0 0 26 3"/><path d="M38 40v-8h-8"/>',
"label":'<path d="M8 12h22l10 12-10 12H8z"/><path d="M15 29l3.5-10 3.5 10M16 25.5h5"/>',
"doc-check":'<path d="M14 6h14l8 8v28H14z"/><path d="M28 6v8h8"/><path d="m19 27 5 5 9-10"/>',
"refund":'<circle cx="24" cy="24" r="15"/><path d="M28.5 18.5H22a3 3 0 0 0 0 6h4a3 3 0 0 1 0 6h-7"/><path d="M24 15v3.5M24 30.5V34"/>',
"phone":'<rect x="15" y="6" width="18" height="36" rx="4"/><path d="M22 37h4"/><path d="m19.5 21 3.5 3.5 6-6.5"/>',
"lock":'<rect x="11" y="22" width="26" height="18" rx="4"/><path d="M17 22v-5a7 7 0 0 1 14 0v5"/><circle cx="24" cy="31" r="2"/>',
"trash":'<path d="M10 14h28M19 14V9h10v5M14 14l2 26h16l2-26"/><path d="M21 20v14M27 20v14"/>',
}
def glance(tiles,bg,fg,acc,rule,title="At a glance"):
    t="".join(f'<div role="listitem" style="display:flex;flex-direction:column;gap:10px;padding:16px;border-radius:16px;background:{bg};border:1px solid {rule}"><svg viewBox="0 0 48 48" width="40" height="40" fill="none" stroke="{acc}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{I[i]}</svg><b style="font-size:15px;line-height:1.3;color:{fg}">{l}</b></div>' for i,l in tiles)
    return f'<div class="glance" data-visual aria-label="{title}" style="margin:18px 0"><div role="list" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px">{t}</div></div>'
