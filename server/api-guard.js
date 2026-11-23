const demoPattern = /^VYRO-DEMO-[A-Fa-f0-9]{8,40}$/;
const buckets = globalThis.__vyroDemoRateBuckets || (globalThis.__vyroDemoRateBuckets = new Map());

export function demoIdentity(req) {
  const candidates = [
    req.headers["x-vyro-demo-id"],
    req.body?.demo_id,
    req.query?.demo_id,
  ].filter(value => value !== undefined && value !== null && String(value).trim() !== "").map(value => String(value).trim().toUpperCase());
  if (!candidates.length || candidates.some(value => !demoPattern.test(value))) return null;
  if (new Set(candidates).size !== 1) return null;
  return candidates[0];
}

export function rejectLargeBody(req, res, limitBytes = 4 * 1024 * 1024) {
  const declared = Number(req.headers["content-length"] || 0);
  if (Number.isFinite(declared) && declared > limitBytes) {
    res.status(413).json({ error: "Payload terlalu besar untuk sesi demo", max_bytes: limitBytes });
    return true;
  }
  return false;
}

export function guardDemo(req, res, { methods = ["POST", "GET"], limit = 60, windowMs = 60_000, bodyLimit = 4 * 1024 * 1024 } = {}) {
  if (!methods.includes(req.method)) {
    res.status(405).json({ error: "Method not allowed" });
    return null;
  }
  if (req.method === "POST" && rejectLargeBody(req, res, bodyLimit)) return null;
  const demoId = demoIdentity(req);
  if (!demoId) {
    res.status(400).json({ error: "Demo ID tidak valid atau tidak konsisten" });
    return null;
  }
  // Best-effort per-client/per-route throttling. Demo IDs are caller-controlled and
  // therefore must not be the only rate-limit partition key. Vercel supplies these
  // forwarding headers; this is still not a substitute for a shared edge limiter.
  const ip = String(req.headers["x-real-ip"] || req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown").split(",")[0].trim();
  const route = req.url?.split("?")[0] || "route";
  const key = `${ip}:${route}`;
  const now = Date.now();
  const old = buckets.get(key);
  const slot = !old || now - old.startedAt >= windowMs ? { startedAt: now, count: 0 } : old;
  slot.count += 1;
  buckets.set(key, slot);
  if (buckets.size > 5000) {
    for (const [entry, value] of buckets) if (now - value.startedAt > windowMs * 2) buckets.delete(entry);
  }
  if (slot.count > limit) {
    res.setHeader("Retry-After", String(Math.ceil((windowMs - (now - slot.startedAt)) / 1000)));
    res.status(429).json({ error: "Batas request demo tercapai; coba lagi nanti" });
    return null;
  }
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("Vary", "X-Vyro-Demo-ID");
  return demoId;
}

export async function relayJson(res, upstream) {
  const text = await upstream.text();
  res.status(upstream.status).setHeader("content-type", upstream.headers.get("content-type") || "application/json");
  return res.send(text);
}

export function serviceConfig(urlName, keyName) {
  const url = process.env[urlName];
  const key = process.env[keyName];
  if (!url || !key) return null;
  if (process.env.NODE_ENV === "production" && !url.startsWith("https://")) return null;
  return { base: url.replace(/\/$/, ""), key };
}
