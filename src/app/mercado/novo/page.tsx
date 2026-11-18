// RF16, RB07: publish a listing.
import Link from "next/link";
import { Suspense } from "react";
import { createListing } from "@/app/actions/market";
import { ListingFields } from "@/components/listing-fields";
import { Flash, Nav } from "@/components/ui";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/guards";
import { ERROR_TEXT } from "@/lib/market";
import s from "../mercado.module.css";

export default function NewListingPage(props: PageProps<"/mercado/novo">) {
  return (
    <main className={`wide ${s.root}`}>
      <header className={s.head}>
        <span className={s.eyebrow}>Marketplace</span>
        <h1 className={s.title}>Anunciar uma peça</h1>
      </header>
      <Suspense fallback={<p className={s.sub}>Carregando…</p>}>
        <NewListing searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}

async function NewListing({ searchParams }: { searchParams: PageProps<"/mercado/novo">["searchParams"] }) {
  const user = await requireUser();
  const { erro } = await searchParams;
  const categories = await prisma.category.findMany({ where: { active: true }, orderBy: { name: "asc" } });
  return (
    <>
      <Nav isAdmin={user.role === "ADMIN"} />
      <Flash erro={erro} okText={{}} errText={ERROR_TEXT} />
      <section className={s.formWrap}>
        <p className={s.note}>O GearLog não processa pagamento: quem se interessar vê seu e-mail e combina direto com você.</p>
        <form action={createListing} className="stack">
          <ListingFields categories={categories} />
          <button className="button" type="submit">Publicar</button>
        </form>
        <p><Link className={s.back} href="/mercado">← Voltar ao mercado</Link></p>
      </section>
    </>
  );
}
