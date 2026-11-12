INK="#1C2B24"; GREEN="#2F6B4F"; BRASS="#B8913A"; PAPER="#FBFBF8"; SAGE="#DDE3DE"; LG="#4E8A6C"

book="M20 110 Q50 98 80 110 Q110 98 140 110 L140 130 Q110 118 80 130 Q50 118 20 130 Z"
leafL="M80 86 C64 84 52 72 52 58 C68 58 78 70 80 86 Z"
leafR="M80 74 C92 72 106 62 108 46 C92 46 82 56 80 74 Z"
jar="M50 60 L110 60 L116 72 L116 128 Q116 136 108 136 L52 136 Q44 136 44 128 L44 72 Z"
hills="M10 132 Q50 92 90 122 Q120 98 150 122 L150 140 L10 140 Z"
shade="M98 42 L138 60 L124 86 Z"

def line(subject):
    s=f'stroke="{INK}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"'
    if subject=="habits":
        return f'<path d="{book}" {s}/><path d="M80 110 L80 130" {s}/><path d="M80 108 C80 92 80 80 80 62" {s}/><path d="{leafL}" {s}/><path d="{leafR}" {s}/><circle cx="108" cy="46" r="5" fill="{BRASS}"/>'
    if subject=="focus":
        return f'<path d="M96 132 L150 132 L122 80 Z" fill="{BRASS}" opacity="0.35"/><path d="M34 136 L86 136" {s}/><path d="M60 136 L60 126 L82 86 L106 66" {s}/><path d="{shade}" {s}/><circle cx="82" cy="86" r="4" fill="{INK}"/>'
    if subject=="money":
        return f'<path d="{jar}" {s}/><rect x="46" y="48" width="68" height="12" rx="3" {s}/><circle cx="64" cy="120" r="9" {s}/><circle cx="86" cy="122" r="9" {s}/><circle cx="100" cy="108" r="9" {s}/><circle cx="76" cy="102" r="9" {s}/><circle cx="80" cy="26" r="9" fill="{BRASS}"/><path d="M66 22 L58 18 M66 32 L58 34" {s}/>'
    if subject=="mindset":
        rays="".join(f'<path d="M{80+30*c:.1f} {74+30*s_:.1f} L{80+40*c:.1f} {74+40*s_:.1f}" {s}/>' for c,s_ in [(-1,0),(-0.7,-0.7),(0,-1),(0.7,-0.7),(1,0)])
        return f'<circle cx="80" cy="74" r="20" fill="{BRASS}" opacity="0.35"/><circle cx="80" cy="74" r="20" {s}/>{rays}<path d="M10 132 Q50 92 90 122 Q120 98 150 122" {s}/><path d="M10 140 L150 140" {s}/>'

def paper(subject):
    sh=lambda d,f,dx=4,dy=5: f'<path d="{d}" fill="{INK}" opacity="0.18" transform="translate({dx} {dy})"/><path d="{d}" fill="{f}"/>'
    if subject=="habits":
        return sh(book,GREEN)+f'<path d="M78 62 L82 62 L82 110 L78 110 Z" fill="{INK}"/>'+sh(leafL,LG)+sh(leafR,BRASS)
    if subject=="focus":
        return f'<path d="M96 134 L152 134 L122 80 Z" fill="{BRASS}" opacity="0.5"/>'+sh("M32 130 L88 130 L88 140 L32 140 Z",INK)+f'<path d="M58 130 L62 130 L86 88 L110 68 L106 64 L82 84 Z" fill="{INK}"/>'+sh(shade,GREEN)
    if subject=="money":
        return sh(jar,SAGE)+sh("M46 48 L114 48 L114 60 L46 60 Z",GREEN)+"".join(f'<circle cx="{x}" cy="{y}" r="10" fill="{BRASS}"/>' for x,y in [(64,120),(86,124),(100,108),(76,102)])+f'<circle cx="80" cy="26" r="10" fill="{BRASS}"/>'
    if subject=="mindset":
        return f'<circle cx="80" cy="76" r="26" fill="{BRASS}"/>'+sh("M10 132 Q50 92 90 122 Q120 98 150 122 L150 140 L10 140 Z",GREEN)+sh("M10 140 Q60 112 110 136 L150 130 L150 140 Z",LG,2,3)

def plate(subject):
    inner={"habits":f'<path d="{book}" fill="{GREEN}"/><path d="M78 62 L82 62 L82 110 L78 110 Z" fill="{GREEN}"/><path d="{leafL}" fill="{GREEN}"/><path d="{leafR}" fill="{GREEN}"/>',
           "focus":f'<path d="M32 132 L88 132 L88 140 L32 140 Z" fill="{GREEN}"/><path d="M58 132 L62 132 L86 88 L110 68 L106 64 L82 84 Z" fill="{GREEN}"/><path d="{shade}" fill="{GREEN}"/>',
           "money":f'<path d="{jar}" fill="{GREEN}"/><rect x="46" y="46" width="68" height="12" rx="3" fill="{GREEN}"/>'+"".join(f'<circle cx="{x}" cy="{y}" r="8" fill="{PAPER}"/>' for x,y in [(64,120),(86,122),(100,106),(74,100)]),
           "mindset":f'<circle cx="80" cy="74" r="22" fill="{GREEN}"/><path d="{hills}" fill="{GREEN}"/>'}[subject]
    return f'<circle cx="80" cy="80" r="76" fill="{PAPER}" stroke="{INK}" stroke-width="3"/><circle cx="80" cy="80" r="68" fill="none" stroke="{BRASS}" stroke-width="2" stroke-dasharray="2 5"/><g transform="translate(80 84) scale(0.62) translate(-80 -88)">{inner}</g>'

subs=[("habits","Habits"),("focus","Focus"),("money","Money"),("mindset","Mindset")]
styles=[("A · INK LINE",line,"Single-weight ink drawings with 1 brass accent. Feels hand-drawn, like notes in a margin. Light, quick to make, works at any size.","#FBFBF8"),
        ("B · CUT PAPER",paper,"Flat layered shapes with a soft offset shadow. Warmer and more playful. Strongest on the home page and area hubs.","#FBFBF8"),
        ("C · BOOKPLATE",plate,"Each idea as a round ex libris stamp. Most on-brand for a library, and doubles as badges for ideas readers kept.","#FBFBF8")]
rows=""
for name,fn,desc,bg in styles:
    tiles=""
    for k,label in subs:
        tiles+=f'''<div style="display: flex; flex-direction: column; gap: 10px; align-items: center"><div style="width: 190px; height: 190px; border-radius: 20px; background: #EEF0EC; display: flex; align-items: center; justify-content: center"><svg width="160" height="160" viewBox="0 0 160 160" role="img" aria-label="{label} illustration">{fn(k)}</svg></div><div style="font-family: 'IBM Plex Mono', monospace; font-size: 13px; color: #4A5A52">{label.upper()}</div></div>'''
    rows+=f'''<div style="background: {bg}; border-radius: 24px; padding: 32px 36px; display: flex; gap: 36px; align-items: center; box-shadow: 0 1px 0 #CBD2CC">
<div style="width: 250px; display: flex; flex-direction: column; gap: 10px"><div style="font-family: 'IBM Plex Mono', monospace; font-size: 13px; color: #4A5A52">{name}</div><div style="font-family: 'Manrope', sans-serif; font-size: 16px; line-height: 1.55; color: #2C3A33">{desc}</div></div>
<div style="display: flex; gap: 20px">{tiles}</div></div>
'''
html=f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Illustration styles</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&amp;family=Manrope:wght@400;600;700&amp;family=IBM+Plex+Mono:wght@400;500&amp;display=swap" rel="stylesheet">
<style>
body{{margin:0}}
a{{color:#2F6B4F}}a:hover{{color:#1C2B24}}
</style>
</helmet>
<div style="width: 1200px; height: 1180px; box-sizing: border-box; padding: 64px; background: #EEF0EC; color: #1C2B24; display: flex; flex-direction: column; gap: 28px; font-family: 'Manrope', sans-serif">
<div style="display: flex; flex-direction: column; gap: 8px">
<div style="font-family: 'IBM Plex Mono', monospace; font-size: 14px; letter-spacing: 0.08em; color: #4A5A52">LAYER 5 · ILLUSTRATION</div>
<div style="font-family: 'DM Serif Display', serif; font-size: 56px; line-height: 1">3 illustration styles</div>
</div>
{rows}
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":1200,"height":1180}}}}'>
class Component extends DCLogic {{
renderVals() {{
return {{}};
}}
}}
</script>
</body>
</html>
'''
if __name__ == "__main__":
    import os
    _out = '/home/claude/lib/project/Illus.dc.html'
    if os.path.isdir(os.path.dirname(_out)): open(_out, 'w').write(html)
