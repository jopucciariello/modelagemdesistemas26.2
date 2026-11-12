// Access checks for server actions and pages. RB17: admin rights are re-checked on every call.
import "server-only";
import { redirect } from "next/navigation";
import { getCurrentAdmin, getCurrentUser } from "@/lib/session";

/** Any signed-in user can track their own bikes (the admin rides too). */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  return user;
}

export async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin?erro=not_authorized");
  return admin;
}
