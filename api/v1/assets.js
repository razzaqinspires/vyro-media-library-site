import { guardDemo, relayJson, serviceConfig } from "../../server/api-guard.js";
export default async function handler(req, res) {
  const demoId = guardDemo(req, res, { limit: 40, windowMs: 60_000, bodyLimit: 4 * 1024 * 1024 });
  if (!demoId) return;
  const target = serviceConfig("VYRO_RENDER_API_URL", "VYRO_RENDER_API_KEY");
  if (!target) return res.status(503).json({ error: "Render Engine belum dikonfigurasi" });
  const { demo_id: _demoId, ...assetPayload } = req.body || {};
  try {
    const upstream = await fetch(`${target.base}/v1/assets`, {
      method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${target.key}`, "x-vyro-demo-id": demoId },
      body: JSON.stringify(assetPayload), signal: AbortSignal.timeout(60_000)
    });
    return relayJson(res, upstream);
  } catch (error) { return res.status(502).json({ error: "Render Engine tidak tersedia", detail: error?.name === "TimeoutError" ? "timeout" : "connection_failed" }); }
}
