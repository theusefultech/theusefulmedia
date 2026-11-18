// Swipe rows for phones (18 Nov 2026): touch swipe plus arrow buttons, dots, mouse drag and arrow keys.
// Mark a row with data-hrow. Buttons only show while the row overflows.
(function () {
  function chev(d) { return '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="' + (d < 0 ? "M12.5 4.5 7 10l5.5 5.5" : "M7.5 4.5 13 10l-5.5 5.5") + '"/></svg>'; }
  function init(row) {
    var nav = document.createElement("div");
    nav.className = "hrow-nav";
    nav.innerHTML = '<button type="button" data-d="-1" aria-label="Previous">' + chev(-1) + '</button><button type="button" data-d="1" aria-label="Next">' + chev(1) + '</button><span class="hrow-dots" aria-hidden="true"></span>';
    row.after(nav);
    var dots = nav.querySelector(".hrow-dots"), prev = nav.children[0], next = nav.children[1];
    function step() { var it = row.children; return it.length > 1 ? it[1].offsetLeft - it[0].offsetLeft : row.clientWidth; }
    function sync() {
      var n = row.children.length, on = row.scrollWidth > row.clientWidth + 4;
      nav.style.display = on ? "" : "none"; row.tabIndex = on ? 0 : -1;
      if (!on) return;
      while (dots.children.length < n) dots.appendChild(document.createElement("i"));
      while (dots.children.length > n) dots.lastChild.remove();
      var max = row.scrollWidth - row.clientWidth, idx = Math.min(n - 1, Math.round(row.scrollLeft / step()));
      prev.disabled = row.scrollLeft < 4; next.disabled = row.scrollLeft > max - 4;
      for (var j = 0; j < n; j++) dots.children[j].classList.toggle("on", j === idx);
    }
    function go(d) { row.scrollBy({ left: d * step(), behavior: "smooth" }); }
    nav.addEventListener("click", function (e) { var b = e.target.closest("button"); if (b) go(+b.getAttribute("data-d")); });
    row.addEventListener("keydown", function (e) {
      if (e.target !== row) return;
      if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
    });
    var down = false, moved = false, x0 = 0, s0 = 0;
    row.addEventListener("pointerdown", function (e) { if (e.pointerType !== "mouse" || e.button !== 0) return; down = true; moved = false; x0 = e.clientX; s0 = row.scrollLeft; });
    window.addEventListener("pointermove", function (e) {
      if (!down) return; var dx = e.clientX - x0;
      if (!moved && Math.abs(dx) > 5) { moved = true; row.classList.add("is-dragging"); }
      if (moved) row.scrollLeft = s0 - dx;
    });
    window.addEventListener("pointerup", function () {
      if (!down) return; down = false;
      if (moved) { row.classList.remove("is-dragging"); row.scrollTo({ left: Math.round(row.scrollLeft / step()) * step(), behavior: "smooth" }); }
    });
    row.addEventListener("dragstart", function (e) { e.preventDefault(); });
    row.addEventListener("click", function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    row.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    if ("MutationObserver" in window) new MutationObserver(sync).observe(row, { childList: true });
    sync();
  }
  function start() { document.querySelectorAll("[data-hrow]").forEach(init); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
