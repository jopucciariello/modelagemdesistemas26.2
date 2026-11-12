// RF33: step-by-step to register a personal Strava app.
export default function StravaTutorial() {
  return (
    <main>
      <header>
        <h1>Cadastrar seu app no Strava</h1>
        <p className="muted">Leva uns 2 minutos. O Strava deixa cada conta ter 1 app, e é ele que o GearLog usa para ler as suas atividades.</p>
      </header>
      <section className="card">
        <ol>
          <li>Abra <a href="https://www.strava.com/settings/api" rel="noreferrer">strava.com/settings/api</a> logado na sua conta.</li>
          <li>Preencha <strong>Application Name</strong> (ex.: GearLog), <strong>Category</strong> (Training) e <strong>Website</strong> (pode ser este site).</li>
          <li>Em <strong>Authorization Callback Domain</strong>, escreva só <code>gearlog.jopucci.com</code>, sem https:// e sem barra.</li>
          <li>Salve. O Strava mostra o <strong>Client ID</strong> (um número) e o <strong>Client Secret</strong>.</li>
          <li>Volte em <a href="/fonte">Fonte dos pedais</a>, cole os dois em &ldquo;API do Strava&rdquo; e autorize.</li>
        </ol>
        <p className="muted">O Client Secret é guardado criptografado e nunca é mostrado de volta. Se você já usa esse app em outro serviço com outro domínio, prefira o conector.</p>
        <p><a href="/fonte">Ir para a fonte dos pedais</a></p>
      </section>
    </main>
  );
}
