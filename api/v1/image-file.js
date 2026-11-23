import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { guardDemo, serviceConfig } from "../../server/api-guard.js";
export default async function handler(req, res) {
  const demoId = guardDemo(req, res, { methods: ["GET"], limit: 100 });
  if (!demoId) return;
  const assetId = String(req.query?.asset_id || "");
  if (!/^[a-f0-9]{32}$/.test(assetId)) return res.status(400).json({ error: "Asset ID tidak valid" });
  const target = serviceConfig("VYRO_CONTENT_API_URL", "VYRO_CONTENT_API_KEY");
  if (!target) return res.status(503).json({ error: "AI Image service belum dikonfigurasi" });
  try {
    const upstream = await fetch(`${target.base}/v1/images/files/${encodeURIComponent(demoId)}/${assetId}`, {
      headers: { authorization: `Bearer ${target.key}` }, signal: AbortSignal.timeout(60_000)
    });
    if (!upstream.ok) return res.status(upstream.status).json({ error: "Image asset tidak tersedia" });
    const type = upstream.headers.get("content-type") || "application/octet-stream";
    res.setHeader("content-type", type); res.setHeader("content-disposition", `inline; filename="vyro-${assetId}"`);
    return pipeline(Readable.fromWeb(upstream.body), res);
  } catch { return res.status(502).json({ error: "AI Image service tidak tersedia" }); }
}
