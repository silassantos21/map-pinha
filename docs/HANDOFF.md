# Handoff — continuação de sessão

> Atualizado em 05/11/2026. Isso aqui é só o que **não** está documentado em
> outro arquivo: convenções de trabalho estabelecidas em conversa e o estado
> atual depois da última sessão. O stack e a estrutura do projeto já estão no
> `CLAUDE.md` (carregado automaticamente); histórico detalhado de cada mudança
> está no `SPRINTS.md`.

## Regras de trabalho (seguir sempre, sem exceção)

- Investigar a causa raiz antes de corrigir qualquer bug — nunca chutar. Testar
  empiricamente (curl, grep no código, reproduzir o cenário) antes de propor fix.
- Nunca commitar ou dar push sem confirmação explícita do dono do projeto antes.
- Documentar toda mudança relevante no `SPRINTS.md` (histórico cronológico
  autoritativo do projeto) — inclusive achados de investigação, não só código.
- Validar sempre com type-check + lint + build (frontend) e, quando fizer sentido,
  testes via curl/Python no backend. Não há ferramenta de navegador disponível —
  o dono do projeto faz o QA visual/funcional manualmente depois.
- Mensagens de commit terminam com
  `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.
- Ambiente local: backend/db/redis via Docker Compose, frontend via `npm run dev`
  (Next.js). Se a porta 8000 parecer "fantasma" (container ok mas não responde no
  host), `docker compose restart backend` costuma resolver — mas o backend já
  roda com reload automático (`WatchFiles`), então normalmente nem precisa.

## Estado atual (branch main)

Concluído: Fases 1-6, 8 e 9 do roadmap inteiras, e a **Fase 7 Parte 1** (Sistema
Social — seguir, notificações, visibilidade de POI). Única coisa que falta do
roadmap original são as Partes 2 e 3 da Fase 7 (ver seção abaixo).

Depois que a Parte 1 foi commitada, uma sessão inteira de ajustes de UX/QA em
cima dela (ainda não commitada — é isso que esta sessão vai commitar):

- **Avatar do dono em vez de ícone de categoria nos marcadores do mapa** — a
  borda do círculo continua na cor da categoria; a foto de quem criou o POI
  fica dentro. Fallback pro ícone de categoria de sempre se não tiver avatar
  ou a URL quebrar (`onerror` na `<img>`, sem re-render React).
- **Card de detalhes do POI mostra quem criou** ("Criado por {nome}", clicável,
  abre o perfil dessa pessoa).
- **Perfil de outra pessoa** (`UserProfileSheet`) ganhou: toast ao seguir/
  deixar de seguir, lista dos POIs dela (respeitando visibilidade — nunca
  mostra `private` pra quem não é o dono), avatar clicável que abre foto
  ampliada (`Dialog` próprio, separado da ação de seguir).
- **"Seguidores e seguindo" virou um painel próprio no rodapé** (`FollowersPanel`,
  duas abas) — antes só dava pra ver a contagem. O botão "Perfil" do rodapé foi
  removido (era redundante com o avatar do HUD, que já abre o mesmo painel).
- **Listas de POI (Meus POIs, Favoritos, POIs próximos, POIs de outra pessoa)**
  ganharam borda colorida por categoria + ícone alinhado à esquerda — visual
  consistente nas 4.
- **Upload de foto de perfil própria** (além dos 20 presets e da foto do
  Google) — pedido explicitamente com "estude os impactos, seja cuidadoso".
  Trilha de upload própria (não reaproveita o endpoint genérico de mídia de
  POI, que não tem validação nenhuma — achado incidental, não corrigido,
  fora de escopo): allowlist de tipo/extensão, limite de 5 MB conferido no
  servidor depois do upload, limite de 10 uploads/dia, recorte quadrado +
  reencode WEBP (nunca serve o arquivo original, remove EXIF de brinde),
  limpeza do avatar antigo no R2 ao trocar. Detalhes completos (incluindo a
  limitação conhecida sobre presigned PUT vs. POST) no `SPRINTS.md`.
- **Bug real corrigido:** sininho de notificações ficava preso numa "página
  vazia" pra sempre depois de clicar "Carregar mais" uma vez (paginação por
  `offset` sem volta) — virou paginação por `limit` crescente. Notificações
  lidas agora ficam visíveis (mais apagadas), não escondidas.
- **Bug real corrigido:** trocar o avatar não atualizava a foto nos marcadores/
  listas de POI na hora — só invalidava a query do próprio usuário, não as que
  guardam uma cópia do avatar do dono (`owner_avatar_url`). Ver
  `invalidateAvatarDependentQueries` em `avatar-picker.tsx`.

Dados de teste no banco local (não sobem pro git, só documentando pra não
confundir numa sessão futura): existe um usuário fake **"Ana Teste"**
(`teste.ana@mappin.local.test`, sem login real possível — é só pra exercitar
seguir/visibilidade/notificações via API direto) que segue e é seguida pelo
usuário real, com 3 POIs de teste (`public`/`followers`/`private`) perto de um
POI real. Puramente pra QA, não precisa limpar antes de commitar (fica só no
Postgres local).

Padrões/bugs de sessões anteriores que vale lembrar pra não reintroduzir:

1. `refetchOnWindowFocus` do React Query fica desativado globalmente
   (`query-provider.tsx`) — a app já invalida explicitamente após mutações.
2. O `<header>` do HUD usa `pointer-events-none`, com cada filho clicável
   reativando via `pointer-events-auto` — checar isso sempre que adicionar algo
   novo dentro do `hud-header.tsx` (já causou um bug real de "fechar a busca
   desloga sozinho").
3. `ORDER BY POI.id` em `list_pois` (backend) nunca pode ser removido/reordenado
   — é o que evita marcadores "piscando" por quebra de structural sharing do
   React Query.
4. Qualquer dado que apareça em mais de uma query do React Query (ex: avatar do
   usuário, que vive em `current-user` **e** copiado em cada POI) precisa de
   todas as queries relevantes invalidadas juntas na hora da mutação — não só a
   "óbvia". Foi a causa dos dois bugs de notificação/avatar corrigidos nesta
   sessão.

## Único item do roadmap que falta

Fase 7 — Partes 2 (grupos: tabelas `groups`/`group_members`, `visibility=group`,
`group_id` em `pois`/`notifications`) e 3 (comentários em POIs, estendendo o
padrão das reações). Nenhuma das duas foi tocada ainda. `group` não existe no
enum `poi_visibility` do banco (só `public`/`followers`/`private`); entra via
`ALTER TYPE poi_visibility ADD VALUE 'group'` numa migration própria quando a
Parte 2 começar (não pode estar na mesma transação que já usa o valor novo —
ver nota na migration `e7c3a9f52d81`).

**Não começar Parte 2/3 sem o dono do projeto pedir explicitamente** — só
perguntar quais são os próximos passos, ou aguardar instrução.

## O que fazer agora

[Preencher aqui o que o dono do projeto quer fazer nesta sessão]
