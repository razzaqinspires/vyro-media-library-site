import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { guardDemo, serviceConfig } from "../../server/api-guard.js";
export default async function handler(req, res) {
  const demoId = guardDemo(req, res, { methods: ["GET"], limit: 60 });
  if (!demoId) return;
  const contentId = String(req.query?.content_id || "");
  const filename = String(req.query?.filename || "");
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{2,79}$/.test(contentId) || (filename !== "narration.wav" && !/^scene-[0-9]{2}\.wav$/.test(filename))) return res.status(400).json({ error: "Artifact reference tidak valid" });
  const target = serviceConfig("VYRO_VOICE_API_URL", "VYRO_VOICE_API_KEY");
  if (!target) return res.status(503).json({ error: "Voice service belum dikonfigurasi" });
  try {
    const upstream = await fetch(`${target.base}/v1/voice/files/${encodeURIComponent(demoId)}/${encodeURIComponent(contentId)}/${encodeURIComponent(filename)}`, {
      headers: { authorization: `Bearer ${target.key}` }, signal: AbortSignal.timeout(90_000)
    });
    if (!upstream.ok) return res.status(upstream.status).json({ error: "Voice artifact tidak tersedia" });
    res.setHeader("content-type", "audio/wav"); res.setHeader("content-disposition", `attachment; filename="${filename}"`);
    return pipeline(Readable.fromWeb(upstream.body), res);
  } catch { return res.status(502).json({ error: "Voice service tidak tersedia" }); }
}
