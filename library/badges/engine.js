/* The Useful Library badges engine (Raja, approved 17-18 Nov 2026). Runs on every Library page and stores everything on this device
   (localStorage "tul-bdg"). It reads the Library's own saved progress (lib:shelf, lib:read, lib:check, lib:test, lib:game, lib:ch)
   and asks the Worker only for what it can't see itself (friends who opened your share links, rarity). Free: no Claude or API credit.
   Streak: 1 reading action a day: open Today's idea, tick a day in a 30-day test, finish a checklist, mark a book read or play the game.
   Weekends are bonus days. Every 7 days earns 1 Hold My Place (hold up to 2), used by itself on a missed weekday.
   A broken streak of 3+ can be repaired once every 30 days: 2 actions within 2 weekdays bring it all back.
   Everyday unlocks ink in a small card; big ones (First Edition, secret, limited, 30/100/365-day titles) get the Pop-up Book, 1 per visit. */
const API = "/apps/api/badges/", KEY = "tul-bdg", SITE = "lib", PAGE = "/library/shelf/";
const V = new URL(import.meta.url).searchParams.get("v") || "1";
const ls = { get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { setRaw.call(localStorage, k, JSON.stringify(v)); } catch (e) {} } };
const setRaw = Storage.prototype.setItem;
function did() { let d = ls.get("tul-did", ""); if (!d) { d = "L" + [...crypto.getRandomValues(new Uint8Array(12))].map(b => b.toString(36).padStart(2, "0")).join("").slice(0, 21); ls.set("tul-did", d); } return d; }
const pad = n => String(n).padStart(2, "0");
const dayOf = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseDay = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const addDays = (s, n) => { const d = parseDay(s); d.setDate(d.getDate() + n); return dayOf(d); };
const isWeekend = s => { const w = parseDay(s).getDay(); return w === 0 || w === 6; };
const between = (a, b) => Math.round((parseDay(b) - parseDay(a)) / 864e5);
const weekOf = (s = dayOf()) => { const d = parseDay(s), t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const w = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - w); const y = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)); return t.getUTCFullYear() + "-" + Math.ceil(((t - y) / 864e5 + 1) / 7); };
const hash = s => { let h = 0; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };

/* which count drives each badge, and the 4 level thresholds */
export const RULES = {
  marg: { src: "shelved", lv: [1, 3, 8, 15], star: 1 },
  dog: { src: "dog", lv: [1, 3, 8, 15] },
  cat: { src: "search", lv: [1, 5, 20, 60], star: 1 },
  field: { src: "field", lv: [1, 5, 20, 60], star: 1 },
  lend: { src: "lend", lv: [1, 3, 10, 25] },
  habit: { src: "a_habits", lv: [1, 3, 6, 10] },
  dnd: { src: "a_focus", lv: [1, 3, 6, 10] },
  interest: { src: "a_money", lv: [1, 3, 6, 10] },
  weather: { src: "a_mindset", lv: [1, 3, 6, 10] },
  twist: { src: "twist", lv: [1, 3, 8, 15] },
  shelfl: { src: "people", lv: [3, 10, 20, 35] },
  turner: { src: "games", lv: [5, 15, 40, 100] },
  wings: { src: "wings", lv: [1, 4, 12, 52] },
  flower: { src: "flower", one: 1 },
  exlib: { src: "exlib", one: 1 },
  oil: { src: "night", one: 1 },
  fresh: { src: "fresh", one: 1 },
  last: { src: "last", one: 1 },
};
export const UNITS = { marg: ["book on your shelf", "books on your shelf"], dog: ["book revisited", "books revisited"], cat: ["search in your words", "searches in your words"], field: ["test day or checklist", "test days and checklists"], lend: ["friend who opened your link", "friends who opened your links"], habit: ["habits idea", "habits ideas"], dnd: ["focus idea", "focus ideas"], interest: ["money idea", "money ideas"], weather: ["mindset idea", "mindset ideas"], twist: ["surprise", "surprises"], shelfl: ["shelf browsed", "shelves browsed"], turner: ["day played", "days played"], wings: ["week on both sites", "weeks on both sites"] };
export const HOW = { marg: "Tap “Add to my shelf” on any book", dog: "Open a book from your shelf again, a day or more later", cat: "Search in your own words, not a suggestion", field: "Tick a day in a 30-day test, or finish a “try it today” checklist", lend: "Share a book or idea. It counts when a friend opens your link", habit: "Read a habits book, idea or problem to the end", dnd: "Read a focus book, idea or problem to the end", interest: "Read a money book, idea or problem to the end", weather: "Read a mindset book, idea or problem to the end", twist: "Tap “This surprised me” on a test result or Today’s idea", shelfl: "Look at other readers’ shelves", turner: "Play the Mystery Book on different days", wings: "Do 1 thing on The Useful Apps and the Library in the same week" };
export const GO = { marg: "/library/books/", dog: "/library/shelf/#saved", cat: "/library/#q", field: "/library/problems/", lend: "/library/books/", habit: "/library/habits/", dnd: "/library/focus/", interest: "/library/money/", weather: "/library/mindset/", twist: "/library/#today", shelfl: "/library/people/", turner: "/library/game/", wings: "/apps/" };
export const TITLES = [[3, "Visitor"], [7, "Card Holder"], [30, "Regular"], [100, "Librarian"], [365, "Archivist"]];
export const FRESH = { from: "2027-01-01", to: "2027-01-07" };
export const LVN = ["Paperback", "Hardcover", "Clothbound", "First Edition"];

function blank() { return { v: 1, first: dayOf(), days: [], acts: {}, streak: 0, best: 0, last: null, freezes: 0, saved: [], broken: null, repairs: [], pledge: null, have: {}, queue: [], loc: { search: [], dog: [], people: [], twist: [], flower: [], ideas: {}, wings: [], night: 0, fresh: 0, shelvedAt: {} }, srv: {}, email: null, initial: "", lastSync: 0, lastMe: 0 }; }
export function load() { const s = ls.get(KEY, null); if (!s || s.v !== 1) return blank(); const b = blank(); return { ...b, ...s, loc: { ...b.loc, ...(s.loc || {}) }, srv: s.srv || {} }; }
export function save(s) {
  s.t = Date.now(); ls.set(KEY, s);
  // a compact copy under lib:bdg rides along with "Save my progress" (email + PIN), which syncs every lib: key up to 4000 characters
  const L = s.loc, c = { t: s.t, first: s.first, days: s.days.slice(-30), streak: s.streak, best: s.best, last: s.last, lastActDay: s.lastActDay, freezes: s.freezes, have: s.have, initial: s.initial, pledge: s.pledge,
    loc: { search: L.search.slice(-30), dog: L.dog, people: L.people, twist: L.twist, flower: L.flower, wings: L.wings, ideas: L.ideas, night: L.night, fresh: L.fresh } };
  let j = JSON.stringify(c); if (j.length > 3900) { c.loc.search = c.loc.search.slice(-5); c.loc.people = c.loc.people.slice(-20); j = JSON.stringify(c); }
  if (j.length <= 3900) try { setRaw.call(localStorage, "lib:bdg", j); } catch (e) {}
}
/* "Save my progress" on a new device brings lib:bdg back: fold it into this device's badges, keeping the bigger of each */
function fromSync() {
  const c = ls.get("lib:bdg", null), s = ls.get(KEY, null); if (!c || (s && (s.t || 0) >= (c.t || 0))) return;
  const cur = s ? load() : blank(), m = { ...cur };
  for (const [k, v] of Object.entries(c.have || {})) if ((m.have[k] || 0) < v) m.have[k] = v;
  if ((c.streak || 0) > (cur.streak || 0)) { m.streak = c.streak; m.last = c.last; m.lastActDay = c.lastActDay; m.days = [...new Set([...(cur.days || []), ...(c.days || [])])].sort().slice(-60); m.freezes = c.freezes; }
  m.best = Math.max(cur.best || 0, c.best || 0); m.first = [cur.first, c.first].filter(Boolean).sort()[0]; m.initial = cur.initial || c.initial || ""; m.pledge = cur.pledge || c.pledge || null;
  for (const k of ["search", "dog", "people", "twist", "flower", "wings"]) m.loc[k] = [...new Set([...(cur.loc[k] || []), ...((c.loc || {})[k] || [])])];
  m.loc.ideas = { ...((c.loc || {}).ideas || {}), ...cur.loc.ideas }; m.loc.night = cur.loc.night || (c.loc || {}).night || 0; m.loc.fresh = cur.loc.fresh || (c.loc || {}).fresh || 0;
  m.queue = []; ls.set(KEY, { ...m, t: c.t });
}

/* walk the calendar from the last action day to today: weekends are free, a missed weekday uses a save or breaks the streak */
export function settle(s, today = dayOf()) {
  if (!s.last || s.last >= today) return s;
  for (let d = addDays(s.last, 1); d < today; d = addDays(d, 1)) {
    if (isWeekend(d)) continue;
    if (s.streak > 0 && s.freezes > 0) { s.freezes--; s.saved.push(d); s.saved = s.saved.slice(-10); s.last = d; s.holdNote = d; continue; }
    if (s.streak > 0) {
      const canRepair = s.streak >= 3 && !(s.repairs || []).some(r => between(r, today) < 30);
      let dl = d, n = 0; while (n < 2) { dl = addDays(dl, 1); if (!isWeekend(dl)) n++; }
      s.broken = { n: s.streak, missed: d, until: dl, acts: 0, ok: canRepair };
      s.streak = 0;
    }
    s.last = d;
  }
  return s;
}
/* 1 reading action now */
export function act(kind) {
  const s = settle(load()), today = dayOf();
  s.acts[today] = (s.acts[today] || 0) + 1;
  const ks = Object.keys(s.acts).sort(); while (ks.length > 14) delete s.acts[ks.shift()];
  if (new Date().getHours() < 4) s.loc.night = 1;
  if (s.broken && s.broken.ok && today <= s.broken.until && today > s.broken.missed) {
    s.broken.acts++;
    if (s.broken.acts >= 2) { s.streak = s.broken.n + (s.streak || 0); s.repairs = [...(s.repairs || []), today].slice(-6); s.repaired = s.broken.n; s.broken = null; }
  } else if (s.broken && today > s.broken.until) s.broken = null;
  if (!s.days.includes(today)) {
    s.days = [...s.days, today].slice(-60);
    s.streak = (s.streak || 0) + 1; s.lastActDay = today;
    if (s.streak > s.best) s.best = s.streak;
    if (s.streak % 7 === 0 && s.freezes < 2) s.freezes++;
  }
  s.last = today; s.lastAct = Date.now(); s.kind = kind;
  wingsCheck(s);
  save(s); evaluate(); sync(true); paintChips();
  return s;
}
/* Both Wings: an action on The Useful Apps and on the Library in the same week (same browser, same site) */
function wingsCheck(s) {
  const apps = ls.get("tua-bdg", null); if (!apps || !apps.days) return;
  const aw = new Set(apps.days.map(weekOf)), lw = new Set(s.days.map(weekOf));
  for (const w of lw) if (aw.has(w) && !s.loc.wings.includes(w)) s.loc.wings.push(w);
}

/* ---------- what the Library already saved on this device ---------- */
let META = null;
async function meta() { if (META) return META; try { META = await fetch("/library/badges/meta.json?v=" + V).then(r => r.json()); } catch (e) { META = { books: {}, checks: {}, ideas: {}, people: [] }; } return META; }
function libKeys(prefix) { const out = []; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.indexOf("lib:" + prefix) === 0) out.push([k.slice(4 + prefix.length), ls.get(k, null)]); } } catch (e) {} return out; }
export function counts(s, M = META || { books: {}, checks: {}, ideas: {} }) {
  const L = s.loc, area = { habits: new Set(), focus: new Set(), money: new Set(), mindset: new Set() };
  const shelved = libKeys("shelf:").filter(([, v]) => v === true).length;
  libKeys("read:").forEach(([k, v]) => { if (v === true && M.books[k] && area[M.books[k]]) area[M.books[k]].add("b:" + k); });
  let checks = 0;
  libKeys("check:").forEach(([k, v]) => { if (Array.isArray(v) && v.length >= 3 && v.every(Boolean)) { checks++; if (M.checks[k] && area[M.checks[k]]) area[M.checks[k]].add("c:" + k); } });
  let testDays = 0; libKeys("test:").forEach(([, v]) => { if (v && v.days) testDays += Object.values(v.days).filter(Boolean).length; });
  for (const [slug, a] of Object.entries(L.ideas || {})) if (area[a]) area[a].add("i:" + slug);
  const games = libKeys("game:").filter(([, v]) => v && (v.won || v.lost)).length;
  const ch = libKeys("ch:"), lic = ch.some(([k, v]) => k === "lic" && v), months = ch.filter(([k, v]) => /^\d\d$/.test(k) && v && v.done).length;
  const longEnough = between(s.first, dayOf()) >= 30 && s.days.length >= 10;
  return {
    shelved, dog: L.dog.length, search: L.search.length, field: testDays + checks, lend: (s.srv && s.srv.lend) || 0,
    a_habits: area.habits.size, a_focus: area.focus.size, a_money: area.money.size, a_mindset: area.mindset.size,
    twist: L.twist.length, people: L.people.length, games, wings: L.wings.length,
    flower: L.flower.length ? 1 : 0, exlib: longEnough ? 1 : 0, night: L.night ? 1 : 0, fresh: L.fresh ? 1 : 0, last: lic && months >= 12 ? 1 : 0,
  };
}
export function levelOf(id, c) { const r = RULES[id], n = c[r.src] || 0; if (r.one) return n >= 1 ? 1 : 0; return r.lv.filter(t => n >= t).length; }
export function progress(id, c, level) {
  const r = RULES[id], n = c[r.src] || 0;
  if (r.one) return { p: n ? 100 : 0, left: n ? 0 : 1, n };
  if (level >= 4) return { p: 100, left: 0, n };
  const lo = level ? r.lv[level - 1] : 0, hi = r.lv[level];
  return { p: Math.max(4, Math.min(96, Math.round(100 * (n - lo) / (hi - lo)))), left: hi - n, n };
}
export function titleOf(n) { let t = null; for (const [d, name] of TITLES) if (n >= d) t = name; return t; }
export function nextTitle(n) { return TITLES.find(([d]) => n < d) || null; }
export const isBig = (id, level) => level === 4 || !!RULES[id].one;

export function evaluate() {
  const s = load(), c = counts(s); let changed = false;
  for (const id of Object.keys(RULES)) {
    const lv = levelOf(id, c), had = s.have[id] || 0;
    if (lv > had) { s.have[id] = lv; changed = true; if (!s.quietFirst) s.queue.push({ id, level: lv, at: Date.now() }); }
  }
  // the first run turns old progress (stamps, tests, games) into badges quietly, without a parade of unlocks
  if (s.quietFirst) { delete s.quietFirst; changed = true; }
  const t = titleOf(s.streak);
  if (t && [30, 100, 365].includes(s.streak) && (s.titleShown || 0) < s.streak) { s.queue.push({ title: t, days: s.streak, at: Date.now() }); s.titleShown = s.streak; changed = true; }
  if (changed) { save(s); setTimeout(showQueue, 400); document.dispatchEvent(new CustomEvent("lib-badges")); }
  return s;
}

/* ---------- Worker ---------- */
let syncT = null;
export async function fetchMe(force) {
  const s = load(); if (!force && Date.now() - (s.lastMe || 0) < 10 * 60e3) return s;
  try { const j = await fetch(API + "me?site=lib&did=" + encodeURIComponent(did())).then(r => r.json()); if (j && j.ok) { const s2 = load(); s2.srv = { ...s2.srv, ...(j.c || {}) }; s2.lastMe = Date.now(); save(s2); evaluate(); return load(); } } catch (e) {}
  return s;
}
export function nearList(s) {
  const c = counts(s), out = [];
  for (const id of Object.keys(RULES)) { if (RULES[id].one) continue; const lv = s.have[id] || 0; if (lv >= 4) continue; const p = progress(id, c, lv); if (p.left >= 1 && p.left <= 2) out.push([id, lv + 1, p.left]); }
  return out;
}
export function sync(soon) {
  clearTimeout(syncT);
  syncT = setTimeout(async () => {
    let s = soon ? await fetchMe(true) : load(); s = load();
    const body = { site: SITE, did: did(), have: s.have, streak: s.streak, best: s.best, lastAct: s.lastAct || 0, tz: -new Date().getTimezoneOffset(), freezes: s.freezes, near: nearList(s), broken: s.broken && s.broken.ok ? s.broken : null };
    try { const j = await fetch(API + "sync", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), keepalive: true }).then(r => r.json()); if (j && j.ok) { const s2 = load(); s2.lastSync = Date.now(); if (j.email !== undefined) s2.email = j.email; if (j.no) s2.srv = { ...s2.srv, no: j.no }; save(s2); } } catch (e) {}
  }, soon ? 2500 : 0);
}
let rarity = null;
export function getRarity() { return rarity || (rarity = fetch(API + "rarity?site=lib").then(r => r.json()).catch(() => ({ total: 0, b: {} }))); }
export function rareText(R, id, level) {
  const t = R && R.total || 0, row = R && R.b && R.b[id];
  if (t < 20 || !row) return "New badge. Be one of the first";
  const n = row[Math.max(0, (level || 1) - 1)] || 0, pc = 100 * n / t, txt = pc < 1 ? "Under 1%" : Math.round(pc) + "%";
  return level > 1 ? `${txt} of readers have ${LVN[level - 1]}` : `${txt} of readers have this`;
}
export async function backup(email) {
  const s = load();
  const j = await fetch(API + "backup", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ site: SITE, did: did(), email, state: { ...s, near: nearList(s) }, tz: -new Date().getTimezoneOffset() }) }).then(r => r.json());
  if (j && j.ok) { const s2 = load(); s2.email = email; if (!s2.initial) s2.initial = email[0].toUpperCase(); save(s2); }
  return j;
}
async function restore() {
  const t = new URLSearchParams(location.search).get("restore"); if (!t || !/^[a-f0-9]{32}$/.test(t)) return;
  try {
    const j = await fetch(API + "restore?t=" + t).then(r => r.json());
    if (j && j.ok && j.state) {
      const cur = load(), got = j.state, merged = { ...cur, ...got, have: { ...(got.have || {}) }, queue: [] };
      for (const [k, v] of Object.entries(cur.have)) if ((merged.have[k] || 0) < v) merged.have[k] = v;
      if (cur.streak > (got.streak || 0)) { merged.streak = cur.streak; merged.last = cur.last; merged.days = cur.days; }
      merged.loc = { ...cur.loc, ...(got.loc || {}) };
      for (const k of ["search", "dog", "people", "twist", "flower", "wings"]) merged.loc[k] = [...new Set([...((got.loc || {})[k] || []), ...(cur.loc[k] || [])])];
      merged.loc.ideas = { ...(got.loc || {}).ideas, ...cur.loc.ideas };
      merged.email = j.email; save(merged);
      if (j.did) ls.set("tul-did", j.did);
      history.replaceState(null, "", location.pathname + "#restored");
      document.dispatchEvent(new CustomEvent("lib-badges", { detail: { restored: true } }));
    }
  } catch (e) {}
}

/* ---------- unlock moments ---------- */
let art = null;
export function loadArt() {
  if (!document.querySelector("link[data-ys-css]")) { const l = document.createElement("link"); l.rel = "stylesheet"; l.href = new URL("./badges.css?v=" + V, import.meta.url).href; l.dataset.ysCss = ""; document.head.appendChild(l); }
  if (!document.getElementById("pencil")) { const d = document.createElement("div"); d.innerHTML = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="pencil" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="7"/><feDisplacementMap in="SourceGraphic" scale="1.4"/></filter></svg>`; document.body.appendChild(d.firstChild); }
  return art || (art = import("./art.js?v=" + V));
}
export const optOf = (s, id) => ({ initial: s.initial || "", no: id === "fresh" && (s.srv.no || {}).fresh ? String(s.srv.no.fresh).padStart(4, "0") : "" });
let showing = false;
export async function showQueue() {
  if (showing) return; const s0 = load(); if (!s0.queue.length) return;
  if (document.visibilityState === "hidden") { addEventListener("visibilitychange", showQueue, { once: true }); return; }
  showing = true;
  const q = s0.queue.splice(0), s = load(); s.queue = []; save(s);
  const A = await loadArt(), R = await getRarity();
  let full = true; try { full = !sessionStorage.getItem("tul-pu"); } catch (e) {}
  const bigs = q.filter(x => x.title || isBig(x.id, x.level)).sort((a, b) => (b.title ? 1 : 0) - (a.title ? 1 : 0)), small = q.filter(x => !bigs.includes(x));
  const one = id => RULES[id].one;
  const name = x => x.title ? `${x.title} (${x.days} days)` : `${A.B[x.id].name}${one(x.id) ? "" : ", " + LVN[x.level - 1]}`;
  const done = () => { showing = false; document.dispatchEvent(new CustomEvent("lib-badges")); if (needInitial()) askInitial(A); };
  if (bigs.length && full) {
    try { sessionStorage.setItem("tul-pu", "1"); } catch (e) {}
    const b = bigs[0], rest = [...bigs.slice(1), ...small].map(name);
    if (b.title) { A.popup("ribbon", "fe", `You are now a ${b.title}`, `${b.days} days in a row. Your ribbon reaches the floor.`, rest, { onClose: done, name: b.title, line: `${b.days} days of reading in a row` }); return; }
    const lv = A.finishOf(b.id, b.level), rare = rareText(R, b.id, b.level);
    A.popup(b.id, lv, one(b.id) ? `${A.B[b.id].name} is yours` : `${A.B[b.id].name} is now a ${LVN[b.level - 1]}`, rare + ".", rest, { ...optOf(s, b.id), onClose: done, line: rare });
    return;
  }
  for (const x of [...bigs, ...small]) await mini(A, R, x, s);
  done();
}
function mini(A, R, x, s) {
  return new Promise(res => {
    const el = document.createElement("div"); el.className = "ys ys-mini"; el.setAttribute("role", "status");
    if (x.title) el.innerHTML = `<div class="ysm"><div class="ysm-t"><b>You are now a ${x.title}</b><span>${x.days}-day streak</span><span class="ysm-b"><a class="ys-btn" href="${PAGE}">See your shelf</a></span></div><button type="button" class="ysm-x" aria-label="Close">×</button></div>`;
    else {
      const b = A.B[x.id], lv = A.finishOf(x.id, x.level);
      el.innerHTML = `<div class="ysm"><div class="ysm-a"><div class="ysm-sk">${A.sketch(x.id, 60)}</div><div class="ysm-so">${A.solid(x.id, lv, .62, "", optOf(s, x.id))}</div></div><div class="ysm-t"><b>${b.name} ${RULES[x.id].one ? "is yours" : "inked in"}</b><span>${A.FIN[lv]}. ${rareText(R, x.id, x.level)}.</span><span class="ysm-b"><button type="button" class="ys-btn" data-share>Share</button><a class="ys-btn ghost" href="${PAGE}">See your shelf</a></span></div><button type="button" class="ysm-x" aria-label="Close">×</button></div>`;
    }
    document.body.appendChild(el);
    requestAnimationFrame(() => { el.classList.add("in"); setTimeout(() => el.classList.add("won"), 700); });
    const close = () => { el.classList.remove("in"); setTimeout(() => { el.remove(); res(); }, 400); };
    const t = setTimeout(close, 6500);
    el.addEventListener("click", async e => {
      if (e.target.closest(".ysm-x")) { clearTimeout(t); close(); }
      if (e.target.closest("[data-share]")) { clearTimeout(t); const lv = A.finishOf(x.id, x.level); const cv = await A.shareCanvas(x.id, lv, rareText(R, x.id, x.level), optOf(s, x.id)); const a = document.createElement("a"); a.href = cv.toDataURL("image/png"); a.download = x.id + ".png"; a.click(); close(); }
    });
    A.bindTilt(el);
  });
}
/* Ex Libris draws your initial on the bookplate: ask for 1 letter if there's no backup email to take it from */
const needInitial = () => { const s = load(); return s.have.exlib && !s.initial; };
function askInitial(A) {
  if (document.querySelector(".ys-init")) return;
  const el = document.createElement("div"); el.className = "ys ys-mini ys-init"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Your initial for Ex Libris");
  el.innerHTML = `<div class="ysm"><div class="ysm-t"><b>Your bookplate needs an initial</b><span>Ex Libris draws 1 letter on it. Pick yours.</span><form class="ysm-f"><input maxlength="1" aria-label="Your initial" autocomplete="off" required pattern="[A-Za-z]"><button class="ys-btn">Add it</button></form></div><button type="button" class="ysm-x" aria-label="Close">×</button></div>`;
  document.body.appendChild(el); requestAnimationFrame(() => el.classList.add("in", "won"));
  el.querySelector(".ysm-x").onclick = () => el.remove();
  el.querySelector("form").onsubmit = e => { e.preventDefault(); const v = el.querySelector("input").value.trim().toUpperCase(); if (!/^[A-Z]$/.test(v)) return; const s = load(); s.initial = v; save(s); el.remove(); document.dispatchEvent(new CustomEvent("lib-badges")); };
}

/* ---------- what each page counts for ---------- */
function watchStorage() {
  // the Library saves progress under lib:*; react to the writes that are reading actions
  Storage.prototype.setItem = function (k, v) {
    let before = null; const watch = this === localStorage && typeof k === "string" && /^lib:(read:|check:|test:|game:|ch:\d|shelf:)/.test(k);
    if (watch) before = this.getItem(k);
    setRaw.call(this, k, v);
    if (watch && before !== v) { burst.push([k, before, v]); clearTimeout(burstT); burstT = setTimeout(flush, 400); }
  };
}
// a restore from "Save my progress" writes many keys at once: that's old progress coming back, not reading done now
let burst = [], burstT = null;
function flush() { const b = burst; burst = []; if (b.length > 3) { evaluate(); return; } for (const [k, was, now] of b) try { onLib(k, was ? JSON.parse(was) : null, JSON.parse(now)); } catch (e) {} }
function onLib(k, was, now) {
  const s = load();
  if (/^lib:shelf:/.test(k) && now === true) { s.loc.shelvedAt[k.slice(10)] = Date.now(); save(s); evaluate(); sync(); return; }
  if (/^lib:read:/.test(k) && now === true) return act("read");
  if (/^lib:check:/.test(k) && Array.isArray(now) && now.length >= 3 && now.every(Boolean) && !(Array.isArray(was) && was.every(Boolean))) return act("check");
  if (/^lib:test:/.test(k) && now) { const n = o => o && o.days ? Object.values(o.days).filter(Boolean).length : 0; if (n(now) > n(was)) return act("test"); if (now.vote && (!was || was.vote !== now.vote)) { twistButtons(); } evaluate(); return; }
  if (/^lib:game:/.test(k) && now && (now.won || now.lost) && !(was && (was.won || was.lost))) return act("game");
  if (/^lib:ch:\d/.test(k) && now) { const n = o => (o && o.days || []).length + (o && o.done ? 1 : 0); if (n(now) > n(was)) return act("challenge"); }
  evaluate();
}
function pageHooks() {
  const p = location.pathname, s = settle(load()), today = dayOf(); let ch = false, m;
  const add = (k, v) => { if (!s.loc[k].includes(v)) { s.loc[k].push(v); if (s.loc[k].length > 400) s.loc[k].shift(); ch = true; } };
  if ((m = p.match(/^\/library\/people\/([a-z0-9-]+)\/$/))) add("people", m[1]);
  if ((m = p.match(/^\/library\/books\/([a-z0-9-]+)\/$/)) && ls.get("lib:shelf:" + m[1], false)) {
    const at = s.loc.shelvedAt[m[1]] || 0; if (Date.now() - at >= 20 * 3600e3) add("dog", m[1]);
  }
  if (today >= FRESH.from && today <= FRESH.to && !s.loc.fresh) { s.loc.fresh = 1; ch = true; }
  if (!s.first || s.first > today) { s.first = today; ch = true; }
  save(s);
  if ((m = p.match(/^\/library\/ideas\/([a-z0-9-]+)\/$/))) readIdea(m[1]);
  evaluate();
}
/* Today's idea: reading it (8 seconds in view, or opening it) is the everyday streak action */
async function readIdea(slug) {
  const M = await meta(), a = (M.ideas[slug] || "").toLowerCase(), s = load();
  if (!s.loc.ideas[slug]) { s.loc.ideas[slug] = a || "habits"; save(s); }
  act("idea");
}
function todayCard() {
  const t = document.querySelector("[data-today]"); if (!t) return;
  const slugOf = () => { const u = (t.querySelector("[data-i-url]") || {}).href || ""; const m = u.match(/ideas\/([a-z0-9-]+)\/|idea=([a-z0-9-]+)/); return m ? (m[1] || m[2]) : null; };
  let timer = null;
  const io = new IntersectionObserver(es => { for (const e of es) { if (e.isIntersecting && e.intersectionRatio > .5) { if (!timer) timer = setTimeout(() => { const sl = slugOf(); if (sl) readIdea(sl); io.disconnect(); }, 8000); } else { clearTimeout(timer); timer = null; } } }, { threshold: [0, .5, 1] });
  io.observe(t);
  t.addEventListener("click", e => { if (e.target.closest("[data-i-url]")) { const sl = slugOf(); if (sl) readIdea(sl); } });
  // the streak chip under Today's idea
  const chip = document.createElement("a"); chip.className = "ys-chip"; chip.href = PAGE; chip.dataset.ysChip = ""; t.appendChild(chip);
  paintChips();
  // the pledge reward: tomorrow's idea, 1 day early
  const s = load();
  if (s.pledge && s.pledge.kept) { const el = document.getElementById("ideas"); try { const I = JSON.parse(el.textContent), d = new Date(); d.setHours(0, 0, 0, 0); const di = Math.round((d - new Date(2026, 10, 12)) / 864e5) + 1, nx = I[((di % I.length) + I.length) % I.length]; const a = document.createElement("a"); a.className = "ys-early"; a.href = "/library/?idea=" + nx.slug + "#today"; a.textContent = "Pledge kept: read tomorrow’s idea a day early"; t.appendChild(a); } catch (e) {} }
}
export function paintChips() {
  const s = settle(load()), st = s.streak || 0, done = s.days.includes(dayOf());
  document.querySelectorAll("[data-ys-chip]").forEach(a => {
    a.innerHTML = `<svg viewBox="0 0 12 16" width="11" height="15" aria-hidden="true"><path d="M1 0h10v16l-5-4-5 4z" fill="#7E1F35"/></svg><span>${st ? `${st}-day streak. ${done ? "Your ribbon grew today." : "Read this to keep it going."}` : "Read this and your reading streak starts today."}</span>`;
  });
}
/* Card Catalog: a search typed in your own words (not a suggestion pill) */
function searchHook() {
  document.addEventListener("input", e => {
    const i = e.target; if (!i.closest || !i.closest("[data-search]") || i.tagName !== "INPUT") return;
    clearTimeout(i._ys); i._ys = setTimeout(() => {
      const q = i.value.trim().toLowerCase().replace(/\s+/g, " "); if (q.length < 4 || q.split(" ").length < 2) return;
      const s = load(); if (s.loc.search.some(x => x === q || q.startsWith(x) || x.startsWith(q))) { s.loc.search = s.loc.search.filter(x => !(q.startsWith(x) && x !== q)); if (!s.loc.search.includes(q)) s.loc.search.push(q); save(s); return; }
      s.loc.search.push(q); s.loc.search = s.loc.search.slice(-200); save(s); evaluate(); sync();
    }, 1500);
  });
}
/* Plot Twist: "This surprised me" under a 30-day test result and on Today's idea */
function twistButtons() {
  const s = load(), mk = key => { const b = document.createElement("button"); b.type = "button"; b.className = "ys-twist"; b.dataset.ysTwist = key; const on = s.loc.twist.includes(key); b.setAttribute("aria-pressed", String(on)); b.textContent = on ? "Surprised you" : "This surprised me"; return b; };
  document.querySelectorAll("[data-test]").forEach(box => { const v = box.querySelector("[data-voted]"); const t = ls.get("lib:test:" + box.getAttribute("data-test"), null); if (!v || !t || !t.vote || box.querySelector("[data-ys-twist]")) return; v.appendChild(mk("t:" + box.getAttribute("data-test"))); });
  const today = document.querySelector("[data-today]");
  if (today && !today.querySelector("[data-ys-twist]")) { const u = (today.querySelector("[data-i-url]") || {}).href || "", m = u.match(/ideas\/([a-z0-9-]+)\/|idea=([a-z0-9-]+)/); if (m) { const st = today.querySelector("[data-i-steps]"); (st ? st.parentNode : today).insertBefore(mk("i:" + (m[1] || m[2])), st ? st.nextSibling : null); } }
}
document.addEventListener("click", e => {
  const b = e.target.closest && e.target.closest("[data-ys-twist]"); if (!b) return;
  const s = load(), k = b.dataset.ysTwist; if (s.loc.twist.includes(k)) return;
  s.loc.twist.push(k); save(s); b.setAttribute("aria-pressed", "true"); b.textContent = "Surprised you"; evaluate(); sync();
});
/* Pressed Flower: each week 1 book page hides a tiny pressed flower */
async function flower() {
  const m = location.pathname.match(/^\/library\/books\/([a-z0-9-]+)\/$/); if (!m) return;
  const M = await meta(), books = Object.keys(M.books).sort(), wk = weekOf(), s = load();
  if (!books.length || s.loc.flower.includes(wk) || books[hash("flower" + wk) % books.length] !== m[1]) return;
  const host = document.querySelector("main .verdict, main h1") || document.querySelector("main"); if (!host) return;
  const b = document.createElement("button"); b.type = "button"; b.className = "ys-flower"; b.setAttribute("aria-label", "Something is pressed between these pages");
  b.innerHTML = `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><g fill="none" stroke="#7A3F68" stroke-width="1.2"><path d="M12 22V11"/><path d="M12 11c-3-5 3-5 0 0M12 11c5-2 5 4 0 0M12 11c-5-2-5 4 0 0" fill="rgba(170,90,140,.45)"/><path d="M12 17c-2 0-3-2-3-3M12 15c2 0 3-2 3-3" stroke="#5E7A4E"/></g></svg>`;
  host.appendChild(b);
  b.addEventListener("click", () => { const s2 = load(); if (!s2.loc.flower.includes(wk)) s2.loc.flower.push(wk); save(s2); b.classList.add("got"); setTimeout(() => b.remove(), 600); evaluate(); sync(); });
}
/* Lending Library: share links carry your device tag; a friend opening it on another device counts once */
function lending() {
  const u = new URL(location.href), r = u.searchParams.get("r");
  if (r && /^L[a-z0-9]{8,30}$/i.test(r)) {
    u.searchParams.delete("r"); history.replaceState(null, "", u.pathname + u.search + u.hash);
    if (r !== did()) fetch(API + "ref", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ site: SITE, owner: r, did: did(), page: u.pathname }), keepalive: true }).catch(() => {});
  }
  window.LibShareTag = () => did();
}
/* the game page shows the reading streak instead of the old solve streak */
function gamePage() {
  const st = document.querySelector("[data-streak]"), fl = document.querySelector("[data-freeze-line]"), stats = document.querySelector("[data-stats]");
  if (!st && !fl && !stats) return;
  const paint = () => {
    const s = settle(load());
    if (st) st.textContent = s.streak + (s.streak === 1 ? " day" : " days");
    if (fl) fl.innerHTML = s.freezes ? `<span class="freeze-chip">${s.freezes} Hold My Place ${s.freezes === 1 ? "save" : "saves"}</span> Miss a weekday and your reading streak stays.` : "Every 7 days of reading streak earns 1 Hold My Place save.";
    if (stats) stats.querySelectorAll(".stat").forEach(el => { const l = el.querySelector("span"), b = el.querySelector("b"); if (!l || !b) return; if (l.textContent === "Streak") b.textContent = s.streak; if (l.textContent === "Best") b.textContent = s.best; });
  };
  paint(); [st, fl, stats].filter(Boolean).forEach(n => new MutationObserver(() => { if (n._p) return; n._p = 1; paint(); setTimeout(() => n._p = 0, 0); }).observe(n, { childList: true, subtree: true, characterData: true }));
  document.addEventListener("lib-badges", paint);
}
export function start() {
  if (start.done) return; start.done = 1;
  watchStorage(); did(); fromSync();
  if (!ls.get(KEY, null)) { const s = blank(); s.quietFirst = 1; save(s); }
  window.LibBadges = { act, load, evaluate, streak: () => settle(load()).streak };
  window.LibBadgesMod = { RULES, UNITS, HOW, GO, TITLES, FRESH, LVN, load, save, settle, counts, progress, titleOf, nextTitle, nearList, sync, fetchMe, getRarity, rareText, backup, loadArt, optOf, act };
  const go = async () => {
    lending(); await restore(); await meta();
    pageHooks(); searchHook(); todayCard(); twistButtons(); flower(); gamePage();
    if (document.querySelector("[data-ys-page]")) import("./shelf.js?v=" + V);
    fetchMe(false).then(() => { const s = load(); if (Date.now() - (s.lastSync || 0) > 60 * 60e3) sync(false); });
    showQueue();
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", go); else go();
}
start();
