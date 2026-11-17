// RF31: the admin's list of athletes' model requests, with answer (registered or refused with a reason).
import { answerModelRequest } from "@/app/actions/help";
import { prisma } from "@/lib/db";
import { REQUEST_KINDS, REQUEST_STATUS } from "@/lib/help";

export async function AdminRequests() {
  const requests = await prisma.modelRequest.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
  });
  const open = requests.filter((r) => r.status === "OPEN");
  const fmt = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" });
  return (
    <section className="card">
      <h2>Pedidos de modelos novos ({open.length} em aberto)</h2>
      <p className="muted">Cadastre o modelo no catálogo acima e marque como cadastrado, ou recuse com o motivo (RF31).</p>
      {requests.length === 0 && <p className="muted">Nenhum pedido.</p>}
      {requests.map((r) => (
        <article key={r.id} className="card">
          <p>
            <strong>{REQUEST_KINDS[r.kind]}</strong>{r.family ? ` · ${r.family}` : ""} · {r.user.name} · {fmt.format(r.createdAt)} · <em>{REQUEST_STATUS[r.status]}</em>
          </p>
          <p>{r.text}</p>
          {r.reply && <p className="muted">Resposta: {r.reply}</p>}
          {r.status === "OPEN" && (
            <form action={answerModelRequest}>
              <input type="hidden" name="id" value={r.id} />
              <label>Resposta (obrigatória ao recusar)
                <textarea name="reply" maxLength={1000} rows={2} />
              </label>
              <button className="button small" type="submit" name="status" value="REGISTERED">Cadastrado</button>{" "}
              <button className="button small" type="submit" name="status" value="REJECTED">Recusar</button>
            </form>
          )}
        </article>
      ))}
    </section>
  );
}
