"use client";
// RF16: photo picker for listings. Shrinks phone photos in the browser so each upload stays under 1 MB.
import { useState } from "react";

const MAX_SIDE = 1600;
const MAX_BYTES = 950_000;

async function shrink(file: File): Promise<File> {
  if (file.size <= MAX_BYTES && /^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  try {
    const bitmap = await createImageBitmap(file);
    let scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    for (let attempt = 0; attempt < 6; attempt++, scale *= 0.75) {
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, "image/jpeg", 0.8));
      if (blob && blob.size <= MAX_BYTES) return new File([blob], "foto.jpg", { type: "image/jpeg" });
    }
    return file;
  } catch {
    return file; // the server validates and reports the error
  }
}

export function PhotoInput({ max }: { max: number }) {
  const [note, setNote] = useState("");
  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const picked = Array.from(input.files ?? []);
    if (picked.length > max) setNote(`Máximo de ${max} foto(s); só as primeiras serão usadas.`);
    else setNote("");
    const done = await Promise.all(picked.slice(0, max).map(shrink));
    const dt = new DataTransfer();
    done.forEach((f) => dt.items.add(f));
    input.files = dt.files;
  }
  return (
    <>
      <input type="file" name="photoFiles" accept="image/jpeg,image/png,image/webp" multiple onChange={onChange} />
      {note && <small role="status">{note}</small>}
    </>
  );
}
