# Handoff — continuação de sessão

> Atualizado em 06/11/2026. Isso aqui é só o que **não** está documentado em
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
  roda com reload automático (`WatchFiles`), então normalmente nem precisa. Se o
  Docker Desktop não estiver aberto, precisa iniciar antes de `docker compose up`.

## Estado atual (branch main)

Concluído: Fases 1-6, 8 e 9 do roadmap inteiras, e a **Fase 7 Partes 1 e 2**
(Sistema Social — seguir, notificações, visibilidade de POI, grupos). Única
coisa que falta do roadmap original é a **Parte 3** (comentários em POIs — ver
seção abaixo).

### Fase 7 Parte 1 + sessão de ajustes de UX (commit `d6756a2`)

Seguir usuários, notificações in-app, visibilidade de POI public/followers/
private, mais uma leva grande de ajustes de UX em cima disso: avatar do dono
nos marcadores do mapa (borda colorida por categoria + foto dentro, fallback
pro ícone se não tiver avatar), card de POI mostrando quem criou, perfil de
outra pessoa com lista de POIs dela + toast ao seguir + foto ampliável,
painel "Seguidores e seguindo" (hoje "Social") com abas em vez de só
contagem, borda colorida + ícone nas 4 listas de POI do app, upload de foto
de perfil própria (allowlist de tipo, limite de 5 MB/10 uploads por dia,
reprocessamento server-side, limpeza do arquivo antigo no R2 — ver
`SPRINTS.md` pros detalhes de segurança), e dois bugs reais corrigidos
(paginação do sininho presa numa página vazia; trocar avatar não invalidava
as queries de POI que guardam uma cópia dele). Tudo commitado e no push.

### Fase 7 Parte 2 — Grupos + rodada de ajustes de UX (commitada nesta sessão)

- Schema: `groups`/`group_members` (convite precisa de aceite/recusa — não é
  automático como seguir), `pois.group_id`, `notifications.group_id`,
  `poi_visibility` e `notification_type` ganharam `'group'`/`'group_invite'`
  via `ALTER TYPE ... ADD VALUE` (migration `632a1944c5ad`). **Decisão
  consciente:** Postgres não remove valor de enum, então um downgrade nunca
  desfaz isso de verdade — documentado no topo do arquivo da migration, não
  é descuido.
- Backend: `app/api/v1/groups.py` (criar/listar/detalhe/renomear/excluir
  grupo, convidar, aceitar, e um único endpoint pra recusar/sair/remover).
  `GET /pois` e `_poi_visible_to` (`pois.py`) ganham a 3ª condição de
  visibilidade. `group_id` nunca é confiado do payload sem checar membership
  aceita no grupo específico.
- Frontend (layout final, depois de QA visual do dono do projeto): "Grupos"
  **não** ficou como 3ª aba do painel Social — virou um 6º painel/botão
  próprio no rodapé (`groups-panel.tsx`), porque 3 abas competindo pela
  largura de uma Sheet mobile ficava apertado. `FollowersPanel` ("Social")
  voltou a ser uncontrolled com só 2 abas (Seguidores/Seguindo); o estado
  controlado que existia pra abrir na aba certa a partir de uma notificação
  migrou pro `groupsPanelOpen` dedicado no `map-store.ts`. Seletor de
  visibilidade do formulário de POI ganhou "Grupo específico" com um
  `<select>` de grupo condicional, controlado via `Controller` do
  react-hook-form (ver bug corrigido abaixo).
- Rodapé consolidado de 6 pra 5 botões no total: "Buscar pessoas" virou um
  ícone no cabeçalho do painel Social (não é mais botão próprio); "POIs
  próximos" + "Favoritos" viraram abas de um único painel "Ver POIs"
  (`poi-panel.tsx`, substitui `favorites-panel.tsx`, removido). Todos os
  botões utilitários do rodapé (Social, Grupos, Minhas rotas, Ver POIs)
  unificados em `variant="secondary"`.
- **Bug real corrigido:** botão de ação num cabeçalho de Sheet (ex: "Buscar
  pessoas" no Social) sobrepunha visualmente o `X` de fechar — o `X` é
  `absolute top-3 right-3`, fora do fluxo do `SheetHeader`. Corrigido
  centralizado (`pr-12` no `SheetHeader` padrão, `components/ui/sheet.tsx`),
  não só no Social — qualquer painel futuro já nasce correto.
- **Bug real corrigido:** "Qual grupo" no formulário de POI ficava sempre
  deselecionado ao salvar (ou ao editar um POI que já tinha grupo) — o
  `<select>` era uncontrolled (`register`) e suas opções chegam depois de um
  fetch assíncrono; um elemento que só existe no DOM depois de um `reset()`
  nunca reaplica o valor desse `reset()`. Virou `Controller` (controlado).
  A validação "obrigatório quando `visibility=group`" já existia nos dois
  lados (frontend e backend) — só estava mascarada por esse bug.
- Validado de ponta a ponta no backend (criar, convidar, convite duplicado
  rejeitado, aceitar, POI de grupo visível só pra membros aceitos, dono não
  sai do próprio grupo, POI sobrevive à exclusão do grupo com `group_id=NULL`)
  e `type-check`/`lint`/`build` limpos no frontend em cada rodada de ajuste.

Dados de teste no banco local (não sobem pro git, só documentando pra não
confundir numa sessão futura): existe um usuário fake **"Ana Teste"**
(`teste.ana@mappin.local.test`, sem login real possível — é só pra exercitar
seguir/visibilidade/notificações via API direto) que segue e é seguida pelo
usuário real, com 3 POIs de teste (`public`/`followers`/`private`) perto de um
POI real. Puramente pra QA, não precisa limpar antes de commitar (fica só no
Postgres local). Os grupos criados durante os testes da Parte 2 foram
excluídos ao final (banco confirmado sem grupos de teste restantes).

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
   "óbvia".
5. `ALTER TYPE ... ADD VALUE` do Postgres não tem `DROP VALUE` simétrico — ao
   estender um enum nativo (`poi_visibility`, `notification_type`), aceitar que
   o downgrade não desfaz isso de verdade é uma decisão válida pra este
   projeto, não um bug a "consertar" depois.
6. Rotas BFF que devolvem 204 no sucesso mas 400/403/404 **com corpo**
   (`{detail: "..."}`) no erro precisam repassar esse corpo, não só o status —
   ver `forwardJsonOr204` em `api-server.ts`, criado exatamente pra isso.

## Único item do roadmap que falta

Fase 7 — **Parte 3** (comentários em POIs, estendendo o padrão já existente
das reações: `POST/GET /pois/{id}/comments`, `DELETE /comments/{id}`, UI na
`PoiDetailSheet`).

**Não começar sem o dono do projeto pedir explicitamente** — só perguntar
quais são os próximos passos, ou aguardar instrução.

## O que fazer agora

[Preencher aqui o que o dono do projeto quer fazer nesta sessão]
