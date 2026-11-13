// Smart book links: theusefulmedia.com/go/<book-title-author-slug>
// India -> amazon.in (tag theusefultech-21), everyone else -> amazon.com (tag theusefultech-20).
// Also: /go/dp/<ASIN> for an exact product.
const STORES = {
  IN: { host: "www.amazon.in", tag: "theusefultech-21" },
  DEFAULT: { host: "www.amazon.com", tag: "theusefultech-20" },
};

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/go\/?/, "").replace(/\/+$/, "");
    const country = (request.cf && request.cf.country) || "";
    const store = STORES[country] || STORES.DEFAULT;
    let target;
    const dp = path.match(/^dp\/([A-Z0-9]{10})$/i);
    if (dp) {
      target = `https://${store.host}/dp/${dp[1].toUpperCase()}?tag=${store.tag}`;
    } else if (path) {
      const q = decodeURIComponent(path).replace(/[-_]+/g, " ").trim();
      target = `https://${store.host}/s?k=${encodeURIComponent(q).replace(/%20/g, "+")}&i=stripbooks&tag=${store.tag}`;
    } else {
      target = "https://theusefulmedia.com/library/";
    }
    return new Response(null, {
      status: 302,
      headers: {
        Location: target,
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex, nofollow",
        Vary: "CF-IPCountry",
      },
    });
  },
};
