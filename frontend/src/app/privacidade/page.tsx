import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade — MaPinha",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-foreground">
      <h1 className="font-display text-2xl text-foreground">Política de Privacidade</h1>
      <p className="mt-1 text-sm text-muted-foreground">Última atualização: 13/11/2026</p>

      <div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed text-foreground/90">
        <p>
          O MaPinha é um mapa interativo gamificado onde você cadastra Marcadores (pontos de
          interesse) pessoais, com fotos, GIFs e áudios, e pode seguir outras pessoas e participar
          de grupos.
          Esta página explica quais dados coletamos e como são usados.
        </p>

        <section>
          <h2 className="font-display text-base text-foreground">Como você entra no app</h2>
          <p className="mt-2">
            O login é feito exclusivamente via Google (OAuth). Recebemos do Google apenas seu nome,
            e-mail e foto de perfil públicos — nunca sua senha, e nunca pedimos acesso a nada além
            disso (sem acesso a e-mails, agenda, Drive ou qualquer outro dado do Google).
          </p>
        </section>

        <section>
          <h2 className="font-display text-base text-foreground">O que armazenamos</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Nome, e-mail e foto de perfil (do Google, ou um avatar que você escolher no app).</li>
            <li>
              Os Marcadores que você cria (nome, descrição, localização, categoria, visibilidade) e
              a mídia que você envia (foto, GIF, áudio) — armazenada na Cloudflare R2.
            </li>
            <li>Comentários, reações e favoritos que você registra em Marcadores.</li>
            <li>Relações de seguir/seguidores e participação em grupos.</li>
            <li>Rotas que você calcula até um Marcador (histórico pessoal, visível só pra você).</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-base text-foreground">Visibilidade do que você cria</h2>
          <p className="mt-2">
            Cada Marcador tem uma visibilidade que você escolhe: público (qualquer pessoa vê), seguidores,
            grupo específico, ou só você. Só compartilhamos o que você explicitamente marcar como
            visível a outros.
          </p>
        </section>

        <section>
          <h2 className="font-display text-base text-foreground">Serviços de terceiros usados</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong>Claude (Anthropic)</strong> — gera sugestão de categoria e descrição para
              Marcadores novos. Recebe só nome/descrição/categoria do Marcador, nunca seus dados
              pessoais.
            </li>
            <li>
              <strong>OSRM</strong> — calcula rotas entre sua posição e um Marcador (coordenadas
              geográficas, sem identificação pessoal).
            </li>
            <li>
              <strong>Stadia Maps / CartoDB / ESRI</strong> — fornecem os tiles visuais do mapa.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-base text-foreground">Exclusão de conta e dados</h2>
          <p className="mt-2">
            Ainda não temos um botão de autoatendimento para excluir a conta. Pra pedir a exclusão
            completa da sua conta e dos seus dados, mande um e-mail pra{" "}
            <a href="mailto:silasribeiro11@gmail.com" className="underline">
              silasribeiro11@gmail.com
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="font-display text-base text-foreground">Contato</h2>
          <p className="mt-2">
            Dúvidas sobre esta política ou sobre seus dados:{" "}
            <a href="mailto:silasribeiro11@gmail.com" className="underline">
              silasribeiro11@gmail.com
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
