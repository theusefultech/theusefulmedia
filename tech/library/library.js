// Library filters: format tabs + search.
(function () {
  var grid = document.querySelector("[data-grid]");
  if (!grid) return;
  var cards = Array.prototype.slice.call(grid.querySelectorAll(".issue-card"));
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".ar-tab"));
  var input = document.querySelector("[data-search-input]");
  var empty = document.querySelector("[data-empty]");
  var filter = "all";
  // 24 Nov 2026 (visual check): the full list is 23 phone screens, so the first 17 show until "Show all" (search and tabs always see every issue)
  var LIMIT = 17, more = document.querySelector("[data-more]"), open = false;
  function apply() {
    var q = (input.value || "").trim().toLowerCase();
    var shown = 0, cap = !open && filter === "all" && !q;
    cards.forEach(function (c) {
      var ok = (filter === "all" || c.dataset.format === filter) && (!q || c.dataset.search.indexOf(q) !== -1);
      if (ok) shown++;
      c.hidden = !ok || (cap && shown > LIMIT);
    });
    empty.hidden = shown !== 0;
    if (more) more.hidden = !(cap && shown > LIMIT);
  }
  if (more) more.addEventListener("click", function () { open = true; apply(); var n = cards.filter(function (c) { return !c.hidden; })[LIMIT]; if (n) n.focus(); });
  tabs.forEach(function (t) {
    t.addEventListener("click", function () {
      filter = t.dataset.filter;
      tabs.forEach(function (x) { var on = x === t; x.classList.toggle("is-on", on); x.setAttribute("aria-selected", on ? "true" : "false"); });
      apply();
    });
  });
  input.addEventListener("input", apply);
  apply();
})();
