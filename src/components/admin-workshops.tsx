// RF25, RB21: the admin registers workshops with the owner's Google e-mail.
import { createWorkshop, decideWorkshopRequest, toggleWorkshop } from "@/app/actions/workshops";
import { prisma } from "@/lib/db";

export async function AdminWorkshops() {
  const all = await prisma.workshop.findMany({ orderBy: { name: "asc" } });
  const workshops = all.filter((w) => w.status === "ACTIVE");
  const requests = all.filter((w) => w.status === "PENDING");
  return (
    <section className="card">
      <h2>Oficinas (Fase 3)</h2>
      <p className="muted">Quem entra com o e-mail Google cadastrado acessa a área /oficina e edita só essa oficina.</p>
      {requests.length > 0 && (
        <>
          <h3>Pedidos de oficina</h3>
          <ul>
            {requests.map((w) => (
              <li key={w.id}>
                <strong>{w.name}</strong> · {w.ownerEmail}{w.contact ? ` · ${w.contact}` : ""}
                {w.requestText && <p className="muted">{w.requestText}</p>}
                {(["approve", "reject"] as const).map((decision) => (
                  <form key={decision} action={decideWorkshopRequest} style={{ display: "inline", marginRight: 8 }}>
                    <input type="hidden" name="id" value={w.id} />
                    <input type="hidden" name="decision" value={decision} />
                    <button className="button small" type="submit">{decision === "approve" ? "Aprovar" : "Recusar"}</button>
                  </form>
                ))}
              </li>
            ))}
          </ul>
        </>
      )}
      {workshops.length > 0 && (
        <ul>
          {workshops.map((w) => (
            <li key={w.id}>
              <strong>{w.name}</strong> · {w.ownerEmail} · {w.active ? "ativa" : "desativada"}{" "}
              <form action={toggleWorkshop} style={{ display: "inline" }}>
                <input type="hidden" name="id" value={w.id} />
                <button className="button small" type="submit">{w.active ? "Desativar" : "Ativar"}</button>
              </form>
            </li>
          ))}
        </ul>
      )}
      <form action={createWorkshop} className="row">
        <label>Nome <input name="name" required maxLength={80} /></label>
        <label>E-mail Google do responsável <input name="ownerEmail" type="email" required maxLength={120} /></label>
        <button className="button small" type="submit">Cadastrar oficina</button>
      </form>
    </section>
  );
}
