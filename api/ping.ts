export default function handler(_request: Request): Response {
  return Response.json({ ok: true, source: "independent-node-ping" });
}
