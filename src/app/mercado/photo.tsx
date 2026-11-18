// Visual only: listing photo box with a typographic placeholder.
import s from "./mercado.module.css";

export function Photo({ url, alt, children }: { url?: string; alt: string; children?: React.ReactNode }) {
  return (
    <div className={s.photo}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={alt} loading="lazy" />
      ) : (
        <span className={s.noPhoto} aria-hidden="true">Sem foto</span>
      )}
      {children}
    </div>
  );
}
