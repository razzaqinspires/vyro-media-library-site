export default async function handler(_req, res) {
  const services = {
    intake: Boolean(process.env.VYRO_INTAKE_API_URL && process.env.VYRO_INTAKE_API_KEY),
    content: Boolean(process.env.VYRO_CONTENT_API_URL && process.env.VYRO_CONTENT_API_KEY),
    voice: Boolean(process.env.VYRO_VOICE_API_URL && process.env.VYRO_VOICE_API_KEY),
    render: Boolean(process.env.VYRO_RENDER_API_URL && process.env.VYRO_RENDER_API_KEY)
  };
  res.status(200).json({ mode: "demo-first", services, accountSystem: false, publisherConnected: false });
}
