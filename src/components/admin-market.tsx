// RF18, RF24, RB06: admin section of the marketplace: merchants, seal and listing moderation.
import { createMerchant, removeListing, setVerified } from "@/app/actions/merchants";
import { decideStoreRequest } from "@/app/actions/store";
import { SellerBadge } from "@/components/seller-badge";
import { prisma } from "@/lib/db";
import { text } from "@/lib/forms";

const brl = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export async function AdminMarket() {
  const [requests, merchants, listings] = await Promise.all([
    prisma.merchantRequest.findMany({ where: { status: "PENDING" }, include: { user: { select: { name: true, email: true } } }, orderBy: { createdAt: "asc" } }),
    prisma.merchant.findMany({ include: { user: { select: { email: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.listing.findMany({
      where: { status: "ACTIVE" },
      include: { seller: { select: { name: true, email: true } }, category: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <>
      <section className="card" id="mercado">
        <h2>Mercado: lojistas</h2>
        <p className="muted">Só o administrador cadastra lojistas e concede ou revoga o selo de verificado.</p>
        {requests.length > 0 && (
          <ul className="list" aria-label="Pedidos de lojista">
            {requests.map((r) => {
              const approve = async () => { "use server"; await decideStoreRequest(r.id, true); };
              const reject = async () => { "use server"; await decideStoreRequest(r.id, false); };
              return (
                <li key={r.id} className="stack">
                  <strong>Pedido: {r.storeName}</strong>
                  <span className="muted">{r.user.name} ({r.user.email}) · contato: {r.contact}{r.shopUrl && ` · ${r.shopUrl}`}</span>
                  <span>{r.message}</span>
                  <div className="row">
                    <form action={approve}><button className="button small" type="submit">Aprovar</button></form>
                    <form action={reject}><button className="button small" type="submit">Recusar</button></form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {merchants.length === 0 ? <p className="muted">Nenhum lojista cadastrado.</p> : (
          <ul className="list">
            {merchants.map((m) => {
              const grant = async () => {
                "use server";
                await setVerified(m.id, true);
              };
              const revoke = async () => {
                "use server";
                await setVerified(m.id, false);
              };
              return (
                <li key={m.id} className="stack">
                  <SellerBadge merchant={m} />
                  <span className="muted">{m.user.email}{m.description && ` · ${m.description}`}</span>
                  {m.verified && m.verifiedAt && (
                    <span className="muted">Verificado em {m.verifiedAt.toLocaleDateString("pt-BR")}</span>
                  )}
                  <form action={m.verified ? revoke : grant}>
                    <button className="button small" type="submit">{m.verified ? "Revogar selo" : "Conceder selo"}</button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
        <details>
          <summary>Novo lojista</summary>
          <form action={createMerchant} className="stack">
            <p className="muted">A pessoa precisa ter entrado uma vez com o Google. Informe o e-mail da conta.</p>
            <label>E-mail do usuário <input name="email" type="email" required maxLength={200} /></label>
            <label>Nome da loja <input name="name" required maxLength={80} /></label>
            <label>Descrição <input name="description" maxLength={300} /></label>
            <button className="button small" type="submit">Cadastrar lojista</button>
          </form>
        </details>
      </section>

      <section className="card">
        <h2>Mercado: anúncios ativos</h2>
        <p className="muted">A remoção guarda o motivo e a data; o anúncio sai da vitrine e o autor vê o motivo.</p>
        {listings.length === 0 ? <p className="muted">Nenhum anúncio ativo.</p> : (
          <ul className="list">
            {listings.map((l) => {
              const remove = async (form: FormData) => {
                "use server";
                await removeListing(l.id, text(form, "reason", 300));
              };
              return (
                <li key={l.id} className="stack">
                  <strong>{l.title}</strong>
                  <span className="muted">{l.category.name} · {brl(l.priceCents)} · {l.seller.name}{l.seller.email && ` (${l.seller.email})`}</span>
                  <form action={remove} className="stack">
                    <label>Motivo da remoção <input name="reason" required minLength={5} maxLength={300} /></label>
                    <button className="button small" type="submit">Remover anúncio</button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
