// The Useful Tech signup Worker
// Receives signups from theusefulmedia.com/tech, filters junk, then adds real
// readers to Beehiiv and enrolls them in the welcome sequence.
// Since 20 Nov 2026 it also saves a reader's Apple setup (devices and services
// they tick on theusefulmedia.com/tech/setup/) into the Beehiiv custom field
// "apple_setup", so issues can be tailored to it later.
//
// Secrets (Settings > Variables and Secrets, type "Secret"):
//   BEEHIIV_API_KEY   your Beehiiv API key
//   TURNSTILE_SECRET  the secret key from your Cloudflare Turnstile widget

const LISTS = { tech: { publication: "pub_e9c964d1-d07f-4b1f-9905-12be2a906734", automations: ["aut_a90a43c7-eb07-487d-a046-d6c68dfd52f3"], campaign: "tech", page: "https://theusefulmedia.com/tech/" }, life: { publication: "pub_3c3feaa5-eef4-41d5-8a8e-b140479e87bb", automations: [], campaign: "library", page: "https://theusefulmedia.com/library/" } };
const WELCOME_AUTOMATION_ID = "aut_a90a43c7-eb07-487d-a046-d6c68dfd52f3";
const ALLOWED_ORIGINS = [
  "https://theusefulmedia.com",
  "https://www.theusefulmedia.com",
];
const DISPOSABLE_LIST_URL =
  "https://raw.githubusercontent.com/disposable-email-domains/disposable-email-domains/main/disposable_email_blocklist.conf";

// Apple setup: the only values the setup page may save.
const SETUP_FIELD = "apple_setup";
const SETUP_ITEMS = [
  "iphone", "ipad", "mac", "watch", "airpods", "appletv", "homepod", "vision",
  "icloud", "appleone", "music", "tvplus", "arcade", "fitness", "news", "applepay",
];
const SUB_ID_RE = /^sub_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// Mistyped versions of big providers. Many of these domains exist and accept
// mail, so a mailbox check alone would let them through.
const TYPO_DOMAINS = {
  "gmial.com": "gmail.com", "gmai.com": "gmail.com", "gamil.com": "gmail.com",
  "gmail.co": "gmail.com", "gmail.con": "gmail.com", "gmail.cm": "gmail.com",
  "gmaill.com": "gmail.com", "gnail.com": "gmail.com", "gmal.com": "gmail.com",
  "gmail.om": "gmail.com", "gmail.cmo": "gmail.com", "gmali.com": "gmail.com",
  "hotmial.com": "hotmail.com", "hotmai.com": "hotmail.com", "hotmail.co": "hotmail.com",
  "hotmail.con": "hotmail.com", "homail.com": "hotmail.com",
  "yaho.com": "yahoo.com", "yahoo.co": "yahoo.com", "yahoo.con": "yahoo.com", "yhoo.com": "yahoo.com",
  "outlok.com": "outlook.com", "outlook.co": "outlook.com", "outlook.con": "outlook.com",
  "iclod.com": "icloud.com", "icloud.co": "icloud.com", "icloud.con": "icloud.com", "icoud.com": "icloud.com",
};

const EMAIL_RE = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get("Origin") || "";
    const cors = corsHeaders(origin);

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "POST") return json({ ok: false, code: "method" }, 405, cors);
    if (!ALLOWED_ORIGINS.includes(origin)) return json({ ok: false, code: "origin" }, 403, cors);

    let body;
    try { body = await request.json(); } catch { return json(fail("bad_request"), 400, cors); }

    if (body.action === "setup_get" || body.action === "setup_save") return handleSetup(body, env, cors);

    // Honeypot: a hidden field real people never fill in.
    if (body.website) return json({ ok: true, existing: false }, 200, cors);

    const list = LISTS[body.list] || LISTS.tech; const email = String(body.email || "").trim().toLowerCase();
    if (email.length > 254 || !EMAIL_RE.test(email)) return json(fail("format"), 200, cors);

    const domain = email.split("@")[1];

    if (TYPO_DOMAINS[domain]) {
      return json(fail("typo", { suggestion: email.split("@")[0] + "@" + TYPO_DOMAINS[domain] }), 200, cors);
    }

    // Bot check
    const ip = request.headers.get("CF-Connecting-IP") || "";
    const human = await verifyTurnstile(env.TURNSTILE_SECRET, body.token, ip);
    if (!human) return json(fail("bot"), 200, cors);

    // Throwaway inbox services
    if (await isDisposable(domain, ctx)) return json(fail("disposable"), 200, cors);

    // The domain must be able to receive email
    if (!(await acceptsMail(domain))) return json(fail("no_mail"), 200, cors);

    // Already subscribed?
    const existing = await findSubscriber(env.BEEHIIV_API_KEY, email, list);
    if (existing && existing.status === "active") return json({ ok: true, existing: true }, 200, cors);

    const created = await createSubscriber(env.BEEHIIV_API_KEY, email, body, request, list);
    if (!created) return json(fail("server"), 502, cors);

    return json({ ok: true, existing: false }, 200, cors);
  },
};

// Read or save a Tech subscriber's Apple setup. The page gets the subscriber id
// from the newsletter link (Beehiiv merge tag {{subscriber_id}}), never an email.
async function handleSetup(body, env, cors) {
  const sid = String(body.sid || "");
  if (!SUB_ID_RE.test(sid)) return json(fail("sid"), 200, cors);
  const base = `https://api.beehiiv.com/v2/publications/${LISTS.tech.publication}/subscriptions/${sid}`;
  const auth = { Authorization: `Bearer ${env.BEEHIIV_API_KEY}` };

  let sub;
  try {
    const res = await fetch(`${base}?expand[]=custom_fields`, { headers: auth });
    if (res.status === 404) return json(fail("sid"), 200, cors);
    if (!res.ok) return json(fail("server"), 502, cors);
    sub = (await res.json()).data;
  } catch {
    return json(fail("server"), 502, cors);
  }
  if (!sub || sub.status !== "active") return json(fail("sid"), 200, cors);

  if (body.action === "setup_get") {
    // Beehiiv reads the field back under its display name ("Apple setup").
    const f = (sub.custom_fields || []).find((c) => c.name === SETUP_FIELD || c.name === "Apple setup");
    const items = f && f.value ? String(f.value).split(",").filter((x) => SETUP_ITEMS.includes(x)) : [];
    return json({ ok: true, items }, 200, cors);
  }

  const raw = Array.isArray(body.items) ? body.items : [];
  const items = SETUP_ITEMS.filter((x) => raw.includes(x)); // whitelist, fixed order, no duplicates
  try {
    const res = await fetch(base, {
      method: "PUT",
      headers: { ...auth, "Content-Type": "application/json" },
      body: JSON.stringify({ custom_fields: [{ name: SETUP_FIELD, value: items.join(",") }] }),
    });
    if (!res.ok) return json(fail("server"), 502, cors);
  } catch {
    return json(fail("server"), 502, cors);
  }
  return json({ ok: true, items }, 200, cors);
}

function fail(code, extra = {}) { return { ok: false, code, ...extra }; }

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

async function verifyTurnstile(secret, token, ip) {
  if (!secret || !token) return false;
  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token);
  if (ip) form.append("remoteip", ip);
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}

async function isDisposable(domain, ctx) {
  try {
    // Cached at Cloudflare's edge for 24 hours.
    const res = await fetch(DISPOSABLE_LIST_URL, { cf: { cacheTtl: 86400, cacheEverything: true } });
    if (!res.ok) return false;
    const text = await res.text();
    const parts = domain.split(".");
    // Check the domain and its parent domains (mail.tempmail.com -> tempmail.com)
    const candidates = [];
    for (let i = 0; i < parts.length - 1; i++) candidates.push(parts.slice(i).join("."));
    const set = new Set(text.split("\n").map((l) => l.trim()).filter(Boolean));
    return candidates.some((d) => set.has(d));
  } catch {
    return false; // never block a real reader because the list failed to load
  }
}

async function acceptsMail(domain) {
  try {
    const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=MX`, {
      headers: { Accept: "application/dns-json" },
    });
    if (!res.ok) return true; // fail open on DNS trouble
    const data = await res.json();
    if (data.Status === 3) return false; // domain does not exist
    const mx = (data.Answer || []).filter((a) => a.type === 15);
    if (mx.length === 0) return false;
    // A "null MX" (0 .) means the domain explicitly refuses mail.
    if (mx.length === 1 && /^0\s+\.?$/.test(String(mx[0].data).trim())) return false;
    return true;
  } catch {
    return true;
  }
}

async function findSubscriber(apiKey, email, list) {
  try {
    const res = await fetch(
      `https://api.beehiiv.com/v2/publications/${list.publication}/subscriptions/by_email/${encodeURIComponent(email)}`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const data = await res.json();
    return data.data || null;
  } catch {
    return null;
  }
}

async function createSubscriber(apiKey, email, body, request, list) {
  const payload = {
    email,
    reactivate_existing: true,
    send_welcome_email: list.automations.length === 0,
    double_opt_override: "off",
    automation_ids: list.automations,
    utm_source: clean(body.utm_source) || "theusefulmedia.com",
    utm_medium: clean(body.utm_medium) || "landing_page",
    utm_campaign: clean(body.utm_campaign) || list.campaign,
    referring_site: clean(body.referrer) || request.headers.get("Referer") || list.page,
  };
  try {
    const res = await fetch(`https://api.beehiiv.com/v2/publications/${list.publication}/subscriptions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function clean(v) {
  if (!v) return "";
  return String(v).slice(0, 200);
}
