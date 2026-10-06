// Personalises the thank-you page with the address the reader just used.
(function () {
  var email = "", existing = false;
  try {
    email = sessionStorage.getItem("tut_email") || "";
    existing = sessionStorage.getItem("tut_existing") === "1";
  } catch (e) {}

  var title = document.querySelector("[data-title]");
  var sub = document.querySelector("[data-sub]");
  var wrong = document.querySelector("[data-wrong]");
  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  if (existing) {
    title.textContent = "You're already on the list, so nothing else to do";
    sub.innerHTML = email ? "Your next issue goes to <b>" + esc(email) + "</b>." : "Your next issue is on its way.";
  } else if (email) {
    sub.innerHTML = "We sent it to <b>" + esc(email) + "</b>. Check your inbox in the next minute or two.";
    wrong.hidden = false;
  }

  // Put the reader's own mail app first.
  var domain = (email.split("@")[1] || "").toLowerCase();
  var isApple = /Mac|iPhone|iPad/.test(navigator.userAgent);
  var apple = document.querySelector('[data-mail="apple"]');
  if (isApple) apple.hidden = false;
  var primary = "gmail";
  if (/^(outlook|hotmail|live|msn)\./.test(domain)) primary = "outlook";
  else if (/^(icloud|me|mac)\.com$/.test(domain) && isApple) primary = "apple";
  else if (!/^(gmail|googlemail)\.com$/.test(domain) && domain && isApple) primary = "apple";
  var btn = document.querySelector('[data-mail="' + primary + '"]');
  if (btn) { btn.classList.add("is-primary"); btn.parentNode.prepend(btn); }
})();
