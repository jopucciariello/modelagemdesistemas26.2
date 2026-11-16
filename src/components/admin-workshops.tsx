// RF25, RB21: the admin registers workshops with the owner's Google e-mail.
import { createWorkshop, toggleWorkshop } from "@/app/actions/workshops";
import { prisma } from "@/lib/db";

export async function AdminWorkshops() {
  const workshops = await prisma.workshop.findMany({ orderBy: { name: "asc" } });
  return (
    <section className="card">
      <h2>Oficinas (Fase 3)</h2>
      <p className="muted">Quem entra com o e-mail Google cadastrado acessa a área /oficina e edita só essa oficina.</p>
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
