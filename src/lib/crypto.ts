// RNF01: Strava tokens are encrypted at rest with AES-256-GCM.
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function parseKey(base64Key: string): Buffer {
  const key = Buffer.from(base64Key, "base64");
  if (key.length !== 32) {
    throw new Error("TOKEN_ENCRYPTION_KEY must be 32 bytes encoded in base64.");
  }
  return key;
}

/** Returns "iv.authTag.ciphertext", each part base64url. */
export function encrypt(plaintext: string, base64Key: string): string {
  const key = parseKey(base64Key);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, ciphertext].map((b) => b.toString("base64url")).join(".");
}

export function decrypt(payload: string, base64Key: string): string {
  const key = parseKey(base64Key);
  const parts = payload.split(".");
  if (parts.length !== 3) throw new Error("Invalid encrypted payload.");
  const [iv, tag, ciphertext] = parts.map((p) => Buffer.from(p, "base64url"));
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
