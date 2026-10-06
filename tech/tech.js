// theusefulmedia.com/tech: tapping an email in the phone marks it read.
(function () {
  var rows = document.querySelectorAll(".mail-row");
  var count = document.querySelector(".inbox-top b");
  if (!rows.length || !count) return;
  function update() {
    var unread = document.querySelectorAll(".mail-row:not(.is-read)").length;
    count.textContent = unread ? unread + " unread" : "All read";
  }
  rows.forEach(function (row) {
    row.addEventListener("click", function () {
      row.classList.toggle("is-read");
      update();
    });
  });
})();

// If the Beehiiv form has not rendered after 6 seconds (blocked or slow),
// show a button instead so the page never has an empty signup spot.
(function () {
  setTimeout(function () {
    document.querySelectorAll(".signup[data-fallback]").forEach(function (slot) {
      var rendered = slot.querySelector("iframe, form, div, [class*='beehiiv']");
      if (rendered) return;
      var a = document.createElement("a");
      a.className = "signup-btn";
      a.href = slot.getAttribute("data-fallback");
      a.textContent = "Send me the next issue";
      slot.appendChild(a);
    });
  }, 6000);
})();
