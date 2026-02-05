import { createHash, createHmac } from "crypto";

/**
 * Validates the VAPI Webhook Signature (HMAC-SHA256)
 * @param payload The raw request body (string)
 * @param signature The 'x-vapi-signature' header
 * @param secret The VAPI webhook secret
 */
export const verifyVapiSignature = (
  payload: string,
  signature: string,
  secret: string
): boolean => {
  if (!payload || !signature || !secret) return false;

  try {
    const hmac = createHmac("sha256", secret);
    const calculatedSignature = hmac.update(payload).digest("hex");

    // Constant time comparison to prevent timing attacks
    return timingSafeEqual(calculatedSignature, signature);
  } catch (error) {
    console.error("Crypto error:", error);
    return false;
  }
};

/**
 * Custom constant-time string comparison (since timingSafeEqual requires Buffers)
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * Generates a SHA-256 hash of the request for Idempotency
 */
export const generateRequestHash = (
  method: string,
  path: string,
  body: string
): string => {
  return createHash("sha256").update(`${method}:${path}:${body}`).digest("hex");
};

/**
 * Redacts PII from an object recursively
 * Targets: phone, email, transcript, recordingUrl, summary
 */
export const redactPII = (obj: any): any => {
  if (!obj) return obj;
  if (typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(redactPII);

  const sensitiveFields = [
    "phone",
    "phone_number",
    "phoneNumber",
    "email",
    "customer_email",
    "transcript",
    "summary",
    "recordingUrl",
    "recording_url",
  ];

  const newObj: any = { ...obj };

  for (const key of Object.keys(newObj)) {
    if (sensitiveFields.includes(key)) {
      if (key === "transcript" || key === "summary") {
        newObj[key] = "[REDACTED_CONTENT]";
      } else if (typeof newObj[key] === "string") {
        newObj[key] = "[REDACTED]";
      }
    } else if (typeof newObj[key] === "object") {
      newObj[key] = redactPII(newObj[key]);
    }
  }

  return newObj;
};


/**
 * Masks a phone number, showing only the last 4 digits.
 * @param phone E.164 phone number
 */
export const maskPhoneNumber = (phone: string): string => {
    if (!phone || phone.length < 4) return '***';
    return `***-${phone.slice(-4)}`;
};

/**
 * SHA256 Hash for identifiers (server-side tracking without PII).
 */
export const hashIdentifier = (id: string): string => {
    if (!id) return '';
    return createHash('sha256').update(id).digest('hex').substring(0, 8) + '...';
};

/**
 * Validates the Trinity Webhook Signature (HMAC-SHA256)
 * @param payload Raw request body
 * @param signature 'x-trinity-signature' header
 * @param secret Trinity webhook secret
 */
export const verifyTrinitySignature = (
    payload: string,
    signature: string,
    secret: string
  ): boolean => {
    return verifyVapiSignature(payload, signature, secret);
};
