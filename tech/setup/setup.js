// theusefulmedia.com/tech/setup: load and save a reader's Apple setup.
// The newsletter links here with ?s={{subscriber_id}}; the Worker checks it with Beehiiv.
(function () {
  var API = "https://useful-signup.raja-822.workers.dev";
  var sid = new URLSearchParams(location.search).get("s") || "";
  var form = document.querySelector("[data-form]");
  var tiles = Array.prototype.slice.call(document.querySelectorAll(".su-tile"));
  var countEl = document.querySelector("[data-picked]");
  var msg = document.querySelector("[data-msg]");
  var save = document.querySelector("[data-save]");
  function show(state) { var el = document.querySelector('[data-state="' + state + '"]'); if (el) el.hidden = false; }
  function picked() { return tiles.filter(function (t) { return t.getAttribute("aria-pressed") === "true"; }).map(function (t) { return t.dataset.k; }); }
  function count() { var n = picked().length; countEl.textContent = n + " picked"; }
  function say(text, cls) { msg.textContent = text; msg.className = "su-msg" + (cls ? " " + cls : ""); }
  function call(body) {
    return fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then(function (r) { return r.json(); });
  }
  if (!/^sub_[0-9a-f-]{36}$/.test(sid)) { show("nolink"); return; }
  // Keep the id out of the address bar after reading it.
  try { history.replaceState(null, "", location.pathname); } catch (e) {}
  tiles.forEach(function (t) {
    t.addEventListener("click", function () {
      t.setAttribute("aria-pressed", t.getAttribute("aria-pressed") === "true" ? "false" : "true");
      count(); say("");
    });
  });
  document.querySelector("[data-clear]").addEventListener("click", function () {
    tiles.forEach(function (t) { t.setAttribute("aria-pressed", "false"); }); count(); say("");
  });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    save.disabled = true; say("Saving...");
    call({ action: "setup_save", sid: sid, items: picked() }).then(function (d) {
      save.disabled = false;
      if (d.ok) say(d.items.length ? "Saved. Your next issues will fit these " + d.items.length + "." : "Saved. You'll get tips for every Apple device.", "ok");
      else if (d.code === "sid") say("That link didn't work. Open the newest issue and tap the link again.", "err");
      else say("Couldn't save just now. Try again in a minute.", "err");
    }).catch(function () { save.disabled = false; say("Couldn't save just now. Try again in a minute.", "err"); });
  });
  call({ action: "setup_get", sid: sid }).then(function (d) {
    if (!d.ok) { show("badlink"); return; }
    tiles.forEach(function (t) { if (d.items.indexOf(t.dataset.k) > -1) t.setAttribute("aria-pressed", "true"); });
    form.hidden = false; count();
  }).catch(function () { form.hidden = false; count(); say("Couldn't load your saved setup. You can still tick and save.", "err"); });
})();
