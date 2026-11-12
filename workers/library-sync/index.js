// The Useful Library: "Save my progress". Email + 4-digit PIN, progress kept in KV.
// POST {act:"login", email, pin, d}  -> creates or opens the account, merges d, returns {token, d, created}
// POST {act:"push", token, d}        -> merges d into the account, returns {d}
// POST {act:"pull", token}           -> returns {d}
// d is a map of localStorage keys to {v: string, t: last-changed ms}. Newest wins, except list keys, which are joined.
const ORIGINS = ["https://theusefulmedia.com", "https://www.theusefulmedia.com"];
const RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const LISTS = ["stamps", "seen"];
const hex = (b) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
const rnd = (n) => { const a = new Uint8Array(n); crypto.getRandomValues(a); return hex(a); };
const sha = async (s) => hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)));

function clean(d) {
  const out = {};
  if (!d || typeof d !== "object") return out;
  let n = 0;
  for (const k of Object.keys(d)) {
    if (n >= 400) break;
    if (k.length > 80 || !/^[a-z0-9:_\-.]+$/i.test(k)) continue;
    const e = d[k];
    if (!e || typeof e.v !== "string" || e.v.length > 4000) continue;
    out[k] = { v: e.v, t: Math.min(+e.t || 0, Date.now() + 60000) };
    n++;
  }
  return out;
}
function merge(a, b) {
  const o = Object.assign({}, a);
  for (const k of Object.keys(b)) {
    if (LISTS.includes(k) && o[k]) {
      try {
        const x = JSON.parse(o[k].v), y = JSON.parse(b[k].v);
        if (Array.isArray(x) && Array.isArray(y)) {
          const u = x.concat(y.filter((i) => !x.includes(i)));
          o[k] = { v: JSON.stringify(u), t: Math.max(o[k].t, b[k].t) };
          continue;
        }
      } catch (e) {}
    }
    if (!o[k] || b[k].t > o[k].t) o[k] = b[k];
  }
  return o;
}

export default {
  async fetch(r, env) {
    const origin = r.headers.get("Origin") || "";
    const ok = ORIGINS.includes(origin);
    const H = { "Access-Control-Allow-Origin": ok ? origin : ORIGINS[0], "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Vary": "Origin", "Content-Type": "application/json", "Cache-Control": "no-store" };
    const out = (o, s) => new Response(JSON.stringify(o), { status: s || 200, headers: H });
    if (r.method === "OPTIONS") return new Response(null, { status: 204, headers: H });
    if (r.method !== "POST" || !ok) return out({ ok: false, code: "forbidden" }, 403);
    let b;
    try { b = await r.json(); } catch (e) { return out({ ok: false, code: "bad" }, 400); }

    if (b.act === "login") {
      const email = String(b.email || "").trim().toLowerCase().slice(0, 200);
      const pin = String(b.pin || "");
      if (!RE.test(email)) return out({ ok: false, code: "format" }, 400);
      if (!/^\d{4}$/.test(pin)) return out({ ok: false, code: "pin" }, 400);
      const ip = r.headers.get("CF-Connecting-IP") || "x";
      const fk = "f:" + email, ik = "i:" + ip;
      const [fails, ipHits] = await Promise.all([env.SYNC.get(fk), env.SYNC.get(ik)]);
      if (+fails >= 5 || +ipHits >= 40) return out({ ok: false, code: "wait" }, 429);
      const ak = "a:" + email;
      let acc = await env.SYNC.get(ak, "json");
      let created = false;
      if (acc) {
        if ((await sha(acc.s + ":" + pin)) !== acc.h) {
          await Promise.all([
            env.SYNC.put(fk, String((+fails || 0) + 1), { expirationTtl: 900 }),
            env.SYNC.put(ik, String((+ipHits || 0) + 1), { expirationTtl: 900 })
          ]);
          return out({ ok: false, code: "wrong", left: Math.max(0, 4 - (+fails || 0)) }, 401);
        }
      } else {
        const s = rnd(16);
        acc = { s, h: await sha(s + ":" + pin), d: {}, c: Date.now() };
        created = true;
      }
      acc.d = merge(acc.d || {}, clean(b.d));
      acc.u = Date.now();
      const token = rnd(24);
      await Promise.all([
        env.SYNC.put(ak, JSON.stringify(acc)),
        env.SYNC.put("t:" + token, email, { expirationTtl: 60 * 60 * 24 * 400 })
      ]);
      return out({ ok: true, token, created, d: acc.d });
    }

    if (b.act === "delete") {
      const token = String(b.token || "");
      if (!/^[a-f0-9]{48}$/.test(token)) return out({ ok: false, code: "signed_out" }, 401);
      const email = await env.SYNC.get("t:" + token);
      if (!email) return out({ ok: false, code: "signed_out" }, 401);
      await Promise.all([env.SYNC.delete("a:" + email), env.SYNC.delete("t:" + token)]);
      return out({ ok: true, deleted: true });
    }
    if (b.act === "push" || b.act === "pull") {
      const token = String(b.token || "");
      if (!/^[a-f0-9]{48}$/.test(token)) return out({ ok: false, code: "signed_out" }, 401);
      const email = await env.SYNC.get("t:" + token);
      if (!email) return out({ ok: false, code: "signed_out" }, 401);
      const acc = await env.SYNC.get("a:" + email, "json");
      if (!acc) return out({ ok: false, code: "signed_out" }, 401);
      if (b.act === "push") {
        const inc = clean(b.d);
        const next = merge(acc.d || {}, inc);
        if (JSON.stringify(next) !== JSON.stringify(acc.d)) { acc.d = next; acc.u = Date.now(); await env.SYNC.put("a:" + email, JSON.stringify(acc)); }
      }
      return out({ ok: true, d: acc.d, u: acc.u });
    }
    return out({ ok: false, code: "bad" }, 400);
  }
};
