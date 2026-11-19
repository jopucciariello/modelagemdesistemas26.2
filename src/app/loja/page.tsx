// RF18, RB24: the user asks to become a merchant; the merchant keeps the store profile (families and link).
import Link from "next/link";
import { Suspense } from "react";
import { requestStore, saveStoreProfile } from "@/app/actions/store";
import { Flash, Nav } from "@/components/ui";
import { pickerCategories } from "@/lib/catalog/pick";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/guards";
import { ERROR_TEXT } from "@/lib/market";

const OK = { pedido_enviado: "Pedido enviado. O administrador vai conferir e avisar você.", perfil_salvo: "Perfil da loja salvo." };

export default function StorePage(props: PageProps<"/loja">) {
  return (
    <main className="wide">
      <h1>Minha loja</h1>
      <Suspense fallback={<p className="muted">Carregando…</p>}>
        <Store searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}

async function Store({ searchParams }: { searchParams: PageProps<"/loja">["searchParams"] }) {
  const user = await requireUser();
  const { ok, erro } = await searchParams;
  const [merchant, pending, categories] = await Promise.all([
    prisma.merchant.findUnique({ where: { userId: user.id }, include: { families: true } }),
    prisma.merchantRequest.findFirst({ where: { userId: user.id, status: "PENDING" } }),
    pickerCategories(),
  ]);
  return (
    <>
      <Nav isAdmin={user.role === "ADMIN"} />
      <Flash ok={ok} erro={erro} okText={OK} errText={ERROR_TEXT} />
      {merchant ? (
        <section className="card">
          <h2>{merchant.name} {merchant.verified && <span className="muted">· verificada</span>}</h2>
          <p className="muted">Marque as famílias de peças que a loja vende. Seus anúncios mostram um botão que leva o comprador à loja.</p>
          <form action={saveStoreProfile} className="stack">
            <label>Link da loja <input name="shopUrl" type="url" defaultValue={merchant.shopUrl ?? ""} maxLength={300} placeholder="https://" /></label>
            <fieldset>
              <legend>Famílias que vendo</legend>
              {categories.map((c) => (
                <label key={c.id}>
                  <input type="checkbox" name="categoryIds" value={c.id} defaultChecked={merchant.families.some((f) => f.categoryId === c.id)} /> {c.name}
                </label>
              ))}
            </fieldset>
            <button className="button" type="submit">Salvar perfil</button>
          </form>
          <p><Link href="/mercado/meus">Meus anúncios</Link></p>
        </section>
      ) : pending ? (
        <section className="card">
          <h2>Pedido em análise</h2>
          <p>Você pediu para virar lojista com a loja <strong>{pending.storeName}</strong>. O administrador vai conferir e avisar você nos Avisos.</p>
        </section>
      ) : (
        <section className="card">
          <h2>Pedir para virar lojista</h2>
          <p className="muted">Conte quem é a loja e como falar com ela. O administrador confere que a loja existe e aprova o pedido.</p>
          <form action={requestStore} className="stack">
            <label>Nome da loja <input name="storeName" required minLength={2} maxLength={80} /></label>
            <label>Sobre a loja <textarea name="message" required minLength={10} maxLength={600} rows={4} /></label>
            <label>Contato (telefone, e-mail ou Instagram) <input name="contact" required minLength={5} maxLength={120} /></label>
            <label>Link da loja (opcional) <input name="shopUrl" type="url" maxLength={300} placeholder="https://" /></label>
            <button className="button" type="submit">Enviar pedido</button>
          </form>
        </section>
      )}
    </>
  );
}
