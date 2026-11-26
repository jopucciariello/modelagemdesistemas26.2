// RF39: parts kept in stock after removal from a bike; the athlete can install them again.
import Link from "next/link";
import { Suspense } from "react";
import "@/app/portfolio-pages.css";
import { installFromStock } from "@/app/actions/stock";
import { Nav } from "@/components/ui";
import { prisma } from "@/lib/db";
import { formatDay, toLocalDay } from "@/lib/dates";
import { getCurrentUser } from "@/lib/session";

export default function StockPage() {
  return (
    <main className="pf">
      <header>
        <h1>Estoque de peças</h1>
        <p className="muted">Peças que você tirou da bike e guardou.</p>
      </header>
      <Suspense fallback={<p className="muted">Carregando…</p>}>
        <StockArea />
      </Suspense>
    </main>
  );
}

async function StockArea() {
  const user = await getCurrentUser();
  if (!user) return <section className="card"><p>Entre para ver o seu estoque.</p><a className="button" href="/entrar">Entrar</a></section>;
  const [parts, bikes] = await Promise.all([
    prisma.part.findMany({
      where: { inStock: true, bike: { userId: user.id } },
      include: { component: { include: { category: true } }, bike: { select: { name: true } } },
      orderBy: { removedAt: "desc" },
    }),
    prisma.bike.findMany({ where: { userId: user.id, archivedAt: null }, orderBy: { createdAt: "asc" }, select: { id: true, name: true } }),
  ]);
  const today = toLocalDay(new Date());
  return (
    <>
      <Nav isAdmin={user.role === "ADMIN"} />
      {parts.length === 0 && <p className="muted">Nenhuma peça no estoque. Ao tirar uma peça da bike, escolha “guardar no estoque”.</p>}
      <ul className="stock-list">
        {parts.map((p) => (
          <li key={p.id} className="stock-item">
            <strong>{p.component.category.name} · {p.component.brand} {p.component.model}</strong>
            <br />
            <span className="muted">
              Saiu da bike {p.bike.name} em {p.removedAt ? formatDay(p.removedAt) : "—"} · {p.stockKm.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} km e {p.stockHours.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} h de uso
              {p.isUsed ? " · usada" : ""}{p.usedCondition ? ` (${p.usedCondition})` : ""}
            </span>
            <form action={installFromStock} className="row">
              <input type="hidden" name="partId" value={p.id} />
              <label>Instalar na bike
                <select name="bikeId" required>
                  {bikes.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </label>
              <label>Data <input name="date" type="date" required defaultValue={today} /></label>
              <button className="button small" type="submit">Instalar</button>
            </form>
          </li>
        ))}
      </ul>
      <p><Link href="/">Voltar</Link></p>
    </>
  );
}
