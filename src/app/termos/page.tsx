// #76: terms of use, required by the Apple and Google stores.
export const metadata = { title: "Termos de uso — GearLog" };

export default function TermosPage() {
  return (
    <main className="narrow">
      <h1>Termos de uso</h1>
      <p>Atualizados em 18/11/2026. Ao usar o GearLog você concorda com estes termos.</p>
      <h2>O serviço</h2>
      <p>O GearLog é um projeto acadêmico, gratuito, que estima o desgaste das peças de bicicletas, permite agendar revisões em oficinas parceiras e anunciar peças. As estimativas de desgaste são recomendações do catálogo e não substituem a avaliação de um mecânico: confira sempre os componentes de segurança da sua bike.</p>
      <h2>Sua conta</h2>
      <p>Você é responsável pelo acesso à sua conta e pelas informações que cadastra. Mantenha sua senha em segredo.</p>
      <h2>Anúncios e conduta</h2>
      <ul>
        <li>Publique só peças de bicicleta que você pode vender, com informações verdadeiras.</li>
        <li>É proibido publicar conteúdo ilegal, enganoso ou ofensivo. Qualquer usuário pode denunciar um anúncio e o administrador pode removê-lo, registrando o motivo.</li>
        <li>O GearLog apenas aproxima compradores e vendedores: a negociação, o pagamento e a entrega acontecem entre vocês, fora do app, e o GearLog não é parte nem garante essas transações.</li>
      </ul>
      <h2>Oficinas</h2>
      <p>Os agendamentos são combinados com a oficina escolhida, que é responsável pelo serviço prestado. O cancelamento com menos de 24 horas é avisado à oficina como urgente.</p>
      <h2>Strava</h2>
      <p>O GearLog não é afiliado nem endossado pelo Strava. Os dados do Strava são usados apenas para o seu próprio controle de desgaste, conforme a <a href="/privacidade">política de privacidade</a>.</p>
      <h2>Responsabilidade</h2>
      <p>O serviço é oferecido como está, sem garantia de disponibilidade. Na extensão permitida em lei, o projeto não responde por perdas decorrentes do uso das estimativas ou das negociações entre usuários.</p>
      <h2>Encerramento e mudanças</h2>
      <p>Você pode apagar sua conta a qualquer momento (veja a política de privacidade). Podemos suspender contas que violem estes termos e atualizar este texto; a data no topo indica a versão.</p>
    </main>
  );
}
