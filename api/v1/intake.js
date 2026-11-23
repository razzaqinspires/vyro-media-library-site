import { guardDemo, relayJson, serviceConfig } from "../../server/api-guard.js";
export default async function handler(req, res) {
  const demoId = guardDemo(req, res, { limit: 40 });
  if (!demoId) return;
  const target = serviceConfig("VYRO_INTAKE_API_URL", "VYRO_INTAKE_API_KEY");
  if (!target) return res.status(503).json({ error: "Script Intake belum dikonfigurasi" });
  const { demo_id: _demoId, ...briefPayload } = req.body || {};
  try {
    const upstream = await fetch(`${target.base}/v1/briefs/normalize`, {
      method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${target.key}`, "x-vyro-demo-id": demoId },
      body: JSON.stringify(briefPayload), signal: AbortSignal.timeout(90_000)
    });
    return relayJson(res, upstream);
  } catch (error) { return res.status(502).json({ error: "Script Intake tidak tersedia", detail: error?.name === "TimeoutError" ? "timeout" : "connection_failed" }); }
}
