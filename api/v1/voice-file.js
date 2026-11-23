import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end("Method not allowed");
  const { content_id: contentId, filename } = req.query || {};
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{2,79}$/.test(String(contentId || "")) || !["narration.wav"].includes(String(filename || "")) && !/^scene-[0-9]{2}\.wav$/.test(String(filename || ""))) return res.status(400).json({ error: "Invalid artifact reference" });
  const target = process.env.VYRO_VOICE_API_URL, key = process.env.VYRO_VOICE_API_KEY;
  if (!target || !key) return res.status(503).json({ error: "Voice service not configured" });
  try {
    const upstream = await fetch(`${target.replace(/\/$/, "")}/v1/voice/files/${encodeURIComponent(contentId)}/${encodeURIComponent(filename)}`, { headers: { authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(60000) });
    if (!upstream.ok) return res.status(upstream.status).json({ error: "Voice artifact unavailable" });
    res.setHeader("content-type", "audio/wav"); res.setHeader("content-disposition", `attachment; filename=\"${filename}\"`);
    return pipeline(Readable.fromWeb(upstream.body), res);
  } catch { return res.status(502).json({ error: "Voice service unavailable" }); }
}
