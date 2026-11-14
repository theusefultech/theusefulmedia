// theusefulmedia.com/tech: signup form + phone inbox interaction.

// Filled in after the Cloudflare setup.
var SIGNUP_ENDPOINT = "https://useful-signup.raja-822.workers.dev/";
var TURNSTILE_SITEKEY = "0x4AAAAAAFPMggcqkSSP8L92";
var FALLBACK_URL = "https://newsletter.theusefultech.com/subscribe";

// ---------- Phone inbox: tap an email to mark it read ----------
(function () {
  var rows = document.querySelectorAll(".mail-row");
  var count = document.querySelector(".inbox-top b");
  if (!rows.length || !count) return;
  function update() {
    var unread = document.querySelectorAll(".mail-row:not(.is-read)").length;
    count.textContent = unread ? unread + " unread" : "All read";
  }
  rows.forEach(function (row) {
    row.addEventListener("click", function () { row.classList.toggle("is-read"); update(); });
  });
})();

// ---------- Signup ----------
(function () {
  var forms = Array.prototype.slice.call(document.querySelectorAll("form[data-signup]"));

  var POPULAR = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com", "me.com", "mac.com",
    "live.com", "aol.com", "proton.me", "protonmail.com", "yahoo.co.in", "yahoo.co.uk", "rediffmail.com",
    "hey.com", "msn.com", "ymail.com", "googlemail.com", "zoho.com", "gmx.com", "hotmail.co.uk", "outlook.in"];
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  var MESSAGES = {
    format: "That doesn't look like an email address. Check for a missing @ or dot.",
    disposable: "Throwaway inboxes can't receive the newsletter. Use the email you actually check.",
    no_mail: "That email domain can't receive mail. Check the part after the @.",
    bot: 'We couldn\'t confirm you\'re a person. Refresh the page and try once more, or <a href="' + FALLBACK_URL + '">subscribe here</a>.',
    server: "Something broke on our side. Try again in a minute.",
    network: 'Your connection dropped before we could sign you up. Try again, or <a href="' + FALLBACK_URL + '">subscribe here</a>.'
  };

  function lev(a, b) {
    var m = a.length, n = b.length, d = [], i, j;
    for (i = 0; i <= m; i++) { d[i] = [i]; }
    for (j = 0; j <= n; j++) { d[0][j] = j; }
    for (i = 1; i <= m; i++) for (j = 1; j <= n; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[m][n];
  }

  function suggest(email) {
    var at = email.lastIndexOf("@");
    if (at < 1) return null;
    var local = email.slice(0, at), domain = email.slice(at + 1);
    if (POPULAR.indexOf(domain) !== -1) return null;
    var best = null, bestD = 3;
    POPULAR.forEach(function (p) {
      var dist = lev(domain, p);
      if (dist > 0 && dist < bestD) { best = p; bestD = dist; }
    });
    return best ? local + "@" + best : null;
  }

  function utm() {
    var out = {};
    try {
      var q = new URLSearchParams(location.search);
      ["utm_source", "utm_medium", "utm_campaign"].forEach(function (k) { if (q.get(k)) out[k] = q.get(k); });
    } catch (e) {}
    if (document.referrer && document.referrer.indexOf(location.host) === -1) out.referrer = document.referrer;
    return out;
  }

  // Turnstile: one invisible widget per form, shown only if Cloudflare needs a check.
  var widgets = new Map();
  function initTurnstile() {
    if (!window.turnstile || TURNSTILE_SITEKEY.indexOf("__") === 0) return;
    forms.forEach(function (form) {
      var slot = form.parentNode.querySelector(".ts-slot");
      if (!slot || widgets.has(form)) return;
      var state = { token: "", id: null };
      state.id = window.turnstile.render(slot, {
        sitekey: TURNSTILE_SITEKEY,
        appearance: "interaction-only",
        callback: function (t) { state.token = t; },
        "expired-callback": function () { state.token = ""; },
        "error-callback": function () { state.token = ""; }
      });
      widgets.set(form, state);
    });
  }
  if (window.turnstile) initTurnstile(); else window.tutTurnstileReady = initTurnstile;

  // Load Turnstile only when a form is near the screen or touched, so the bot
  // check never delays the first paint of the page.
  function loadTurnstile() {
    if (window.turnstile || document.querySelector('script[src*="challenges.cloudflare.com/turnstile/v0/api.js"]')) return;
    var s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=tutTurnstileReady";
    s.async = true;
    document.head.appendChild(s);
  }
  if ("IntersectionObserver" in window) {
    var tsIO = new IntersectionObserver(function (es) {
      if (es.some(function (e) { return e.isIntersecting; })) { tsIO.disconnect(); loadTurnstile(); }
    }, { rootMargin: "600px 0px" });
    forms.forEach(function (f) { tsIO.observe(f); });
  } else loadTurnstile();
  forms.forEach(function (f) { f.addEventListener("focusin", loadTurnstile); });

  function waitForToken(form, ms) {
    return new Promise(function (resolve) {
      var start = Date.now();
      (function poll() {
        var s = widgets.get(form);
        if (!s && Date.now() - start > ms) return resolve("");
        if (!s) return setTimeout(poll, 150);
        if (s.token) return resolve(s.token);
        if (Date.now() - start > ms) return resolve("");
        setTimeout(poll, 150);
      })();
    });
  }

  function bind(form) {
    var input = form.querySelector('input[type="email"]');
    var hp = form.querySelector(".hp");
    var btn = form.querySelector("button");
    var label = btn.querySelector(".btn-label");
    var idleLabel = label.textContent;
    var msg = form.parentNode.querySelector(".signup-msg");
    var confirmed = "";

    function show(html, kind) {
      msg.innerHTML = html;
      msg.className = "signup-msg is-" + (kind || "error");
      form.classList.toggle("has-error", kind !== "info" && !!html);
    }
    function clear() { msg.innerHTML = ""; msg.className = "signup-msg"; form.classList.remove("has-error"); }
    function busy(on) {
      btn.disabled = on;
      form.classList.toggle("is-busy", on);
      label.textContent = on ? "Checking your email" : idleLabel;
    }
    function resubmit() {
      if (form.requestSubmit) form.requestSubmit();
      else form.dispatchEvent(new Event("submit", { cancelable: true }));
    }

    function offerFix(fixed, fromServer) {
      show('Did you mean <b>' + fixed.replace(/</g, "&lt;") + '</b>?' +
        '<span class="fix-row"><button type="button" class="fix-yes">Yes, fix it</button>' +
        (fromServer ? "" : '<button type="button" class="fix-no">No, mine is right</button>') + "</span>", "info");
      msg.querySelector(".fix-yes").addEventListener("click", function () {
        input.value = fixed; clear(); resubmit();
      });
      var no = msg.querySelector(".fix-no");
      if (no) no.addEventListener("click", function () {
        confirmed = input.value.trim().toLowerCase(); clear(); resubmit();
      });
    }

    input.addEventListener("input", function () { if (msg.innerHTML) clear(); });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (form.classList.contains("is-busy")) return;
      var email = input.value.trim().toLowerCase();

      if (!email) { show("Type your email first."); input.focus(); return; }
      if (!EMAIL_RE.test(email)) { show(MESSAGES.format); input.focus(); return; }

      var fix = suggest(email);
      if (fix && confirmed !== email) { offerFix(fix, false); return; }

      busy(true);
      loadTurnstile();
      waitForToken(form, 6000).then(function (token) {
        var extra = utm();
        if (form.getAttribute("data-campaign") && !extra.utm_campaign) extra.utm_campaign = form.getAttribute("data-campaign");
        // data-source names the form itself (e.g. the Wristkeeper page), so it wins over a link's utm_source.
        if (form.getAttribute("data-source")) extra.utm_source = form.getAttribute("data-source");
        if (form.getAttribute("data-medium") && !extra.utm_medium) extra.utm_medium = form.getAttribute("data-medium");
        var payload = Object.assign({ email: email, token: token, website: hp ? hp.value : "", list: form.getAttribute("data-list") || "tech" }, extra);
        return fetch(SIGNUP_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }).then(function (r) { return r.json(); });
      }).then(function (res) {
        var s = widgets.get(form);
        if (s && window.turnstile) { s.token = ""; window.turnstile.reset(s.id); }
        if (res && res.ok) {
          try {
            sessionStorage.setItem("tut_email", email);
            sessionStorage.setItem("tut_existing", res.existing ? "1" : "0");
          } catch (err) {}
          label.textContent = "You're in";
          form.classList.add("is-done");
          // data-next="stay" keeps the reader on the page (freebie pages reveal the download)
          var next = form.getAttribute("data-next");
          // 14 Nov 2026 (Raja: no redirects to subscribe): outside the /tech/ landing page the reader stays where they are.
          if (!next && !/^\/tech\/(index\.html)?$/.test(location.pathname)) {
            var life = form.getAttribute("data-list") === "life";
            show(res.existing ? "You're already on the list. Thanks for reading." : "You're in. Your first email from " + (life ? "The Useful Life" : "The Useful Tech") + " is on its way to <b>" + email.replace(/</g, "&lt;") + "</b>.", "ok");
            form.dispatchEvent(new CustomEvent("signup:done", { bubbles: true, detail: { email: email, existing: !!res.existing } }));
            return;
          }
          if (next === "stay") {
            form.dispatchEvent(new CustomEvent("signup:done", { bubbles: true, detail: { email: email, existing: !!res.existing } }));
            return;
          }
          setTimeout(function () { location.href = next || "/tech/welcome/"; }, 450);
          return;
        }
        busy(false);
        if (res && res.code === "typo" && res.suggestion) { offerFix(res.suggestion, true); return; }
        show(MESSAGES[res && res.code] || MESSAGES.server);
      }).catch(function () {
        busy(false);
        show(MESSAGES.network);
      });
    });
  }
  forms.forEach(bind);

  // Add a form built later (the subscribe sheet) to the same flow.
  window.TUTSignup = {
    add: function (form) {
      if (forms.indexOf(form) !== -1) return;
      forms.push(form); bind(form);
      form.addEventListener("focusin", loadTurnstile);
      loadTurnstile();
      if (window.turnstile) initTurnstile();
    }
  };
})();

// ---------- Subscribe sheet (14 Nov 2026) ----------
// Any link or button with data-subscribe (data-list="life" for The Useful Life) opens
// a small email form over the page instead of sending the reader somewhere else.
(function () {
  var css = '.tum-sub{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:16px}.tum-sub[hidden]{display:none}' +
    '.tum-sub-bg{position:absolute;inset:0;background:rgba(12,12,28,.5)}' +
    '.tum-sub-p{position:relative;width:min(440px,100%);background:#fff;color:#17172B;border-radius:22px;padding:26px 22px 20px;box-shadow:0 30px 60px -20px rgba(0,0,0,.45);font-family:inherit}' +
    '.tum-sub-x{position:absolute;top:10px;right:10px;width:40px;height:40px;border:0;border-radius:12px;background:transparent;font-size:24px;line-height:1;color:#5A5A73;cursor:pointer}.tum-sub-x:hover{background:#F1EFF7}' +
    '.tum-sub h2{font-size:22px;line-height:1.2;margin:0 32px 6px 0;letter-spacing:-.01em}.tum-sub p.tum-sub-l{margin:0 0 16px;color:#5A5A73;font-size:15px;line-height:1.45}' +
    '.tum-sub form{display:flex;gap:8px;flex-wrap:wrap}.tum-sub input[type=email]{flex:1 1 200px;min-width:0;height:48px;border:1.5px solid #D9D5E8;border-radius:14px;padding:0 14px;font:inherit;font-size:16px;color:#17172B;background:#fff}' +
    '.tum-sub input[type=email]:focus{outline:none;border-color:#7C5CFC;box-shadow:0 0 0 3px rgba(124,92,252,.2)}.tum-sub .hp{position:absolute;left:-9999px}' +
    '.tum-sub button[type=submit]{flex:1 1 auto;height:48px;border:0;border-radius:14px;background:#5638E6;color:#fff;font:inherit;font-weight:600;font-size:16px;padding:0 18px;cursor:pointer}.tum-sub button[disabled]{opacity:.7}' +
    '.tum-sub .is-done button[type=submit]{background:#12B886}.tum-sub .signup-msg{font-size:14px;line-height:1.45;margin-top:10px;min-height:0}.tum-sub .signup-msg.is-error{color:#C62D42}.tum-sub .signup-msg.is-ok{color:#0E7A5A}' +
    '.tum-sub .signup-msg button{margin:8px 8px 0 0;border:1px solid #D9D5E8;background:#fff;border-radius:10px;padding:6px 10px;font:inherit;cursor:pointer}.tum-sub small{display:block;margin-top:12px;color:#5A5A73;font-size:13px}' +
    '@media (prefers-color-scheme:dark){.tum-sub-p{background:#1C1C34;color:#F1F0F7}.tum-sub input[type=email]{background:#121224;color:#F1F0F7;border-color:#2C2C4A}.tum-sub p.tum-sub-l,.tum-sub small{color:#ABAAC4}.tum-sub .signup-msg.is-ok{color:#3DDCA9}}' +
    '@media (prefers-reduced-motion:no-preference){.tum-sub:not([hidden]) .tum-sub-p{animation:tumsub .22s cubic-bezier(.2,.8,.2,1)}@keyframes tumsub{from{opacity:0;transform:translateY(10px) scale(.98)}}}';
  var COPY = {
    tech: ["Get The Useful Tech", "3 short emails a week: the apps worth installing, the settings worth changing and the AI features worth turning on. Free.", "Monday, Wednesday and Friday. Unsubscribe in 1 click."],
    life: ["Get The Useful Life", "1 book lesson and 1 action step, 3 times a week. Free.", "Unsubscribe in 1 click."]
  };
  var sheet = null, form = null, last = null;
  function build() {
    var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
    sheet = document.createElement("div"); sheet.className = "tum-sub"; sheet.hidden = true;
    sheet.innerHTML = '<div class="tum-sub-bg" data-sub-close></div><div class="tum-sub-p" role="dialog" aria-modal="true" aria-labelledby="tum-sub-h">' +
      '<button class="tum-sub-x" type="button" data-sub-close aria-label="Close">&times;</button><h2 id="tum-sub-h"></h2><p class="tum-sub-l"></p>' +
      '<div class="signup"><form data-signup data-campaign="subscribe-sheet" novalidate><label class="visually-hidden" for="tum-sub-email" style="position:absolute;left:-9999px">Email address</label>' +
      '<input id="tum-sub-email" type="email" name="email" inputmode="email" autocomplete="email" autocapitalize="off" spellcheck="false" placeholder="you@email.com" required>' +
      '<input class="hp" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true"><button type="submit"><span class="btn-label">Subscribe free</span></button></form>' +
      '<div class="ts-slot"></div><div class="signup-msg" aria-live="polite"></div></div><small></small></div>';
    document.body.appendChild(sheet);
    form = sheet.querySelector("form");
    sheet.addEventListener("click", function (e) { if (e.target.closest("[data-sub-close]")) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && sheet && !sheet.hidden) close(); });
    if (window.TUTSignup) window.TUTSignup.add(form);
  }
  function open(list, source) {
    if (!sheet) build();
    var c = COPY[list] || COPY.tech;
    sheet.querySelector("h2").textContent = c[0];
    sheet.querySelector(".tum-sub-l").textContent = c[1];
    sheet.querySelector("small").textContent = c[2];
    form.setAttribute("data-list", list);
    if (source) form.setAttribute("data-source", source); else form.removeAttribute("data-source");
    if (!form.classList.contains("is-done")) form.querySelector(".btn-label").textContent = "Subscribe free";
    last = document.activeElement;
    sheet.hidden = false; document.documentElement.style.overflow = "hidden";
    setTimeout(function () { form.querySelector("input[type=email]").focus(); }, 30);
  }
  function close() { sheet.hidden = true; document.documentElement.style.overflow = ""; if (last && last.focus) last.focus(); }
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-subscribe]");
    if (!t || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    open(t.getAttribute("data-list") || "tech", t.getAttribute("data-source") || location.pathname.split("/")[1] || "home");
  });
})();
