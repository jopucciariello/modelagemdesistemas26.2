// RNF01, RNF05: privacy policy, required by the Strava API Agreement (Strava Developer Program review).
export const metadata = { title: "Privacidade — GearLog" };

export default function PrivacidadePage() {
  return (
    <main>
      <h1>Política de privacidade</h1>
      <p>O GearLog calcula o desgaste das peças da sua bike a partir dos seus pedais. Esta página diz o que guardamos e como apagar.</p>
      <h2>O que guardamos</h2>
      <ul>
        <li>Seu e-mail e nome do login Google.</li>
        <li>Dos pedais (importados do Strava ou lançados à mão): data, tipo de esporte, distância, tempo em movimento e a bike associada.</li>
        <li>Se você conectar o seu app do Strava: o token de acesso, criptografado, usado só para ler os seus pedais.</li>
      </ul>
      <h2>O que não guardamos</h2>
      <p>Trajetos (GPS), frequência cardíaca, potência, fotos, segmentos, kudos e comentários.</p>
      <h2>Quem vê</h2>
      <p>Só você. Os dados do Strava de um atleta nunca são exibidos a outros usuários nem compartilhados com terceiros, e não são usados em inteligência artificial.</p>
      <h2>Como apagar</h2>
      <p>Você pode desconectar o Strava na página Fonte dos pedais, o que apaga os tokens, e pedir a exclusão da conta e de todos os dados pelo e-mail do administrador do projeto. Também pode revogar o acesso em strava.com/settings/apps.</p>
      <p>GearLog é um projeto acadêmico, independente e não afiliado ao Strava.</p>
    </main>
  );
}
