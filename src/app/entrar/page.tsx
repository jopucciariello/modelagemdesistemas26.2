// RF04, ADR-005: sign in or sign up with Google, or with username and password.
import Link from "next/link";
import { Suspense } from "react";
import "@/app/portfolio.css";

const ERRORS: Record<string, string> = {
  dados_invalidos: "Usuário: 3 a 30 letras, números, ponto, hífen ou sublinhado. Senha: ao menos 8 caracteres.",
  usuario_existe: "Esse usuário já existe. Escolha outro ou entre.",
  credenciais: "Usuário ou senha incorretos.",
  muitas_tentativas: "Muitas tentativas. Espere alguns minutos e tente de novo.",
};

export default function EnterPage(props: PageProps<"/entrar">) {
  return (
    <main className="pf">
      <header>
        <h1>Entrar no GearLog</h1>
      </header>
      <Suspense fallback={<p className="muted">Carregando…</p>}>
        <Forms searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}

async function Forms({ searchParams }: { searchParams: PageProps<"/entrar">["searchParams"] }) {
  const { erro } = await searchParams;
  return (
    <>
      {typeof erro === "string" && ERRORS[erro] && <p className="alert" role="alert">{ERRORS[erro]}</p>}
      <section className="card">
        <h2>Google</h2>
        <a className="button" href="/auth/google?next=/">Entrar com Google</a>
      </section>
      <section className="card">
        <h2>Usuário e senha</h2>
        <form action="/auth/senha" method="post">
          <input type="hidden" name="mode" value="login" />
          <label>Usuário <input name="username" autoComplete="username" required maxLength={30} /></label>
          <label>Senha <input name="password" type="password" autoComplete="current-password" required maxLength={200} /></label>
          <button className="button" type="submit">Entrar</button>
        </form>
      </section>
      <section className="card">
        <h2>Criar conta de atleta</h2>
        <form action="/auth/senha" method="post">
          <input type="hidden" name="mode" value="cadastro" />
          <label>Nome <input name="name" autoComplete="name" maxLength={80} /></label>
          <label>Usuário <input name="username" autoComplete="username" required maxLength={30} /></label>
          <label>Senha (mín. 8 caracteres) <input name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={200} /></label>
          <button className="button" type="submit">Criar conta</button>
        </form>
      </section>
      <p><Link href="/">Voltar</Link></p>
    </>
  );
}
