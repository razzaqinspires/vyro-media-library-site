const TARGET = process.env.VYRO_INTAKE_API_URL;
const KEY = process.env.VYRO_INTAKE_API_KEY;
const PATH = "/v1/briefs/normalize";
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!TARGET || !KEY) return res.status(503).json({ error: "Layanan belum dikonfigurasi" });
  try {
    const upstream = await fetch(`${TARGET.replace(/\/$/, "")}${PATH}`, {
      method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${KEY}` },
      body: JSON.stringify(req.body ?? {}), signal: AbortSignal.timeout(120000)
    });
    const text = await upstream.text();
    res.status(upstream.status).setHeader("content-type", upstream.headers.get("content-type") || "application/json");
    return res.send(text);
  } catch (error) {
    return res.status(502).json({ error: "Upstream service unavailable", detail: error?.name === "TimeoutError" ? "Request timeout" : "Connection failed" });
  }
}
