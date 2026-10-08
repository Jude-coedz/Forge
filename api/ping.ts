export const config = { runtime: "edge" };

export default function handler(_request: Request): Response {
  return Response.json({ ok: true, source: "independent-edge-ping" });
}
