// RF01, RF15: the bike picture, or a placeholder icon while the athlete has not sent one.
import Image from "next/image";

export function BikeAvatar({ bikeId, hasPhoto, version, size = 56 }: { bikeId: string; hasPhoto: boolean; version?: number; size?: number }) {
  if (hasPhoto) {
    return (
      <Image className="bike-avatar" src={`/bikes/${bikeId}/foto?v=${version ?? 0}`} alt="" width={size} height={size} unoptimized />
    );
  }
  return (
    <span className="bike-avatar bike-avatar-empty" style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 24 24" width={size * 0.6} height={size * 0.6} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="5.5" cy="16.5" r="3.5" />
        <circle cx="18.5" cy="16.5" r="3.5" />
        <path d="M5.5 16.5 9 8h4l5.5 8.5M9 8 7.5 5.5H6M13 8l-2.5 8.5" />
      </svg>
    </span>
  );
}
