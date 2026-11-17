// RF01: validation of a bike picture. Pure, so it is tested without a database.

export const MAX_PHOTO_BYTES = 1_000_000;

export type PhotoType = "image/jpeg" | "image/png" | "image/webp";

/** Detects the image type from its first bytes; the file name and the browser's type are not trusted. */
export function detectPhotoType(bytes: Uint8Array): PhotoType | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length >= 8 && png.every((b, i) => bytes[i] === b)) return "image/png";
  const ascii = (from: number, text: string) => [...text].every((c, i) => bytes[from + i] === c.charCodeAt(0));
  if (bytes.length >= 12 && ascii(0, "RIFF") && ascii(8, "WEBP")) return "image/webp";
  return null;
}

export type PhotoCheck = { ok: true; type: PhotoType } | { ok: false; error: "foto_vazia" | "foto_grande" | "foto_tipo" };

export function checkPhoto(bytes: Uint8Array): PhotoCheck {
  if (bytes.length === 0) return { ok: false, error: "foto_vazia" };
  if (bytes.length > MAX_PHOTO_BYTES) return { ok: false, error: "foto_grande" };
  const type = detectPhotoType(bytes);
  return type ? { ok: true, type } : { ok: false, error: "foto_tipo" };
}
