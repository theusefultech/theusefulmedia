// theusefulmedia.com/free: reveal the download after signup, cover tilt, list ticks, index filters.
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  // Reveal the download once the signup succeeds (tech.js fires signup:done)
  var get = document.querySelector("[data-get]");
  var done = document.querySelector("[data-done]");
  function reveal() {
    if (!get || !done) return;
    get.hidden = true;
    done.hidden = false;
    done.focus({ preventScroll: true });
    if (navigator.vibrate) { try { navigator.vibrate([10, 40, 10]); } catch (e) {} }
    burst(done.querySelector("[data-file]"));
    try { sessionStorage.setItem("free_ok", "1"); } catch (e) {}
  }
  document.addEventListener("signup:done", reveal);
  // Someone who already signed up in this tab gets the button straight away
  try { if (sessionStorage.getItem("free_ok") === "1") reveal(); } catch (e) {}

  function burst(from) {
    var layer = document.querySelector(".burst");
    if (!layer || !from || reduce) return;
    var r = from.getBoundingClientRect();
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    var colors = ["#7C5CFC", "#B9A8FF", "#17172B", "#ECE7FF", "#2BD47D", "#7C5CFC"];
    for (var i = 0; i < 18; i++) {
      var el = document.createElement("i");
      el.style.left = cx + "px"; el.style.top = cy + "px";
      el.style.background = colors[i % colors.length];
      layer.appendChild(el);
      var a = (Math.PI * 2 * i) / 18 + Math.random() * 0.4, d = 70 + Math.random() * 90;
      el.animate([
        { transform: "translate(-50%,-50%) rotate(0deg) scale(1)", opacity: 1 },
        { transform: "translate(" + (Math.cos(a) * d - 6) + "px," + (Math.sin(a) * d - 6 + 40) + "px) rotate(" + (Math.random() * 360) + "deg) scale(.6)", opacity: 0 }
      ], { duration: 900 + Math.random() * 300, easing: "cubic-bezier(.2,.7,.2,1)" }).onfinish = (function (n) { return function () { n.remove(); }; })(el);
    }
  }

  // Cover tilts toward the pointer
  var cover = document.querySelector("[data-tilt]");
  if (cover && fine && !reduce) {
    var art = cover.parentNode;
    art.addEventListener("pointermove", function (e) {
      var r = art.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      cover.style.setProperty("--ry", (x * 16).toFixed(2) + "deg");
      cover.style.setProperty("--rx", (-y * 12).toFixed(2) + "deg");
    });
    art.addEventListener("pointerleave", function () { cover.style.removeProperty("--ry"); cover.style.removeProperty("--rx"); });
  }

  // Ticks animate in when the list scrolls into view
  var ticks = document.querySelector(".ticks");
  if (ticks) {
    if ("IntersectionObserver" in window && !reduce) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { ticks.classList.add("is-in"); io.disconnect(); } });
      }, { threshold: 0.25 });
      io.observe(ticks);
    } else ticks.classList.add("is-in");
  }

  // Index filters
  var chips = Array.prototype.slice.call(document.querySelectorAll(".chip-f"));
  var cards = Array.prototype.slice.call(document.querySelectorAll(".fgrid--all .fc"));
  chips.forEach(function (c) {
    c.addEventListener("click", function () {
      var f = c.getAttribute("data-f");
      chips.forEach(function (o) { o.setAttribute("aria-pressed", o === c ? "true" : "false"); });
      cards.forEach(function (card) {
        card.hidden = !(f === "all" || (" " + card.getAttribute("data-tags") + " ").indexOf(" " + f + " ") !== -1);
      });
    });
  });
})();
