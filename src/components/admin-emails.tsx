// RF37: manage admin e-mails (root admins come from ADMIN_EMAILS in Infisical).
import { addAdminEmail, removeAdminEmail } from "@/app/actions/admins";
import { prisma } from "@/lib/db";

export async function AdminEmails() {
  const rows = await prisma.adminEmail.findMany({ orderBy: { createdAt: "asc" } });
  return (
    <section className="card">
      <h2>Administradores</h2>
      <p className="muted">
        Os administradores principais ficam no Infisical (<code>ADMIN_EMAILS</code>). Os incluídos aqui ficam no banco e
        valem na próxima entrada da pessoa.
      </p>
      {rows.length > 0 && (
        <ul>
          {rows.map((r) => (
            <li key={r.email}>
              {r.email}{" "}
              <form action={removeAdminEmail} style={{ display: "inline" }}>
                <input type="hidden" name="email" value={r.email} />
                <button className="button small" type="submit">Remover</button>
              </form>
            </li>
          ))}
        </ul>
      )}
      <form action={addAdminEmail} className="row">
        <label>E-mail <input name="email" type="email" required maxLength={120} /></label>
        <button className="button small" type="submit">Incluir administrador</button>
      </form>
    </section>
  );
}
