// Reader profile pages: theusefulmedia.com/tech/setup and /library/profile.
// The newsletter links here with ?s={{api_subscription_id}}; the Worker checks it with Beehiiv.
// Tiles carry data-f (field) and data-k (value). A fieldset with data-single allows 1 pick.
// After load and after save, the page ranks this week's pool for the reader, the same way
// the nightly matcher does, so readers see their tips right away.
(function () {
  var root = document.querySelector("[data-profile]");
  if (!root) return;
  var LIST = root.getAttribute("data-profile"); // "tech" or "life"
  var API = "https://useful-signup.raja-822.workers.dev";
  var sid = (new URLSearchParams(location.search).get("s") || "").trim().toLowerCase();
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(sid)) sid = "sub_" + sid;
  var form = document.querySelector("[data-form]");
  var tiles = Array.prototype.slice.call(document.querySelectorAll(".su-tile"));
  var countEl = document.querySelector("[data-picked]");
  var msg = document.querySelector("[data-msg]");
  var save = document.querySelector("[data-save]");
  var tipsBox = document.querySelector("[data-tips]");
  var pool = null;
  function show(state) { var el = document.querySelector('[data-state="' + state + '"]'); if (el) el.hidden = false; }
  function isSingle(t) { var fs = t.closest("fieldset"); return fs && fs.hasAttribute("data-single"); }
  function profile() {
    var p = {};
    tiles.forEach(function (t) {
      var f = t.dataset.f;
      if (!(f in p)) p[f] = isSingle(t) ? "" : [];
      if (t.getAttribute("aria-pressed") === "true") { if (isSingle(t)) p[f] = t.dataset.k; else p[f].push(t.dataset.k); }
    });
    return p;
  }
  function count() {
    var n = tiles.filter(function (t) { return t.getAttribute("aria-pressed") === "true"; }).length;
    countEl.textContent = n + " picked";
  }
  function say(text, cls) { msg.textContent = text; msg.className = "su-msg" + (cls ? " " + cls : ""); }
  function call(body) {
    body.list = LIST;
    return fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then(function (r) { return r.json(); });
  }
  function rank(p) {
    if (!pool) return [];
    var owned = LIST === "tech" ? (p.apple_setup || []) : [];
    var type = LIST === "tech" ? p.user_type : p.life_area;
    var wants = LIST === "tech" ? (p.wants || []) : [p.reading_goal, p.pace].filter(Boolean);
    var out = [];
    (pool.items || []).forEach(function (it) {
      var need = it.devices || [];
      if (need.length && owned.length && !need.some(function (x) { return owned.indexOf(x) > -1; })) return;
      if (it.paces && it.paces.length && p.pace && it.paces.indexOf(p.pace) < 0) return;
      var s = 1 + (it.weight || 0);
      if (need.length) s += 1;
      if ((it.types || []).indexOf(type) > -1) s += 3;
      if ((it.wants || []).some(function (w) { return wants.indexOf(w) > -1; })) s += 2;
      out.push({ it: it, s: s });
    });
    out.sort(function (a, b) { return b.s - a.s || String(a.it.id).localeCompare(String(b.it.id)); });
    return out.map(function (x) { return x.it; });
  }
  function esc(s) { return String(s || "").replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function renderTips(p) {
    if (!tipsBox) return;
    var has = Object.keys(p).some(function (k) { return Array.isArray(p[k]) ? p[k].length : p[k]; });
    var items = has ? rank(p).slice(0, 6) : [];
    if (!items.length) { tipsBox.hidden = true; return; }
    tipsBox.querySelector("[data-tips-list]").innerHTML = items.map(function (it, i) {
      return '<li class="fy-card"><span class="fy-n">#' + (i + 1) + '</span><div><p class="fy-tags">' + esc((it.tags || []).join(" · ")) + '</p><h3>' + esc(it.title) + '</h3><p>' + esc(it.text) + '</p>' +
        (it.url ? '<a class="fy-link" href="' + esc(it.url) + '">' + esc(it.cta || "Open it") + '</a>' : "") + '</div></li>';
    }).join("");
    tipsBox.hidden = false;
  }
  if (!/^sub_[0-9a-f-]{36}$/.test(sid)) { show("nolink"); return; }
  try { history.replaceState(null, "", location.pathname); } catch (e) {}
  tiles.forEach(function (t) {
    t.addEventListener("click", function () {
      var on = t.getAttribute("aria-pressed") === "true";
      if (isSingle(t) && !on) {
        tiles.forEach(function (o) { if (o !== t && o.dataset.f === t.dataset.f) o.setAttribute("aria-pressed", "false"); });
      }
      t.setAttribute("aria-pressed", on ? "false" : "true");
      count(); say("");
    });
  });
  var clr = document.querySelector("[data-clear]");
  if (clr) clr.addEventListener("click", function () { tiles.forEach(function (t) { t.setAttribute("aria-pressed", "false"); }); count(); say(""); });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    save.disabled = true; say("Saving...");
    var p = profile();
    call({ action: "setup_save", sid: sid, profile: p }).then(function (d) {
      save.disabled = false;
      if (d.ok) {
        say(LIST === "tech" ? "Saved. Your next issues will fit this setup." : "Saved. Your next issues will end with your next read.", "ok");
        renderTips(d.profile || p);
        if (tipsBox && !tipsBox.hidden) tipsBox.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (d.code === "sid") say("That link didn't work. Open the newest issue and tap the link again.", "err");
      else say("Couldn't save just now. Try again in a minute.", "err");
    }).catch(function () { save.disabled = false; say("Couldn't save just now. Try again in a minute.", "err"); });
  });
  var poolUrl = root.getAttribute("data-pool");
  var poolReady = poolUrl ? fetch(poolUrl + "?t=" + Date.now()).then(function (r) { return r.json(); }).then(function (j) { pool = j; }).catch(function () {}) : Promise.resolve();
  Promise.all([call({ action: "setup_get", sid: sid }), poolReady]).then(function (r) {
    var d = r[0];
    if (!d.ok) { show("badlink"); return; }
    var p = d.profile || { apple_setup: d.items || [] };
    tiles.forEach(function (t) {
      var v = p[t.dataset.f];
      if ((Array.isArray(v) && v.indexOf(t.dataset.k) > -1) || v === t.dataset.k) t.setAttribute("aria-pressed", "true");
    });
    form.hidden = false; count(); renderTips(p);
  }).catch(function () { form.hidden = false; count(); say("Couldn't load your saved answers. You can still pick and save.", "err"); });
})();
