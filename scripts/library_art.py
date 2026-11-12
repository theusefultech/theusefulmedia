"""Dog-Ear: The Useful Library's mascot (a little book with a folded corner) and the scenes, stamps and icons drawn with it.
All functions return SVG markup. Scenes use viewBox 0 0 200 200, stamps 0 0 160 160."""
G="#2F6B4F";G2="#4E8A6C";INK="#1C2B24";BR="#B8913A";GOLD="#E6C77A";PA="#FBFBF8";MINT="#E3EEE7";BL="#3A5BA0";PL="#7A4A78";CR="#F2EAD6";PK="#E8A0A0";RED="#D9654B"

def st(w=3):
    return f'stroke="{INK}" stroke-width="{w}" stroke-linejoin="round" stroke-linecap="round"'

ARMS={
 "down":'<path d="M-30 4 Q-40 14 -38 24" fill="none" {s}/><path d="M32 4 Q42 14 40 24" fill="none" {s}/>',
 "up":'<path d="M-30 -2 Q-44 -16 -44 -32" fill="none" {s}/><path d="M32 -2 Q46 -16 46 -32" fill="none" {s}/><circle cx="-44" cy="-34" r="4" fill="{ink}"/><circle cx="46" cy="-34" r="4" fill="{ink}"/>',
 "wave":'<path d="M-30 4 Q-40 14 -38 24" fill="none" {s}/><path d="M32 0 Q48 -8 50 -26" fill="none" {s}/><path d="M44 -30 l6 4 M48 -36 l6 2 M54 -28 l6 0" stroke="{br}" stroke-width="2.5" stroke-linecap="round"/>',
 "hold":'<path d="M-30 6 Q-20 22 -6 22" fill="none" {s}/><path d="M32 6 Q22 22 8 22" fill="none" {s}/>',
 "right":'<path d="M-30 4 Q-40 14 -38 24" fill="none" {s}/><path d="M32 4 Q46 0 54 -10" fill="none" {s}/>',
 "meditate":'<path d="M-30 8 Q-46 18 -34 30" fill="none" {s}/><path d="M32 8 Q48 18 36 30" fill="none" {s}/>',
}

def dog(x, y, s=1, mood="smile", color=G, arms="down", prop="", blink=True):
    k=st(3/s)
    mouth={"smile":f'<path d="M-9 8 Q0 16 9 8" fill="none" {k}/>',
           "o":f'<ellipse cx="0" cy="10" rx="4" ry="5" fill="{INK}"/>',
           "calm":f'<path d="M-7 9 Q0 13 7 9" fill="none" {k}/>',
           "grin":f'<path d="M-11 6 Q0 20 11 6 Z" fill="{INK}"/><path d="M-6 12 Q0 15 6 12" fill="{PK}"/>',
           "sleep":f'<path d="M-5 10 Q0 12 5 10" fill="none" {k}/>'}[mood]
    if mood in ("calm","sleep"):
        eyes=f'<path d="M-14 -4 Q-10 {-9 if mood=="calm" else 0} -6 -4" fill="none" {k}/><path d="M6 -4 Q10 {-9 if mood=="calm" else 0} 14 -4" fill="none" {k}/>'
    else:
        eyes=f'<g class="{"dog-eyes" if blink else ""}"><circle cx="-10" cy="-4" r="4" fill="{INK}"/><circle cx="10" cy="-4" r="4" fill="{INK}"/><circle cx="-8.6" cy="-5.4" r="1.4" fill="#fff"/><circle cx="11.4" cy="-5.4" r="1.4" fill="#fff"/></g>'
    a=ARMS[arms].replace("{s}",k).replace("{ink}",INK).replace("{br}",BR)
    legs=f'<path d="M-22 34 L-22 50 M14 34 L14 50" {k}/><path d="M-27 50 L-17 50 M9 50 L19 50" {k}/>' if arms!="meditate" else f'<path d="M-28 40 Q-4 52 26 40" fill="none" {k}/>'
    return f'''<g transform="translate({x} {y}) scale({s})">{legs}{a}
<path d="M-30 -36 H22 L32 -26 V36 H-30 Z" fill="{color}" {k}/>
<path d="M22 -36 V-26 H32" fill="{PA}" {k}/>
<path d="M-24 -36 V36" stroke="{INK}" stroke-width="{1.5/s:.2f}" opacity=".35"/>
<path d="M-4 36 V48 L1 44 L6 48 V36" fill="{BR}" {k}/>
<rect x="-20" y="-20" width="44" height="40" rx="12" fill="{PA}"/>
<g transform="translate(2 0)">{eyes}{mouth}<circle cx="-16" cy="6" r="4" fill="{PK}" opacity=".7"/><circle cx="20" cy="6" r="4" fill="{PK}" opacity=".7"/></g>
{prop}</g>'''

def svg(inner, vb="0 0 200 200", cls="art"):
    return f'<svg class="{cls}" viewBox="{vb}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">{inner}</svg>'

def star(x,y,r=10,fill=BR):
    import math
    pts=[]
    for i in range(10):
        a=-math.pi/2+i*math.pi/5; rr=r if i%2==0 else r*0.45
        pts.append(f"{x+rr*math.cos(a):.1f},{y+rr*math.sin(a):.1f}")
    return f'<polygon points="{" ".join(pts)}" fill="{fill}" {st(2)}/>'

def scene(name):
    k=st()
    if name=="habits":
        steps="".join(f'<rect x="{30+i*34}" y="{150-i*24}" width="34" height="{24+i*24}" rx="4" fill="{[MINT,"#CFE3D7",G2,G][i]}" {k}/>' for i in range(4))
        return svg(f'<g class="a-steps">{steps}</g>'+f'<path class="a-trail" d="M48 92 Q80 48 150 40" fill="none" stroke="{BR}" stroke-width="3" stroke-dasharray="2 7" stroke-linecap="round"/>'+'<g class="a-star">'+star(156,36,11)+'</g><g class="a-hop">'+dog(81,90,0.62,"grin",G,"up")+'</g>')
    if name=="focus":
        hp=f'<path d="M-30 -10 Q-30 -52 2 -52 Q34 -52 34 -10" fill="none" stroke="{INK}" stroke-width="5"/><rect x="-38" y="-16" width="14" height="24" rx="6" fill="{BL}" {st(3)}/><rect x="28" y="-16" width="14" height="24" rx="6" fill="{BL}" {st(3)}/>'
        box=f'<g transform="translate(150 150)"><rect x="-26" y="-34" width="52" height="34" rx="4" fill="{CR}" {k}/><path d="M-30 -34 H30 L24 -46 H-24 Z" fill="{BR}" {k}/><rect x="-9" y="-30" width="18" height="26" rx="4" fill="{INK}" opacity=".85"/><path d="M-4 -40 h8" {k}/><text class="a-zz" x="0" y="-54" text-anchor="middle" font-family="Georgia,serif" font-size="14" fill="{INK}">z z</text></g>'
        return svg(f'<rect x="14" y="150" width="172" height="10" rx="5" fill="{INK}"/>'+box+'<g class="a-bob">'+dog(66,100,0.78,"calm",G,"down",hp)+'</g>'+f'<path class="a-beat" d="M110 70 L122 64 M112 84 L126 84 M110 98 L122 104" stroke="{BR}" stroke-width="3" stroke-linecap="round"/>')
    if name=="money":
        coins="".join(f'<ellipse cx="148" cy="{150-i*10}" rx="20" ry="7" fill="{BR}" {k}/>' for i in range(4))
        plant=f'<path d="M148 112 V88" {k}/><path d="M148 96 C136 94 128 84 128 74 C140 74 148 84 148 96 Z" fill="{G2}" {k}/><path d="M148 90 C158 88 166 78 166 68 C154 68 148 78 148 90 Z" fill="{G}" {k}/>'
        coin=f'<g class="a-coin"><g transform="translate(112 46)"><circle r="11" fill="{GOLD}" {k}/><circle r="5" fill="none" stroke="{INK}" stroke-width="2"/></g><path d="M124 62 Q132 74 136 96" fill="none" stroke="{BR}" stroke-width="2.5" stroke-dasharray="2 6" stroke-linecap="round"/></g>'
        return svg(f'<rect x="14" y="156" width="172" height="8" rx="4" fill="{INK}" opacity=".15"/>'+f'<g class="a-coins">{coins}</g><g class="a-plant">{plant}</g>'+coin+dog(64,104,0.8,"o",G,"right"))
    if name=="mindset":
        clouds=f'<g class="a-clouds" fill="{PA}" {k}><path d="M24 70 q0 -14 14 -14 q4 -12 18 -10 q14 -2 16 12 q12 2 10 14 z"/><path d="M128 46 q0 -12 12 -12 q4 -10 16 -8 q12 0 13 10 q10 2 9 12 z"/></g>'
        return svg(f'<circle cx="100" cy="92" r="70" fill="{CR}"/>'+clouds+f'<path d="M30 110 l-8 -4 M28 120 h-10 M174 110 l8 -4 M172 120 h10" stroke="{BR}" stroke-width="3" stroke-linecap="round"/>'+'<g class="a-breathe">'+dog(100,108,0.82,"calm",PL,"meditate")+'</g>')
    if name=="game":
        glass=f'<circle cx="54" cy="-14" r="15" fill="{PA}" fill-opacity=".7" stroke="{INK}" stroke-width="4"/><path d="M64 -3 L74 8" stroke="{INK}" stroke-width="6" stroke-linecap="round"/>'
        sq="".join(f'<rect x="{18+i*28}" y="166" width="22" height="22" rx="5" fill="{c}" {k}/>' for i,c in enumerate([BR,BR,G2,MINT,MINT,MINT]))
        return svg(f'<text x="22" y="72" font-family="Georgia,serif" font-size="56" font-weight="700" fill="{BR}" stroke="{INK}" stroke-width="2">?</text>'+sq+dog(88,96,0.82,"o",BL,"right",glass))
    if name=="shelf":
        books="".join(f'<rect x="{x}" y="{y}" width="{w}" height="{150-y}" rx="3" fill="{c}" {k}/>' for x,y,w,c in [(18,80,18,BR),(38,92,16,BL),(56,74,20,PL),(78,98,14,G2)])
        medal=f'<g transform="translate(160 66)"><path d="M-10 10 L-16 40 L-4 34 L2 44 L6 14" fill="{BL}" {k}/><circle r="20" fill="{GOLD}" {k}/><path d="M-6 0 L-1 6 L8 -5" fill="none" stroke="{INK}" stroke-width="3.5" stroke-linecap="round"/></g>'
        return svg(f'<rect x="10" y="150" width="180" height="10" rx="5" fill="{INK}"/>'+books+medal+dog(122,112,0.55,"grin",G,"up"))
    if name=="read":
        book=f'<g transform="translate(0 30)"><path d="M-30 -6 Q-15 -14 0 -6 Q15 -14 30 -6 V10 Q15 2 0 10 Q-15 2 -30 10 Z" fill="{PA}" {st(3)}/><path d="M0 -6 V10" {st(2)}/></g>'
        return svg(f'<circle cx="100" cy="104" r="72" fill="{MINT}"/>'+dog(100,96,0.95,"smile",G,"hold",book)+f'<path d="M150 50 l6 -10 M160 62 l12 -4 M40 54 l-8 -8" stroke="{BR}" stroke-width="3" stroke-linecap="round"/>')
    if name=="sleep":
        return svg(f'<path d="M30 160 Q100 140 170 160" fill="none" {k}/><text x="132" y="64" font-family="Georgia,serif" font-size="22" fill="{INK}">z</text><text x="148" y="46" font-family="Georgia,serif" font-size="16" fill="{INK}">z</text>'+dog(96,110,0.85,"sleep",G2,"down",blink=False))
    if name=="celebrate":
        conf="".join(f'<rect x="{x}" y="{y}" width="8" height="14" rx="2" fill="{c}" transform="rotate({r} {x} {y})"/>' for x,y,c,r in [(36,40,BR,20),(160,36,PL,-30),(52,80,BL,40),(150,84,G2,10),(100,24,PK,-15),(176,120,BR,30),(24,124,G2,-40)])
        return svg(conf+dog(100,110,0.9,"grin",G,"up"))
    raise KeyError(name)

STAMP_POSES={
 "first-solve":("game",BL), "ace":("bolt",BR), "streak-3":("flame3",RED), "streak-7":("flame7",PL),
 "checklist":("check",G), "tester":("calendar",BL), "kept":("trophy",GOLD), "regular":("phone",G2), "reader":("letter",PL)}

def stamp(sid):
    pose,color=STAMP_POSES[sid]; k=st(2.5)
    props={
     "game":f'<circle cx="46" cy="-18" r="13" fill="{PA}" fill-opacity=".7" stroke="{INK}" stroke-width="3.5"/><path d="M55 -9 L64 0" stroke="{INK}" stroke-width="5" stroke-linecap="round"/>',
     "bolt":f'<path d="M44 -48 L30 -18 H44 L34 10 L62 -26 H48 L58 -48 Z" fill="{GOLD}" {k}/>',
     "flame3":f'<path d="M48 -6 C34 -10 34 -30 46 -44 C46 -34 54 -32 56 -40 C66 -28 64 -8 48 -6 Z" fill="{RED}" {k}/><text x="47" y="-14" text-anchor="middle" font-family="Georgia,serif" font-size="16" font-weight="700" fill="{PA}">3</text>',
     "flame7":f'<path d="M48 -6 C34 -10 34 -30 46 -44 C46 -34 54 -32 56 -40 C66 -28 64 -8 48 -6 Z" fill="{PL}" {k}/><text x="47" y="-14" text-anchor="middle" font-family="Georgia,serif" font-size="16" font-weight="700" fill="{PA}">7</text>',
     "check":f'<rect x="34" y="-40" width="30" height="36" rx="4" fill="{PA}" {k}/><path d="M40 -28 l4 4 l8 -9 M40 -14 h14" fill="none" stroke="{G}" stroke-width="3" stroke-linecap="round"/>',
     "calendar":f'<rect x="32" y="-40" width="34" height="32" rx="5" fill="{PA}" {k}/><path d="M32 -30 H66" {k}/><text x="49" y="-13" text-anchor="middle" font-family="Georgia,serif" font-size="14" font-weight="700" fill="{INK}">30</text>',
     "trophy":f'<path d="M36 -44 H62 V-32 Q62 -18 49 -16 Q36 -18 36 -32 Z" fill="{GOLD}" {k}/><path d="M49 -16 V-8 M41 -6 H57" {k}/>',
     "phone":f'<rect x="38" y="-46" width="22" height="38" rx="5" fill="{INK}"/><rect x="41" y="-42" width="16" height="26" rx="2" fill="{MINT}"/><circle cx="49" cy="-11" r="2" fill="{PA}"/>',
     "letter":f'<rect x="32" y="-38" width="34" height="24" rx="3" fill="{PA}" {k}/><path d="M33 -37 L49 -24 L65 -37" fill="none" {k}/>',
    }
    ring=f'<circle cx="80" cy="80" r="74" fill="{PA}" {st(3)}/><circle cx="80" cy="80" r="66" fill="none" stroke="{color if color!=GOLD else BR}" stroke-width="2.5" stroke-dasharray="2 5"/><circle cx="80" cy="80" r="56" fill="{MINT}"/>'
    return ring+dog(72,86,0.62,"grin" if pose in ("bolt","trophy","flame3","flame7") else "smile",color if color!=GOLD else G,"right",props[pose])

def logo():
    return f'<circle cx="80" cy="80" r="76" fill="{MINT}" {st(4)}/>'+dog(80,82,0.95,"smile",G,"down")


MUG=f'<g transform="translate(1 26)"><path class="a-steam" d="M-4 -16 q3 -5 0 -10 M4 -16 q3 -5 0 -10" fill="none" stroke="{BR}" stroke-width="2.5" stroke-linecap="round"/><rect x="-10" y="-11" width="20" height="17" rx="4" fill="{PA}" {st(2.5)}/><path d="M10 -7 q8 0 8 5 q0 5 -8 5" fill="none" {st(2.5)}/></g>'
OPENBOOK=f'<g transform="translate(0 30)"><path d="M-30 -6 Q-15 -14 0 -6 Q15 -14 30 -6 V10 Q15 2 0 10 Q-15 2 -30 10 Z" fill="{PA}" {st(3)}/><path d="M0 -6 V10" {st(2)}/></g>'
def hero(tod):
    """Dog-Ear for the home hero, by time of day."""
    if tod=="morning": inner=dog(62,70,1,"smile",G,"hold",MUG)
    elif tod=="day": inner=dog(60,70,1,"smile",G,"wave")
    elif tod=="evening": inner=f'<circle cx="104" cy="22" r="10" fill="{GOLD}" opacity=".8"/>'+dog(62,70,1,"calm",G,"hold",OPENBOOK)
    else: inner=f'<path d="M104 14 a12 12 0 1 0 12 16 a9 9 0 1 1 -12 -16z" fill="{GOLD}" {st(2)}/><text class="a-zz" x="92" y="52" font-family="Georgia,serif" font-size="16" fill="{INK}">z</text>'+dog(60,74,1,"sleep",G2,"down",blink=False)
    return svg(inner,"0 0 130 130","art")
def peek():
    return svg(dog(60,74,1,"smile",G,"wave"),"0 0 120 112","art")
def react(win):
    return svg(dog(70,74,1,"grin",G,"up") if win else dog(70,76,1,"o",G2,"down"),"0 0 140 130","art")
def lost():
    page=f'<g transform="translate(128 132) rotate(14)"><path d="M-18 -24 H12 L18 -18 V24 H-18 Z" fill="{PA}" {st(2.5)}/><path d="M-10 -10 h20 M-10 -2 h20 M-10 6 h12" stroke="{INK}" stroke-width="2" opacity=".5"/></g>'
    return svg(f'<path d="M20 170 Q100 150 180 170" fill="none" {st(3)}/>'+page+f'<text x="150" y="70" font-family="Georgia,serif" font-size="40" fill="{BR}" stroke="{INK}" stroke-width="1.5">?</text>'+dog(80,104,0.95,"o",G,"right"))
