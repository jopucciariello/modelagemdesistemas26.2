// RF21, OPEN-34: in-app notifications, unread first.
import Link from "next/link";
import { Suspense } from "react";
import { markAllRead, markNotificationRead } from "@/app/actions/dreams";
import { Nav } from "@/components/ui";
import { prisma } from "@/lib/db";
import { formatDay } from "@/lib/dates";
import { requireUser } from "@/lib/guards";

export default function NotificationsPage() {
  return (
    <main>
      <header><h1>Avisos</h1></header>
      <Suspense fallback={<p className="muted">Carregando…</p>}>
        <Notifications />
      </Suspense>
    </main>
  );
}

async function Notifications() {
  const user = await requireUser();
  const items = await prisma.notification.findMany({ where: { userId: user.id }, orderBy: [{ createdAt: "desc" }], take: 100 });
  const sorted = [...items.filter((n) => !n.readAt), ...items.filter((n) => n.readAt)];
  const unread = items.filter((n) => !n.readAt).length;
  return (
    <>
      <Nav isAdmin={user.role === "ADMIN"} />
      <section className="card">
        <div className="row">
          <p>{unread === 0 ? "Nenhum aviso novo." : `${unread} ${unread === 1 ? "aviso novo" : "avisos novos"}.`}</p>
          {unread > 0 && (
            <form action={markAllRead}><button className="button small" type="submit">Marcar todos como lidos</button></form>
          )}
        </div>
        {sorted.length === 0 ? <p className="muted">Você ainda não recebeu avisos.</p> : (
          <ul className="list">
            {sorted.map((n) => (
              <li key={n.id} style={n.readAt ? undefined : { fontWeight: 700 }}>
                <div>{n.href ? <Link href={n.href}>{n.message}</Link> : n.message}<br /><span className="muted" style={{ fontWeight: 400 }}>{formatDay(n.createdAt)}</span></div>
                {!n.readAt && (
                  <form action={markNotificationRead}>
                    <input type="hidden" name="id" value={n.id} />
                    <button className="button small" type="submit">Marcar como lida</button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
