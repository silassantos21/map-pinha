# Handoff — continuação de sessão

> Atualizado em 13/11/2026 (sessão de pendências fora do app nativo, fix
> do login quebrado em cold start, e 4 ajustes na web — ver seções
> "Rodada de 12/11/2026" e "4 ajustes na web" abaixo). Isso
> aqui é só o que **não** está documentado em
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
partes. **Partes 1 a 4 implementadas e a Parte 5 (geofence) implementada
com a ressalva abaixo** — ver seções próprias abaixo. Nada do resto do
roadmap original fica pendente; "o que falta" só se aplica à Fase 10 em si.

**Novo sub-projeto `mobile/`** (Expo/React Native) — tooling próprio, não
confundir com os comandos de `frontend/`/`backend/`: `cd mobile && npx expo
start` (dev), `npx tsc --noEmit` (type-check), `npx expo-doctor`
(diagnóstico de config). **Há um emulador Android configurado nesta máquina**
(AVD `Medium_Phone_API_37.0`, SDK em
`C:\Users\jende\AppData\Local\Android\Sdk`, Google Play habilitado) — dá pra
instalar builds e usar `adb logcat` pra investigar crashes nativos sem
depender do celular físico do dono do projeto, como já foi feito nesta sessão
e na anterior. Duas ressalvas reais desse emulador específico, não do app:
conectar o dev-client ao Metro só funciona pelo IP real da máquina na rede
Wi-Fi (`192.168.0.x:8081`, via `adb reverse` ou direto) — `localhost`/
`10.0.2.2` falham silenciosamente; e o Fused Location Provider do Google Play
Services falha com `DEVELOPER_ERROR` nesse AVD (afeta `expo-location` e o
registro de geofence), então localização/geofence só se confirma de verdade
num celular físico. Teste de ponta a ponta com dados reais (login Google,
upload de mídia) ainda depende do celular físico do dono do projeto, já que
o login usa OAuth de verdade.

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
- Dois fixes da rodada de testes anterior, documentados só agora:
  `GOOGLE_MOBILE_CLIENT_ID` nunca tinha sido cadastrado nas env vars do Render
  em produção (só existia localmente) — causava "Token not issued for this
  app" no login; e o mapa mostrava o tema padrão do Google por baixo do tema
  "cartoon" por falta de `mapType="none"` em `MapView` (`react-native-maps`
  sempre desenha o mapa base do Google por baixo de qualquer `UrlTile`, a
  menos que isso seja setado).

### Fase 10 Partes 3, 4 e 5 — paridade de escrita, social e geofence (11/11/2026)

Pedido explícito do dono do projeto: desenvolver tudo que falta da Fase 10 de
uma vez, gerando **uma única build nova** no final (não uma por
funcionalidade). Detalhes completos em `SPRINTS.md`; resumo aqui:

- **Backend:** JWT mobile estendido do único endpoint da Parte 2
  (`list_pois`) pros ~20 restantes que endpoints de escrita/social precisam
  (`pois.py`, `favorites.py`, `follows.py`, `users.py`, `groups.py`,
  `comments.py`, `notifications.py`, `media.py`) — mesmo padrão
  (`require_internal_secret_or_mobile_user`, já existente desde a Parte 2),
  sem mudança no helper em si. Validado com um script `TestClient` ad-hoc (24
  asserções, nenhum arquivo de teste commitado — mesmo padrão já usado neste
  projeto).
- **Mobile:** navegação trocada de `useState` simples pra
  `@react-navigation` (stack + bottom-tabs) pra sustentar ~10 telas novas;
  criar/editar POI com foto (`expo-image-picker`), favoritar, seguir
  usuários, grupos, comentários, notificações (polling 30s, igual a web), e
  geofence nativo + notificação local (`expo-location` +
  `expo-task-manager` + `expo-notifications`) com um botão "Ativar avisos de
  proximidade".
- **Limitações assumidas:** mídia do POI só imagem no app (web continua
  aceitando GIF/áudio); sem editor de avatar no app (Fase 9, fora de escopo).
- **Validado no emulador Android** (ver nota sobre o AVD acima): todas as
  telas e fluxos de escrita confirmados criando dados reais e consultando o
  banco diretamente depois de cada ação (não só pela UI) — criar POI com
  upload real pro R2, favoritar, seguir, criar/excluir grupo. Um bug real
  encontrado e corrigido: `useCurrentLocation` (`PoiFormScreen.tsx`) não
  tratava erro de localização, deixando o botão "usar minha localização
  atual" sem nenhum feedback quando falhava. Geofence: fluxo de permissão
  (3 passos) confirmado; o disparo real da notificação ao entrar na área só
  pode ser confirmado pelo dono do projeto no celular físico (ver ressalva
  do emulador acima).
- **Build `preview` final gerada e concluída** (11/11/2026, build
  `b4789557-1b6e-4917-bdc7-c26dba6a5b76`, commit `178d065`), cobrindo
  Partes 3/4/5 juntas num único `.apk`:
  https://expo.dev/artifacts/eas/ZBx0mRVJn3rL9rSwsqgKshcfD5Lb6gJMYADGddBZp7k.apk
  (link pode expirar — gerar um novo com
  `npx eas build:view b4789557-1b6e-4917-bdc7-c26dba6a5b76` ou no dashboard
  da EAS se precisar).
- **Commits enviados ao remoto em 12/11/2026** (`git push`, `3bcd8fe..178d065`),
  depois que o primeiro teste no físico revelou que a build `preview`
  estava contra o backend **antigo** em produção (Render implanta do
  `origin/main`, que estava 3 commits atrás) — causa de "Invalid internal
  secret" ao criar POI e loading infinito ao abrir detalhe de POI. Sem
  mudança de código, só publicar o que já estava pronto e testado.
- **Outros achados do teste físico, anotados mas não corrigidos ainda**
  (dono do projeto decidiu deixar tudo de app nativo por último por
  agora): login lento/múltiplas tentativas (suspeita: cold start do Render
  Free), impossível tocar no mapa dentro do formulário de criar POI
  (esperado — sem mapa embutido nessa tela, só toque longo no mapa
  principal antes de abrir o form), zoom inicial do mapa muito distante.
  Ver "Primeiro teste no físico com a build preview" em `SPRINTS.md`.
- **Próximo passo:** aguardar o Render reimplantar (automático após o
  push) e o dono do projeto testar de novo — criar POI e abrir detalhe
  devem funcionar agora; confirmar também o disparo real da notificação
  de geofence (único ponto que o emulador não conseguiu validar). App
  nativo fica de prioridade mais baixa a partir de agora, por pedido
  explícito — não investir mais tempo nele sem pedido novo.

### Rodada de 12/11/2026 — fix de 2 pontos do app nativo + 5 pendências fora dele

Depois do teste físico da build `preview` (ver seção anterior), o dono do
projeto pediu pra resolver 2 dos pontos levantados (zoom e mapa não-tocável
no formulário) e depois **deixar o app nativo de prioridade baixa**,
focando numa lista de 5 pendências que vinham sendo registradas ao longo
das sessões (nenhuma delas do app nativo). Resumo — detalhes completos de
cada uma no `SPRINTS.md`:

- **App nativo (2 fixes, build nova gerada):** `MapScreen.tsx` ganhou
  ajuste automático de zoom aos POIs reais (`fitToCoordinates`/
  `animateToRegion`, em vez da visão de país inteiro); `PoiFormScreen.tsx`
  ganhou um mapa de verdade embutido (toque pra marcar ponto, arrastar o
  marcador pra ajustar fino). Build `preview` nova gerada e concluída
  (`e0a0b8b9-d174-4ba7-8cd3-c673e6d51c39`):
  https://expo.dev/artifacts/eas/84tn-cMv1G_cZl3BdLp32hArbXw9lEyt-MLr1pU7VFw.apk
  — ainda sem confirmação do dono do projeto no físico.
- **1) Código morto do `NearbyRecommenderAgent` removido do backend**
  (endpoints `/ai/recommendations`/`/ai/feedback`, lógica do agente,
  schemas) — a UI já tinha sido removida na Sprint 6, o backend ficou sem
  nenhum chamador desde então. `AiFeedback` (tabela/modelo) e os outros 2
  agentes (categorizer, bio writer) intocados.
- **2) Feedback loop do categorizador** — revisitado, dono do projeto
  confirmou deixar só documentado como pendência (projeto próprio futuro),
  sem mexer em código.
- **3) Upload de mídia de POI validado de verdade** — antes aceitava
  qualquer `content_type` sem checagem nenhuma de tipo real nem tamanho.
  Agora: whitelist de `content_type` por `media_type` já no pedido do
  presigned URL, e no `attach` (único momento com o arquivo já no R2)
  confere tamanho máximo + conteúdo real (Pillow p/ imagem/gif com
  fallback de assinatura pra HEIC, magic bytes p/ áudio) — apaga do R2 e
  rejeita se falhar. Testado de ponta a ponta com o R2 de verdade (não
  mock).
- **4) `docs/06_PRICING.md` recalculado** incluindo as Fases 7-9 (a
  ferramenta externa que gerou os números originais não existe neste
  repo — recalculado à mão por proporção de horas/dia). Preço sugerido:
  R$ 22.932–29.302 → **R$ 30.139,20–38.511,20**. Também corrigidas 2
  referências que já estavam stale (dias totais, contagem de agentes).
- **5) Bottom-sheet mobile estendido pros 7 painéis que nunca tiveram** —
  pedido era só conferir Favoritos/Histórico de rotas em viewport mobile
  real; achado de quebra: **nenhum** painel secundário (Social, Grupos,
  Perfil, Busca de pessoas, Perfil de outro usuário) tinha o tratamento
  "sobe como bottom-sheet no mobile" documentado desde a Sprint 1 — só
  existia em 2 componentes (form e detalhe de POI). Aplicado o mesmo
  padrão (`side="bottom"` + `max-h-[65vh]` + `flex-1` no container de
  lista onde faltava) nos 7. Validado rodando a app de verdade (Playwright
  + sessão forjada, viewport 390×844, com até 8 itens pra forçar scroll) —
  screenshots confirmam o painel travando em 65vh e rolando por dentro,
  sem vazar.
- **Push feito e confirmado em produção** (`6fbdfb7..9c719e7`) — Render já
  reimplantou (`/ai/recommendations` responde 404 na produção agora,
  confirmando o deploy novo).
- Nota registrada, não corrigida: botão de fechar (X) de qualquer Sheet
  mede 28×28px, abaixo do mínimo recomendado de toque (44×44px) — afeta o
  app inteiro, não é específico de nenhuma tela dessas.

### App publicado no Google (saiu do modo "Testing") — 12/11/2026

O dono do projeto perguntou se dava pra várias contas Google diferentes
testarem o site ao mesmo tempo — resposta: a arquitetura já suporta isso
tranquilamente (sessões independentes, nada compartilhado entre usuários
além do que é intencional), mas o app OAuth no Google Cloud Console ainda
estava em modo **"Testing"**, que só deixa logar quem está numa lista
manual de até 100 "usuários de teste". Resolvido:

- **`frontend/src/app/privacidade/page.tsx`** (novo): página estática de
  Política de Privacidade, exigida pelo Google pra liberar o botão
  "Publicar app" (junto com nome do app, e-mail de suporte e URL da
  página inicial, preenchidos manualmente pelo dono do projeto no Google
  Cloud Console). Publicada em produção:
  https://mapinha-iota.vercel.app/privacidade — e-mail de contato nela é
  o pessoal do dono do projeto, publicado com confirmação explícita dele
  (perguntei antes, não assumi).
- **Logotipo do app e Termos de Serviço deixados em branco de propósito**
  — nenhum dos dois é exigido pra publicar, e subir um logotipo
  obrigaria o app a passar por verificação do Google (processo de
  dias/semanas) antes de poder sair do modo Teste, o que era
  contraproducente pro pedido.
- **Status mudado para "Em produção"** pelo dono do projeto no Google
  Cloud Console (Google Auth Platform → Público-alvo → "Publicar app"),
  confirmado por print — qualquer conta Google já consegue logar, sem
  limite de usuários de teste.
- Removido também, de quebra, um item obsoleto da lista "Funcionalidades
  Futuras (v2+)" em `docs/00_OVERVIEW.md`: "upload direto de GIFs" — já
  implementado de verdade desde a Sprint 3 (R2, não só URL externa).
- **Decisão tomada, sem mudança de código:** o dono do projeto sugeriu um
  dialog de login obrigatório antes do mapa pra quem não está logado.
  Recomendei não fazer — o mapa público navegável sem login é
  intencional (deixa visitantes/recrutadores verem o projeto sem precisar
  de conta Google), e um dialog bloqueando atrapalharia isso. O botão
  "Entrar" já existe, sempre visível no header (`auth-button.tsx`). Dono
  do projeto concordou em deixar como está.

## Roadmap original — completo

Nada mais falta do roadmap original (`docs/04_TIMELINE.md`). Qualquer coisa
nova a partir daqui é v2+ ou pedido explícito do dono do projeto — não
presumir próximos passos, só perguntar ou aguardar instrução.

### 4 ajustes na web, planejados e implementados (13/11/2026)

Depois de um login real quebrar com o bug acima, o dono do projeto
relatou mais 4 pontos testando o site publicado. Planejado em plan mode
(3 agentes Explore + teste real contra o Nominatim antes de codar) e
implementado na sequência — detalhes completos em `SPRINTS.md`:

1. **Busca de endereço não achava endereço real / achava lugar errado**
   — causa raiz dupla confirmada testando direto contra o Nominatim:
   acento em "Sinfrônio" quebrava o match sozinho (contraintuitivo, o
   nome oficial no OSM *tem* esse acento), e o complemento "Lj 3"
   derrubava a busca inteira junto. Fix: `geocode/search/route.ts`
   tenta de novo com uma versão simplificada (sem acento, sem
   complemento) quando a busca completa falha; `poi-form-sheet.tsx`
   agora mostra uma lista de opções (como a SearchBar já fazia) em vez
   de confiar cegamente no 1º resultado do Nominatim. Limitação de
   precisão de numeração em si continua (decisão: não trocar de
   provedor geocoding pago).
2. **Formulário de criar Marcador ocupava espaço demais no mobile** —
   altura reduzida de 65vh pra 50vh (`poi-form-sheet.tsx`), offset do
   mapa recalculado (`map-pan.ts`), e cabeçalho do mapa escondido
   enquanto o formulário está aberto, só no mobile (novo
   `header-visibility.tsx`, lê o `map-store.ts`). Desktop mantém o
   cabeçalho sempre visível (formulário lateral não compete por altura
   de mapa lá).
3. **"POI" trocado por "Marcador" em todo texto visível ao usuário** —
   web (~17 arquivos) + mobile (7 arquivos) + `README.md`. Nomes de
   variável/rota/API/banco continuam exatamente como estavam. Achado
   paralelo resolvido junto: o app mobile mostrava mensagens de erro
   cruas em inglês do backend (`"POI not found"` etc.) — ganhou uma
   tradução central das 3 mensagens conhecidas que mencionam POI.
4. De quebra, corrigida uma frase do `README.md` que ainda citava "3
   agentes de IA" e a recomendação de POIs próximos — esse agente foi
   removido do backend numa sessão anterior (12/11/2026).

Validado de ponta a ponta com Playwright (sessão forjada, viewport
mobile e desktop) pros itens 1 e 2, e visualmente pro item 3 — não só
por tipo/lint. `tsc`/`eslint` limpos e `next build` de produção
completo sem erros.

## O que fazer agora

O fix do login quebrado (cold start) já está commitado, no push e
confirmado em produção. Os 4 ajustes de hoje (busca de endereço, layout
mobile do formulário, rename POI→Marcador) estão implementados e
validados, mas **ainda não commitados nem enviados ao remoto** (pendente
de confirmação explícita do dono do projeto, como sempre). App nativo
continua de prioridade baixa por pedido explícito — não investir mais
tempo nele sem pedido novo.
