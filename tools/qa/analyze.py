#!/usr/bin/env python3
"""Turn results.json into one issue list: grouped by root cause, with severity, pages and widths."""
import json, collections, re, csv, sys

R = json.load(open('results.json'))
SEV = {
 'text-covered': 'High', 'text-off-screen': 'High', 'page-scrolls-sideways': 'High', 'field-off-screen': 'High',
 'image-broken': 'High', 'page-error': 'High', 'resource-404': 'High', 'js-error': 'High', 'adblock-risk-url': 'High', 'broken-link': 'High',
 'text-cut-off': 'Medium', 'text-squeezed': 'Medium', 'field-too-narrow': 'Medium', 'slop-phrase': 'Medium', 'em-dash': 'Medium',
 'a11y-image-alt': 'Medium', 'a11y-label': 'Medium', 'a11y-button-name': 'Medium', 'a11y-link-name': 'Medium',
 'tap-target-small': 'Low', 'a11y-color-contrast': 'Low', 'space-before-punctuation': 'Low', 'repeated-word': 'Low',
 'adblock-risk-name': 'Low', 'font-not-approved': 'Low', 'dark-only': 'Medium',
}
def sig(el):
    # component signature: tag + first class, text dropped, so the same bug on 40 pages is 1 row
    m = re.match(r'([a-z0-9]+)(#[\w-]+)?(\.[\w.-]+)?', el or '')
    return (m.group(1) + (m.group(3) or '')) if m else ''

rows = collections.defaultdict(lambda: {'pages': set(), 'widths': set(), 'examples': []})
for p in R:
    path = p['url'].replace('https://theusefulmedia.com', '') or '/'
    for run in p['runs']:
        if run.get('status') and run['status'] != 200: rows[('page-error', path)]['pages'].add(path)
        if run.get('error'): rows[('page-error', 'load')]['pages'].add(path); rows[('page-error', 'load')]['examples'].append(run['error'])
        for f in run.get('failed', []):
            if f.startswith('404') or f.startswith('40') or f.startswith('50'):
                k = ('resource-404', f.split(' ', 1)[1].split('?')[0]); rows[k]['pages'].add(path); rows[k]['widths'].add(run['W'])
        for c in run.get('console', []):
            if c.startswith('JS error'):
                k = ('js-error', c[:90]); rows[k]['pages'].add(path)
        for i in run['issues']:
            t = i['type']
            if t == 'tap-target-small' and run['W'] != 393: continue
            key_el = sig(i['el']) if t not in ('slop-phrase', 'em-dash', 'adblock-risk-name', 'adblock-risk-url', 'space-before-punctuation', 'font-not-approved', 'page-scrolls-sideways', 'repeated-word') else (i['detail'][:60] if t not in ('em-dash','space-before-punctuation','page-scrolls-sideways','repeated-word') else '')
            k = (t, key_el)
            r = rows[k]; r['pages'].add(path); r['widths'].add(f"{run['W']}{'d' if run['scheme']=='dark' else ''}")
            if len(r['examples']) < 3 and (i['el'], i['detail']) not in r['examples']: r['examples'].append((i['el'], i['detail'], path))

# light vs dark: issues only in dark mode
out = []
for (t, k), r in rows.items():
    widths = sorted(r['widths'], key=str)
    if widths and all(str(w).endswith('d') for w in widths) and t not in ('a11y-color-contrast',): sev = SEV.get(t, 'Medium')
    out.append({'severity': SEV.get(t, 'Medium'), 'type': t, 'where': k, 'pages': len(r['pages']), 'page_list': sorted(r['pages']),
                'widths': ' '.join(map(str, widths)), 'examples': r['examples']})
order = {'High': 0, 'Medium': 1, 'Low': 2}
out.sort(key=lambda x: (order[x['severity']], -x['pages']))
json.dump(out, open('issues.json', 'w'), indent=1, default=list)
c = collections.Counter(o['severity'] for o in out)
print('issue groups:', dict(c), 'from', len(R), 'pages')
for o in out:
    if o['severity'] == 'Low': continue
    ex = o['examples'][0] if o['examples'] else ('', '', '')
    print(f"{o['severity']:6} {o['type']:24} {str(o['where'])[:40]:40} pages={o['pages']:3} w={o['widths'][:30]:30} | {str(ex[0])[:50]} | {str(ex[1])[:70]} | {o['page_list'][0][:45]}")

# facts across pages
facts = collections.defaultdict(set)
for p in R:
    for run in p['runs']:
        for f in run.get('facts') or []:
            n, what = f.split(' ', 1); facts[what.lower()].add((n, p['url'].replace('https://theusefulmedia.com', '')))
print('\nFACTS')
for what, s in facts.items():
    vals = collections.defaultdict(list)
    for n, u in s: vals[n].append(u)
    if len(vals) > 1: print(what, {k: (len(v), v[0]) for k, v in vals.items()})
