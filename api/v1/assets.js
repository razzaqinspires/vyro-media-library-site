export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const target = process.env.VYRO_RENDER_API_URL, key = process.env.VYRO_RENDER_API_KEY;
  if (!target || !key) return res.status(503).json({ error: "Render service not configured" });
  try {
    const upstream = await fetch(`${target.replace(/\/$/, "")}/v1/assets`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${key}` }, body: JSON.stringify(req.body ?? {}), signal: AbortSignal.timeout(60000) });
    const body = await upstream.text(); res.status(upstream.status).setHeader("content-type", upstream.headers.get("content-type") || "application/json"); return res.send(body);
  } catch { return res.status(502).json({ error: "Render service unavailable" }); }
}
