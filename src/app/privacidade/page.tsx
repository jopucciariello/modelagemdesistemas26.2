// RNF01, RNF05, #76: privacy policy, required by the Strava API Agreement and by the Apple and Google stores.
export const metadata = { title: "Privacidade — GearLog" };

export default function PrivacidadePage() {
  return (
    <main>
      <h1>Política de privacidade</h1>
      <p>Atualizada em 18/11/2026. O GearLog calcula o desgaste das peças da sua bike a partir dos seus pedais, ajuda a agendar revisões em oficinas e a negociar peças. Esta página diz o que guardamos, para quê e como apagar.</p>
      <h2>O que guardamos</h2>
      <ul>
        <li><strong>Conta:</strong> nome e e-mail do login Google, ou o usuário e a senha que você criou (a senha é guardada só como hash, nunca em texto).</li>
        <li><strong>Bikes e peças:</strong> as bikes, peças, manutenções e fotos de bike que você cadastra.</li>
        <li><strong>Pedais:</strong> importados do Strava ou lançados à mão: data, tipo de esporte, distância, tempo em movimento e a bike associada.</li>
        <li><strong>Strava:</strong> a URL e a chave do seu conector, criptografadas, usadas só para ler os seus pedais. Não guardamos token do Strava.</li>
        <li><strong>Mercado:</strong> anúncios que você publica (texto, preço e até 3 fotos), os modelos que você deseja e, se você informar, seu WhatsApp para contato.</li>
        <li><strong>Oficinas:</strong> agendamentos que você faz e, só se você aceitar ao agendar, o histórico daquela bike para a oficina.</li>
        <li><strong>Localização:</strong> usada no aparelho para ordenar as oficinas por distância. A posição não é guardada nos nossos servidores.</li>
        <li><strong>Avisos:</strong> notificações no app e, se você ativar, por e-mail.</li>
      </ul>
      <h2>O que não guardamos</h2>
      <p>Trajetos (GPS), frequência cardíaca, potência, segmentos, kudos e comentários do Strava.</p>
      <h2>Quem vê</h2>
      <ul>
        <li>Seus dados de pedais e de bikes são vistos só por você. Os dados do Strava nunca são exibidos a outros usuários nem compartilhados com terceiros, e não são usados em inteligência artificial.</li>
        <li>Anúncios do mercado são públicos para quem usa o app. Seu WhatsApp só aparece como botão de contato nos seus anúncios.</li>
        <li>A oficina vê o histórico da bike somente quando você aceita compartilhar no agendamento.</li>
        <li>Não vendemos dados e não usamos publicidade nem rastreadores de terceiros.</li>
      </ul>
      <h2>Como apagar</h2>
      <p>Você pode desconectar o Strava na página Fonte dos pedais, excluir bikes e anúncios pelo app, excluir a conta e todos os dados em Configurações → Excluir minha conta, ou pedir a exclusão pelo e-mail do administrador do projeto. Também pode revogar o acesso em strava.com/settings/apps. Atendemos ao pedido em até 30 dias, conforme a LGPD.</p>
      <h2>Crianças</h2>
      <p>O GearLog não é dirigido a menores de 13 anos.</p>
      <p>GearLog é um projeto acadêmico, independente e não afiliado ao Strava. Veja também os <a href="/termos">termos de uso</a>.</p>
    </main>
  );
}
