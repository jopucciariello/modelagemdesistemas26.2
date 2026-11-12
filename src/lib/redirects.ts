// Where to send the user after login. Only fixed, same-site paths are allowed (no open redirect).
export const LOGIN_RETURN_PATHS = ["/", "/admin", "/fonte"] as const;
export type LoginReturnPath = (typeof LOGIN_RETURN_PATHS)[number];

export function safeReturnPath(value: string | null | undefined): LoginReturnPath {
  return (LOGIN_RETURN_PATHS as readonly string[]).includes(value ?? "") ? (value as LoginReturnPath) : "/";
}
