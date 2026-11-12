// The Useful Reading Challenge 2027: buy button timing on the sales page, and the tracker.
// Tracker data lives in localStorage under lib:ch:* so "Save my progress" syncs it with the rest.
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var get = function (k, d) { try { var v = localStorage.getItem("lib:ch:" + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } };
  var set = function (k, v) { try { localStorage.setItem("lib:ch:" + k, JSON.stringify(v)); } catch (e) {} };
  var SYNC = "https://library-sync.raja-822.workers.dev/";
  var now = Date.now();
  var forceOpen = /[?&]open=1/.test(location.search); // lets the daily checks see the after-launch state

  // Sales page: waitlist before 1 Dec, buy button after; $39 from 1 Jan
  var buy = $("[data-ch-buy]");
  if (buy) {
    var open = forceOpen || now >= Date.parse(buy.getAttribute("data-opens"));
    $("[data-ch-before]", buy).hidden = open;
    $("[data-ch-after]", buy).hidden = !open;
    if (now >= Date.parse(buy.getAttribute("data-price-up"))) {
      $("[data-ch-now]", buy).textContent = "$39";
      $("[data-ch-note]", buy).textContent = "";
      $("[data-ch-then]", buy).textContent = "";
    }
  }

  var page = $("[data-challenge-tracker]");
  if (!page) return;
  var urls = {};
  try { urls = JSON.parse($("#ch-books").textContent); } catch (e) {}
  var unlocked = get("lic", false);
  function today() { var d = new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }

  function paint() {
    var books = 0, tests = 0, dots = "";
    $$(".chm-t").forEach(function (sec) {
      var m = sec.getAttribute("data-m"), s = get(m, {}), days = s.days || [];
      var locked = !unlocked && m !== "01";
      if (locked) sec.setAttribute("data-locked", ""); else sec.removeAttribute("data-locked");
      $$("[data-pick]", sec).forEach(function (b) { b.setAttribute("aria-checked", String(b.getAttribute("data-pick") === s.b)); });
      var v = $("[data-verdict]", sec);
      if (s.b && urls[s.b]) { v.href = urls[s.b]; v.hidden = false; } else v.hidden = true;
      var done = $("[data-done]", sec); done.setAttribute("aria-pressed", String(!!s.done));
      done.textContent = s.done ? "Finished the parts that matter" : "I finished the parts that matter";
      $("[data-days]", sec).textContent = Math.min(days.length, 30);
      var g = "", i; for (i = 0; i < 30; i++) g += '<i class="' + (i < days.length ? "on" : "") + '"></i>';
      $("[data-grid]", sec).innerHTML = g;
      var t = $("[data-today]", sec), did = days.indexOf(today()) > -1;
      t.disabled = did || days.length >= 30;
      t.textContent = days.length >= 30 ? "30 days done" : did ? "Done for today" : "I tried it today";
      var n = $("[data-note]", sec); if (document.activeElement !== n) n.value = s.n || "";
      var st = locked ? "Locked" : days.length >= 30 ? "Tested" : s.done ? "Read" : s.b ? "Reading" : "";
      $("[data-state]", sec).textContent = st;
      if (s.done) books++;
      if (days.length >= 30) tests++;
      dots += '<i class="' + (s.done && days.length >= 30 ? "on" : s.done || days.length ? "half" : "") + '"></i>';
    });
    $("[data-ch-books]").textContent = books;
    $("[data-ch-tests]").textContent = tests;
    $("[data-ch-dots]").innerHTML = dots;
    $("[data-unlock]").hidden = unlocked;
  }

  function upd(sec, fn) { var m = sec.getAttribute("data-m"), s = get(m, {}); fn(s); set(m, s); paint(); }
  page.addEventListener("click", function (e) {
    var sec = e.target.closest(".chm-t"); if (!sec || sec.hasAttribute("data-locked")) return;
    var p = e.target.closest("[data-pick]");
    if (p) upd(sec, function (s) { s.b = p.getAttribute("data-pick"); });
    if (e.target.closest("[data-done]")) upd(sec, function (s) { s.done = !s.done; });
    if (e.target.closest("[data-today]")) upd(sec, function (s) { s.days = s.days || []; if (s.days.indexOf(today()) < 0 && s.days.length < 30) s.days.push(today()); });
  });
  page.addEventListener("input", function (e) {
    if (!e.target.matches("[data-note]")) return;
    var sec = e.target.closest(".chm-t"), m = sec.getAttribute("data-m"), s = get(m, {});
    s.n = e.target.value.slice(0, 500); set(m, s);
  });

  var f = $("[data-unlock-form]"), msg = $("[data-unlock-msg]");
  f.addEventListener("submit", function (e) {
    e.preventDefault();
    var key = $("#lic").value.trim();
    if (!/^[A-Z0-9-]{20,60}$/i.test(key)) { msg.textContent = "That key looks off. Copy it from your purchase email."; return; }
    msg.textContent = "Checking...";
    fetch(SYNC, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ act: "license", key: key }) })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (j.ok) { unlocked = true; set("lic", true); msg.textContent = ""; paint(); $(".chm-t[data-m='02']").scrollIntoView({ behavior: "smooth", block: "start" }); }
        else msg.textContent = j.code === "not_ready" ? "Unlocking opens on 1 Dec, with the challenge." : "That key didn't match a purchase. Copy it again from your email.";
      })
      .catch(function () { msg.textContent = "Couldn't check right now. Try again in a minute."; });
  });

  window.addEventListener("storage", function (e) { if (e.key && e.key.indexOf("lib:ch:") === 0) { unlocked = get("lic", false); paint(); } });
  document.addEventListener("lib:synced", function () { unlocked = get("lic", false); paint(); });
  paint();
})();
