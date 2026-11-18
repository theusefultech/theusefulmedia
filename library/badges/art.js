/* The Useful Library badges: the 18 drawings and how they are drawn (Raja, approved 17-18 Nov 2026).
   "Sketch to Solid": a locked badge is a pencil sketch with margin notes, an earned one is a book-object in its binding.
   Bindings: Paperback, Hardcover, Clothbound, First Edition. Secret badges are vellum, limited ones hand-numbered bookplates.
   Big unlocks get the Pop-up Book. Everything runs in the browser, free. */
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const R=(x,y,w,h,r)=>`M${x+r} ${y}H${x+w-r}A${r} ${r} 0 0 1 ${x+w} ${y+r}V${y+h-r}A${r} ${r} 0 0 1 ${x+w-r} ${y+h}H${x+r}A${r} ${r} 0 0 1 ${x} ${y+h-r}V${y+r}A${r} ${r} 0 0 1 ${x+r} ${y}Z`;
const C=(cx,cy,r)=>`M${cx-r} ${cy}a${r} ${r} 0 1 0 ${2*r} 0a${r} ${r} 0 1 0 ${-2*r} 0Z`;
const T=(x,y,s,size)=>({x,y,s,size});const N=(x,y,t,a)=>({x,y,t,a});
export const B={
 marg:{name:'Marginalia',how:'Leave yourself a note',cat:'start',star:1,rare:'46%',lv:[1,5,20,60],unit:'ideas saved',
  sil:[R(22,16,76,90,5)],glyph:[R(22,16,76,90,5),'M32 32H72','M32 42H76','M32 52H68','M32 62H74','M32 72H62','M32 82H70','M84 30V58','M82 74q3-5 6 0t6 0','M83 86l8-4'],
  sk:['M100 96L114 82l4 4-14 14z','M100 96l-2 6 6-2'],cons:['M60 8V112','M14 61H106'],
  notes:[N(-22,20,'pencil first','M0 24q14 2 30 8'),N(92,16,'yes!','M98 20q-4 4-10 10'),N(-20,108,'pressed in later','M8 102q12-6 22-14')],
  callouts:{0:'Line of text',6:'Margin note'}},
 dog:{name:'Dog-Ear',how:'Come back to something you saved',cat:'start',rare:'31%',lv:[1,5,20,60],unit:'ideas revisited',
  sil:['M22 16H78L98 36V106H22Z'],glyph:['M22 16H78L98 36V106H22Z','M78 16V36H98','M32 50H84','M32 60H80','M32 70H86','M32 80H70','M32 90H78'],
  sk:['M66 8q18 0 28 16','M90 20l4 4 2-6'],cons:['M78 8V44','M70 36H106'],
  notes:[N(-22,22,'fold here','M4 26q30 -10 72 -4'),N(-20,112,'come back tomorrow','M10 106q8-6 18-10')],
  callouts:{0:'Folded corner',2:'The page you came back to'}},
 cat:{name:'Card Catalog',how:'Ask in your own words',cat:'start',star:1,rare:'22%',lv:[1,5,20,60],unit:'searches in your words',
  sil:[R(30,12,60,34,3),R(12,40,96,64,6)],glyph:[R(12,40,96,64,6),R(30,12,60,34,3),'M38 22H82','M38 30H72',R(38,56,44,14,2),R(50,78,20,6,3),'M12 48H108','M18 98H102'],
  tx:[T(60,66,'F to H',8)],sk:['M60 11V5','M56 9l4-4 4 4','M6 108H114'],cons:['M60 6V112'],
  notes:[N(-22,16,'your own words','M2 20q14 0 30 4'),N(80,118,'slides out','M92 112q6-4 8-8')],
  callouts:{0:'Index card',3:'Label holder',4:'Brass pull'}},
 field:{name:'Field Notes',how:'Test yourself on an idea',cat:'start',star:1,rare:'39%',lv:[1,5,20,60],unit:'tests done',
  sil:[R(24,14,72,92,6)],glyph:[R(24,14,72,92,6),'M24 28H96','M36 38V88','M36 88H86','M44 86V70','M56 86V58','M68 86V48','M80 86V62','M44 64L56 52L68 42L80 56'],
  sk:['M30 14v-6','M42 14v-6','M54 14v-6','M66 14v-6','M78 14v-6','M90 14v-6','M100 98L114 84l4 4-14 14z','M100 98l-2 6 6-2'],cons:['M60 6V112','M14 88H106'],
  notes:[N(-22,22,'my result','M2 26q16 6 30 28'),N(-20,112,'bars rise','M8 106q14-4 32-14')],
  callouts:{0:'Notebook',4:'Result bar'}},
 lend:{name:'Lending Library',how:'Pass an idea to a friend',cat:'start',rare:'5%',lv:[1,3,10,25],unit:'friends who opened your link',
  sil:[R(18,16,84,92,4)],glyph:[R(18,16,84,92,4),'M18 34H102','M52 34V108','M26 48H44','M60 48H92','M26 62H44','M60 62H86','M26 76H44',C(78,86,14)],
  tx:[T(60,29,'date due',9),T(78,89,'due',9)],sk:['M78 70V56','M70 56H86','M74 48h8v8h-8z'],cons:['M60 8V112','M10 86H110'],
  notes:[N(-22,20,'you shared it','M2 24q12 2 18 8'),N(84,118,'thump','M96 112q2-6 -4-12')],
  callouts:{0:'Due-date card',8:'Date stamp'}},
 habit:{name:'Habit Loop',how:'Finish the habits ideas',cat:'areas',rare:'14%',lv:[1,3,6,10],unit:'habits ideas finished',
  sil:[R(24,14,72,92,5)],glyph:[R(24,14,72,92,5),'M60 14V32','M60 32a24 24 0 1 1-21 13','M33 38l6 7 7-4','M74 74L84 104l-5-3-3 5'],
  sk:['M90 44q6 12 0 26','M88 66l2 4 4-2'],cons:['M60 6V112','M14 56H106'],
  notes:[N(-22,20,'every day','M2 24q14 4 26 22'),N(78,116,'tighter each level','M90 110q-2-4-4-6')],
  callouts:{0:'Page',2:'Loop'}},
 dnd:{name:'Do Not Disturb',how:'Finish the focus ideas',cat:'areas',rare:'11%',lv:[1,3,6,10],unit:'focus ideas finished',
  sil:['M40 18H80L94 50H26Z',R(56,50,8,46,2),R(34,96,52,12,5)],glyph:['M40 18H80L94 50H26Z',R(56,50,8,46,2),R(34,96,52,12,5),'M48 50q12 12 24 0','M30 42H90','M82 50v12',C(82,65,2.5)],
  sk:['M30 56L16 88','M90 56L104 88','M44 58L38 92','M76 58L82 92'],cons:['M60 6V112','M14 50H106'],
  notes:[N(-22,18,'click','M2 22q12 4 26 16'),N(72,118,'room fades','M86 112q6-6 14-20')],
  callouts:{0:'Shade',6:'Pull chain'}},
 interest:{name:'Interest',how:'Finish the money ideas',cat:'areas',rare:'9%',lv:[1,3,6,10],unit:'money ideas finished',
  sil:[R(14,92,92,12,3),R(20,70,16,22,2),R(40,56,16,36,2),R(60,40,16,52,2),R(80,22,16,70,2)],
  glyph:[R(14,92,92,12,3),R(20,70,16,22,2),R(40,56,16,36,2),R(60,40,16,52,2),R(80,22,16,70,2),'M20 76H36','M40 62H56','M40 84H56','M60 46H76','M60 82H76','M80 28H96','M80 60H96','M80 84H96'],
  sk:['M14 62L72 20','M64 18l8 2-2 8'],cons:['M14 92H106','M60 6V112'],
  notes:[N(-22,24,'compounding','M4 30q8 10 18 34'),N(86,116,'+1 book','M100 110q2-4 0-8')],
  callouts:{0:'Plinth',4:'Tallest stack'}},
 weather:{name:'Weather Inside',how:'Finish the mindset ideas',cat:'areas',rare:'7%',lv:[1,3,6,10],unit:'mindset ideas finished',
  sil:[C(60,50,36),'M34 80H86L94 106H26Z'],glyph:[C(60,50,36),'M34 80H86L94 106H26Z','M30 94H90','M46 72V60H70V72','M44 72H72','M78 72V52','M72 52H84L81 46H75Z','M40 30H54V44H40Z','M47 30V44'],
  sk:['M50 22q4-8 12-4q6-6 12 2q8 0 6 8','M68 36l2 2','M86 40l2 2','M36 54l2 2','M58 50l2 2'],cons:['M60 6V112','M14 50H106'],
  notes:[N(-22,20,'stormy at first','M2 24q12 4 22 14'),N(84,118,'clears','M96 112q-2-6-6-8')],
  callouts:{0:'Glass globe',3:'Tiny reading chair'}},
 twist:{name:'Plot Twist',how:'Say when a result surprised you',cat:'reading',rare:'12%',lv:[1,3,10,25],unit:'surprises marked',
  sil:[R(26,14,68,92,5)],glyph:[R(26,14,68,92,5),'M60 14V30','M48 44q0-14 12-14t12 12q0 9-12 14V72','M56 72H64L60 80Z',C(60,90,3),'M36 26H50','M70 26H84'],
  sk:['M100 18v14','M100 38v2'],cons:['M60 6V112'],
  notes:[N(-22,20,'wait, what?','M2 24q14 2 26 12'),N(74,116,'curls up','M90 110q-6-14-16-40')],
  callouts:{0:'Page',2:'Ribbon'}},
 shelfl:{name:'Shelf Life',how:'Browse other readers’ shelves',cat:'reading',rare:'19%',lv:[5,15,30,50],unit:'shelves browsed',
  sil:[R(10,28,100,72,5)],glyph:[R(10,28,100,72,5),'M16 90H104',R(22,48,10,42,2),R(34,40,12,50,2),R(48,52,10,38,2),R(60,44,12,46,2),'M76 90L86 54l8 3-10 33','M34 48H46','M60 52H72'],
  sk:['M98 88V60','M98 56v-2'],cons:['M10 90H110','M60 14V104'],
  notes:[N(-22,22,'their shelf','M2 26q14 2 24 14'),N(76,116,'+1 spine each','M92 110q6-6 6-20')],
  callouts:{0:'Bookcase',6:'Leaning book'}},
 turner:{name:'Page Turner',how:'Play the Library game on 5 days',cat:'reading',rare:'16%',lv:[5,15,40,100],unit:'days played',
  sil:[R(22,20,76,86,4)],glyph:[R(22,20,76,86,4),'M22 106Q48 76 98 70','M22 106Q42 62 92 44','M22 106Q36 52 76 24','M22 106Q30 48 52 20','M88 20V64','M93 20V60'],
  sk:['M100 30q6 6 4 14','M104 52q4 4 2 10'],cons:['M22 8V112','M14 106H106'],
  notes:[N(-22,20,'flick','M2 24q8 4 16 12'),N(72,118,'5 days played','M88 112q2-6 0-12')],
  callouts:{0:'Flip book',2:'Page in motion'}},
 wings:{name:'Both Wings',how:'Use Apps and the Library in one week',cat:'reading',rare:'8%',lv:[1,4,12,52],unit:'weeks on both sites',
  sil:[R(10,32,100,68,5)],glyph:[R(10,32,100,68,5),'M16 92H104',R(18,42,12,50,2),R(21,46,6,40,1),R(34,52,10,40,2),R(46,46,12,46,2),R(60,56,10,36,2),R(72,48,12,44,2),R(88,40,14,52,2),'M88 50H102','M88 82H102'],
  sk:['M24 38v-2'],cons:['M10 92H110','M60 18V104'],
  notes:[N(-22,22,'apps','M2 26q8 4 18 14'),N(96,18,'library','M104 24q0 6-6 14'),N(38,118,'same week','M54 112q2-6 4-14')],
  callouts:{1:'Laptop bookend',8:'Book bookend'}},
 flower:{name:'Pressed Flower',how:'Something is pressed between the pages',cat:'secret',secret:1,rare:'3%',
  sil:[R(26,14,68,92,6)],glyph:[R(26,14,68,92,6),'M36 26H84','M36 34H78','M60 96V58','M60 58c-10-16 10-16 0 0','M60 58c16-6 16 12 0 0','M60 58c-16-6-16 12 0 0','M60 80c-8-2-12-8-12-12','M60 74c8-2 12-8 12-12'],
  sk:['M44 50l-6-4','M76 50l6-4'],cons:['M60 6V112'],
  notes:[N(-22,22,'found it','M2 26q14 6 30 26'),N(72,118,'this week only','M86 112q-4-6-10-10')],
  callouts:{0:'Page',3:'Petal'}},
 exlib:{name:'Ex Libris',how:'Stay a while',cat:'secret',secret:1,rare:'4%',
  sil:[R(28,14,64,92,4)],glyph:[R(28,14,64,92,4),R(34,20,52,80,2),'M42 36H78',C(46,88,4),C(60,88,4),C(74,88,4)],
  tx:[T(60,32,'ex libris',8),T(60,70,'?',28)],sk:['M40 106l40 0'],cons:['M60 6V112'],
  notes:[N(-22,20,'your initial','M2 24q14 6 34 30'),N(74,118,'your 3 areas','M88 112q-4-10-14-20')],
  callouts:{0:'Bookplate',3:'Area seal'}},
 oil:{name:'Midnight Oil',how:'Some pages are better late',cat:'secret',secret:1,rare:'6%',
  sil:['M34 104H86L80 86H40Z','M40 86q20-16 40 0Z','M54 82q-10-12-2-26V28h16v28q8 14-2 26Z'],glyph:['M34 104H86L80 86H40Z','M40 86q20-16 40 0Z','M54 82q-10-12-2-26V28h16v28q8 14-2 26Z','M60 72q-5-8 0-16q5 8 0 16','M80 94q14 0 12-12q-2-8-10-6','M46 96H74','M52 28H68'],
  sk:['M96 22a10 10 0 1 0 8 16a8 8 0 1 1-8-16','M30 30l2 2','M86 50l2 2'],cons:['M60 6V112'],
  notes:[N(-22,20,'after midnight','M2 24q14 4 34 34'),N(80,118,'flame steadies','M92 112q-4-6-6-8')],
  callouts:{0:'Base',3:'Flame'}},
 fresh:{name:'Fresh Chapter',how:'Opens 1 Jan 2027 for 7 days',cat:'limited',rare:'Opens 1 Jan',
  sil:[R(22,14,76,92,4)],glyph:[R(22,14,76,92,4),'M98 106Q76 96 72 64Q70 36 98 14','M30 74H60','M30 30H58'],
  tx:[T(46,62,'2027',16)],sk:['M104 50q6 10 0 20','M102 68l2 4 4-2'],cons:['M60 6V112'],
  notes:[N(-22,20,'new year','M2 24q12 6 24 30'),N(80,118,'1 to 7 Jan','M94 112q-2-4-6-8')],
  callouts:{0:'Blank page',1:'Turning leaf'}},
 last:{name:'Last Page',how:'Finish the Reading Challenge',cat:'limited',rare:'0.4%',
  sil:[R(26,14,68,92,4)],glyph:[R(26,14,68,92,4),'M80 14V96l4-4 4 4V14','M36 30H70','M36 38H66','M36 46H70','M36 54H60'],
  tx:[T(52,78,'the end',11)],sk:['M30 106H90'],cons:['M60 6V112'],
  notes:[N(-22,22,'30 days','M2 26q14 4 28 22'),N(76,118,'gold edges','M90 112q4-6 4-8')],
  callouts:{0:'Final page',1:'Ribbon'}},
 ribbon:{name:'Reading streak',how:'Read every day',cat:'title',sil:[R(24,14,72,92,5)],glyph:[R(24,14,72,92,5),'M66 14V96l-7-6-7 6V14','M34 30H50','M34 40H48','M34 50H50','M76 30H86','M76 40H84'],cons:[],notes:[]}
};
export const CATS=[['start','Getting started'],['areas','Life areas'],['reading','Reading habits'],['secret','Secret'],['limited','Rare and limited']];
export const LVN=['Paperback','Hardcover','Clothbound','First Edition'],LVK=['pb','hc','cb','fe'],LV={pb:'Paperback',hc:'Hardcover',cb:'Clothbound',fe:'First Edition'};
const mask=b=>`url(data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'>${b.sil.map(d=>`<path d='${d}'/>`).join('')}</svg>`).replace(/'/g,'%27').replace(/\(/g,'%28').replace(/\)/g,'%29')})`;
export function sketch(id,p){const b=B[id],all=[...b.glyph,...(b.sk||[])],tx=b.tx||[];
  const P=a=>a.map(d=>`<path pathLength="100" d="${d}"/>`).join('');
  const t=tx.map(t=>`<text class="g" x="${t.x}" y="${t.y}" font-size="${t.size}" text-anchor="middle">${t.s}</text>`).join('');
  const n=(b.notes||[]).map(n=>`<text x="${n.x}" y="${n.y}">${n.t}</text><path d="${n.a}"/>`).join('');
  return `<svg class="sk" viewBox="-24 4 168 120" style="--p:${p}" aria-hidden="true"><g class="cons">${(b.cons||[]).map(d=>`<path d="${d}"/>`).join('')}</g>
   <g class="pen" filter="url(#pencil)">${P(all)}${t}</g><g class="pen2" transform="translate(.7 .5)">${P(b.glyph)}</g><g class="ink">${P(b.glyph)}${t}</g><g class="notes">${n}</g></svg>`}
export function solid(id,lv,k=1,extra='',opt={}){const b=B[id];
  const ly=Array.from({length:8},(_,i)=>`<div class="ly" style="--i:${8-i}"></div>`).join('');
  const e=b.glyph.slice(1).map(d=>`<path d="${d}"/>`).join('');
  const tx=(b.tx||[]).map(t=>`<text x="${t.x}" y="${t.y}" font-size="${t.size}" text-anchor="middle">${t.s==='?'&&opt.initial?esc(opt.initial):t.s}</text>`).join('');
  const flower=lv==='vel'?`<div class="ly" style="--i:3;background:none;-webkit-mask:none;mask:none"><svg viewBox="0 0 120 120" style="width:100%;height:100%"><g fill="none" stroke="#7A3F68" stroke-width="2" opacity=".9"><path d="M60 96V54"/><path d="M60 54c-12-20 12-20 0 0M60 54c20-8 20 14 0 0M60 54c-20-8-20 14 0 0" fill="rgba(170,90,140,.55)"/><path d="M60 78c-8-2-12-8-12-12M60 72c8-2 12-8 12-12" stroke="#5E7A4E"/></g></svg></div>`:'';
  const plate=lv==='plate'?`<rect x="${b.sil[0].includes('Z')?34:30}" y="24" width="52" height="76" rx="2" fill="none" stroke="var(--eng)" stroke-width=".8"/><text x="60" y="94" text-anchor="middle" style="font-family:Kalam;font-size:9px;fill:var(--eng)">No. ${esc(opt.no||'____')}</text>`:'';
  const rib=lv==='fe'?'<div class="rbn"></div>':'';
  return `<div class="solid mat-${lv} ${extra}" style="--k:${k};--m:${mask(b)}" data-tilt><div class="shadow"></div><div class="obj">${rib}${ly}${flower}<div class="yface"></div>
   <svg class="eng" viewBox="0 0 120 120" aria-hidden="true">${b.sil.map(d=>`<path class="bev" d="${d}" transform="translate(60 60) scale(.96) translate(-60 -60)"/>`).join('')}
   <g class="h" transform="translate(.7 .9)">${e}${tx}</g><g class="e">${e}${tx}</g>${plate}</svg></div></div>`}


export const finishOf=(id,level)=>B[id].cat==='secret'?'vel':B[id].cat==='limited'?'plate':LVK[Math.max(0,level-1)];
export const FIN={pb:'Paperback',hc:'Hardcover',cb:'Clothbound',fe:'First Edition',vel:'Vellum',plate:'Bookplate'};
export function bindTilt(root=document){root.querySelectorAll('[data-tilt]').forEach(el=>{if(el._t)return;el._t=1;const o=el.querySelector('.obj'),f=el.querySelector('.yface');
  el.addEventListener('pointermove',ev=>{const r=el.getBoundingClientRect(),x=(ev.clientX-r.left)/r.width-.5,y=(ev.clientY-r.top)/r.height-.5;el.classList.add('live');
    o.style.setProperty('--rx',(-y*44)+'deg');o.style.setProperty('--ry',(x*52)+'deg');f.style.setProperty('--mx',(50-x*80)+'%');f.style.setProperty('--my',(50-y*80)+'%')});
  el.addEventListener('pointerleave',()=>{el.classList.remove('live');o.style.removeProperty('--rx');o.style.removeProperty('--ry')})})}
if(typeof document!=='undefined')document.addEventListener('click',e=>{const f=e.target.closest&&e.target.closest('.solid.mat-fe');if(!f)return;f.classList.add('yfan');clearTimeout(f._ft);f._ft=setTimeout(()=>f.classList.remove('yfan'),1400)});

/* ---------- Pop-up Book: the full-screen unlock ---------- */
const RM=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let sound=false,ac,skipped=false,anims=[],pu=null,cur=null;
function tick(f=900,d=.06,v=.15){if(!sound)return;try{ac=ac||new AudioContext();const o=ac.createOscillator(),g=ac.createGain();o.type='triangle';o.frequency.value=f;g.gain.setValueAtTime(v,ac.currentTime);g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+d);o.connect(g).connect(ac.destination);o.start();o.stop(ac.currentTime+d)}catch(e){}}
function overlay(){if(pu)return pu;pu=document.createElement('div');pu.className='ys ys-pu';pu.setAttribute('role','dialog');pu.setAttribute('aria-modal','true');pu.setAttribute('aria-label','Badge unlocked');
  pu.innerHTML=`<div class="ytag">Pop-up Book</div><div class="ctrl"><button type="button" data-snd aria-pressed="false">Sound off</button><button type="button" data-skip>Skip</button></div>
  <div class="yscene"><div class="ytilt"></div><div class="pops"></div><div class="yfinal"></div></div>
  <div class="ytitle"><h2 data-t></h2><p data-sub></p><div class="evb"><button type="button" class="ys-btn" data-share>Get share card</button><button type="button" class="ys-btn ghost" data-close>Put it on the shelf</button></div><div class="yalso" data-also></div></div>
  <div class="sharebox"><img alt="Your share card"><div><a class="ys-btn" data-dl download="badge.png">Download for X or Instagram</a><button type="button" class="ys-btn ghost" data-sx>Close</button></div></div>`;
  document.body.appendChild(pu);
  pu.querySelector('[data-snd]').onclick=e=>{sound=!sound;e.currentTarget.textContent=sound?'Sound on':'Sound off';e.currentTarget.setAttribute('aria-pressed',sound)};
  pu.querySelector('[data-skip]').onclick=()=>{skipped=true;finish()};
  pu.querySelector('[data-close]').onclick=closePU;
  pu.querySelector('[data-sx]').onclick=()=>pu.querySelector('.sharebox').classList.remove('yon');
  pu.querySelector('[data-share]').onclick=async()=>{const cv=await shareCanvas(cur.id,cur.lv,cur.line,cur.opt);const u=cv.toDataURL('image/png');pu.querySelector('.sharebox img').src=u;const a=pu.querySelector('[data-dl]');a.href=u;a.download=cur.id+'.png';pu.querySelector('.sharebox').classList.add('yon')};
  addEventListener('keydown',e=>{if(e.key==='Escape'&&pu.classList.contains('yon'))closePU()});
  return pu}
function closePU(){if(!pu)return;pu.className='ys ys-pu';document.body.style.overflow='';const c=cur;cur=null;if(c&&c.onClose)c.onClose()}
function buildPU(id,lv,opt){const b=B[id],m=mask(b);
  const layers=[{sk:1,y:34},{c:'linear-gradient(150deg,#2A3263,#141834)',y:6,s:1},{y:0,g:1}];
  pu.querySelector('.ytilt').innerHTML=`<div class="spread"><div class="boards"></div><div class="leaf"></div><div class="leaf yr"></div><div class="ycover"><div class="yout">The Useful Library</div><div class="yin"></div></div></div>`;
  pu.querySelector('.pops').innerHTML=layers.map(L=>L.sk?`<div class="pl" style="transform:translateY(${-L.y}px)"><div class="ypcard">${sketch(id,100)}</div></div>`:L.g?`<div class="pl" style="transform:translateY(${-L.y}px)"><svg viewBox="0 0 120 120"><g fill="none" stroke="#E6C56F" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">${b.glyph.slice(1).map(d=>`<path d="${d}"/>`).join('')}</g></svg></div>`
     :`<div class="pl" style="transform:translateY(${-L.y}px)"><div class="ypaper" style="--m:${m};--c:${L.c};transform:scale(${L.s||1})"></div></div>`).join('');
  pu.querySelector('.yfinal').innerHTML=solid(id,lv,2,'',opt||{});}
function typeName(t){const el=pu.querySelector('[data-t]');el.textContent='';if(RM()||skipped){el.textContent=t;return}
  let i=0;const iv=setInterval(()=>{el.textContent=t.slice(0,++i);if(i%3==0)tick(1700,.02,.04);if(i>=t.length)clearInterval(iv)},36)}
export async function popup(id,lv,title,sub,also=[],opt={}){
  overlay();skipped=false;anims=[];cur={id,lv,title,line:opt.line||sub,opt,onClose:opt.onClose};buildPU(id,lv,opt);
  pu.className='ys ys-pu yon';document.body.style.overflow='hidden';
  pu.querySelector('[data-t]').textContent='';pu.querySelector('[data-sub]').textContent=sub||'';
  pu.querySelector('[data-also]').innerHTML=also.length?'You also earned '+also.map(x=>`<span class="chip2">${esc(x)}</span>`).join(' '):'';
  pu.querySelector('.sharebox').classList.remove('yon');pu.querySelector('[data-skip]').style.display='';
  setTimeout(()=>pu.querySelector('[data-close]').focus({preventScroll:true}),50);
  const cover=pu.querySelector('.ycover'),pls=[...pu.querySelectorAll('.pops .pl')],tilt=pu.querySelector('.ytilt');
  if(RM()){pu.animate([{opacity:0},{opacity:1}],{duration:400});finish();return}
  const A=(el,kf,o)=>{const a=el.animate(kf,{fill:'forwards',easing:'cubic-bezier(.3,.7,.2,1)',...o});anims.push(a);return a};
  A(tilt,[{transform:'rotateX(52deg) translateY(30px) scale(.85)',opacity:0},{transform:'rotateX(52deg) translateY(30px) scale(1)',opacity:1}],{duration:400});
  cover.style.transform='translateZ(2px) rotateY(0deg)';
  await sleep(350);if(skipped)return;
  A(cover,[{transform:'translateZ(2px) rotateY(0deg)'},{transform:'translateZ(2px) rotateY(-179.5deg)'}],{duration:900,easing:'cubic-bezier(.5,0,.2,1)'});tick(300,.15,.2);
  await sleep(650);if(skipped)return;
  pls.forEach((p,i)=>{const base=p.style.transform;A(p,[{transform:base+' scaleY(0) skewX(-8deg)',opacity:0},{opacity:1,offset:.12},{transform:base+' scaleY(1.07)',offset:.7,opacity:1},{transform:base+' scaleY(1)',opacity:1}],{duration:800,delay:i*260,easing:'cubic-bezier(.3,.8,.3,1.2)'});setTimeout(()=>tick(500+i*200,.05,.12),i*160+500)});
  await sleep(800+pls.length*260+600);if(skipped)return;
  A(pu.querySelector('.pops'),[{transform:'none'},{transform:'translateY(-20px) scale(1.08)'}],{duration:600});
  await sleep(450);if(skipped)return;finish();
}
function finish(){if(!cur)return;if(skipped){anims.forEach(a=>{try{a.finish()}catch(e){}})}
  pu.classList.add('solidon','ydone');pu.querySelector('[data-skip]').style.display='none';typeName(cur.title);
  const s=pu.querySelector('.yfinal .solid');if(!s)return;bindTilt(pu);s.classList.add('yfan');setTimeout(()=>s.classList.remove('yfan'),1200);
  if(!RM())s.querySelector('.obj').animate([{transform:'rotateX(10deg) rotateY(-30deg)'},{transform:'rotateX(10deg) rotateY(330deg)'}],{duration:14000,iterations:Infinity,delay:1300})}

/* ---------- share card: drawn in the browser, 1080 x 1350 ---------- */
const PAL={pb:['#F5F2EA','#DDD7C8','#A59E8B','#D6CFBC'],hc:['#317058','#1E4D3B','#C9E2D6','#173D2F'],cb:['#64304A','#3E1A28','#E2DFE8','#2E1320'],fe:['#2A3263','#141834','#E6C56F','#10132A'],vel:['#F3F0E8','#DCD6C6','#5D6B57','#CFC8B4'],plate:['#F7F2E5','#E6DEC9','#1E4D3B','#1E4D3B']};
export async function shareCanvas(id,lv,line,opt={}){try{await document.fonts.ready}catch(e){}
  const b=B[id],P=PAL[lv]||PAL.fe,cv=document.createElement('canvas');cv.width=1080;cv.height=1350;const x=cv.getContext('2d');
  const g=x.createRadialGradient(540,560,60,540,600,900);g.addColorStop(0,'#25473A');g.addColorStop(1,'#0E1A15');x.fillStyle=g;x.fillRect(0,0,1080,1350);
  const S=5.2,ox=540-60*S,oy=560-60*S;const Pp=d=>{const p=new Path2D();p.addPath(new Path2D(d),new DOMMatrix([S,0,0,S,ox,oy]));return p};
  x.save();x.filter='blur(26px)';x.fillStyle='rgba(0,0,0,.6)';x.beginPath();x.ellipse(540,960,260,40,0,0,7);x.fill();x.restore();
  for(let i=18;i>0;i--){x.save();x.translate(i*1.6,i*2.2);b.sil.forEach(d=>{let f;if(lv==='fe'){f=x.createLinearGradient(0,oy,0,oy+600);f.addColorStop(0,'#F4DE96');f.addColorStop(.5,'#C79E43');f.addColorStop(1,'#F7E7B0')}else f='#EFE9D9';x.fillStyle=i==18?P[3]:f;x.fill(Pp(d))});x.restore()}
  const fg=x.createLinearGradient(ox,oy,ox+120*S,oy+120*S);fg.addColorStop(0,P[0]);fg.addColorStop(1,P[1]);b.sil.forEach(d=>{x.fillStyle=fg;x.fill(Pp(d))});
  x.lineCap='round';x.lineJoin='round';b.glyph.slice(1).forEach(d=>{x.save();x.translate(3,4);x.strokeStyle='rgba(0,0,0,.35)';x.lineWidth=10;x.stroke(Pp(d));x.restore();x.strokeStyle=P[2];x.lineWidth=10;x.stroke(Pp(d))});
  (b.tx||[]).forEach(t=>{x.fillStyle=P[2];x.font=`700 ${t.size*S}px Kalam`;x.textAlign='center';x.fillText(t.s==='?'&&opt.initial?opt.initial:t.s,ox+t.x*S,oy+t.y*S)});
  x.fillStyle='#fff';x.textAlign='center';x.font='400 84px "DM Serif Display"';x.fillText(opt.name||b.name,540,1095);
  x.font='600 38px Manrope';x.fillStyle='rgba(255,255,255,.75)';x.fillText((opt.name?'':(FIN[lv]||'')+'. ')+(line||'').replace(/\.$/,'')+'.',540,1155);
  x.font='400 34px Kalam';x.fillStyle='rgba(255,255,255,.6)';x.fillText('theusefulmedia.com/library/shelf',540,1262);x.font='400 40px Kalam';x.fillText('it started as a pencil outline',540,150);
  return cv}
