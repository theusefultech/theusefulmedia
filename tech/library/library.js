// Library filters: format tabs + search.
(function () {
  var grid = document.querySelector("[data-grid]");
  if (!grid) return;
  var cards = Array.prototype.slice.call(grid.querySelectorAll(".issue-card"));
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".ar-tab"));
  var input = document.querySelector("[data-search-input]");
  var empty = document.querySelector("[data-empty]");
  var filter = "all";
  function apply() {
    var q = (input.value || "").trim().toLowerCase();
    var shown = 0;
    cards.forEach(function (c) {
      var ok = (filter === "all" || c.dataset.format === filter) && (!q || c.dataset.search.indexOf(q) !== -1);
      c.hidden = !ok; if (ok) shown++;
    });
    empty.hidden = shown !== 0;
  }
  tabs.forEach(function (t) {
    t.addEventListener("click", function () {
      filter = t.dataset.filter;
      tabs.forEach(function (x) { var on = x === t; x.classList.toggle("is-on", on); x.setAttribute("aria-selected", on ? "true" : "false"); });
      apply();
    });
  });
  input.addEventListener("input", apply);
})();
