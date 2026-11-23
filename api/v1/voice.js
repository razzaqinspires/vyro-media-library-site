import { guardDemo, relayJson, serviceConfig } from "../../server/api-guard.js";
export default async function handler(req, res) {
  const demoId = guardDemo(req, res, { limit: 8, windowMs: 60_000, bodyLimit: 256 * 1024 });
  if (!demoId) return;
  const target = serviceConfig("VYRO_VOICE_API_URL", "VYRO_VOICE_API_KEY");
  if (!target) return res.status(503).json({ error: "AI Voice Studio belum dikonfigurasi" });
  try {
    const upstream = await fetch(`${target.base}/v1/voice/synthesize`, {
      method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${target.key}` },
      body: JSON.stringify({ ...(req.body || {}), demo_id: demoId }), signal: AbortSignal.timeout(300_000)
    });
    return relayJson(res, upstream);
  } catch (error) { return res.status(502).json({ error: "AI Voice Studio tidak tersedia", detail: error?.name === "TimeoutError" ? "timeout" : "connection_failed" }); }
}
