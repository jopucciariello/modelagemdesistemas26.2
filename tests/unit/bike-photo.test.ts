import { describe, expect, it } from "vitest";
import { MAX_PHOTO_BYTES, checkPhoto, detectPhotoType } from "@/lib/bike-photo";
import { formatDuration } from "@/lib/format";

const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10]);
const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
const webp = Uint8Array.from([..."RIFF"].map((c) => c.charCodeAt(0)).concat([0, 0, 0, 0], [..."WEBP"].map((c) => c.charCodeAt(0))));

describe("RF01: bike picture", () => {
  it("recognises JPEG, PNG and WebP by their first bytes", () => {
    expect(detectPhotoType(jpeg)).toBe("image/jpeg");
    expect(detectPhotoType(png)).toBe("image/png");
    expect(detectPhotoType(webp)).toBe("image/webp");
  });
  it("rejects anything else, such as SVG or HTML, even if it is named like an image", () => {
    expect(detectPhotoType(new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'></svg>"))).toBeNull();
    expect(checkPhoto(new TextEncoder().encode("<html><script>alert(1)</script>"))).toEqual({ ok: false, error: "foto_tipo" });
  });
  it("rejects empty and oversized files", () => {
    expect(checkPhoto(new Uint8Array())).toEqual({ ok: false, error: "foto_vazia" });
    const big = new Uint8Array(MAX_PHOTO_BYTES + 1);
    big.set(jpeg);
    expect(checkPhoto(big)).toEqual({ ok: false, error: "foto_grande" });
  });
  it("accepts a valid picture within the limit", () => {
    expect(checkPhoto(png)).toEqual({ ok: true, type: "image/png" });
  });
});

describe("RF14: ride time shown as hours and minutes", () => {
  it("formats x h y m", () => {
    expect(formatDuration(1.5)).toBe("1 h 30 m");
    expect(formatDuration(2)).toBe("2 h 0 m");
    expect(formatDuration(0.25)).toBe("15 m");
    expect(formatDuration(0)).toBe("0 m");
  });
});
