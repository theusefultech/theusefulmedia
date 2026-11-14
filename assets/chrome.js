// Phone menu for pages using /assets/chrome.css (14 Nov 2026)
(function () {
  var b = document.querySelector(".tum-mb"), s = document.getElementById("tum-sheet");
  if (!b || !s) return;
  function set(o) { s.hidden = !o; b.setAttribute("aria-expanded", String(o)); b.setAttribute("aria-label", o ? "Close menu" : "Open menu"); }
  b.addEventListener("click", function () { set(s.hidden); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !s.hidden) { set(false); b.focus(); } });
  document.addEventListener("click", function (e) { if (!s.hidden && !s.contains(e.target) && !b.contains(e.target)) set(false); });
})();
