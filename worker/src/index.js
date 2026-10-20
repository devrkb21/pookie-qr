// Love QR Studio — photo storage on Cloudflare (Worker + KV).
//
//   POST /upload       body = image bytes, headers X-Upload-Key + X-Message  -> { id }
//   POST /check        header X-Upload-Key                                   -> 200 if the key is right
//   GET  /i/:id        the photo
//   GET  /meta/:id     { msg, type, at }
//
// Uploads need the secret UPLOAD_KEY (set with: npx wrangler secret put UPLOAD_KEY),
// so strangers can't fill the storage. Viewing only needs the id, which is long and random.

const MAX_BYTES = 3 * 1024 * 1024;
const TYPES = ["image/webp", "image/jpeg", "image/png", "image/avif"];
const ID_RE = /^[A-Za-z0-9]{10,32}$/;
const ALPHABET = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function newId(len = 12) {
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return [...bytes].map((b) => ALPHABET[b % ALPHABET.length]).join("");
}

// constant-time string compare, so the key can't be guessed by timing
function sameKey(a = "", b = "") {
  const x = new TextEncoder().encode(a), y = new TextEncoder().encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0 && b.length > 0;
}

function corsFor(req, env) {
  const origin = req.headers.get("Origin") || "";
  const allowed = (env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim());
  return {
    "Access-Control-Allow-Origin": allowed.includes(origin) ? origin : allowed[0] || "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Upload-Key, X-Message",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

const json = (data, status, headers) =>
  new Response(JSON.stringify(data), { status, headers: { ...headers, "Content-Type": "application/json; charset=utf-8" } });

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const cors = corsFor(req, env);
    const open = { "Access-Control-Allow-Origin": "*" }; // reading is fine from anywhere

    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

    if (req.method === "POST" && (url.pathname === "/upload" || url.pathname === "/check")) {
      if (!sameKey(req.headers.get("X-Upload-Key") || "", env.UPLOAD_KEY)) return json({ error: "bad-key" }, 401, cors);
      if (url.pathname === "/check") return json({ ok: true }, 200, cors);

      const type = (req.headers.get("Content-Type") || "").split(";")[0].trim();
      if (!TYPES.includes(type)) return json({ error: "bad-type" }, 415, cors);
      const body = await req.arrayBuffer();
      if (!body.byteLength) return json({ error: "empty" }, 400, cors);
      if (body.byteLength > MAX_BYTES) return json({ error: "too-big" }, 413, cors);

      let msg = "";
      try { msg = decodeURIComponent(req.headers.get("X-Message") || "").slice(0, 500); } catch {}

      const id = newId();
      const meta = { msg, type, at: Date.now() };
      await env.IMAGES.put(`img:${id}`, body, { metadata: { type } });
      await env.IMAGES.put(`meta:${id}`, JSON.stringify(meta));
      return json({ id }, 201, cors);
    }

    if (req.method === "GET") {
      const m = url.pathname.match(/^\/(i|meta)\/([^/]+)$/);
      if (!m || !ID_RE.test(m[2])) {
        return url.pathname === "/" ? new Response("Love QR Studio images ♥", { headers: open }) : json({ error: "not-found" }, 404, open);
      }
      const [, kind, id] = m;
      if (kind === "meta") {
        const meta = await env.IMAGES.get(`meta:${id}`);
        if (!meta) return json({ error: "not-found" }, 404, open);
        return new Response(meta, { headers: { ...open, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=300" } });
      }
      const { value, metadata } = await env.IMAGES.getWithMetadata(`img:${id}`, "arrayBuffer");
      if (!value) return json({ error: "not-found" }, 404, open);
      return new Response(value, {
        headers: {
          ...open,
          "Content-Type": metadata?.type || "image/jpeg",
          "Cache-Control": "public, max-age=31536000, immutable",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    return json({ error: "method" }, 405, cors);
  },
};
