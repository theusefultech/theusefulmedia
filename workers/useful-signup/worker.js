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
  async scheduled(event, env, ctx) { ctx.waitUntil(fyTick(env)); },
  async fetch(request, env, ctx) {
    const origin = request.headers.get("Origin") || "";
    const cors = corsHeaders(origin);

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    // 20 Nov 2026 (M06): GET ?count=tech gives the newsletter's active subscriber count, read nightly by
    // scripts/refresh_facts.py for the Advertise page. A total only, cached 6 hours.
    if (request.method === "GET" && new URL(request.url).searchParams.has("count")) return subscriberCount(new URL(request.url).searchParams.get("count"), env, ctx);
    if (request.method === "GET" && new URL(request.url).searchParams.get("fy") === "polltest") {
      // Temporary: which poll response endpoint exists (status codes and key names only, no reader data).
      const pub = LISTS.tech.publication, id = "poll_6eb245a0-e573-404a-b58f-7a58f7317de7";
      const auth = { Authorization: `Bearer ${env.BEEHIIV_API_KEY}` };
      const out = {};
      for (const u of [`polls/${id}/responses`, `polls/${id}?expand[]=poll_responses`, `polls/${id}`]) {
        try { const r = await fetch(`https://api.beehiiv.com/v2/publications/${pub}/${u}`, { headers: auth }); let k = null; try { const j = await r.json(); k = j && j.data ? (Array.isArray(j.data) ? ["array", j.data[0] ? Object.keys(j.data[0]) : []] : Object.keys(j.data)) : Object.keys(j || {}); } catch {} out[u] = [r.status, k]; } catch (e) { out[u] = String(e); }
      }
      return json(out, 200, cors);
    }
    if (request.method === "GET" && new URL(request.url).searchParams.get("fy") === "tick") {
      // Manual nudge of the matcher (same work as 1 cron minute). Returns the run state or the error.
      try { await fyTick(env); return json(JSON.parse((await env.FY.get("fy:run", { cacheTtl: 30 })) || "null"), 200, cors); }
      catch (e) { return json({ error: String(e && e.stack || e) }, 500, cors); }
    }
    if (request.method === "GET" && new URL(request.url).searchParams.get("fy") === "status") return json(env.FY ? JSON.parse((await env.FY.get("fy:run")) || "null") : null, 200, cors);
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

// Read or save a reader's profile. The page gets the subscriber id from the
// newsletter link (Beehiiv merge tag {{api_subscription_id}}), never an email.
// 24 Nov 2026: generalised from the Apple setup form. Tech saves devices and
// services, user type and wants; Life saves life area, reading goal and pace.
// Every value is whitelisted here, so the page can never write anything else.
const PROFILES = {
  tech: {
    fields: {
      apple_setup: { label: "Apple setup", multi: true, values: SETUP_ITEMS },
      user_type: { label: "User type", multi: false, values: ["casual", "power", "creator", "student", "pro", "dev"] },
      wants: { label: "Wants", multi: true, values: ["apps", "hidden", "shortcuts", "deals", "howitworks", "free"] },
    },
  },
  life: {
    fields: {
      life_area: { label: "Life area", multi: false, values: ["habits", "focus", "money", "mindset"] },
      reading_goal: { label: "Reading goal", multi: false, values: ["more", "apply", "choose", "finish"] },
      pace: { label: "Pace", multi: false, values: ["slow", "steady", "fast"] },
    },
  },
};

async function handleSetup(body, env, cors) {
  const sid = String(body.sid || "");
  if (!SUB_ID_RE.test(sid)) return json(fail("sid"), 200, cors);
  const which = body.list === "life" ? "life" : "tech";
  const prof = PROFILES[which];
  const base = `https://api.beehiiv.com/v2/publications/${LISTS[which].publication}/subscriptions/${sid}`;
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

  const current = readProfile(sub, prof);
  if (body.action === "setup_get") {
    // Old Tech pages only know "items" (the Apple setup list).
    return json({ ok: true, items: current.apple_setup || [], profile: current }, 200, cors);
  }

  // Old page sends { items }, new pages send { profile: { field: value(s) } }.
  const incoming = body.profile && typeof body.profile === "object" ? body.profile : { apple_setup: body.items };
  const out = [];
  const saved = {};
  for (const [name, def] of Object.entries(prof.fields)) {
    if (!(name in incoming)) continue;
    let raw = incoming[name];
    if (def.multi) {
      raw = Array.isArray(raw) ? raw : [];
      const vals = def.values.filter((x) => raw.includes(x)); // whitelist, fixed order, no duplicates
      saved[name] = vals;
      out.push({ name, value: vals.join(",") });
    } else {
      const v = def.values.includes(raw) ? raw : "";
      saved[name] = v;
      out.push({ name, value: v });
    }
  }
  if (!out.length) return json(fail("empty"), 200, cors);
  try {
    const res = await fetch(base, {
      method: "PUT",
      headers: { ...auth, "Content-Type": "application/json" },
      body: JSON.stringify({ custom_fields: out }),
    });
    if (!res.ok) return json(fail("server"), 502, cors);
  } catch {
    return json(fail("server"), 502, cors);
  }
  const profile = { ...current, ...saved };
  return json({ ok: true, items: profile.apple_setup || [], profile }, 200, cors);
}

// Beehiiv reads custom fields back under their display name ("Apple setup").
function readProfile(sub, prof) {
  const out = {};
  const cf = sub.custom_fields || [];
  for (const [name, def] of Object.entries(prof.fields)) {
    const f = cf.find((c) => c.name === name || c.name === def.label);
    const v = f && f.value != null ? String(f.value) : "";
    out[name] = def.multi ? v.split(",").filter((x) => def.values.includes(x)) : (def.values.includes(v) ? v : "");
  }
  return out;
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

async function subscriberCount(which, env, ctx) {
  const list = LISTS[which] || LISTS.tech;
  const ck = new Request("https://useful-signup-cache/count/" + list.publication);
  const hit = await caches.default.match(ck);
  if (hit) return hit;
  let n = null;
  try {
    const res = await fetch(`https://api.beehiiv.com/v2/publications/${list.publication}?expand[]=stats`, { headers: { Authorization: `Bearer ${env.BEEHIIV_API_KEY}` } });
    if (res.ok) { const d = await res.json(); n = d && d.data && d.data.stats ? d.data.stats.active_subscriptions : null; }
  } catch (e) {}
  const out = new Response(JSON.stringify({ ok: typeof n === "number", subscribers: typeof n === "number" ? n : null }), { headers: { "content-type": "application/json", "cache-control": "public, max-age=21600" } });
  if (typeof n === "number") ctx.waitUntil(caches.default.put(ck, out.clone()));
  return out;
}

// ---------------------------------------------------------------------------
// "For your setup" matcher (24 Nov 2026). Free, no Claude usage per reader.
// Beehiiv Lite has no dynamic content, so each issue shows a card built from
// merge tags {{fy_title}}, {{fy_text}}, {{fy_cta}}, {{fy_tags}}. Once a day,
// from 11:00 UTC (before the 14:00 Life and 17:00 Tech sends), this cron walks
// every active reader in batches of 40 (Cloudflare free plan: 50 subrequests
// per run), picks their best item from that week's pool and writes the 4
// fields. Readers with no answers get the "tell us your setup" progress card.
// Pools: /tech/setup/pool.json and /library/profile/pool.json (written weekly).
// State lives in KV (binding FY) under "fy:*".
// ---------------------------------------------------------------------------
const FY_START_UTC_HOUR = 11;
const FY_BATCH = 38; // 1 list call + up to 38 writes + 6 retries stays under 50 subrequests
const FY_POOLS = {
  tech: "https://theusefulmedia.com/tech/setup/pool.json",
  life: "https://theusefulmedia.com/library/profile/pool.json",
};

function fyDaySlot(d) {
  // Issue days: Mon (0), Wed (1), Fri (2). Other days reuse the nearest slot.
  return [0, 0, 0, 1, 2, 2, 0][d.getUTCDay()];
}

function fyRank(pool, profile, which) {
  const owned = which === "tech" ? profile.apple_setup || [] : [];
  const type = which === "tech" ? profile.user_type : profile.life_area;
  const wants = which === "tech" ? profile.wants || [] : [profile.reading_goal, profile.pace].filter(Boolean);
  const scored = [];
  for (const it of pool.items || []) {
    const need = it.devices || [];
    if (need.length && owned.length && !need.some((x) => owned.includes(x))) continue; // never a tip for gear they own none of (no devices ticked = no filter)
    if (it.paces && it.paces.length && profile.pace && !it.paces.includes(profile.pace)) continue;
    let s = 1 + (it.weight || 0);
    if (need.length) s += 1;
    if ((it.types || []).includes(type)) s += 3;
    if ((it.wants || []).some((w) => wants.includes(w))) s += 2;
    scored.push({ it, s });
  }
  scored.sort((a, b) => b.s - a.s || String(a.it.id).localeCompare(String(b.it.id)));
  return scored.map((x) => x.it);
}

function fyProgress(which, count, target, sid) {
  const n = count >= 20 ? `${count} of ${target} readers have told us. ` : "";
  if (which === "tech") return {
    fy_tags: "Built for your setup",
    fy_title: "Tell us your Apple setup in 20 seconds",
    fy_text: `Tap the devices you own and the kind of user you are. Your issues then skip tips for gear you don't have. ${n}At ${target}, every issue starts fitting your setup.`,
    fy_cta: "Tick my setup",
  };
  return {
    fy_tags: "Your reading",
    fy_title: "Tell us what you want books to fix",
    fy_text: `Pick 1 part of life, your reading goal and your pace. Each issue then ends with your next read. ${n}It takes 15 seconds.`,
    fy_cta: "Set my reading profile",
  };
}

function fyFields(item) {
  return {
    fy_tags: (item.tags || []).join(" · "),
    fy_title: item.title,
    fy_text: item.text,
    fy_cta: "See all your picks this week",
  };
}

async function fyBatch(env, which, state) {
  const pub = LISTS[which].publication;
  const auth = { Authorization: `Bearer ${env.BEEHIIV_API_KEY}` };
  const pool = JSON.parse((await env.FY.get(`fy:pool:${which}`)) || "{}");
  const prof = PROFILES[which];
  const url = `https://api.beehiiv.com/v2/publications/${pub}/subscriptions?status=active&limit=${FY_BATCH}&page=${state.page}&expand[]=custom_fields`;
  const res = await fetch(url, { headers: auth });
  if (!res.ok) { state.errors = (state.errors || 0) + 1; return state.errors > 5; }
  const data = await res.json();
  const subs = data.data || [];
  const slot = fyDaySlot(new Date());
  let retries = 0;
  for (const sub of subs) {
    const profile = readProfile(sub, prof);
    const has = Object.values(profile).some((v) => (Array.isArray(v) ? v.length : v));
    let want;
    if (has) {
      state.answered++;
      const ranked = fyRank(pool, profile, which);
      const item = ranked.length ? ranked[slot % ranked.length] : null;
      want = item ? fyFields(item) : fyProgress(which, state.prevCount, pool.target || 300);
    } else {
      want = fyProgress(which, state.prevCount, pool.target || (which === "tech" ? 300 : 100));
    }
    const cf = sub.custom_fields || [];
    const cur = (n) => { const f = cf.find((c) => c.name === n || c.name === n.replace("fy_", "FY ")); return f && f.value != null ? String(f.value) : ""; };
    if (Object.keys(want).every((k) => cur(k) === want[k])) continue;
    const doPut = () => fetch(`https://api.beehiiv.com/v2/publications/${pub}/subscriptions/${sub.id}`, {
      method: "PUT",
      headers: { ...auth, "Content-Type": "application/json" },
      body: JSON.stringify({ custom_fields: Object.entries(want).map(([name, value]) => ({ name, value })) }),
    });
    let put = await doPut();
    if (!put.ok && retries < 6) { retries++; await new Promise((r) => setTimeout(r, 1500)); put = await doPut(); }
    if (put.ok) state.written++; else { state.failed = (state.failed || 0) + 1; state.lastFail = put.status; }
  }
  state.seen += subs.length;
  state.page++;
  return subs.length < FY_BATCH; // true when this list is finished
}

async function fyTick(env) {
  if (!env.FY) return;
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  let run = JSON.parse((await env.FY.get("fy:run")) || "null");
  if (!run || (run.day !== today && run.done)) {
    if (now.getUTCHours() < FY_START_UTC_HOUR) return;
    if (run && run.day === today) return;
    run = { day: today, order: ["life", "tech"], i: 0, done: false, lists: {} };
    for (const w of run.order) {
      try {
        const p = await fetch(`${FY_POOLS[w]}?t=${Date.now()}`);
        if (p.ok) await env.FY.put(`fy:pool:${w}`, JSON.stringify(await p.json()));
      } catch {}
      const prevCount = Number((await env.FY.get(`fy:count:${w}`)) || 0);
      run.lists[w] = { page: 1, seen: 0, answered: 0, written: 0, prevCount };
    }
    await env.FY.put("fy:run", JSON.stringify(run));
    return;
  }
  if (run.done) return;
  const which = run.order[run.i];
  const state = run.lists[which];
  const finished = await fyBatch(env, which, state);
  if (finished) {
    await env.FY.put(`fy:count:${which}`, String(state.answered));
    run.i++;
    if (run.i >= run.order.length) { run.done = true; run.finishedAt = new Date().toISOString(); }
  }
  await env.FY.put("fy:run", JSON.stringify(run));
}
