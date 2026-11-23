import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { guardDemo, serviceConfig } from "../../server/api-guard.js";
export default async function handler(req, res) {
  const demoId = guardDemo(req, res, { methods: ["GET"], limit: 40 });
  if (!demoId) return;
  const renderId = String(req.query?.render_id || "");
  if (!/^[a-f0-9]{32}$/.test(renderId)) return res.status(400).json({ error: "Render ID tidak valid" });
  const target = serviceConfig("VYRO_RENDER_API_URL", "VYRO_RENDER_API_KEY");
  if (!target) return res.status(503).json({ error: "Render Engine belum dikonfigurasi" });
  try {
    const upstream = await fetch(`${target.base}/v1/renders/${renderId}/download`, {
      headers: { authorization: `Bearer ${target.key}`, "x-vyro-demo-id": demoId }, signal: AbortSignal.timeout(180_000)
    });
    if (!upstream.ok) return res.status(upstream.status).json({ error: "Render tidak tersedia atau sesi tidak cocok" });
    res.setHeader("content-type", "video/mp4"); res.setHeader("content-disposition", `attachment; filename="vyro-${renderId}.mp4"`);
    return pipeline(Readable.fromWeb(upstream.body), res);
  } catch { return res.status(502).json({ error: "Render Engine tidak tersedia" }); }
}
