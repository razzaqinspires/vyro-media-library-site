import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end("Method not allowed");
  const renderId = String(req.query?.render_id || "");
  if (!/^[a-f0-9]{32}$/.test(renderId)) return res.status(400).json({ error: "Invalid render ID" });
  const target = process.env.VYRO_RENDER_API_URL, key = process.env.VYRO_RENDER_API_KEY;
  if (!target || !key) return res.status(503).json({ error: "Render service not configured" });
  try {
    const upstream = await fetch(`${target.replace(/\/$/, "")}/v1/renders/${renderId}/download`, { headers: { authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(120000) });
    if (!upstream.ok) return res.status(upstream.status).json({ error: "Render artifact unavailable" });
    res.setHeader("content-type", "video/mp4"); res.setHeader("content-disposition", `attachment; filename=\"vyro-${renderId}.mp4\"`);
    return pipeline(Readable.fromWeb(upstream.body), res);
  } catch { return res.status(502).json({ error: "Render service unavailable" }); }
}
