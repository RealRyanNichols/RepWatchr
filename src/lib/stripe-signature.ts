import crypto from "node:crypto";

export function parseStripeSignature(header: string | null) {
  if (!header) return null;

  const parsed: { t?: string; v1?: string } = {};
  for (const part of header.split(",")) {
    const [key, ...valueParts] = part.split("=");
    const value = valueParts.join("=");
    if (key === "t") parsed.t = value;
    if (key === "v1" && !parsed.v1) parsed.v1 = value;
  }

  return parsed;
}

export function verifyStripeSignature(rawBody: string, signatureHeader: string | null, secret: string) {
  const parsed = parseStripeSignature(signatureHeader);
  if (!parsed?.t || !parsed.v1) return false;

  const timestamp = Number(parsed.t);
  if (!Number.isFinite(timestamp)) return false;

  const timestampToleranceSeconds = 300;
  const age = Math.abs(Math.floor(Date.now() / 1000) - timestamp);
  if (age > timestampToleranceSeconds) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${parsed.t}.${rawBody}`)
    .digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(parsed.v1, "hex");

  return (
    expectedBuffer.length === receivedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}
