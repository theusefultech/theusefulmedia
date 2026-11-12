// The Useful Library offline support. Pages: network first, then cache. Files: cache first.
var V = "lib-v2";
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(V).then(function (c) { return c.addAll(["/library/", "/library/game/", "/library/offline/"]); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== V; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  var r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== location.origin || u.pathname.indexOf("/library/") !== 0) return;
  if (r.mode === "navigate") {
    e.respondWith(fetch(r).then(function (res) { var cp = res.clone(); caches.open(V).then(function (c) { c.put(r, cp); }); return res; })
      .catch(function () { return caches.match(r).then(function (m) { return m || caches.match("/library/offline/"); }); }));
    return;
  }
  // Files: serve the cached copy fast, but always refresh it in the background so updated images and files show up next time
  e.respondWith(caches.open(V).then(function (c) {
    return c.match(r).then(function (m) {
      var net = fetch(r).then(function (res) { if (res.ok) c.put(r, res.clone()); return res; }).catch(function () { return m; });
      return m || net;
    });
  }));
});
