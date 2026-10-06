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
  if (!forms.length) return;

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

  function waitForToken(form, ms) {
    return new Promise(function (resolve) {
      var start = Date.now();
      (function poll() {
        var s = widgets.get(form);
        if (!s) return resolve("");
        if (s.token) return resolve(s.token);
        if (Date.now() - start > ms) return resolve("");
        setTimeout(poll, 150);
      })();
    });
  }

  forms.forEach(function (form) {
    var input = form.querySelector('input[type="email"]');
    var hp = form.querySelector(".hp");
    var btn = form.querySelector("button");
    var label = btn.querySelector(".btn-label");
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
      label.textContent = on ? "Checking your email" : "Send me the next issue";
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
      waitForToken(form, 6000).then(function (token) {
        var payload = Object.assign({ email: email, token: token, website: hp ? hp.value : "" }, utm());
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
          setTimeout(function () { location.href = "/tech/welcome/"; }, 450);
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
  });
})();
