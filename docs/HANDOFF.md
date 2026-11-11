# Handoff — continuação de sessão

> Atualizado em 11/11/2026. Isso aqui é só o que **não** está documentado em
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

Concluído: Fases 1-6, 8 e 9 do roadmap inteiras, e a **Fase 7 completa**
(Partes 1, 2 e 3 — Sistema Social: seguir, notificações, visibilidade de POI,
grupos, comentários). **Roadmap original (Fases 1-9) 100% implementado.**

Em andamento, **sem prazo comprometido** (v2+): **Fase 10 — App Nativo
(React Native/Expo)**, formalizada em `docs/04_TIMELINE.md`, faseada em 5
partes. **Partes 1 e 2** implementadas (auth mobile no backend + projeto
Expo com login/mapa somente-leitura) — ver seções próprias abaixo. Nada do
resto do roadmap original fica pendente; "o que falta" só se aplica à Fase
10 em si.

**Novo sub-projeto `mobile/`** (Expo/React Native) — tooling próprio, não
confundir com os comandos de `frontend/`/`backend/`: `cd mobile && npx expo
start` (dev), `npx tsc --noEmit` (type-check), `npx expo-doctor`
(diagnóstico de config). **Sem emulador Android nem Mac neste ambiente** —
só dá pra validar por código aqui; teste de verdade (login, mapa com dados
reais) é sempre no celular físico do dono do projeto, via development build
(não Expo Go — ver `mobile/README.md`).

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

### Fase 7 Parte 2 — Grupos + rodada de ajustes de UX (commit `bcac9e3`)

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

### Fase 7 Parte 3 — Comentários em POIs

- Schema: `comments` (`id`, `poi_id`, `user_id`, `body`, `created_at`,
  `deleted_at` nullable — **soft delete**, diferente das reações que são
  hard-delete) + `notification_type` ganha `'poi_comment'` (migration
  `53496d41a521`, mesma limitação de sempre com `ALTER TYPE ... ADD VALUE`).
- Backend: novo `app/api/v1/comments.py` (arquivo próprio, mesmo padrão de
  `favorites.py`) — `GET/POST /pois/{id}/comments`, `DELETE /comments/{id}`.
  Comentários **não** entram em `POIRead` (diferente das reações) — endpoint
  buscado sob demanda só quando o card de detalhe abre. Reaproveita
  `_poi_visible_to` de `pois.py` pra checar quem pode ver/criar comentário.
  Exclusão: autor OU dono do POI. Paginação por `limit` crescente (mesma
  lição já corrigida no sininho), `ORDER BY created_at DESC, id DESC`.
- Frontend: nova seção "Comentários" colapsável (fechada por padrão, mesmo
  estilo do `addressSection`) dentro do `PoiDetailSheet`, com lista + textarea
  de novo comentário (Enter envia, Shift+Enter quebra linha). Exclusão sem
  `AlertDialog` (precedente de `removeExistingMedia`). Sininho ganha o caso
  `poi_comment` em `formatNotificationText` (clique já cai no branch genérico
  existente).
- Validado de ponta a ponta no backend (via `TestClient`, não só curl) e
  `type-check`/`lint`/`build` limpos no frontend.

### Refinamentos pós-roadmap no painel de Grupos

Pedidos pontuais do dono do projeto depois do roadmap original já fechado:

- Novo `GET /groups/{id}/pois` + seção "POIs desse grupo" no detalhe do grupo
  (`groups-panel.tsx`), card mostrando categoria + **quem criou** cada POI
  (`por {nome}`) — posicionada abaixo da seção de membros.
- `MemberAvatarStack`: pilha de avatares sobrepostos (só `accepted`) com
  contador, clicável pra expandir a lista completa de membros (que ficou
  inalterada) — visão "econômica" por padrão.
- Avatar à esquerda do nome na busca de convite (`AddMemberSearch`), mesmo
  padrão já usado em `user-search-panel.tsx`.
- `AddMemberSearch` agora recebe os membros do grupo e troca "Convidar" por
  um texto de status ("Já é membro"/"Convite pendente") pra quem já está na
  lista — evita a tentativa de reconvite (o backend já rejeitava com 400,
  só que depois do clique).
- **Notificação nova `group_invite_accepted`** (migration `eda7c0156ff4`):
  faltava avisar o dono do grupo quando alguém aceita o convite — o roadmap
  original só previa notificar o convidado no envio (`group_invite`).
  Confirmado com o dono do projeto antes de implementar. `accept_invite`
  (`groups.py`) cria a notificação pro `group.owner_id`; sininho ganha o
  caso em `formatNotificationText`/`handleItemClick`.
- Validado via `TestClient` (POIs do grupo só visíveis a membros aceitos,
  fluxo convite→aceite completo gerando a notificação nova) e
  `type-check`/`lint`/`build` limpos no frontend.

### Reorganização do HUD em camadas (inspirada no Google Maps)

A partir de um print do Google Maps mobile, reorganização puramente espacial
do HUD do mapa — planejada formalmente (plan mode + `AskUserQuestion` pra 3
decisões em aberto) antes de codar, sem perder nenhuma função nem mudar
tokens de design. Detalhes completos no `SPRINTS.md`, resumo aqui:

- **Topo:** `theme-switcher.tsx` saiu do `hud-header.tsx` (foi pra coluna
  lateral do mapa, ver abaixo) — sobram logo, busca, sino e avatar, cada um
  com seu próprio espaço, igual sempre foi (uma rodada tentou sobrepor
  sino+avatar na borda da busca, o dono do projeto não gostou, revertido —
  ver "Correção pós-QA visual" abaixo).
- **Coluna lateral do mapa:** `theme-switcher.tsx` saiu do header e virou o
  botão "camadas" (ícone `Layers`) dentro do `map-controls.tsx`, abrindo um
  popover com os temas (novo `components/ui/popover.tsx`, mesmo primitivo
  `@base-ui/react/popover` de `tooltip.tsx`/`dialog.tsx`) — junto com
  locate/zoom, formando 1 coluna vertical só na borda direita do mapa.
- **Rodapé:** cluster de 5 ícones soltos virou uma barra (`app-shell.tsx`) de
  4 slots fixos com ícone+rótulo (`tab-bar-item.tsx`, novo) — `FollowersPanel`/
  `GroupsPanel`/`RouteHistoryPanel` não retornam mais `null` deslogado, ficam
  desabilitados com tooltip em vez de sumir (barra não muda de tamanho). O
  botão de criar POI saiu da fileira, virou um FAB elevado sobrepondo a borda
  superior da barra. Nova CSS var `--hud-footer-height` (`app-shell.tsx`)
  consumida por `route-panel.tsx`/`map-view.tsx` pra não ficarem escondidos
  atrás do rodapé mais alto.
- Validado com `type-check`/`lint`/`build` limpos a cada camada. Commitada e
  no push (`3f6202d`, já incluindo a correção pós-QA abaixo).
- **Correção pós-QA visual:** o dono do projeto testou de verdade e pediu 3
  ajustes — barra cheia do rodapé só no mobile (desktop volta ao cluster
  compacto de antes), avatar+sino voltam a ser elementos separados no
  cabeçalho (não mais sobrepostos na pill de busca), e a pill de busca no
  mobile volta a mostrar o texto "Buscar POIs ou endereços..." (não colapsa
  pra um ícone sozinho) — só muda a aparência em repouso, o toque continua
  abrindo o painel de tela cheia. Pro rodapé responsivo sem duplicar
  `Sheet`s, novo `components/layout/panel-trigger.tsx` (usado pelos 4
  painéis) decide a casca do botão via CSS puro com `useMediaQuery` — nunca
  monta dois gatilhos ao mesmo tempo.

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

### Fase 10 Parte 1 — Fundação de autenticação mobile

App nativo (React Native/Expo) com notificação de proximidade, item novo de
v2+ (`docs/00_OVERVIEW.md`), formalizado como **Fase 10** em
`docs/04_TIMELINE.md` (5 partes, **sem prazo comprometido** — diferente do
roadmap original). Só a Parte 1 foi feita até aqui.

- **Achado que bloqueava tudo:** o backend (`verify_internal_secret`) confia
  cegamente no `user_id` recebido em cada chamada, protegido só por um
  segredo fixo que hoje só o Next.js (BFF) conhece — um app nativo não pode
  carregar esse mesmo segredo (extraível do binário). Resolvido antes de
  qualquer tela de app.
- Novo `backend/app/core/security.py` (`create_access_token`/
  `decode_access_token`, JWT HS256, `pyjwt`, sem refresh token — expira em 30
  dias) e novo router `backend/app/api/v1/mobile_auth.py`: `POST
  /mobile/auth/google` (troca um ID token do Google, verificado contra
  `tokeninfo`, por um JWT próprio) e `GET /mobile/auth/me` (valida o JWT).
  **De propósito, sem o `X-Internal-Secret`** — são os únicos 2 endpoints
  públicos sem o segredo interno, protegidos pela verificação do Google.
- `backend/app/api/v1/auth.py`: lógica de get-or-create extraída pra
  `get_or_create_user()`, reaproveitada pelos dois caminhos (web e mobile) —
  `/auth/sync` revalidado sem mudança de comportamento.
- **Resto da API intocado nesta parte** — continuou só `X-Internal-Secret`;
  `GET /pois` ganhou o JWT mobile na Parte 2 (ver abaixo), o restante segue
  igual.
- Validado via `TestClient` (não dá pra simular ID token real do Google no
  terminal): round-trip do token, `/mobile/auth/me` com token válido/
  inválido/ausente/usuário inexistente, `/auth/sync` revalidado ponta a
  ponta. `JWT_SECRET`/`GOOGLE_MOBILE_CLIENT_ID` novos no `.env.example`, sem
  migration (JWT stateless).

### Fase 10 Parte 2 — App Expo: login + mapa somente-leitura

- **2 premissas derrubadas por doc oficial da Expo antes de codar** (seguindo
  o próprio `mobile/AGENTS.md` gerado pelo template: "Expo muda toda release,
  não confiar na memória"): login via navegador (`expo-auth-session`) não
  funciona de forma confiável no Expo Go — precisa de **development build**
  (EAS Build); e `react-native-maps` no Android exige API key do Google Maps
  mesmo só com tiles customizados. As duas mudaram a abordagem combinada
  antes, confirmadas com o dono do projeto via pergunta direta antes de
  prosseguir (login virou SDK nativo `@react-native-google-signin/
  google-signin` em vez de navegador; mapa continuou `react-native-maps`,
  aceitando a API key extra).
- **Backend:** `GET /pois` (`pois.py`) ganhou `require_internal_secret_or_
  mobile_user()` (`security.py`) — aceita `Authorization: Bearer` (JWT
  mobile, `user_id` resolvido do token, **sobrescreve** qualquer `user_id` da
  query) OU `X-Internal-Secret` (comportamento de sempre do BFF). Único
  endpoint tocado nesta parte.
- **Mobile:** novo `mobile/` (Expo SDK 58, TypeScript, sem Expo Router — só
  2 telas, troca por `useState` simples). Mapa com `react-native-maps`/
  `UrlTile` no tema "cartoon" (único portado por agora) + marcadores com os
  mesmos ~37 ícones (`lucide-react-native`, mesmas chaves kebab-case da
  web).
- **Login — trocado de SDK nativo pra navegador (10/11/2026), depois do
  primeiro teste num Android físico:** `@react-native-google-signin/
  google-signin` falha de forma intermitente (`TurboModuleRegistry... could
  not be found`, mesmo build funcionando numa abertura e falhando na
  próxima) — bug confirmado e sem correção nas issues oficiais do pacote
  (#1350, #1330, #1362). Trocado por `expo-auth-session` + `expo-web-
  browser` (`LoginScreen.tsx`). O Google não aceita mais esquema
  customizado (`mapinha://`) como redirect URI — por isso existe
  `frontend/public/mobile-auth-redirect.html`, página-ponte estática
  publicada no site (`mapinha-iota.vercel.app`) que recebe o retorno do
  Google (https) e repassa pro app via `mapinha://`. Esse URL precisa estar
  cadastrado em "Authorized redirect URIs" do client Web no Google Cloud
  Console (mesmo client de sempre, sem cadastro adicional tipo "Android").
- **Confirmado de ponta a ponta num Android físico (10/11/2026)** — mais 3
  bugs reais encontrados e corrigidos nesse teste, nenhum de rede:
  - Produção inteira (site) com 500 em qualquer listagem de POI — migrações
    do Alembic desatualizadas no banco (Supabase) desde 01/11. Fix: `backend/
    Dockerfile` roda `alembic upgrade head` antes do `uvicorn` a cada deploy
    (Render Free não dá Shell pra migração manual); junto, `alembic/env.py`
    corrigido pra escapar `%` na `DATABASE_URL` antes do `ConfigParser` (senha
    do Supabase tem `%40`).
  - Botão da página-ponte não abria o app — Chrome ignora silenciosamente um
    link cru pra esquema customizado. Fix: página-ponte monta um link
    `intent://...#Intent;...;end` (sintaxe própria do Chrome) no Android;
    `LoginScreen.tsx` ganhou um listener de deep link (`Linking.
    addEventListener`), já que o retorno real (https) nunca fecha o Custom
    Tab sozinho.
  - Mapa crashava com "API key not found" — `EXPO_PUBLIC_GOOGLE_MAPS_
    ANDROID_API_KEY` só existia no `.env` local (gitignored), nunca chegou
    na build da nuvem da EAS. Fix: `eas env:create` + nova build.
  - **`mobile/README.md` documenta o setup completo** (conta Expo/EAS, 2
    cadastros no Google Cloud Console, gerar/instalar o build, rodar o dev
    server).
- **Novo perfil `preview` (11/11/2026)** no `eas.json` — `developmentClient:
  false` (bundle embutido, sem Metro) + env vars próprias na EAS apontando
  pro backend de produção, pra outras pessoas testarem o app sem estar na
  minha rede. Crashava na hora de abrir, só nessa build (nunca na
  `development`) — causa real só achada com `adb logcat` num emulador
  Android (dono do projeto já tinha o SDK instalado): `FATAL EXCEPTION:
  Failed to create an instance of class androidx.work.impl.WorkDatabase`,
  R8 (minificação, só ativa em release) removendo uma classe interna que o
  `androidx.work`/Room usa via reflection — bug conhecido dessa combinação
  de versões. Fix: `expo-build-properties` com `extraProguardRules`
  mantendo essas classes intactas. Validado reinstalando no emulador via
  `adb` — sem crash. Perfil `preview-debug` (variante release + dev client
  junto) ficou no `eas.json` como ferramenta de debug pra próximas vezes.
- **Próximo passo (não começar sem pedido explícito):** Parte 3 — paridade
  de escrita (criar/editar POI, favoritar) no app.

## Roadmap original — completo

Nada mais falta do roadmap original (`docs/04_TIMELINE.md`). Qualquer coisa
nova a partir daqui é v2+ ou pedido explícito do dono do projeto — não
presumir próximos passos, só perguntar ou aguardar instrução.

## O que fazer agora

[Preencher aqui o que o dono do projeto quer fazer nesta sessão]
