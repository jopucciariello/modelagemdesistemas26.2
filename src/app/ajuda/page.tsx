// RF31, UC15: help menu. The athlete asks for a missing component or bike model and reads the admin's answer.
import { Suspense } from "react";
import { createModelRequest } from "@/app/actions/help";
import { Flash, Nav } from "@/components/ui";
import { prisma } from "@/lib/db";
import { REQUEST_KINDS, REQUEST_STATUS } from "@/lib/help";
import { getCurrentUser } from "@/lib/session";

const OK = { pedido: "Pedido enviado. O administrador vai cadastrar o modelo ou responder com o motivo." };
const ERR = { pedido_invalido: "Escolha o tipo e descreva o que falta no catálogo." };

export default function HelpPage(props: PageProps<"/ajuda">) {
  return (
    <main>
      <header>
        <h1>Ajuda</h1>
        <p className="muted">Não achou o componente ou a bike no catálogo? Peça a inclusão aqui (RF31).</p>
      </header>
      <Suspense fallback={<p className="muted">Carregando…</p>}>
        <HelpArea searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}

async function HelpArea({ searchParams }: { searchParams: PageProps<"/ajuda">["searchParams"] }) {
  const { erro, ok } = await searchParams;
  const user = await getCurrentUser();
  if (!user) {
    return (
      <section className="card">
        <p>Entre com o Google para enviar um pedido.</p>
        <a className="button" href="/auth/google?next=/ajuda">Entrar com Google</a>
      </section>
    );
  }
  const requests = await prisma.modelRequest.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  const fmt = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" });

  return (
    <>
      <Nav isAdmin={user.role === "ADMIN"} />
      <Flash ok={ok} erro={erro} okText={OK} errText={ERR} />
      <section className="card">
        <h2>Pedir um modelo novo</h2>
        <p className="muted">O catálogo é mantido pelo administrador. Você não cadastra nada: ele registra o modelo ou explica por que não.</p>
        <form action={createModelRequest} className="stack fill">
          <label>Tipo
            <select name="kind" defaultValue="COMPONENT" required>
              {Object.entries(REQUEST_KINDS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
            </select>
          </label>
          <label>Família (opcional)
            <input name="family" maxLength={60} placeholder="Ex.: Corrente, Pneu, Gravel" />
          </label>
          <label>O que está faltando
            <textarea name="text" required maxLength={1000} rows={4} placeholder="Marca, modelo e, se souber, um link ou o intervalo de troca" />
          </label>
          <button className="button" type="submit" style={{ alignSelf: "flex-start" }}>Enviar pedido</button>
        </form>
      </section>
      <section className="card">
        <h2>Meus pedidos</h2>
        {requests.length === 0 ? (
          <p className="muted">Você ainda não enviou pedidos.</p>
        ) : (
          <ul>
            {requests.map((r) => (
              <li key={r.id}>
                <strong>{REQUEST_KINDS[r.kind]}</strong>{r.family ? ` · ${r.family}` : ""} · {fmt.format(r.createdAt)} · <em>{REQUEST_STATUS[r.status]}</em>
                <br />{r.text}
                {r.reply && <><br /><span className="muted">Resposta do administrador: {r.reply}</span></>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
