/* Your Shelf: /library/shelf/ (Raja, approved preview 17-18 Nov 2026). The streak ribbon hangs from the top shelf, Next up is an open book
   with the 2 closest badges, earned badges are solid spines in their binding and locked ones pencil outlines. Pull a spine to see its badge;
   on phones the stand opens as a sheet from the bottom. Every shelf row scrolls with touch, mouse drag, arrows and arrow keys. */
const E = window.LibBadgesMod;
const A = await E.loadArt();
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const root = $("[data-ys-page]"), IDS = Object.keys(E.RULES), LVN = E.LVN;
const H = [214, 230, 200, 222, 240, 206, 226, 194, 236, 212], W = [44, 50, 40, 46, 52, 42, 48, 45];
const SHELVES = [[["start", "Getting started"], ["areas", "Life areas"], ["reading", "Reading habits"]], [["secret", "Secret"], ["limited", "Rare and limited"]]];
let R = { total: 0, b: {} }, open = null;
const one = id => !!E.RULES[id].one;
const unit = (id, n) => (E.UNITS[id] || ["", ""])[n === 1 ? 0 : 1];
function freshLine(s) { const t = new Date().toLocaleDateString("en-CA"); return s.have.fresh ? "Yours for good" : t < E.FRESH.from ? "Opens 1 Jan 2027 for 7 days" : t <= E.FRESH.to ? "Open now until 7 Jan" : "Closed for good"; }
function howOf(id, s) { const b = A.B[id]; if (id === "fresh") return freshLine(s); return E.HOW[id] || b.how; }
function lineOf(id, c, lv) {
  const r = E.RULES[id], p = E.progress(id, c, lv);
  if (r.one) return lv ? "Earned" : A.B[id].how;
  if (lv >= 4) return `${p.n} ${unit(id, p.n)}. Top binding.`;
  return `${p.left} more ${unit(id, p.left)} to ${LVN[lv]}`;
}

function render() {
  const s = E.settle(E.load()), c = E.counts(s), today = new Date().toLocaleDateString("en-CA"), opt = id => E.optOf(s, id);
  // ribbon: grows with each day toward the next title
  const st = s.streak || 0, t = E.titleOf(st), nt = E.nextTitle(st), len = 40 + Math.min(st, 30) * 7;
  $("#ysRib rect").setAttribute("height", len); $("#ysRib path").setAttribute("transform", `translate(0 ${len - 150})`); $("#ysRib g path").setAttribute("d", `M8 0v${len}M32 0v${len}`);
  $("[data-rib-tag]").style.setProperty("--y", (len - 10) + "px"); $("[data-st-n]").textContent = st;
  $("[data-st-title]").textContent = t || (st ? "On the shelf" : "No streak yet");
  const sub = [], done = s.days.includes(today);
  if (s.holdNote && !s.holdSeen) sub.push(`Hold My Place saved your streak on ${new Date(s.holdNote + "T12:00").toLocaleDateString("en-GB", { weekday: "long" })}.`);
  if (s.repaired) sub.push(`Repaired. All ${s.repaired} days are back.`);
  else if (s.broken && s.broken.ok) sub.push(`Your ${s.broken.n}-day streak can still come back. Do ${2 - s.broken.acts} more reading ${2 - s.broken.acts === 1 ? "action" : "actions"} by the end of ${new Date(s.broken.until + "T12:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })}.`);
  const more = nt ? ` ${nt[0] - st} more ${nt[0] - st === 1 ? "day" : "days"} to ${nt[1]}.` : "";
  sub.push(st === 0 ? "Read Today’s idea, tick a test day, finish a checklist, mark a book read or play the game. 1 a day grows the ribbon." : done ? `Your ribbon grew today.${more}` : `Not read today yet. 1 reading action keeps it growing.${more}`);
  $("[data-st-sub]").textContent = sub.join(" ");
  if (s.holdNote) { const s2 = E.load(); s2.holdSeen = 1; delete s2.holdNote; delete s2.repaired; E.save(s2); }
  const stops = [[0, ...E.TITLES[0]], [21, ...E.TITLES[1]], [46, ...E.TITLES[2]], [73, ...E.TITLES[3]], [100, ...E.TITLES[4]]];
  const w = st >= 365 ? 100 : (() => { for (let i = 0; i < stops.length - 1; i++) { const [x0, d0] = stops[i], [x1, d1] = stops[i + 1]; if (st < d1) return st < d0 ? x0 * st / d0 : x0 + (x1 - x0) * (st - d0) / (d1 - d0); } return 100; })();
  const L = $("[data-ladder]"); L.style.setProperty("--w", w + "%");
  L.innerHTML = `<div class="track"></div><div class="ydone"></div>` + stops.map(([x, d, n], i) => `<div class="stop${st >= d ? " got" : ""}${t === n ? " cur" : ""}${nt && nt[1] === n ? " nxt" : ""}${i === 0 ? " yfirst" : ""}" style="left:${x}%"><i>${d}</i><em>${n}</em></div>`).join("");
  $("[data-hold]").innerHTML = `<svg viewBox="0 0 12 16" aria-hidden="true"><path d="M1 0h10v16l-5-4-5 4z" fill="#7E1F35"/></svg>Hold My Place: ${s.freezes} saved`;
  $("[data-hold-h]").textContent = s.freezes ? "Miss a weekday and it keeps your place. You earn 1 more every 7 days, up to 2." : "Every 7 days of streak earns 1 save for a missed weekday. Weekends never break a streak.";
  // pledge: offered from day 3, kept after 7 days in a row
  const pl = $("[data-pledge]");
  if (s.pledge) {
    const left = 7 - Math.min(7, st - s.pledge.at + 1);
    if (left <= 0 && !s.pledge.kept) { const s2 = E.load(); s2.pledge.kept = 1; E.save(s2); }
    pl.hidden = false; pl.innerHTML = left > 0 ? `<b>You committed to 7 days.</b><span>${left} ${left === 1 ? "day" : "days"} to go. Keep it and tomorrow’s idea opens for you a day early, every day.</span>` : `<b>Pledge kept.</b><span>Tomorrow’s idea now opens for you a day early. Look under Today’s idea on the home page.</span>`;
  } else if (st >= 3) { pl.hidden = false; pl.innerHTML = `<b>Commit to 7 days?</b><span>Keep your streak 7 days and tomorrow’s idea opens for you a day early.</span><button type="button" class="ys-btn" data-commit>Commit</button>`; }
  else pl.hidden = true;
  // Next up: the 2 closest badges you can work on today (not secret, not a closed limited edition)
  const freshOpen = today >= E.FRESH.from && today <= E.FRESH.to;
  const cand = IDS.filter(id => !A.B[id].secret && (id !== "fresh" || (freshOpen && !s.have.fresh)) && (id !== "last" || !s.have.last) && (s.have[id] || 0) < (one(id) ? 1 : 4))
    .map(id => { const lv = s.have[id] || 0; return { id, lv, p: E.progress(id, c, lv) }; })
    .sort((a, b) => (a.p.left - b.p.left) || ((E.RULES[b.id].star || 0) - (E.RULES[a.id].star || 0)) || (b.p.p - a.p.p) || ((a.id === "last") - (b.id === "last"))).slice(0, 2);
  $("[data-next]").innerHTML = cand.map(({ id, lv, p }, i) => `<div class="pg ${i ? "yr" : "yl"}" data-id="${id}">
    <div class="slot">${A.sketch(id, p.p)}<div class="solidwrap">${A.solid(id, A.finishOf(id, lv + 1), 1.15, "", opt(id))}</div></div>
    <h4>${esc(A.B[id].name)}${lv ? `, ${LVN[lv]}` : ""}</h4><p>${esc(lineOf(id, c, lv))}. ${esc(howOf(id, s))}.</p><div class="ymeter" style="--p:${p.p}"><i></i></div>
    <a class="go" href="${E.GO[id] || "/library/"}">Show me where</a><span class="folio">${i ? 2 : 1}</span></div>`).join("") || `<div class="pg yl" style="grid-column:1/-1"><p class="bempty">Every badge you can work on is inked. First Editions next.</p></div>`;
  // the collection: earned spines and pencil gaps, on 2 shelves
  let n = 0;
  const book = id => { const b = A.B[id], h = H[n % 10], w = W[n % 8]; n++; const lv = s.have[id] || 0;
    if (lv) { const fin = A.finishOf(id, lv), cls = { pb: "b-pb", hc: "b-hc", cb: "b-cb", fe: "b-fe", vel: "b-pb", plate: "b-hc" }[fin];
      const mk = `<svg class="mk" viewBox="0 0 120 120"><g fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">${b.glyph.map(d => `<path d="${d}"/>`).join("")}</g></svg>`;
      return `<button type="button" class="spine yearned ${cls}" style="--h:${h}px;--w:${w}px" data-id="${id}" aria-label="${esc(b.name)}, ${esc(A.FIN[fin])}. Pull it to see the badge."><span class="bands"></span><span class="yt">${esc(b.name)}</span>${mk}<span class="bands yb"></span></button>`; }
    const p = b.secret ? 0 : E.progress(id, c, 0).p;
    return `<button type="button" class="ygap" style="--h:${h}px;--w:${w}px;--p:${p}" data-id="${id}" aria-label="${esc(b.secret ? "Secret badge" : b.name)}, still a pencil outline. Pull it to see how to earn it."><svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><g fill="none" stroke="currentColor" stroke-linecap="round" filter="url(#pencil)"><path d="M2 ${h}V3H${w - 2}V${h}" stroke-width="1.1" stroke-dasharray="${b.secret ? "3 4" : "none"}"/><path d="M4 ${h}V5H${w - 4}V${h}" stroke-width=".5" opacity=".5"/><path d="M2 16H${w - 2}M2 ${h - 40}H${w - 2}" stroke-width=".6" opacity=".6"/></g></svg><span class="yt">${b.secret ? "secret" : esc(b.name)}</span><span class="pp"></span></button>`; };
  $("[data-case]").innerHTML = SHELVES.map(groups => `<div class="yshelf"><div class="yrow">${groups.map(([cat, label], gi) => { const ids = IDS.filter(k => A.B[k].cat === cat);
    return `${gi ? '<span class="yend" aria-hidden="true"></span>' : ""}<div class="grp ${cat}"><span class="ylbl">${label}</span><div class="bks">${ids.map(book).join("")}</div></div>`; }).join("")}</div></div>`).join("");
  const earned = IDS.filter(id => s.have[id]).length;
  $("[data-coll-n]").textContent = `${earned} of ${IDS.length} inked${s.best > 1 ? `. Best streak: ${s.best} days` : ""}. Pull any book to see its badge.`;
  scrollRows($$("[data-case] .yrow"));
  if (open) show(open, true); else show(cand[0] ? cand[0].id : "marg", true);
  // backup
  const bk = $("[data-backup]");
  if (s.email) { $(".yt", bk).innerHTML = `<b>Backed up to ${esc(s.email)}</b><span>Every badge email carries a fresh restore link for any phone or computer.</span>`; $("form", bk).hidden = true; }
  A.bindTilt(root);
}
function show(id, quiet) {
  const s = E.load(), c = E.counts(s), b = A.B[id], lv = s.have[id] || 0, stand = $("[data-stand]"); open = id;
  $$(".spine.yout").forEach(x => x.classList.remove("yout")); if (!quiet) { const sp = $(`.spine[data-id=${id}]`); if (sp) sp.classList.add("yout"); }
  const rows = b.cat === "secret" ? "<p>1 finish: vellum with a pressed flower behind</p>" : b.cat === "limited" ? "<p>1 finish: a hand-numbered bookplate</p>"
    : `<ul class="lvls">${LVN.map((x, i) => `<li class="${i < lv ? "got" : ""}"><span>${x}</span><span>${E.RULES[id].lv[i]}</span></li>`).join("")}</ul>`;
  const hide = b.secret && !lv, p = E.progress(id, c, lv);
  stand.innerHTML = `<button type="button" class="yx" aria-label="Close">×</button><div class="yk">${lv ? "pulled from the shelf" : "still a pencil outline"}</div>
   <div class="holder">${lv ? A.solid(id, A.finishOf(id, lv), 1.35, "", E.optOf(s, id)) : A.sketch(id, hide ? 10 : p.p)}</div>
   <h4>${hide ? "Secret" : esc(b.name)}</h4><p>${lv ? esc(A.FIN[A.finishOf(id, lv)]) + ", " + esc(lineOf(id, c, lv)) : hide ? "Shows up when you find it" : esc(lineOf(id, c, 0))}</p>${rows}
   <p class="hn">${esc(hide ? b.how : howOf(id, s))}</p><p class="rr">${esc(E.rareText(R, id, Math.max(1, lv)))}</p>
   ${!hide && E.GO[id] && (one(id) ? !lv : lv < 4) && id !== "fresh" ? `<a class="ys-btn stand-go" href="${E.GO[id]}">Show me where</a>` : ""}${lv ? `<button type="button" class="ys-btn ghost stand-go" data-share="${id}" style="margin-left:6px">Share</button>` : ""}`;
  $(".yx", stand).onclick = () => { stand.classList.remove("open"); $$(".spine.yout").forEach(x => x.classList.remove("yout")); };
  if (!quiet) stand.classList.add("open");
  A.bindTilt(stand);
}
function scrollRows(rows) { rows.forEach(row => { if (row._sr) return; row._sr = 1;
  const wrap = document.createElement("div"); wrap.className = "srwrap"; row.parentNode.insertBefore(wrap, row); wrap.appendChild(row);
  const mk = d => { const b = document.createElement("button"); b.type = "button"; b.className = "srbtn " + (d < 0 ? "yl" : "yr"); b.setAttribute("aria-label", d < 0 ? "Scroll left" : "Scroll right");
    b.innerHTML = `<svg viewBox="0 0 20 20" width="18" height="18"><path d="${d < 0 ? "M12 4 6 10l6 6" : "M8 4l6 6-6 6"}" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    b.onclick = () => row.scrollBy({ left: d * Math.max(160, row.clientWidth * .8), behavior: "smooth" }); wrap.appendChild(b); return b; };
  const L = mk(-1), Rt = mk(1);
  const upd = () => { const max = row.scrollWidth - row.clientWidth; L.hidden = row.scrollLeft <= 24; Rt.hidden = max <= 24 || row.scrollLeft >= max - 24; };
  row.addEventListener("scroll", upd, { passive: true }); addEventListener("resize", upd); setTimeout(upd, 50);
  row.tabIndex = 0; row.setAttribute("role", "region"); row.setAttribute("aria-label", "Books on this shelf, use left and right arrow keys to scroll");
  row.addEventListener("keydown", e => { if (e.target !== row) return; if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); row.scrollBy({ left: (e.key === "ArrowRight" ? 1 : -1) * 170, behavior: "smooth" }); } });
  let down = false, sx = 0, sl = 0, moved = false;
  row.addEventListener("pointerdown", e => { if (e.pointerType !== "mouse" || e.button !== 0) return; down = true; moved = false; sx = e.clientX; sl = row.scrollLeft; });
  addEventListener("pointermove", e => { if (!down) return; const dx = e.clientX - sx; if (!moved && Math.abs(dx) > 5) { moved = true; row.classList.add("ydrag"); } if (moved) row.scrollLeft = sl - dx; });
  addEventListener("pointerup", () => { if (!down) return; down = false; row.classList.remove("ydrag"); });
  row.addEventListener("click", e => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
  row.addEventListener("dragstart", e => e.preventDefault());
}); }

root.addEventListener("click", async e => {
  const t = e.target.closest("[data-case] [data-id]"); if (t) { show(t.dataset.id); return; }
  if (e.target.closest("[data-commit]")) { const s = E.load(); s.pledge = { at: s.streak, day: new Date().toLocaleDateString("en-CA") }; E.save(s); render(); E.sync(); return; }
  const sh = e.target.closest("[data-share]"); if (sh) { const s = E.load(), id = sh.dataset.share, lv = s.have[id]; const cv = await A.shareCanvas(id, A.finishOf(id, lv), E.rareText(R, id, lv), E.optOf(s, id)); const a = document.createElement("a"); a.href = cv.toDataURL("image/png"); a.download = id + ".png"; a.click(); }
});
/* email backup: the newsletter sign-up goes through the useful-signup Worker (Beehiiv API), never a Beehiiv automation */
const TS_KEY = "0x4AAAAAAFPMggcqkSSP8L92";
function turnstileToken() {
  return new Promise(res => {
    const go = () => { const box = document.createElement("div"); box.style.cssText = "position:fixed;bottom:12px;right:12px;z-index:95"; document.body.appendChild(box);
      try { window.turnstile.render(box, { sitekey: TS_KEY, appearance: "interaction-only", callback: t => { res(t); setTimeout(() => box.remove(), 500); }, "error-callback": () => { res(""); box.remove(); } }); } catch (e) { res(""); } };
    if (window.turnstile) return go();
    const sc = document.createElement("script"); sc.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"; sc.onload = go; sc.onerror = () => res(""); document.head.appendChild(sc);
    setTimeout(() => res(""), 15000);
  });
}
const f = $("[data-backup] form");
f.addEventListener("submit", async e => {
  e.preventDefault(); const em = $("input", f).value.trim(), b = $("button", f), m = $("[data-backup] .msg");
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(em)) { m.textContent = "That email doesn't look right."; return; }
  b.disabled = true; b.textContent = "Sending…"; m.textContent = "";
  try {
    const tok = await turnstileToken();
    const r = await fetch("https://useful-signup.raja-822.workers.dev/", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: em, list: "life", token: tok, utm_source: "theusefulmedia.com", utm_medium: "badges", utm_campaign: "library-badges", referrer: location.href }) }).then(r => r.json()).catch(() => null);
    if (r && !r.ok && r.code === "typo") { b.disabled = false; b.textContent = "Email me my link"; m.textContent = `Did you mean ${r.suggestion}?`; return; }
    if (r && !r.ok && (r.code === "format" || r.code === "disposable" || r.code === "no_mail")) { b.disabled = false; b.textContent = "Email me my link"; m.textContent = r.code === "disposable" ? "Use an inbox you keep. Throwaway addresses can't restore badges later." : "That email can't receive mail. Check the spelling."; return; }
  } catch (x) {}
  try { const j = await E.backup(em); if (j.ok) { b.textContent = "Link sent"; m.textContent = "Check your inbox for your restore link."; setTimeout(render, 1500); } else { b.disabled = false; b.textContent = "Email me my link"; m.textContent = j.error || "That didn't go through. Try again."; } }
  catch (x) { b.disabled = false; b.textContent = "Email me my link"; m.textContent = "That didn't go through. Try again later."; }
});
document.addEventListener("lib-badges", e => { render(); if (e.detail && e.detail.restored) { const m = $("[data-backup] .msg"); if (m) m.textContent = "Your badges and streak are back on this device."; } });
root.hidden = false;
render();
E.getRarity().then(r => { R = r; render(); });
E.fetchMe(true).then(render);
