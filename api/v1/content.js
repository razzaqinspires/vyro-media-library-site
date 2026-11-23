import { guardDemo, relayJson, serviceConfig } from "../../server/api-guard.js";
export default async function handler(req, res) {
  const demoId = guardDemo(req, res, { limit: 24 });
  if (!demoId) return;
  const target = serviceConfig("VYRO_CONTENT_API_URL", "VYRO_CONTENT_API_KEY");
  if (!target) return res.status(503).json({ error: "AI Content Engine belum dikonfigurasi" });
  const { demo_id: _demoId, ...contentPayload } = req.body || {};
  try {
    const upstream = await fetch(`${target.base}/v1/content/generate`, {
      method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${target.key}`, "x-vyro-demo-id": demoId },
      body: JSON.stringify(contentPayload), signal: AbortSignal.timeout(150_000)
    });
    return relayJson(res, upstream);
  } catch (error) { return res.status(502).json({ error: "AI Content Engine tidak tersedia", detail: error?.name === "TimeoutError" ? "timeout" : "connection_failed" }); }
}
