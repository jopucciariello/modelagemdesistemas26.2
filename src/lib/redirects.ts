// Where to send the user after login. Only fixed, same-site paths are allowed (no open redirect).
export const LOGIN_RETURN_PATHS = ["/", "/admin", "/fonte"] as const;
export type LoginReturnPath = (typeof LOGIN_RETURN_PATHS)[number];

export function safeReturnPath(value: string | null | undefined): LoginReturnPath {
  return (LOGIN_RETURN_PATHS as readonly string[]).includes(value ?? "") ? (value as LoginReturnPath) : "/";
}

const DEV_ORIGINS = ["http://localhost:8081", "http://localhost:19006"];

/**
 * Where the Expo app wants the token after Google login (issue #61). Only the app's own deep link
 * (`gearlog://`), Expo Go in development (`exp://`, `exps://`), the site's own origin or the Expo
 * web dev server on this machine (`http://localhost:8081` / `:19006`) are allowed, so the token can
 * never be sent to a third-party host.
 */
export function safeAppRedirect(value: string | null | undefined, appOrigin: string): string | null {
  if (!value) return null;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.username || url.password || url.hash) return null;
  if (["gearlog:", "exp:", "exps:"].includes(url.protocol)) return url.toString();
  if (DEV_ORIGINS.includes(url.origin)) return url.toString();
  try {
    if (url.origin === new URL(appOrigin).origin) return url.toString();
  } catch {
    /* invalid APP_URL: refuse */
  }
  return null;
}
