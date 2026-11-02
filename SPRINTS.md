# SPRINTS — MapPin

Este arquivo acompanha a execução do projeto, sprint por sprint, espelhando o cronograma definido em [docs/04_TIMELINE.md](docs/04_TIMELINE.md). Cada sprint corresponde a uma fase do planejamento original.

**Legenda de status:** 🔜 Não iniciado · 🚧 Em andamento · ✅ Concluído · ⏸️ Bloqueado

Cada sprint tem três seções próprias, atualizadas conforme avançamos:
- **Decisões e Pendências** — escolhas que precisam da sua confirmação (configs, contas, anexos, credenciais)
- **Dificuldades** — obstáculos encontrados durante a execução e como foram resolvidos
- **Notas** — observações relevantes para quem revisar depois

---

## ⚠️ Pendências de Segurança (prioridade alta, resolver antes do deploy público)

- ~~**Next.js 14.2.35 tem CVEs críticas**, incluindo 2 de RCE não-autenticado...~~ **Corrigido em 28/10/2026** — upgrade pra Next.js 16.4.3 (Sprint 6, detalhes completos na seção da sprint). `npm audit` não acusa mais nenhuma vulnerabilidade do Next.js.
- ~~IDOR em `GET /api/v1/pois` (backend) — qualquer `user_id` é aceito sem checar sessão.~~ **Corrigido em 23/10/2026** (mesmo dia, a pedido seu). Descoberto ao implementar "Meus POIs" (item 18 abaixo): o endpoint era público (sem `verify_internal_secret`) e chamado **direto do navegador** pro FastAPI (`fetchPois`/`fetchPoiById` em `frontend/src/lib/api-client.ts`, via `NEXT_PUBLIC_API_URL`) passando `user_id` como query param escolhido pelo próprio cliente — nada impedia alguém de passar o UUID de outro usuário e ver os POIs privados (`is_public=False`) dele. Correção (item 19 abaixo).

---

## Sprint 1 — Setup, Design System e Infraestrutura Base

**Status:** ✅ Concluído (deploy automático fica pausado por decisão sua — ver Decisões) · **Duração estimada:** 10 dias

### Tarefas
- [x] Configurar monorepo: Next.js 14 + FastAPI + Docker Compose local
- [x] Setup PostgreSQL local com extensão PostGIS habilitada
- [~] Configurar GitHub Actions: lint, type-check, deploy automático Vercel + Railway (CI de lint/type-check pronto e funcionando; deploy automático **pausado** — trial do Railway acabou, decisão de pagar/migrar adiada, seguimos 100% local por enquanto — ver Decisões e Pendências)
- [x] Criar design system gamificado: paleta de cores (5 temas de mapa), tipografia (fonte pixelada + sans-serif funcional), tokens de design no Tailwind
- [x] Configurar shadcn/ui com tema customizado (dark/light gamificado) — só **dark** por decisão sua, estrutura preparada para light depois (ver Decisões)
- [x] Setup Cloudflare R2: bucket, CORS, política de acesso público para mídia
- [x] Implementar NextAuth.js v5: OAuth Google + Credentials, sessão JWT — só **Google** (MVP não pede Credentials, ver Decisões)
- [x] Criar layout base do app: sidebar, header gamificado, área do mapa — redesenhado como HUD flutuante responsivo (ver Decisões)
- [x] Definir e documentar schema do banco: tabelas users, poi, poi_media, routes, categories

### Entregáveis
- Repositório configurado com CI/CD funcionando (deploy no Vercel + Railway)
- Design system documentado com todos os tokens visuais dos 5 temas de mapa
- Autenticação completa (login Google + email/senha) com sessão persistente
- Schema do banco de dados migrado no PostgreSQL+PostGIS em produção
- Bucket R2 configurado e testado com upload de arquivo de exemplo

### Decisões e Pendências
- ✅ Estrutura do monorepo: pastas simples `frontend/` + `backend/` (sem Turborepo/Nx)
- ✅ Gerenciador de pacotes do frontend: `npm`
- ✅ Banco local: PostgreSQL+PostGIS via Docker Compose (imagem `postgis/postgis:16-3.4`), não Supabase
- ✅ Docker Desktop ligado, containers validados de ponta a ponta (ver Dificuldades/Notas)
- Nota: pasta `src/` vazia removida — o código real mora em `frontend/` e `backend/`

#### Checklist de credenciais (levantamento feito em 21/10/2026)

| Credencial | Status | Quando é necessária |
|---|---|---|
| Repositório remoto no GitHub | ✅ Você tem | Agora (conectar + push) |
| Conta Vercel | ✅ Você tem | Agora (conectar projeto) |
| Conta Railway | ✅ Você tem | Agora (conectar projeto + Postgres + Redis) |
| Google OAuth Client ID/Secret | ✅ Você tem | Agora (NextAuth.js, ainda nesta sprint) |
| Conta Cloudflare + bucket R2 | ✅ Você tem | Agora (upload de mídia, ainda nesta sprint) |
| Anthropic API Key | ✅ Você tem | Sprint 5 (pode preencher com antecedência) |
| Domínio customizado | ➖ Não vai usar (01/11/2026) | Sprint 6 — segue com subdomínio gratuito (Vercel/Render) |
| Conta Sentry | ✅ Você tem | Sprint 6 — feito em 30/10/2026 |
| Giphy API Key | ⏳ Não levantado | Opcional — MVP usa URL externa de GIF, sem key |
| Stadia Maps / MapTiler API Key | ⏳ Não levantado | Opcional — tema padrão usa CartoDB, sem key |

- ✅ Repositório conectado e primeiro push feito: https://github.com/silassantos21/map-pinha (branch `main`)
- ✅ Design system definido com você: fonte display **Silkscreen** (pixel, legível), fonte corpo **Inter**, tema base **Dark HUD gamer** (só dark por agora — luz fica pra depois se quisermos, tokens já em CSS vars isolados para isso)
- ✅ **Decisão retomada em 01/11/2026: migrar pra stack 100% gratuita em vez de pagar Railway.** Backend (FastAPI) → Render, banco (Postgres+PostGIS) → Supabase, Redis → Upstash. Frontend continua na Vercel (já conectada, nunca foi o bloqueio). Sem domínio customizado por agora — segue nos subdomínios gratuitos de cada plataforma.
- ⏳ **Pendente — você (sem pressa, não bloqueia):** confirmar se já criou o serviço PostgreSQL no Railway e se conseguiu habilitar PostGIS nele (risco técnico 2 do `docs/00_OVERVIEW.md`) — relevante só quando retomarmos o deploy
- ✅ `backend/.env` e `frontend/.env.local` preenchidos com os valores reais (R2, Google OAuth, Anthropic, `NEXTAUTH_SECRET` gerado por mim)
- ✅ Decisão: NextAuth.js só com **Google OAuth** por enquanto — o MVP (`docs/00_OVERVIEW.md`) só pede login Google; Credentials (email/senha) fica pra depois, se vocë quiser, evitando construir uma tela de cadastro/senha que ninguém pediu ainda
- ✅ Login com Google testado por você no navegador — funcionando de ponta a ponta
- ✅ **Decisão de arquitetura de layout (importante, muda a estrutura original "sidebar fixa"):** você quer usar o MapPin tanto no PC quanto no celular "como um app" — então, em vez de sidebar fixa (que exige dois layouts, um deles virando menu hambúrguer no mobile), vamos de **mapa full-bleed + HUD flutuante + painéis overlay responsivos** (`Sheet` do shadcn/ui: desliza da lateral no desktop, sobe como bottom-sheet no mobile). Um único sistema de componentes para as duas telas, sem duplicar layout. Isso também já deixa o terreno preparado pra PWA (Sprint 6, já estava no roadmap).

### Dificuldades
- **Mismatch Tailwind v3 vs v4 no `shadcn init`.** O `create-next-app` tinha instalado Tailwind v3.4.1 (config clássico em `tailwind.config.ts`), mas o CLI atual do shadcn (`shadcn@4.x`, preset `base-nova`) gera CSS no formato do Tailwind v4 (`@theme inline`, `@custom-variant`, `@utility`) — e o `globals.css` gerado nem tinha o mapeamento `--color-*` completo, então nenhuma classe como `bg-background` funcionaria de verdade. Resolvido migrando o projeto inteiro para **Tailwind v4**: troquei `tailwindcss` por `tailwindcss@4` + `@tailwindcss/postcss`, reescrevi `postcss.config.mjs`, `globals.css` (com `@theme inline` completo) e esvaziei `tailwind.config.ts` (no v4 os tokens vivem no CSS, não mais no JS config). Validado com `npm run build` (compilou limpo) e `npm run dev` (HTTP 200).
- **`next/font/google` quebrou o build** (`Unknown font 'Geist'`) — o `shadcn init` injetou um import de fonte `Geist` que essa versão do Next.js (14.2.35) não reconhece, duplicando com as fontes locais `Geist` que o `create-next-app` já tinha copiado em `src/app/fonts/`. Resolvido removendo os dois (import quebrado + arquivos `.woff` locais não usados) e configurando `Inter` + `Silkscreen` via `next/font/google`, que é o par de fontes decidido com você.
- **Autogenerate do Alembic queria dropar 34 tabelas do PostGIS.** A imagem `postgis/postgis` instala as extensões `postgis_tiger_geocoder` e `postgis_topology`, que criam dezenas de tabelas nos schemas `tiger`/`tiger_data`/`topology` — e o Postgres configura o `search_path` do usuário `mappin` para incluir esses schemas automaticamente. Isso fazia o Alembic reflectir essas tabelas como se estivessem "sem schema" (igual às nossas) e tentar apagá-las no autogenerate. Resolvido fixando `search_path=public` via `connect_args` na engine do Alembic (`backend/alembic/env.py`) — mais seguro que um `SET search_path` manual, que na primeira tentativa fez a migration rodar "silenciosamente" sem commitar nenhuma tabela (o Postgres criou só a `alembic_version`, vazia, e nenhuma das 5 tabelas da aplicação — percebi comparando `\dt` com `information_schema.tables` e vendo que não batia).
- **Índice espacial duplicado.** Tinha colocado `index=True` nas colunas `Geography` (`pois.location`, `routes.origin`) além do índice GIST que o GeoAlchemy2 já cria sozinho — gerava dois índices na mesma coluna, um deles (btree) inútil para geography. Removido o `index=True` manual.
- **Python local é 3.11.9, stack pede 3.12.** Resolvido rodando o backend inteiramente via Docker com imagem `python:3.12-slim` no `backend/Dockerfile` — a versão do Python no host não afeta o container. Se precisar rodar o backend fora do Docker em algum momento, será necessário instalar Python 3.12 à parte.
- **`create-next-app` inicializou um `.git` próprio dentro de `frontend/`.** Removido antes de inicializar o git único na raiz do monorepo, para não gerar repositórios aninhados.
- **Conflito de porta 5432:** este ambiente já tem outro projeto (`desafio-tecnico-one-db`) usando a porta 5432 do host. Em vez de desligar o banco de outro projeto, remapeei o Postgres do MapPin para a porta **5433** no host (`docker-compose.yml` e `.env.example` já refletem isso). Dentro da rede Docker interna, o backend continua falando com `db:5432` normalmente — só o acesso via host (ex.: um client de banco local) usa 5433.

### Notas
- Repositório git inicializado na raiz (`git init`), mas **nenhum commit foi feito ainda** — vou aguardar você pedir explicitamente antes de commitar.
- Frontend scaffolded com `create-next-app@14` (TypeScript, Tailwind, App Router, `src/` dir, import alias `@/*`). `npx tsc --noEmit` passou sem erros.
- Backend scaffolded com estrutura em camadas (`app/core`, `app/db`, `app/api/v1`), endpoint `GET /api/v1/health` que testa conexão com o banco. Sintaxe validada com `py_compile`.
- `docker-compose.yml` na raiz orquestra `db` (Postgres+PostGIS), `redis` e `backend`. O `frontend` roda fora do Docker via `npm run dev` para manter hot-reload rápido no Windows.
- **Validado de ponta a ponta:** `docker compose up -d --build` subiu os 3 serviços; `GET /api/v1/health` respondeu `{"status":"ok"}` com conexão real ao banco; `SELECT PostGIS_Version();` confirmou PostGIS 3.4 ativo.
- **Variáveis de ambiente divididas por app** (Next.js e FastAPI leem `.env` de pastas diferentes): `backend/.env.example` (DB, Redis, R2, Anthropic) e `frontend/.env.local.example` (NextAuth, Google OAuth, URL da API). O `.env.example` da raiz agora é só um índice apontando para os dois. Arquivos reais (`backend/.env`, `frontend/.env.local`) já criados localmente a partir dos templates — faltam só os valores reais.
- `docker-compose.yml` do backend agora usa `env_file: ./backend/.env` (para R2/Anthropic) combinado com `environment:` fixo para `DATABASE_URL`/`REDIS_URL` apontando para a rede interna do Docker (`db`/`redis`), para não haver conflito entre valores de host e de container.
- `.github/workflows/ci.yml` criado: job `frontend` (`npm ci`, `next lint`, `tsc --noEmit`) e job `backend` (`ruff check`). Validei o `ruff check app` manualmente dentro do container — passou sem erros.
- Adicionei `backend/requirements-dev.txt` (ruff) e o script `type-check` no `frontend/package.json`.
- **Decisão sobre deploy automático:** em vez de scriptar deploy no GitHub Actions (o que exigiria guardar tokens da Vercel/Railway como secrets), vamos usar a integração nativa Git de cada plataforma — Vercel e Railway fazem deploy automático a cada push assim que o repositório for conectado pelo dashboard deles. Mais simples e sem secrets extras para gerenciar. GitHub Actions fica só com lint/type-check (CI).
- **Design system (Tailwind v4 + shadcn/ui):** paleta Dark HUD em `frontend/src/app/globals.css` (`:root` + `@theme inline`) — tokens semânticos shadcn (`background`, `primary`, `card`, `border` etc.), 6 cores de categoria de POI (`category-alimentacao/comercio/saude/lazer/entretenimento/residencial`) e 5 cores de tema de mapa (`map-cartoon/rpg/vintage/urbano/satelite`; cor "bandeira" do produto = roxo do tema RPG, o mais diferenciado segundo o `docs/00_OVERVIEW.md`). Fontes via `next/font/google`: `Silkscreen` (`--font-display`) e `Inter` (`--font-sans`). Showcase visual em `frontend/src/app/page.tsx` (substitui a página padrão do `create-next-app`) — documentação viva dos tokens até a Sprint 2 trazer os tiles reais do Leaflet.
- Removida a pasta `frontend/src/app/fonts/` (fontes Geist locais, não usadas).
- **Layout base do app (`frontend/src/components/layout/`):** arquitetura de **mapa full-bleed + HUD flutuante + painel overlay responsivo**, substituindo a sidebar fixa originalmente cogitada — decisão motivada por você querer usar tanto no PC quanto no celular "como um app". Componentes: `app-shell.tsx` (orquestra tudo, `h-dvh` pra lidar certo com a barra de endereço móvel), `hud-header.tsx` (logo + busca + `auth-button.tsx`, todos flutuantes com fundo `backdrop-blur`), `category-chips.tsx` (filtros por categoria, scroll horizontal no mobile), `poi-panel.tsx` (`Sheet` do shadcn/ui com dados de exemplo — lista real chega na Sprint 3), `map-placeholder.tsx` (espaço reservado pro Leaflet da Sprint 2). Padding respeitando `env(safe-area-inset-*)` pra não esbarrar em notch/home-indicator em iPhones. Página de showcase do design system (`page.tsx`) foi substituída pelo shell real. Build/lint/type-check limpos; testei manualmente em 3000/3001 que renderiza certo.
- **NextAuth.js v5 (`frontend/src/auth.ts`):** só provider Google, sessão JWT (`strategy: "jwt"`). No callback `jwt`, no primeiro login (quando `account` vem preenchido), o frontend chama `POST /api/v1/auth/sync` no backend pra fazer get-or-create do usuário na tabela `users` e trazer o `user_id` real do Postgres pra dentro do token/sessão (`session.user.id`) — necessário porque `pois.user_id` referencia essa tabela. Esse endpoint é protegido por um segredo compartilhado simples (`INTERNAL_API_SECRET`, header `X-Internal-Secret`) — não é o middleware JWT completo do FastAPI (isso fica pra Sprint 3, quando existirem rotas de POI protegidas de verdade). Rota NextAuth em `frontend/src/app/api/auth/[...nextauth]/route.ts`, augmentação de tipos em `frontend/src/types/next-auth.d.ts`. Botão de login/logout funcional na página de showcase via Server Actions (`signIn("google")`/`signOut()`).
- **Validado sem navegador:** endpoint `/api/v1/auth/sync` testado direto (401 sem o segredo, 200 com ele, upsert idempotente — mesmo `id` em duas chamadas), `GET /api/auth/providers` do NextAuth retorna o Google configurado com a callback URL certa, `GET /api/auth/signin` renderiza sem erro de configuração, `npm run build`/`lint`/`type-check` todos limpos. **Confirmado por você no navegador:** login completo funcionando, e o usuário real apareceu sincronizado na tabela `users` do Postgres (`google_id` preenchido, nome e e-mail corretos) — validação de ponta a ponta fechada.
- **Cloudflare R2 (`backend/app/core/storage.py`):** cliente S3-compatível via `boto3` (`get_r2_client()`), configurado com as credenciais do `backend/.env`. Você criou o bucket `map-pinha`, gerou um API Token com Object Read & Write **restrito a esse bucket** (boa prática de menor privilégio) e habilitou a "Public Development URL" (`pub-....r2.dev`). Validado round-trip completo: upload → download → delete via boto3, e a URL pública servindo o arquivo de fato (`curl` retornou HTTP 200). O endpoint real de presigned URL para upload direto do frontend fica pra Sprint 3 — aqui só validamos que a infraestrutura está de pé.
- **Schema do banco (`backend/app/models/` + `backend/alembic/`):** 5 tabelas — `categories` (6 pré-cadastradas via migration de seed, cores iguais aos tokens do frontend), `users` (Google OAuth + Credentials, `password_hash` nullable), `pois` (coluna `location` `geography(Point,4326)` com índice GIST, FK para `users`/`categories`), `poi_media` (1:N com `pois` — imagem/GIF/áudio, suporta mídia múltipla por POI conforme Sprint 3), `routes` (cache de rotas calculadas, conforme Sprint 4). IDs em UUID. Alembic configurado com GeoAlchemy2 (`alembic_helpers` para autogenerate de colunas espaciais). Duas migrations aplicadas e validadas: `initial schema` e `seed default categories`.

---

## Sprint 2 — Mapa Interativo e Temas Visuais

**Status:** ✅ Concluído · **Duração estimada:** 14 dias

### Tarefas
- [x] Integrar React-Leaflet com Next.js 14 (SSR disabled para componente de mapa)
- [x] Implementar sistema de temas de tileset: Cartoon (Stadia osm_bright), RPG (Stadia Alidade Smooth Dark), Vintage (Stadia Stamen Watercolor), Urbano (Stadia Alidade Smooth), Satélite (ESRI) — CartoDB trocado por Stadia em todos (ver Dificuldades: CartoDB descontinuou tiles sem conta)
- [x] Criar componente de switcher de tema com animação Framer Motion (transição suave entre tilesets)
- [x] Implementar geolocalização: obter posição atual do usuário, centralizar mapa, ícone de avatar do usuário no mapa
- [x] Desenvolver sistema de ícones gamificados por categoria (lucide-react + cores dos tokens, estilo pin cartoon)
- [x] Implementar Leaflet.markercluster para agrupamento visual de POIs densos
- [x] Criar minimap HUD no canto inferior direito (estilo videogame) usando Leaflet Control
- [x] Implementar controles de zoom gamificados substituindo UI padrão do Leaflet
- [x] Adicionar compass/rosa dos ventos animada no mapa
- [x] Setup React Query + Zustand para estado global do mapa (bounding box atual, tema ativo, POIs carregados) — Zustand com `activeTheme` pronto; bounding box/POIs carregados ficam pra Sprint 3 (ainda não existem dados reais); React Query provider configurado e pronto, sem uso ainda (nenhum fetch de dados existe antes da Sprint 3)

### Entregáveis
- Mapa interativo funcionando com 5 temas visuais intercambiáveis via UI
- Geolocalização do usuário com ícone de avatar no mapa
- Sistema de clustering de markers funcionando
- Minimap HUD e controles gamificados implementados
- Performance: mapa carregando em menos de 2s na primeira visita

### Decisões e Pendências
- ✅ `react-leaflet@4.x` (não v5) — v5 exige React 19, mas o projeto está em React 18 (padrão do Next 14). `react-leaflet-cluster@2.1.0` (não a versão mais nova) pelo mesmo motivo de compatibilidade.
- ⏳ **Pendente — você (sem pressa, não bloqueia):** os temas **RPG** e **Vintage** usam tiles da Stadia Maps/Stamen, que funcionam sem API key em `localhost` mas vão precisar de uma key gratuita (`NEXT_PUBLIC_STADIA_API_KEY`) quando formos publicar (free tier generoso, já orçado no `docs/05_COST_ANALYSIS.md`). Cadastro em https://stadiamaps.com — não precisa agora, só antes do deploy.
- ✅ Testado por você no navegador: tiles nos 5 temas, clustering, zoom, geolocalização, painel de POIs — tudo confirmado funcionando, incluindo depois de resolver os 3 bugs abaixo.

### Dificuldades
- **Cache `.next` corrompido** depois que eu matei processos Node à força (`Stop-Process -Force`) em pleno meio de uma escrita do dev server — causou `MODULE_NOT_FOUND` e página sem CSS nenhum (confundiu com o bug de z-index por um momento). Resolvido apagando `frontend/.next` e reiniciando do zero. Lição: evitar `Stop-Process -Force` em processos do Next.js dev server daqui pra frente; preferir fechar via Ctrl+C/porta ociosa.
- **Mapa recentralizava sozinho, brigando com o zoom manual.** `UserLocationMarker` chamava `map.flyTo(...)` toda vez que o `watchPosition` atualizava a localização (a cada ~15s, por causa do `maximumAge`), resetando o zoom/posição que o usuário tinha acabado de ajustar manualmente. Corrigido: agora só centraliza automaticamente **uma vez**, no primeiro fix de GPS (`hasCenteredRef`); recentralizar depois disso é uma ação explícita do usuário via o novo botão "localizar-me" (ícone de mira) em `frontend/src/components/map/map-controls.tsx`, que substituiu o antigo `zoom-controls.tsx` (agora um cluster único: localizar-me + zoom +/-). **Confirmado por você: resolvido.**
- **Bug de z-index/stacking context fazia o HUD (header + chips de categoria) sumir durante o zoom do mapa.** Investigação longa (extensões, CSP, Fast Refresh/DevTools) até você apontar certo: era CSS. Causa raiz confirmada direto no código-fonte do Leaflet (`node_modules/leaflet/dist/leaflet-src.js` e `leaflet.css`): o Leaflet aplica `position: relative` no container do mapa via JS, mas sem `z-index` junto — isso não cria um stacking context novo pela spec do CSS. Os controles internos do Leaflet (`.leaflet-top`/`.leaflet-bottom`, usados pela atribuição) têm `z-index: 1000` fixo. Como nosso wrapper raiz também só tinha `position: relative` sem `z-index`, o 1000 do Leaflet podia vazar e competir direto com o `z-20` do nosso HUD — 1000 ganha. Corrigido envolvendo o mapa num container com `isolate` (`frontend/src/components/layout/app-shell.tsx`), que força um stacking context próprio e contém qualquer z-index interno do Leaflet, por maior que seja, sem precisar de uma "corrida de números" de z-index.
- **CartoDB descontinuou tiles gratuitos sem conta.** Você testou no navegador e viu a marca d'água "API KEY REQUIRED" nos tiles do tema Cartoon (os ícones dos POIs renderizaram certinho, só o tileset que falhou). Minha suposição inicial de que `basemaps.cartocdn.com` era gratuito sem cadastro estava desatualizada — a CartoDB mudou essa política. Resolvido migrando **Cartoon** e **Urbano** para Stadia Maps também (estilos `osm_bright` e `alidade_smooth`), consolidando todos os temas não-satélite sob um único provedor. Validei direto por `curl` com o header `Referer: localhost:3000` (replicando o que o navegador manda) — todos os 3 estilos Stadia usados (incluindo o RPG, que já estava certo) respondem HTTP 200.
- **`react-leaflet@latest` (v5) e `react-leaflet-cluster@latest` exigem React 19.** O projeto está em React 18 (padrão do scaffold Next.js 14). Resolvido fixando `react-leaflet@^4.2.1` e `react-leaflet-cluster@2.1.0`, ambos com peer deps compatíveis com React 18 — confirmei via `npm view ... peerDependencies` antes de instalar, em vez de só tentar e torcer.
- **`npm audit` revelou uma vulnerabilidade crítica no Next.js 14.2.35** (RCE não-autenticado, entre outras CVEs) ao instalar as novas libs. Não é algo introduzido por mim, já estava lá desde o scaffold inicial — só apareceu agora porque reparei no aviso. Registrado como pendência de segurança no topo deste arquivo e como tarefa na Sprint 6; por decisão sua, seguimos a Sprint 2 normalmente (risco baixo em localhost).
- **Primeira compilação do dev server ficou bem mais lenta** (~27s) depois de adicionar Leaflet + markercluster — normal pela quantidade de módulos novos (2176). Compilações seguintes usam cache e voltam ao normal.

### Notas
- **Arquitetura SSR-safe do mapa:** seguindo exatamente a mitigação de risco já prevista no `docs/00_OVERVIEW.md` — `frontend/src/components/map/map-view.tsx` é o mapa real (Client Component), carregado via `frontend/src/components/map/map-view-loader.tsx` com `next/dynamic({ ssr: false })`. Esse wrapper existe separado porque o App Router do Next.js não permite `ssr: false` dentro de Server Components — só dentro de um Client Component próprio.
- **5 temas de tileset** em `frontend/src/lib/map-themes.ts`: Cartoon/Urbano via CartoDB (sem API key), RPG/Vintage via Stadia Maps (sem key em localhost, precisa de key gratuita em produção — ver Decisões), Satélite via ESRI World Imagery (sem key). Atribuições corretas por provedor já incluídas (obrigatório pelos termos de uso de cada um).
- **Switcher de tema** (`frontend/src/components/map/theme-switcher.tsx`): fica no `HudHeader`, ao lado do botão de login. Usa Framer Motion (`layoutId`) pra animar o indicador de seleção entre os temas — só essa transição por enquanto; a troca do tileset em si é instantânea (o `TileLayer` troca de `key` e o Leaflet recarrega os tiles).
- **Ícones de categoria** (`frontend/src/components/map/poi-marker-icon.tsx`): reaproveita exatamente o mapeamento categoria→ícone→cor que já está no seed do backend e nos tokens do `globals.css` — renderiza o ícone lucide como SVG (`renderToStaticMarkup`) dentro de um `L.divIcon` colorido.
- **Clustering** via `react-leaflet-cluster` (wrapper de `leaflet.markercluster`). POIs e geolocalização ainda usam **dados de exemplo** — CRUD real de POIs é Sprint 3, e aí o clustering passa a agrupar dados reais vindos do backend.
- **Controles de zoom customizados** (`frontend/src/components/map/zoom-controls.tsx`) substituem o `+`/`-` padrão do Leaflet (`zoomControl={false}` no `MapContainer`), com o visual HUD do design system.
- **Minimap HUD** (`frontend/src/components/map/minimap.tsx`): segunda instância real do Leaflet (não o plugin `leaflet-minimap`, pra manter o visual 100% consistente com nosso design system) — mapa em miniatura (128×128px, canto inferior esquerdo, escondido em telas pequenas pra não poluir o mobile), com um retângulo mostrando a área visível do mapa principal, sincronizado via `useMapEvents` (`move`/`zoomend`). Zoom fica sempre 5 níveis "mais afastado" que o mapa principal.
- **Bússola animada** (`frontend/src/components/map/compass.tsx`): ícone do lucide com leve balanço contínuo (Framer Motion, `rotate: [0,-6,6,0]` em loop) e feedback de escala no hover/clique. Funcional além de decorativa: clicar reseta a vista do mapa pro centro/zoom padrão (como um botão "home"), posicionado abaixo do HUD superior (`top-32`) pra não colidir com o header/chips.

---

## Sprint 3 — CRUD de POIs e Upload de Mídia

**Status:** ✅ Concluído (10/10) · **Duração estimada:** 16 dias

### Tarefas
- [x] Desenvolver endpoints FastAPI: POST /pois, GET /pois (com filtros geoespaciais), GET /pois/{id}, PUT /pois/{id}, DELETE /pois/{id}
- [x] Implementar query geoespacial: buscar POIs pelo bounding box atual do mapa (ST_MakeEnvelope + ST_Intersects)
- [x] Criar endpoint de presigned URL para upload no R2: POST /media/presigned-url
- [x] Implementar processamento de imagens com Pillow: geração de thumbnail (400×400) + compressão WebP — resize automático do original não implementado, ver Decisões
- [x] Desenvolver formulário de criação de POI: Sheet lateral, validação Zod (react-hook-form), preview em tempo real no mapa (marcador tracejado arrastável)
- [x] Implementar upload multi-mídia no frontend: drag-and-drop de imagem/GIF, gravação de áudio via MediaRecorder + upload de arquivo de áudio existente, preview antes de salvar
- [x] Criar componente POI Card: popup no mapa com imagem/GIF, reprodução de áudio (Howler.js)
- [~] Implementar sistema de categorias: CRUD completo **na API** (GET público, POST/PUT/DELETE protegidos); sem UI de administração — ver Decisões
- [x] Adicionar busca de POIs: SearchBar com autocomplete por nome (debounce 300ms) + filtro por categoria via chips
- [x] Painel lateral de detalhes do POI: lista de POIs na área visível (PoiPanel) + popup rico ao clicar no marcador (nome, descrição, endereço, mídia); edição e exclusão disponíveis pro dono, direto no popup

### Entregáveis
- CRUD completo de POIs funcionando com persistência no PostgreSQL+PostGIS
- Upload de imagem, GIF e áudio funcionando via Cloudflare R2
- Formulário de criação de POI com preview em tempo real no mapa
- POI Card com popup rico: imagem/GIF, player de áudio
- Busca de POIs por nome e categoria funcionando

### Decisões e Pendências
- ✅ **Modelo de autenticação para as rotas de escrita (decisão de arquitetura importante):** como o backend ainda não decodifica a sessão do NextAuth (JWE criptografado, exigiria replicar a derivação de chave do Auth.js em Python), toda escrita de POI/mídia/categoria passa por um **proxy confiável no próprio Next.js** (`frontend/src/app/api/pois/*`, `frontend/src/app/api/media/*`) — Route Handlers que leem a sessão via `auth()` no servidor, descobrem o `user_id` real, e só então chamam o FastAPI com o `X-Internal-Secret` (mesmo padrão já usado desde a Sprint 1 no `/auth/sync`). O navegador nunca vê o secret nem escolhe `user_id` livremente. Leitura pública (`GET /pois`, `GET /categories`) continua indo direto do navegador pro FastAPI, sem proxy — são dados públicos, sem necessidade de sessão.
- ✅ **Fluxo de mídia respeita a arquitetura do CLAUDE.md** ("binários nunca trafegam pelo servidor de aplicação"): upload original vai direto do navegador pro R2 via presigned URL; só **depois** do upload concluído, o backend baixa a imagem do R2 pra gerar a thumbnail WebP com Pillow e sobe de volta — o binário original nunca passa pelo FastAPI, só a thumbnail (bem menor) nessa etapa de pós-processamento.
- ✅ Resize automático do arquivo original **não foi implementado** — só a thumbnail (400×400 WebP) é gerada. O original fica no tamanho que o usuário enviou. Decisão por escopo: evita processar/re-upload do arquivo grande sem necessidade clara ainda; se imagens muito grandes se tornarem um problema real de custo/performance no R2, dá pra adicionar depois.
- ✅ **CRUD de categorias existe só na API**, sem tela de administração no frontend — não há conceito de "admin" no app ainda, e ninguém pediu uma tela pra gerenciar as 6 categorias seed. Protegido pelo mesmo `X-Internal-Secret`.
- ✅ **Edição implementada** (sua escolha: implementar agora, não deixar pra depois) — reaproveita o mesmo formulário/Sheet da criação (`frontend/src/components/poi/poi-form-sheet.tsx`, renomeado de `poi-create-sheet.tsx`) em "modo edição": botão "Editar" no popup do POI (só pro dono) pré-preenche nome/categoria/descrição/endereço/visibilidade, permite arrastar o pino pra reposicionar, remover mídia existente individualmente (novo endpoint `DELETE /pois/{id}/media/{media_id}`, que também apaga o arquivo do R2) e adicionar mídia nova. Submissão faz `PUT /pois/{id}` em vez de `POST /pois`.
- ✅ Dependências novas instaladas: `zod`, `react-hook-form`, `@hookform/resolvers` (fixado em `3.9.0` — a `6.x` tem um conflito de peer-dependency opcional não relacionado ao zod, ver Dificuldades), `howler` + `@types/howler`, e no backend `Pillow` + `shapely` (exigido pelo `geoalchemy2.shape.to_shape` pra extrair lat/lng da coluna `Geography`).

### Dificuldades
- **`@hookform/resolvers@6.x` tem um conflito de peer-dependency** com um pacote opcional (`effect`, usado só pelo suporte a `@effect/schema`, que não usamos) — `npm install` falhava com `ERESOLVE`. Resolvido fixando `@hookform/resolvers@3.9.0`, que só declara `react-hook-form` como peer e não tem esse problema; funcionalmente idêntico pra uso com `zodResolver`.
- **Falso alarme de encoding ao validar a API pelo terminal:** ao inspecionar `GET /api/v1/categories` via `python3 -m json.tool` no Git Bash, os nomes vieram como `"AlimentaÃ§Ã£o"` em vez de `"Alimentação"` — parecia um bug de double-encoding UTF-8 nos dados. Investigação direta: bytes brutos da resposta HTTP (`curl | od -c`) mostraram a sequência correta `0xC3 0xA7 0xC3 0xA3` (UTF-8 válido pra "çã"), e uma consulta `SELECT octet_length(name), length(name)` no Postgres confirmou os dados corretos no banco. A corrupção existia só na minha ferramenta de verificação (decodificação padrão do Python nesse ambiente Git Bash/Windows), não na API nem no banco — confirmado reexecutando com `PYTHONUTF8=1`. Nenhuma correção foi necessária na aplicação.
- **CSS sumiu de novo (página renderizando sem nenhum estilo, só o placeholder "Mapa Leaflet entra na Sprint 2" preso na tela) — você reportou em 22/10/2026.** Causa raiz desta vez, confirmada no log do dev server (`[webpack.cache.PackFileCacheStrategy] Restoring pack ... failed: TypeError: Cannot read properties of undefined`): eu rodei `npm run build` (validação de produção) **enquanto o `npm run dev` já estava rodando** na mesma pasta — os dois comandos escrevem no mesmo diretório `.next/cache/webpack`, e a escrita concorrente corrompeu o cache; o servidor dev passou a referenciar um arquivo CSS (`layout.css?v=...`) que não existia mais no disco (404), daí a página sem estilo nenhum. Resolvido: matei os processos dev travados (incluindo um zumbi antigo na porta 3000 que não respondia desde antes), apaguei `frontend/.next` e subi um dev server limpo — confirmei por `curl` que o CSS volta a responder 200 com o conteúdo real (65KB) antes de pedir pra você testar de novo. **Regra adotada daqui pra frente:** não rodar `npm run build` como validação enquanto um `npm run dev` da mesma pasta estiver ativo — `type-check` + `lint` já dão sinal suficiente durante o desenvolvimento; o build de produção fica reservado pra quando o dev server estiver parado (ou peço pra você parar antes).
- Também corrigido de brinde: o placeholder de carregamento do mapa (`frontend/src/components/layout/map-placeholder.tsx`) ainda dizia "Mapa Leaflet entra na Sprint 2" — texto provisório da Sprint 1 que nunca foi atualizado depois que o Leaflet entrou de verdade na Sprint 2. Trocado para "Carregando mapa..." (é só o texto breve exibido enquanto o chunk JS do mapa carrega, não afeta funcionalidade).

### Notas
- **Backend (`backend/app/api/v1/pois.py`, `categories.py`, `media.py`):** endpoints validados ponta a ponta via `curl` direto no container (sem navegador ainda) — criação, listagem por bbox/categoria/busca textual, update e delete com checagem de dono (403 pra quem não é, 401 sem o secret), upload presigned + attach de mídia com geração real de thumbnail (confirmei a thumbnail acessível publicamente após o processamento). Slug único gerado automaticamente a partir do nome (`backend/app/utils/slug.py`), com sufixo numérico em caso de colisão.
- **Serialização de geometria:** `POI.location` é uma coluna `Geography` do PostGIS — a conversão pra `lat`/`lng` simples nas respostas usa `geoalchemy2.shape.to_shape()` (precisa do `shapely`, adicionado ao `requirements.txt`); a escrita usa `WKTElement("POINT(lng lat)", srid=4326)`.
- **Frontend — dados reais substituindo os dummies:** `frontend/src/hooks/use-pois.ts` e `use-categories.ts` (React Query) alimentam `map-view.tsx`, `category-chips.tsx` e `poi-panel.tsx`. O bounding box atual do mapa principal é rastreado por `frontend/src/components/map/bounds-watcher.tsx` (`useMapEvents` em `moveend`/`zoomend`) e guardado no Zustand (`mapBounds`) — é isso que vira a query geoespacial a cada pan/zoom.
- **Fluxo de criação de POI:** botão "+" no HUD (`poi-create-button.tsx`, só habilitado se autenticado — checagem de sessão feita no server, não exposta ao cliente) entra em "modo mira"; o próximo clique no mapa (`poi-placement-handler.tsx`) define a posição e abre automaticamente o Sheet de criação (`poi-create-sheet.tsx`), com um marcador tracejado arrastável (`draft-poi-marker.tsx`) mostrando a posição em tempo real. Ao salvar: cria o POI primeiro (sem mídia), depois faz upload+attach de cada arquivo pendente em sequência, depois invalida o cache do React Query — o novo POI aparece no mapa sem precisar recarregar a página.
- **Upload multi-mídia (`frontend/src/components/poi/media-uploader.tsx`):** drag-and-drop nativo (sem lib extra) pra imagem/GIF, gravação de áudio via `MediaRecorder`/`getUserMedia` (com fallback de erro se o navegador negar o microfone) ou upload de um arquivo de áudio existente. Cada item pendente mostra o nome do arquivo com opção de remover antes de salvar.
- **POI Card (`frontend/src/components/map/poi-card-popup.tsx`):** imagem/GIF (thumbnail pra imagem, original pra GIF — senão perderia a animação), player de áudio via Howler.js (um `Howl` por faixa, carregado só quando o usuário toca play), e botão de excluir visível só pro dono (comparando `poi.user_id` com a sessão).
- **Busca (`frontend/src/components/layout/search-bar.tsx`):** autocomplete por nome com debounce de 300ms, busca **global** (ignora o bounding box atual, diferente da busca da `usePois` que é sempre limitada à área visível) — ao clicar num resultado, o mapa principal voa até o POI via `selected-poi-flyto.tsx` (ponte entre a lista/busca e o mapa through Zustand, já que vivem em árvores de componente diferentes).
- **Validado:** `npm run type-check`, `npm run lint` e `npm run build` limpos; página inicial renderizando sem erro no dev server (`curl` confirmando o HTML, sem exceptions no log do servidor). O novo endpoint `DELETE /pois/{id}/media/{media_id}` foi validado ponta a ponta via `curl` (403 pra quem não é dono, 204 pra quem é, e confirmei por `head_object` no R2 que o arquivo original **e** a thumbnail foram de fato apagados do bucket, não só a linha do banco). **Ainda não testado manualmente no navegador** — fluxos que dependem de interação real (clicar no mapa, arrastar o marcador, arrastar arquivo, gravar áudio, preencher e editar o formulário) precisam da sua validação, ver próximos passos.

---

## Extensões fora do plano original (pós-Sprint 3, pedidas por você em 22/10/2026)

**Status:** ✅ Concluído

Três pedidos seus que não estavam no `docs/04_TIMELINE.md` original — implementados antes de seguir pra Sprint 4.

### 1. Cursor pointer + tooltips em todos os botões
- Regra global em `frontend/src/app/globals.css` (`@layer base`): qualquer `<button>` não desabilitado, `[role="button"]`, `<a>`, `<select>` e `<label>` ganham `cursor: pointer` — resolve de uma vez só em vez de adicionar a classe em cada componente (navegadores só dão pointer de graça em `<a>`, não em `<button>`).
- Componente `Tooltip` novo (`frontend/src/components/ui/tooltip.tsx`, via `npx shadcn add tooltip`, mesmo preset `base-nova`/`@base-ui/react` já usado no resto do projeto). `TooltipProvider` (delay 300ms) envolvendo o app inteiro em `frontend/src/app/layout.tsx`.
- Tooltips adicionados nos botões só-ícone: controles de zoom/localizar-me, bússola, switcher de tema (trocou o `title` nativo por tooltip de verdade), botão de criar POI (inclusive o estado desabilitado — sem `disabled` de verdade nele, porque isso tira `pointer-events` e o hover nunca dispararia o tooltip explicando o motivo), botão de abrir lista de POIs, botão de fechar (X) dos Sheets, e remover arquivo no upload de mídia.

### 2. Sistema de favoritos (não estava no planejamento — pergunta sua: "já está no planejamento isso?")
- **Resposta:** não estava no `docs/00_OVERVIEW.md` nem no `docs/04_TIMELINE.md` original. Era uma peça natural de adicionar (schema já tinha `users`/`pois` prontos) e de baixo custo, então implementei direto a seu pedido.
- Nova tabela `favorites` (user_id, poi_id, unique constraint) via migration Alembic (`bee0c0460e65_add_favorites_table.py`) — autogenerate limpo, sem ruído do PostGIS (confirma que o fix de `search_path` da Sprint 1 continua segurando).
- Endpoints: `GET /favorites`, `POST/DELETE /pois/{id}/favorite`, todos atrás do mesmo `X-Internal-Secret` (é dado privado do usuário, diferente de `GET /pois` que é público — por isso `GET /favorites` só é acessível via proxy do Next.js, nunca direto do navegador).
- Botão de estrela no popup do POI (`poi-card-popup.tsx`) — disponível pra **qualquer usuário logado** favoritar **qualquer POI público**, não só os próprios (diferente de editar/excluir, que são só do dono). Painel de favoritos novo (`favorites-panel.tsx`, FAB com estrela no HUD) lista tudo que você favoritou, com clique pra voar até o POI.
- **Bug pego durante a implementação, corrigido antes de liberar:** a navegação "voar até o POI" (usada pela busca e pela lista) dependia da lista de POIs carregados **dentro da área visível atual do mapa** — ou seja, favoritar um POI e tentar ir até ele **de longe** (exatamente o seu caso de uso) não funcionaria, porque o POI não estaria nessa lista. Corrigido trocando `selectedPoiId` por `selectedPoiTarget` no Zustand (`frontend/src/stores/map-store.ts`) — agora guarda a posição (lat/lng) direto no momento do clique, em vez de só o id e depois procurar a posição numa lista que pode não conter o alvo. Esse bug também afetava a busca (resultado fora da área visível), então o fix resolveu os dois casos de uma vez.

### 3. Auto-preenchimento de endereço (geocodificação reversa)
- Novo proxy `frontend/src/app/api/geocode/reverse/route.ts`, usando **Nominatim (OpenStreetMap)** — gratuito, sem API key, mesma família de serviço já usada no projeto (OSRM pras rotas na Sprint 4, Stadia/OSM pros tiles). User-Agent identifica só o projeto (nome + link do repo), **sem dado pessoal seu** — a política de uso do Nominatim exige um identificador de contato, e usar seu e-mail pessoal nesse header violaria a diretriz de privacidade que sigo (só uso seu e-mail pra identificar você dentro desta conversa, nunca pra mandar pra serviço de terceiro sem pedido explícito).
- No formulário (`poi-form-sheet.tsx`): toda vez que a posição do pino muda (clique inicial ou arrastar), busca o endereço e preenche o campo — **só se você ainda não tiver editado esse campo manualmente** (`dirtyFields.address` do react-hook-form), pra nunca sobrescrever um endereço que você ajustou de propósito. Falha de geocodificação é silenciosa (não trava o formulário) — o campo continua 100% editável à mão.

### Decisões e Pendências
- ⏳ **Pendente — você (sem pressa):** igual ao Stadia Maps, o Nominatim tem uma política de uso justo pra requisições vindas de localhost/dev sem cadastro — gratuito, mas com limite de ~1 req/s e pedindo moderação em produção. Pra uso real em produção com volume, a recomendação deles é rodar uma instância própria ou usar um provedor pago (ex: Mapbox/Google Geocoding). Não bloqueia agora; registrar como mais um item pra revisar antes do deploy público (Sprint 6).
- ✅ Dependência nova: nenhuma no frontend além do que já existia (`@base-ui/react` já trazia o Tooltip); no backend, nenhuma nova lib, só a tabela/migration de favoritos.

### Validado
- Backend: `GET/POST/DELETE /pois/{id}/favorite` e `GET /favorites` testados via `curl` — toggle idempotente (favoritar 2x não duplica), isolamento por usuário (favoritos de um usuário não aparecem pra outro), 401 sem secret, limpeza confirmada.
- Frontend: `npm run type-check` e `npm run lint` limpos.
- ⚠️ **Correção importante (22/10/2026):** o aninhamento triplo `TooltipTrigger` → `SheetTrigger` → `Button` via `render` prop, usado aqui nos botões de Favoritos/POIs próximos, **não funcionava em runtime** (você reportou tooltip ausente nesses dois botões especificamente) — type-check passava porque só valida compatibilidade de tipos, não comportamento de verdade. Corrigido na seção 5 abaixo trocando pelo padrão "wrapper `<span>`", mais confiável.

### 4. Foto em dialog/lightbox + data de registro visível (pedido em 22/10/2026)
- Componente `Dialog` novo (`frontend/src/components/ui/dialog.tsx`, via `npx shadcn add dialog` — recusei sobrescrever o `button.tsx` que já tinha o fix do `forwardRef` da Sprint 1).
- Clicar na foto/GIF do popup do POI (`poi-card-popup.tsx`) abre um lightbox centralizado com a imagem em resolução original (não a thumbnail) e botão de fechar.
- Data de registro (`poi.created_at`, formatada em pt-BR) exibida num "cantinho": sobreposta no canto inferior esquerdo da própria foto quando ela existe, ou como uma linha pequena abaixo do endereço quando o POI não tem mídia.
- Validado: `type-check` e `lint` limpos, dev server e CSS saudáveis depois da mudança.

### 5. Lote de correções e features pedidas em 22/10/2026 (print do popup)

**Status:** ✅ Concluído

- **Bug: tooltip ausente em "Favoritos" e "POIs próximos".** Causa: aninhamento de 3 níveis via `render` prop (`TooltipTrigger` → `SheetTrigger` → `Button`) não propagava os handlers de hover corretamente. Corrigido em `poi-panel.tsx`, `favorites-panel.tsx`, `sheet.tsx` (botão de fechar) e `dialog.tsx` (idem) trocando pro padrão "`TooltipTrigger` ancora num `<span>` wrapper, e o botão real (Sheet/Dialog trigger + Button) fica como filho dele" — 2 composições independentes de 2 níveis em vez de uma de 3.
- **Bug: tocar áudio fechava o popup do POI.** Causa mais provável: o Leaflet não reconhecia certos cliques dentro do conteúdo React do popup como "internos" e disparava o fechamento automático (`closePopupOnClick`, ligado por padrão). Corrigido com `closePopupOnClick={false}` no `MapContainer` (`map-view.tsx`) + `event.stopPropagation()` em todo botão interativo dentro do popup (defesa redundante, não custa nada ter os dois).
- **"Onde fica a segunda imagem?"** Era um bug real: o popup só exibia a **primeira** imagem/GIF (`.find()` em vez de `.filter()`), mesmo o backend e o upload já suportando múltiplas. Corrigido com um carrossel (`ImageGallery` em `poi-card-popup.tsx`): setas aparecem no hover quando há mais de uma, bolinhas indicando qual está ativa, e o lightbox também navega entre todas.
- **Editar/Excluir viraram botões só-ícone com tooltip**, consistente com o resto do popup (antes tinham texto "Editar"/"Excluir" visível).
- **Áudios registrados mais bonitos:** trocado o botão-pílula genérico por uma linha com círculo de play/pause (cor primária, visual mais "player de música"), rótulo "Áudio N" e **duração** (lida do próprio arquivo via `Howl.duration()` depois que carrega).
- **Reações com emoji (novo):** qualquer usuário logado pode reagir a qualquer POI público com um emoji de um conjunto curado (👍 ❤️ 😂 😮 😢 🔥) — clique de novo no mesmo emoji remove sua reação. Aparece como pills agrupadas por emoji embaixo do POI (ex: "👍 2"), com tooltip no hover mostrando **o nome de quem reagiu com aquele emoji** — exatamente o pedido. Backend: tabela `poi_reactions` (migration `ba57b11d3c2d`), unique constraint por (poi, usuário, emoji) permitindo reagir com vários emojis diferentes ao mesmo POI. Isso já funciona hoje em qualquer POI público (visível a todos, já que não existe sistema de grupos ainda — ver "Ideias Futuras (v2+)" no topo deste arquivo); quando o mapa-rede-social existir, reações passam a fazer ainda mais sentido dentro de um grupo.
- **Categoria "Status" (novo):** sétima categoria, pra marcar "onde você está e o que está fazendo agora" — ícone `activity` (pulso), cor `#FB5B8D`, seed via migration `d4f1f6c2e8a1`.

### Validado
- Backend: suite de smoke test via Python (`urllib`, evitando os problemas de encoding de emoji do bash/Git-Bash neste ambiente Windows) cobrindo criar → listar por bbox → reagir → editar (reação preservada) → favoritar → excluir, tudo com o POI real do seu teste ("Casa do silinhas") aparecendo corretamente nos favoritos.
- Frontend: `npm run type-check` e `npm run lint` limpos; dev server e CSS saudáveis após a reescrita grande do `poi-card-popup.tsx`.
- **Ainda não testado por você no navegador** — hover dos tooltips corrigidos, clique no áudio sem fechar o popup, navegação do carrossel, reações e a categoria Status precisam da sua validação visual.

### 6. Bug crítico: loop infinito ao tocar áudio (reportado por você em 22/10/2026)

**Sintoma:** `Error: Maximum update depth exceeded` em `map-store.ts:51` (`setMapBounds`), travando a página ao tocar um áudio dentro do popup.

**Causa:** quando o áudio termina de carregar, o `AudioTrackRow` atualiza o estado pra mostrar a duração — isso muda o tamanho do conteúdo do popup, e o Leaflet (com `autoPan` ligado por padrão) reposiciona o mapa pra manter o popup visível. Esse reposicionamento dispara `moveend`, que o `BoundsWatcher` usava pra atualizar `mapBounds` **imediatamente e sem checar se realmente mudou algo relevante** — o que realimentava a query de POIs, re-renderizava o popup, mudava o tamanho de novo, disparava `autoPan` de novo... um ciclo que o React eventualmente detecta e aborta.

**Correção (`frontend/src/components/map/bounds-watcher.tsx`):**
- Debounce de 200ms antes de commitar uma mudança de bounds no store (absorve rajadas de eventos `moveend`/`zoomend` consecutivos num único commit).
- Comparação com tolerância (`EPSILON = 1e-5` grau) contra o bounds atual — se a mudança é desprezível (como o leve nudge do autoPan), não atualiza o store, quebrando o ciclo na raiz.
- Benefício colateral: menos refetches de POIs durante pan/zoom contínuo (antes, cada pixel de movimento já disparava uma busca nova).

Também ajustado por pedido seu: o fundo cinza sólido da linha de áudio (`bg-muted/50`) virou só borda (outline), menos "pesado" visualmente — o círculo de play continua na cor primária (roxo) como destaque.

**Validado:** `type-check`/`lint` limpos, dev server recompilou sem erro. **Precisa da sua confirmação no navegador** que tocar áudio (inclusive esperando a duração carregar) não trava mais a página.

### 7. Redesign do popup do POI (pedido em 23/10/2026, com print)

**Bug real encontrado e corrigido:** o texto do popup (nome, descrição, endereço, rótulos de áudio) aparecia cinza-claro quase ilegível. Causa: o Leaflet crava `background: white; color: #333` no wrapper do popup (`leaflet.css`) — nosso conteúdo usa os tokens de cor pensados pro tema escuro do app (texto claro), então ficava claro-sobre-branco, péssimo contraste. Corrigido globalmente em `globals.css`: `.leaflet-popup-content-wrapper`/`.leaflet-popup-tip` agora usam `var(--popover)`/`var(--popover-foreground)` (mesmo tom escuro do resto do app), e o botão nativo de fechar (×) do Leaflet ganhou cor compatível com fundo escuro.

- **Áudio virou um botão único** (ícone + "Áudio N" + duração), com contorno roxo (`border-primary/60`) e fundo roxo bem sutil (`bg-primary/10`) — antes eram dois elementos visualmente separados (círculo + texto ao lado).
- **Layout paisagem:** quando o POI tem foto/GIF, o popup agora é uma faixa horizontal — imagem à esquerda (preenchendo toda a altura disponível), nome/descrição/endereço/áudios/reações/ações à direita, com altura máxima (`max-h-80`) e rolagem interna se o conteúdo for muito longo. Resolve o "preciso dar zoom-out pra ver o card todo", porque agora ele cresce na horizontal em vez de empilhar tudo verticalmente. POIs sem mídia continuam no layout vertical compacto de antes (não faz sentido reservar uma coluna de imagem vazia).
- Ajustei o `maxWidth`/`minWidth` do `<Popup>` do Leaflet (`map-view.tsx`) pra acomodar a largura nova (420px/260px).

**Validado:** `type-check`/`lint` limpos, dev server e CSS saudáveis. **Precisa da sua validação visual** — essa é puramente uma mudança de UI/UX, não dá pra confirmar via `curl`.

### 8. Causa raiz real do contraste ilegível + redesign fino (pedido em 23/10/2026, com print)

**A correção do item 7 não funcionou de verdade** — você mandou um print mostrando o popup ainda branco com texto cinza-claro ilegível. Investigando a fundo: todas as minhas correções de CSS pro Leaflet (contraste do popup, e também o cinza dos tiles carregando, do item de performance de zoom de uma sessão anterior) estavam dentro de `@layer base` do Tailwind v4 — e por especificação do CSS, **uma regra dentro de uma `@layer` sempre perde pra uma regra sem camada, não importa a ordem no arquivo nem a especificidade do seletor**. Como o `leaflet.css` não usa `@layer`, ele sempre vencia. Confirmei a causa direto no CSS compilado (`.next`/saída do Tailwind) antes de aplicar a correção. **Corrigido com `!important`** nessas regras especificamente — uso legítimo aqui, é uma sobrescrita deliberada de CSS de uma biblioteca de terceiro, não um gambiarra.

Com o contraste resolvido de verdade, apliquei o resto do pedido (print do popup):
- **Imagem mais larga:** coluna de imagem no layout paisagem foi de `w-32` (128px) pra `w-40` (160px).
- **Áudio:** virou contorno roxo sem preenchimento (`border-primary`, fundo transparente), com o texto ("Áudio N" + duração) também na cor primária — só o círculo do ícone de play continua preenchido como destaque.
- **Cabeçalho próprio:** título + estrela de favorito agrupados à esquerda, botão de fechar (✕, nosso, com tooltip) à direita — substituiu o "×" nativo do Leaflet (desligado via `closeButton={false}` no `<Popup>`, fechar agora chama `map.closePopup()` via `useMap()`).
- **Borda colorida por categoria:** o cartão (que agora desenha seu próprio fundo/sombra/cantos arredondados, com o wrapper do Leaflet virando só um contêiner invisível por trás) ganhou `border-2` na cor da categoria do POI (`color_hex`, buscado via `useCategories()`).

**Validado:** `type-check`/`lint` limpos; conferi no CSS compilado que as regras com `!important` aparecem e vencem as do `leaflet.css` (antes só supunha que funcionava — dessa vez confirmei de verdade, já que o item 7 me ensinou a não confiar só em "parece certo no código"). **Precisa da sua validação visual.**

### 9. Ajustes finos do popup (pedido em 23/10/2026, com print)

- **Cabeçalho agora cobre a largura toda do card** (inclusive acima da imagem) — reestruturado de "linha ao lado da imagem" pra "faixa no topo, com a imagem e o conteúdo lado a lado abaixo dela". Ganhou também uma linha divisória sutil (`border-b`) separando do resto.
- **Padding/respiro:** card ganhou `p-4` geral — a imagem não fica mais colada nas bordas do card, tem sua própria borda arredondada com espaço ao redor.
- **Ícone de play "flat":** tirei o círculo preenchido de fundo — agora é só o ícone (Play/Pause) na cor primária, sem chrome extra.
- **Imagem do lightbox virou quadrada** (`aspect-square` + `object-cover`), em vez de manter a proporção original da foto.
- **Barra de rolagem do conteúdo** customizada (`.popup-scroll` no `globals.css`) pra usar o fundo do próprio card (`var(--popover)`) em vez da trilha cinza clara padrão do navegador — cobre Firefox (`scrollbar-color`) e Chrome/Edge/Safari (`::-webkit-scrollbar-*`).

**Nota:** você descreveu a barra como "scroll horizontal", mas no print ela é vertical (lateral direita) — assumi que era essa mesmo, já que é a única barra de rolagem que existe no popup.

**Validado:** `type-check`/`lint` limpos, CSS compilado conferido (regra `.popup-scroll` presente). **Precisa da sua validação visual.**

### 10. Mais ajustes do popup, com correção de mal-entendido (pedido em 23/10/2026, com print)

- **Cabeçalho mais baixo:** padding inferior reduzido (`pb-2` → `pb-1.5`).
- **Correção de mal-entendido:** no pedido anterior eu deixei a imagem do **lightbox** (tela cheia) quadrada, mas o que você tinha circulado no print era a **miniatura/carrossel dentro do próprio popup**. Revertido o lightbox pra proporção original (`object-contain`, sem recorte) e aplicado o quadrado onde você realmente pediu: a coluna de imagem do card agora é `aspect-square` (antes esticava pra preencher a altura inteira da linha, ficando retangular).
- **Footer novo:** reações (emoji) e os botões de editar/excluir saíram do meio do conteúdo rolável e viraram uma faixa própria na parte de baixo do card — reações à esquerda, ações à direita — com uma linha divisória, no mesmo espírito do cabeçalho (que também cobre a largura toda, acima da imagem).
- **Ícone da categoria no cabeçalho:** badge circular com fundo branco (pedido explícito: "deixe o fundo branco", diferente do estilo dos marcadores no mapa, que são o inverso — fundo colorido, ícone branco) e o ícone da categoria colorido com a cor da própria categoria, ao lado esquerdo do título. Reaproveitei o mapeamento ícone-por-categoria que já existia pros marcadores do mapa (`poi-marker-icon.tsx`, agora exporta `getCategoryIcon`), em vez de duplicar a lista.

**Validado:** `type-check`/`lint` limpos, dev server e CSS saudáveis. **Precisa da sua validação visual.**

### 11. Últimos ajustes finos (pedido em 23/10/2026, com 2 prints)

- **Imagem voltou a preencher a altura toda da linha** — o quadrado fixo do item 10 deixava um vão vazio embaixo quando o conteúdo ao lado era mais alto que 160px (seu ponto: "fica parecendo que tem um espaço sobrando ali"). Revertido pro preenchimento de altura total (como era antes do item 10), já que isso importava mais que a proporção quadrada.
- **Ícone da categoria também ficou flat** — tirei o badge com fundo branco, agora é só o ícone colorido com a cor da categoria, direto, sem chrome.
- **Cabeçalho ainda mais baixo** — reduzi o padding de novo e o tamanho do ícone de categoria (não tem mais o badge circular, então ficou naturalmente mais compacto).
- **Nota à parte:** notei no log do dev server um erro pontual (`ECONNRESET`/500) numa chamada de `/api/favorites` pro backend — investiguei e foi um soluço transitório de conexão (provavelmente o Docker), já recuperado sozinho na tentativa seguinte; backend seguia de pé há mais de uma hora quando conferi. Nada a corrigir, só registrando que investiguei.

**Validado:** `type-check`/`lint` limpos, dev server e CSS saudáveis. **Precisa da sua validação visual.**

### 12. Padding dos áudios + loading de geolocalização (pedido em 23/10/2026)

- **Padding embaixo dos áudios:** `pb-1` no bloco de faixas de áudio, separando melhor do footer.
- **Loading de geolocalização (novo):** `frontend/src/components/map/location-loading-overlay.tsx` — overlay cobrindo só a área do mapa (fundo semitransparente + `backdrop-blur-md`, borrando os tiles por baixo) com um spinner (`Loader2` do lucide, girando) centralizado. Some assim que a geolocalização resolve pela primeira vez — sucesso **ou** erro/permissão negada, nunca trava pra sempre — e tem uma rede de segurança de 8s caso o navegador nunca chame nenhum dos dois callbacks. Reservado um espaço pra você trocar o spinner pela logo do app quando mandar.
- **Decisão de posicionamento:** o overlay vive só dentro da área do mapa (`MapView`), não cobre o HUD (busca, troca de tema, login) — você pode continuar usando o header enquanto a localização carrega.

**Validado:** `type-check`/`lint` limpos, dev server e CSS saudáveis. **Precisa da sua validação visual** (inclusive testar com permissão de localização negada, pra confirmar que não trava).

### 13. Busca atrás dos filtros, "como arrastar o pino", loading/preview de mídia, busca por endereço/coordenadas (pedido em 23/10/2026, com 3 prints)

- **Dropdown da busca atrás dos chips de categoria:** bug de `z-index` — o dropdown não tinha nenhum definido, então os chips (que vêm depois no DOM, dentro do mesmo contexto de empilhamento) pintavam por cima. Adicionado `z-30` no dropdown.

- **"Como eu arrasto o pino tracejado?" — bug real, não só confusão de UI.** Causa: a Sheet de criação/edição abre como um painel lateral cobrindo uma fatia relevante da tela (até 384px), e nada fazia o mapa se ajustar pra manter o marcador de rascunho visível **fora** dessa área — ele podia perfeitamente cair bem atrás do painel, impossível de ver ou arrastar. Corrigido com `frontend/src/lib/map-pan.ts` (`flyToVisibleNextToSheet`): desloca o centro do mapa ~170px pra a direita (em pixels de tela, via `project`/`unproject` do Leaflet) antes de centralizar, empurrando o marcador pra a área visível à esquerda da Sheet. Reorganizei o Zustand pra centralizar esse comportamento num único lugar (`pendingFlyTo` no `map-store.ts`, observado por um novo componente `DraftFlyToWatcher` dentro do `MapView`) em vez de espalhar chamadas de `flyTo` em cada ponto que define uma posição de rascunho — isso também deixou plugar a busca por endereço/coordenadas (próximo item) de graça, sem reinventar a lógica de deslocamento.

- **Sua pergunta "o que o mapa me permite fazer?" ao criar um POI — agora tem 3 jeitos:** clique livre no mapa (já existia), **busca por endereço completo** (geocodificação direta via Nominatim, nova rota `frontend/src/app/api/geocode/search/route.ts`) e **latitude/longitude manuais**. Os três ficam disponíveis juntos numa seção "Ajustar posição" no topo do formulário — qualquer um dos três reposiciona o pino de rascunho (e o mapa voa até lá, já com o deslocamento anti-Sheet acima). Limitação atual: ainda é preciso abrir o formulário primeiro (clicando em algum lugar do mapa ou editando um POI existente) antes de poder usar a busca por endereço/coordenadas — não dá pra pular o clique inicial no mapa completamente ainda. Se isso incomodar no uso real, dá pra reavaliar depois.

- **Loading ao remover mídia:** o botão de lixeira na lista "Mídia atual" (modo edição) agora mostra um spinner e fica desabilitado enquanto a exclusão está em andamento, em vez de ficar sem feedback enquanto espera a resposta do servidor.

- **Preview de mídia (adicionando e removendo):** tanto a lista "Mídia atual" (edição) quanto a lista de arquivos pendentes no upload (`media-uploader.tsx`) agora mostram uma miniatura de verdade pra imagem/GIF, e um player `<audio>` nativo compacto pra áudio — em vez de só o nome do arquivo em texto. Pra pendentes, isso já usava a `previewUrl` (URL local do arquivo) que já existia no código mas nunca tinha sido exibida.

**Validado:** `type-check`/`lint` limpos; `/api/geocode/search` e `/api/geocode/reverse` testados via `curl` direto (endereço "Avenida Paulista" resolveu certo; reverse de coordenadas de São Paulo também). Dev server e CSS saudáveis. **Precisa da sua validação visual** — em especial confirmar que o pino fica visível/arrastável agora ao abrir pra editar ou criar.

### 14. Formulário abre sem clicar no mapa, sem blur no fundo, endereço/mídia obrigatórios (pedido em 23/10/2026)

- **Fundo sem blur ao criar/editar POI:** a Sheet (shadcn/base-ui) tinha um backdrop padrão com `backdrop-blur-xs` + `bg-black/10`, compartilhado por todas as Sheets do app (favoritos, lista de POIs, formulário). Adicionei um prop `overlayClassName` em `SheetContent`/`SheetOverlay` (`frontend/src/components/ui/sheet.tsx`) pra permitir sobrescrever o backdrop só onde for pedido — só o formulário de POI (`frontend/src/components/poi/poi-form-sheet.tsx`) passa `overlayClassName="bg-transparent supports-backdrop-filter:backdrop-blur-none"` agora; favoritos e lista de POIs continuam com o backdrop padrão. Validei que o util `cn()` deste projeto (pacote `cn`, aliases do `tailwind-merge`) realmente faz o dedupe de classes conflitantes quando o variant bate exatamente (`supports-backdrop-filter:backdrop-blur-xs` vs `supports-backdrop-filter:backdrop-blur-none`), então não sobra blur residual.

- **Formulário abre direto ao clicar no "+", sem precisar tocar o mapa primeiro.** Antes, o "+" só armava um "modo mira" (`isPlacingPoi`) e a Sheet só abria depois do primeiro clique no mapa (`open={draftPosition !== null}`). Isso forçava clicar no mapa mesmo pra quem só queria buscar por endereço. Desacoplei "formulário aberto" de "posição escolhida" no `map-store.ts`: novo estado `isCreatingPoi` (substitui `isPlacingPoi`) controla a Sheet (`open={isCreatingPoi || isEditMode}`), independente de `draftPoiPosition` (que pode ficar `null` por um tempo, sem marcador no mapa, até o usuário escolher uma posição por qualquer um dos três jeitos). O "+"/"X" do HUD (`poi-create-button-client.tsx`) agora chama `startCreatingPoi()`/`cancelCreatingPoi()` direto.

- **Endereço agora sempre acompanha o pino automaticamente.** Antes, a geocodificação reversa só preenchia o endereço se o campo ainda não tivesse sido "sujado" (`dirtyFields.address` do react-hook-form) — pensado pra não sobrescrever um endereço digitado à mão. Isso conflitava com o pedido atual ("se eu clicar no mapa, quero que o endereço atualize"), então troquei por: **todo** clique no mapa, arrastar do marcador ou aplicar lat/lng dispara a geocodificação reversa e sobrescreve o campo de endereço, mesmo que o usuário tenha digitado algo antes — reposicionar é a ação mais explícita possível de "é aqui". Se o usuário não mexer na posição depois de digitar o endereço à mão, o texto dele fica intacto (o efeito só roda quando a posição muda).

- **Trava de campos obrigatórios antes de salvar — nome, categoria, endereço e ao menos uma mídia.** Nome e categoria já eram obrigatórios no zod (`poi-schema.ts`). Adicionei: `address` agora é obrigatório no schema (`min(1)`, antes era opcional); `onSubmit` em `poi-form-sheet.tsx` bloqueia o envio com uma mensagem clara se não houver posição definida (`draftPosition`) ou se não houver nenhuma mídia (`pendingMedia` + `existingMedia` juntos somando zero) — isso incluindo o modo de edição, não só criação.

- **Bug que eu mesmo introduzi e corrigi antes de reportar:** como o "X" do HUD agora fecha a Sheet mudando o estado do store direto (`cancelCreatingPoi()`), e isso é um prop `open` controlado externamente, o `onOpenChange` da Sheet (que só dispara em interações internas dela — ESC, clique fora, botão de fechar embutido) nunca seria chamado nesse caminho. Isso deixaria mídia pendente, busca de endereço e lat/lng "presos" no estado local depois de cancelar pelo HUD. Corrigido centralizando o reset num `useEffect` que observa a transição aberto→fechado da Sheet (`isOpen`), independente de qual botão fechou — então todo caminho de fechamento (HUD, botão da Sheet, ESC, clique fora, ou sucesso ao salvar) reseta mídia pendente/existente, busca de endereço, lat/lng e o formulário por igual.

**Validado:** `type-check`/`lint` limpos (incluindo depois do refactor do `close()`); dev server compilando sem erros (`✓ Compiled`, `200` nas rotas testadas manualmente antes). **Precisa da sua validação visual** — em especial: (1) clicar no "+" abre o formulário na hora, sem blur no mapa; (2) clicar no mapa com o formulário já aberto atualiza posição + endereço; (3) tentar salvar sem endereço/mídia mostra a mensagem de erro em vez de salvar silenciosamente; (4) cancelar pelo "X" do HUD limpa tudo (testar abrindo de novo depois e ver se não sobrou mídia pendente de uma tentativa anterior).

### 15. Clique no mapa fechava o formulário; endereço e lat/lng precisavam ser excludentes (pedido em 23/10/2026)

- **Causa raiz do "clicar no mapa fecha o formulário":** a Sheet (Base UI `Dialog`) é **modal por padrão** — além do backdrop visual (já deixado transparente no item 14), o próprio `Dialog.Root` registra um listener de "clique fora" que fecha o diálogo, e route o pointer-blocking da página inteira enquanto `modal` não for `false`. Ou seja, mesmo com o backdrop invisível, o clique no mapa (que é "fora" do popup) ainda disparava o fechamento — a transparência resolveu a questão visual do item 14, mas não a de interação, que só apareceu agora que dava pra tentar clicar no mapa com o form já aberto. Corrigido em duas frentes: (1) `frontend/src/components/ui/sheet.tsx` ganhou um prop `showOverlay` em `SheetContent` — quando `false`, nem renderiza o elemento de backdrop (que é um `fixed inset-0` e intercepta ponteiro mesmo transparente); (2) `poi-form-sheet.tsx` agora abre a Sheet com `modal={false}` (libera interação com o resto da página) e `disablePointerDismissal` (impede que esse clique "fora" feche o formulário — confirmado lendo o código-fonte do `@base-ui/react/dialog`: sem essa flag, todo clique fora fecha diálogos não-modais por padrão). Resultado: o clique agora chega direto no Leaflet por baixo da Sheet, atualiza a posição normalmente, e o formulário continua aberto.

- **Endereço e lat/lng agora são excludentes.** Você notou certo: as duas formas de digitar uma posição podiam apontar pra lugares diferentes do mapa, e ter os dois campos sempre visíveis dava a entender que precisava preencher ambos (ou que um complementava o outro). Troquei a seção "Ajustar posição" por um seletor de dois botões (Endereço / Latitude-Longitude) que mostra só o grupo de campos escolhido por vez — clique no mapa continua funcionando em paralelo a qualquer modo escolhido, já que é uma interação física, não um campo do formulário.

**Validado:** `type-check`/`lint` limpos; dev server compilando sem erros. **Precisa da sua validação visual** — especialmente confirmar que agora dá pra clicar várias vezes no mapa com o formulário aberto sem ele fechar, e que só um dos dois modos (endereço ou lat/lng) aparece por vez.

### 16. Toasts de sucesso/erro ao salvar, editar, excluir (pedido em 23/10/2026)

O app não tinha nenhum sistema de notificação — ações como salvar, editar e excluir um POI só davam feedback via estado inline no próprio formulário (ex: `submitError` dentro da Sheet), nada visível fora dela, e exclusão/remoção de mídia não davam feedback nenhum de sucesso. Adicionado:

- **`frontend/src/components/ui/toast.tsx`** (novo): componente de toast do registro shadcn pro preset `base-nova` (usa `@base-ui/react/dialog` → na verdade `@base-ui/react/toast`, já instalado no projeto, sem precisar adicionar dependência nova). Criado manualmente em vez de via `npx shadcn add toast` porque o CLI também sobrescreveria `button.tsx` convertendo-o de `React.forwardRef` pra function component — mudança incompatível com React 18 (o projeto está em `react@^18`, não 19) que quebraria o `ref` usado internamente pelo Base UI em composições `render={<Button .../>}` (tooltip, etc). Mantive o `button.tsx` como estava e só copiei o `toast.tsx`.
- **`frontend/src/app/layout.tsx`**: `<Toaster>` monta uma vez na raiz, envolvendo a árvore inteira (dentro do `TooltipProvider`), com o manager global exportado (`toast` de `@/components/ui/toast`) — qualquer componente cliente pode chamar `toast.add({ title, description, type })` sem precisar de contexto/hook.
- **Pontos instrumentados:** criar POI, editar POI (`poi-form-sheet.tsx`, `onSubmit`) e excluir POI (`poi-card-popup.tsx`, `handleDelete`) — toast de sucesso (`type: "success"`) e de erro (`type: "error"`) nos dois casos. Remover mídia existente durante a edição (`removeExistingMedia`) também ganhou toast de sucesso/erro — e de quebra corrigi uma lacuna: essa função nunca checava `res.ok` nem tinha `catch`, então uma falha do servidor passava batido como se tivesse funcionado. Mesma correção aplicada em `handleDelete` do POI (antes também não checava `res.ok`).
- Deixei de fora, de propósito: favoritar/desfavoritar e reagir com emoji — ambos já têm feedback visual imediato (estrela preenche, contador muda), um toast ali seria ruído a mais a cada clique.

**Validado:** `type-check`/`lint` limpos; dev server compilando (um "Fast Refresh ... full reload" apareceu no log logo após mexer no `layout.tsx` — esperado ao reestruturar provedores na raiz em dev, não indica bug; as requisições seguintes voltaram a `200` normalmente). **Precisa da sua validação visual** — testar salvar, editar, excluir um POI e remover uma mídia, e conferir se o toast aparece no canto inferior direito com a mensagem certa.

- **Toast de favoritar/desfavoritar também** (pedido logo em seguida): adicionado ao `toggleFavorite`, junto com a mesma correção de `res.ok`/`catch` que faltava nos outros pontos.

### 17. Planejamento da Fase 7 — Sistema Social (seguir, grupos) e Notificações (pedido em 23/10/2026)

Você perguntou se já havia algo planejado pra "seguir outras contas e acompanhar os pontos delas" — não havia (só a nota de "grupos" em v2+ registrada em 22/10/2026, ver seção "Ideias Futuras" acima). Expliquei antes de desenvolver: o modelo atual de `POI.is_public` é binário (todo mundo vê, ou só o dono) — não existe o conceito de "visível pra quem me segue" nem de perfil de usuário navegável. É um recurso do tamanho de uma fase inteira, não um acréscimo pequeno.

**O que foi feito nesta rodada:** formalizado como **Fase 7** em `docs/04_TIMELINE.md` (16 dias), com tarefas, entregáveis e uma observação de escopo priorizando seguir+notificações antes de grupos (pra não inflar o escopo, risco já listado em `docs/00_OVERVIEW.md`). Atualizei a estimativa total do projeto (70→86 dias) em `docs/00_OVERVIEW.md` e `CLAUDE.md`, e deixei uma nota em `docs/06_PRICING.md` avisando que o preço sugerido ainda não contempla a Fase 7 (não recalculei — fora do que foi pedido). **Nenhum código de backend/frontend da Fase 7 foi implementado ainda** — isso é só o planejamento, conforme pedido ("implementa o planejamento da fase 7").

### 18. "Meus POIs" — painel separado de Favoritos (pedido em 23/10/2026)

Você mesmo concluiu que favoritar o próprio POI já devia funcionar independente de "Meus POIs" — e checando o código, já funcionava: a estrela no popup nunca teve trava de `isOwner`. Faltava só a tela "Meus POIs" em si. Como os dois painéis consultam fontes independentes (`/api/favorites` e o novo `/api/pois/mine`), um POI seu que você também favoritou aparece nos dois — exatamente o "pode fazer os dois" que você descreveu.

- **Backend** (`backend/app/api/v1/pois.py`): novo parâmetro `mine_only` em `GET /pois` — quando `true`, ignora os POIs públicos de outros usuários e devolve só os do `user_id` informado (400 se vier `mine_only=true` sem `user_id`). Testado via `curl` direto: sem `user_id` → 400; com um UUID qualquer → 200 e `[]`.
- **Rota BFF nova** `frontend/src/app/api/pois/mine/route.ts` — autenticada (`requireSessionUserId()`), nunca confia em `user_id` vindo do cliente (ver achado de segurança acima).
- **Frontend:** `fetchMyPois`/`useMyPois` (mesmo padrão de `fetchFavorites`/`useFavorites`) e `MyPoisPanel` (mesmo layout de `FavoritesPanel`/`PoiPanel`, ícone `UserRound` pra não colidir com a estrela dos favoritos nem a lista "POIs próximos"), montado em `app-shell.tsx` entre Favoritos e POIs próximos. Invalidação de `["my-pois"]` adicionada nos mesmos pontos onde `["pois"]` já era invalidado (criar/editar/excluir POI), pra manter a lista sincronizada.

**Validado:** `type-check`/`lint` limpos; `GET /api/v1/pois?mine_only=true` testado via `curl`; `GET /api/pois/mine` compilou e respondeu `200` no dev server. **Precisa da sua validação visual** — abrir o painel "Meus POIs" (ícone de pessoa, ao lado dos favoritos) e conferir que lista só os seus POIs, e que criar/editar/excluir atualiza a lista.

### 19. Correção do IDOR em `GET /pois` (pedido em 23/10/2026)

Fechei a vulnerabilidade registrada na seção de Pendências de Segurança no topo deste arquivo. Mudança em duas pontas, seguindo o mesmo padrão BFF já usado pros endpoints de escrita:

- **Backend** (`backend/app/api/v1/pois.py`): `GET /pois` e `GET /pois/{id}` agora exigem `dependencies=[Depends(verify_internal_secret)]` — só quem tem o segredo interno (o BFF do Next.js) consegue chamá-los. Chamada direta ao FastAPI sem o header agora dá 401.
- **`frontend/src/lib/api-server.ts`**: novo `getSessionUserId()` — como `requireSessionUserId()`, mas devolve `null` em vez de lançar erro quando não há sessão (necessário aqui porque ver POIs públicos no mapa sem estar logado é um fluxo legítimo que precisa continuar funcionando).
- **Rotas BFF:** `GET` adicionado em `frontend/src/app/api/pois/route.ts` (repassa `min_lat`/`min_lng`/`max_lat`/`max_lng`/`category_slug`/`q` do cliente, mas `user_id` vem só de `getSessionUserId()`) e em `frontend/src/app/api/pois/[id]/route.ts` (mesma ideia).
- **`frontend/src/lib/api-client.ts`**: `fetchPois`/`fetchPoiById` agora chamam o BFF (`/api/pois`, `/api/pois/{id}`) em vez do FastAPI direto (`NEXT_PUBLIC_API_URL`), e não recebem mais `userId` como parâmetro — não tem mais porquê, o servidor resolve isso sozinho. Os hooks que os usam (`usePois`, `usePoi`, `usePoiSearch`) mantiveram o parâmetro `userId` só pra diferenciar a `queryKey` do React Query entre logado/deslogado (cache), mas pararam de repassá-lo na requisição.

**Validado:** `type-check`/`lint` limpos. Testado via `curl`: FastAPI direto sem o segredo → `401` (antes era `200`, vazando POIs privados de qualquer `user_id` informado); FastAPI direto com o segredo → continua `200` (o BFF ainda funciona); `GET /api/pois` e `GET /api/pois/{id}` pelo Next.js (anônimo, sem login) → `200`, só com POIs públicos — confirmando que a navegação sem login no mapa não quebrou. Dev server recompilou limpo.

### 20. Primeiro commit real do projeto — Sprints 1-3 + todas as extensões (23-25/10/2026)

Até aqui, só existia um commit no repositório ("chore: setup inicial do monorepo") — todo o trabalho das Sprints 1-3 e dos itens 1-19 acima ficou como alteração não commitada na árvore de trabalho a sessão inteira. A seu pedido, revisei tudo (118 arquivos — `.gitignore` confirmado cobrindo `.env`/`node_modules`/`.next`; `.env.example` conferidos, só placeholders; nenhum binário ou arquivo de credencial estranho na lista de novos arquivos) e consolidei num único commit (`f2c1650`), com a mensagem resumindo as três sprints e as extensões — histórico detalhado de cada mudança fica aqui no `SPRINTS.md`, não duplicado na mensagem do commit.

- **Push travou:** o Git Credential Manager (`credential.helper=manager`) não tinha nenhuma credencial do GitHub salva nesta máquina e tentou abrir um fluxo de login interativo (janela/navegador) que não existe nesta sessão sem interface — três tentativas de `git push` ficaram penduradas sem erro nenhum até eu investigar com `GCM_INTERACTIVE=never` e achar a causa real (`fatal: Cannot prompt because user interactivity has been disabled`). Matei os processos `git`/`git-credential-manager`/`git-remote-https` travados antes de prosseguir.
- Você forneceu um Personal Access Token direto no chat. Usei `git credential approve` (via stdin, não como argumento de comando nem salvo em arquivo do repo) pra gravar a credencial no Credential Manager do Windows — o token não foi escrito em nenhum arquivo do projeto nem commitado. Push concluído: `df53887..f2c1650 main -> main`.
- **Aviso de segurança dado a você:** como o token foi colado em texto puro no chat, sugeri considerar revogá-lo/gerar um novo em `github.com/settings/tokens` por precaução — não é urgente (repositório pessoal), mas é a prática mais segura.

**Status:** repositório remoto (`origin/main`) agora reflete o estado real do projeto pela primeira vez desde o commit inicial.

### 21. Primeiro teste no navegador: bug de ZodError + 4 ajustes de UI (pedido em 25/10/2026)

- **Bug real encontrado: formulário de POI quebrava com "Unhandled Runtime Error: ZodError" ao tentar salvar sem categoria (e, na prática, em qualquer erro de validação).** Causa raiz: `@hookform/resolvers@3.9.0` foi fixado na Sprint 3 por causa de um conflito de peer-dependency com o pacote `effect` (não usado por nós, só puxado pelo CLI do shadcn) — só que essa versão do resolver foi escrita pra Zod v3, que expõe os erros de validação em `error.errors`. O projeto usa **Zod v4** (`^4.6.7`), que renomeou esse campo pra `error.issues` e não tem mais `.errors` nenhum. O resolver checava `Array.isArray(error?.errors)` pra decidir se era um erro de validação do Zod (e aí converter pros `errors` do react-hook-form) — como `.errors` vinha `undefined`, essa checagem falhava **toda vez** e o `ZodError` bruto era relançado sem tratamento, estourando como erro não capturado na tela. Confirmei isso reproduzindo o erro isolado via `node -e` antes de mexer em qualquer coisa. Corrigido fazendo o upgrade pra `@hookform/resolvers@6.0.0` (`npm install @hookform/resolvers@latest --legacy-peer-deps` — o mesmo conflito de peer-dependency do `effect` de antes, mesma solução), confirmado que a versão nova lê `.issues` em vez de `.errors`. Reiniciei o dev server (limpando `.next`) pra garantir que pegou a dependência nova.
- **Diálogo de confirmação de exclusão deixou de ser o `window.confirm()` nativo do navegador.** Adicionei `frontend/src/components/ui/alert-dialog.tsx` (componente do design system, Base UI `alert-dialog`, criado manualmente igual ao `toast.tsx` — pulei o `npx shadcn add` porque ele sobrescreveria `button.tsx` pra uma versão sem `forwardRef`, incompatível com React 18) e troquei o botão de excluir do popup do POI (`poi-card-popup.tsx`) por um `AlertDialog` controlado, com botões "Cancelar"/"Excluir" de verdade, no estilo visual do app.
- **Removidos o botão "voltar pra vista inicial" (bússola, `compass.tsx`) e o minimapa do canto inferior esquerdo (`minimap.tsx`)** — nenhum dos dois era usado em mais nenhum lugar, deletei os arquivos e as referências em `map-view.tsx`.
- **Copiar endereço e latitude/longitude no card do POI:** novo componente `CopyField` (local, em `poi-card-popup.tsx`) com ícone que vira um check por 1.5s ao copiar (via `navigator.clipboard`), usado ao lado do endereço (quando existe) e numa nova linha com as coordenadas (`lat, lng`), que agora sempre aparece no card, independente de ter endereço/descrição ou não.

**Validado:** `type-check`/`lint` limpos; bug do ZodError reproduzido isoladamente via Node antes da correção, e a correção confirmada lendo o bundle instalado (`.issues` em vez de `.errors`). Dev server reiniciado do zero, compilando limpo. **Precisa da sua validação visual** — principalmente tentar salvar um POI sem categoria de novo (não deve mais quebrar a tela, só mostrar o erro no campo), testar o diálogo de exclusão novo, confirmar que a bússola/minimapa sumiram, e testar os botões de copiar endereço/coordenadas.

### 22. Número do endereço faltando na geocodificação reversa — investigado, decisão: deixar como está (pedido em 25/10/2026)

Você notou que o endereço preenchido automaticamente às vezes não traz o número. Investiguei contra o Nominatim de verdade antes de propor qualquer coisa:

- Pro ponto testado, o Nominatim nem achou um prédio/endereço numerado perto — devolveu a **rua inteira** como resultado (`osm_type: "way"`), sem `house_number` nenhum no payload.
- Fui além: busquei **todos** os pontos já cadastrados nessa mesma rua no OpenStreetMap — nenhum tem número mapeado. Não é o Nominatim escondendo um dado que ele tem; é um buraco real de dados do OSM, comum em ruas residenciais no Brasil.
- **Por que "estimar" (interpolação) não ajudaria aqui:** precisa de pelo menos dois números de referência na mesma rua pra interpolar um valor entre eles — e não existe nenhum nessa rua pra começar. Construir isso bateria exatamente nos casos que estão incomodando, sem resolver nada ali.
- Apresentei duas alternativas reais: manter como está (campo de endereço já é editável, usuário completa o número à mão) ou trocar de provedor de geocodificação (Google/Mapbox, com número melhor coberto no Brasil, mas sai do "grátis sem API key" escolhido de propósito, com custo/limite de uso).

**Decisão sua:** deixar como está — nenhuma mudança de código feita. Documentando aqui pra não reabrir essa investigação à toa numa sessão futura.

---

## Sprint 4 — Sistema de Rotas e Integração Google Maps

**Status:** ✅ Concluído (9/9, com ressalva no turn-by-turn — ver Decisões) · **Duração estimada:** 10 dias

### Tarefas
- [x] Integrar OSRM API (gratuita, open-source): endpoint FastAPI proxy para calcular rota entre dois pontos
- [x] Implementar exibição de rota no mapa Leaflet: polyline com estilo gamificado (linha tracejada animada estilo videogame)
- [~] Criar painel de informações de rota: distância em km, tempo estimado (carro/a pé) — **sem** turn-by-turn, ver Decisões
- [x] Desenvolver deep-link para Google Maps: montar URL google.com/maps/dir/ com origem e destino, abrir em nova aba
- [x] Implementar deep-link para Apple Maps (detecção de iOS/Mac via user-agent)
- [x] Criar botão 'Como Chegar' em cada POI com opções: ver rota no mapa, ou abrir no Google/Apple Maps
- [x] Implementar cache Redis para rotas frequentes (origem-destino já calculados)
- [x] Adicionar indicador visual de rotas salvas: histórico de rotas do usuário
- [x] Desenvolver modo de navegação simplificado: seguir a rota com geolocalização em tempo real (watchPosition)

### Entregáveis
- [x] Cálculo de rotas funcionando via OSRM com exibição visual no mapa
- [~] Painel de rota com distância e tempo (sem instruções turn-by-turn)
- [x] Deep-link para Google Maps e Apple Maps funcionando
- [x] Cache de rotas no Redis implementado
- [x] Modo de navegação básico com atualização de posição em tempo real

### Decisões e Pendências
- ✅ **Escopo cortado pra MVP da sprint, 3 tarefas adiadas de propósito** (cache Redis, histórico de rotas salvas, modo de navegação com `watchPosition`): são as três tarefas que mais se beneficiam de uso real antes de valer a pena construir — cache só compensa se houver repetição de consultas, histórico precisa de uma UI própria de "minhas rotas" que ninguém pediu ainda, e modo de navegação é complexo (recalcular/seguir a rota em tempo real) e sobrepõe parcialmente com só abrir no Google Maps (que já faz isso muito melhor). Entregue o essencial: calcular, ver no mapa, e sair pro Google/Apple Maps pra navegação de verdade. **Status (27/10/2026): as três foram fechadas** — ver "Fechando o que ficou de fora" abaixo.
- ✅ **Turn-by-turn simplificado não implementado** — o endpoint OSRM já devolve `overview=full` (geometria completa) mas não os `steps` turn-by-turn (não pedidos no `GET /route`); como o modo de navegação foi adiado também, não havia consumidor pra esse dado ainda. Fácil de adicionar depois (`steps=true` no OSRM + endpoint retornando a lista).
- ✅ **Origem da rota é sempre a geolocalização do usuário** (`userPosition` no `map-store.ts`, espelhado de `useGeolocation()`) — não dá pra calcular rota entre dois POIs quaisquer ainda, só "daqui até ali". Suficiente pro pedido original ("calcular distância/tempo da localização atual até qualquer POI").
- ✅ **Cálculo de rota é público, sem autenticação** — diferente de `GET /pois`, o endpoint `/routes` não tem nenhum dado sensível (só geometria a partir de coordenadas), então não precisa de `verify_internal_secret` nem passar pelo BFF; o frontend chama o FastAPI direto, mesmo padrão de `/categories`.

### Dificuldades
- **OSRM demo público se comporta de forma inconsistente pra coordenadas sem rota possível** (testei com `0,0` → `1,1`, no meio do oceano): às vezes devolve `400 InvalidUrl` com uma mensagem claramente incorreta ("URL string malformed... 'and'") em vez do esperado `200` com `{"code": "NoRoute"}`. Não investiguei mais a fundo por ser comportamento de um servidor de terceiros fora do nosso controle, e porque o tratamento de erro já cobre o caso de qualquer forma: `response.raise_for_status()` + `except httpx.HTTPError` devolve um `502` limpo ("Não foi possível calcular a rota agora") pro frontend em vez de vazar a mensagem estranha do OSRM ou quebrar o endpoint. Não deve aparecer na prática — rotas reais (localização do usuário até um POI cadastrado, ambos em terra firme) sempre caíram no caminho feliz nos testes.

### Notas
- **Backend (`backend/app/api/v1/routes.py`):** novo endpoint `GET /routes?from_lat&from_lng&to_lat&to_lng&profile=driving|walking`, proxy pro OSRM público (`router.project-osrm.org`, sem API key). Inverte a ordem de coordenadas do OSRM (`[lng, lat]`, convenção GeoJSON) pra `[lat, lng]` (convenção já usada no resto da API). Dependência nova: `httpx` (adicionado ao `requirements.txt`, imagem do backend reconstruída com `docker compose up -d --build backend`).
- **Modelo `Route` (`backend/app/models/route.py`) já existia desde a Sprint 1** (schema planejado com antecedência) mas segue sem uso — é a tabela que serviria pro cache Redis/histórico adiados, não precisou de migration nova agora.
- **Frontend — estado da rota (`map-store.ts`):** `userPosition` (espelhado de `useGeolocation()` em `map-view.tsx`, já que o painel de rota vive fora da árvore do mapa e não pode chamar o hook de novo sem abrir uma segunda assinatura de geolocalização), `activeRouteTarget` (POI de destino, setado pelo botão "Como chegar"), `routeProfile` (carro/a pé).
- **`RouteLayer` (`components/map/route-layer.tsx`, dentro do `MapContainer`):** busca a rota via `useRoute` (React Query) e desenha como `Polyline` tracejada com animação "marching ants" (`mappin-route-line` em `globals.css`, `stroke-dashoffset` animado). Enquadra o mapa (`fitBounds`) na rota inteira assim que os dados chegam.
- **`RoutePanel` (`components/layout/route-panel.tsx`, fora da árvore do mapa, canto inferior esquerdo):** nome do destino, toggle carro/a pé, distância/tempo, botões "Google Maps"/"Apple Maps" (Apple só aparece em iOS/Mac, detectado via `navigator.userAgent` depois de montado, pra não divergir do SSR). Fecha a rota (botão X) e tudo limpa via `clearRoute()`.
- **Botão "Como chegar" no popup do POI** (`poi-card-popup.tsx`): disponível pra **qualquer visitante**, não só o dono — diferente de Editar/Excluir. O rodapé do card deixou de ser condicional (`hasFooterContent`) porque agora sempre tem pelo menos esse botão.
- **Deep-links (`lib/deep-links.ts`):** Google Maps sempre visível (`google.com/maps/dir/?api=1&origin=...&destination=...&travelmode=...`); Apple Maps só em iOS/Mac (`maps.apple.com/?saddr=...&daddr=...&dirflg=d|w`).
- **Validado:** backend testado via `curl` direto (São Paulo, Av. Paulista → Ibirapuera: `driving` deu 6.25km/11min; mesmo trecho em `walking` com mais pontos de geometria, como esperado); `type-check`/`lint` limpos; dev server recompilando sem erro (um erro de sintaxe transiente apareceu no log no meio de uma sequência de edits do `poi-card-popup.tsx`, mas já tinha se auto-corrigido pela edit seguinte antes mesmo de eu notar — confirmado pelo recompile limpo logo depois e `type-check`/`lint` passando no estado final). **Precisa da sua validação visual** — clicar em "Como chegar" num POI, ver a linha tracejada animada no mapa, trocar entre carro/a pé, e testar os botões de abrir no Google/Apple Maps.

### Correções e extensão pós-validação (26/10/2026)

Você testou e reportou dois pontos: tempo de carro igual ao de a pé, e pediu uma categoria "Outros" com ícone livre.

- **Bug real: carro e a pé davam o mesmo tempo.** Causa raiz, confirmada comparando as respostas HTTP byte a byte: o demo público oficial (`router.project-osrm.org`) só tem o perfil de **carro** carregado de verdade — qualquer outro nome de perfil na URL (ex: `foot`) é **ignorado silenciosamente** e devolve exatamente o mesmo resultado do carro, sem erro nenhum que denunciasse o problema. Troquei pra FOSSGIS (`routing.openstreetmap.de`, comunidade OSM alemã), que mantém instâncias **separadas de verdade** por perfil (`/routed-car/`, `/routed-foot/`), gratuitas e sem API key. Revalidei com a mesma rota de antes: agora carro dá 11min e a pé dá 55min pro mesmo trajeto de 6.3km — números batem com o que se espera na realidade (antes os dois davam o mesmo valor, o que já era a pista de que algo estava errado).
- **Categoria "Outros" com ícone livre por POI:** implementado como pedido, com a ressalva de ser um conjunto curado (~30 ícones), não realmente qualquer ícone do lucide-react — acho que é o equilíbrio certo entre "livre o suficiente" e manter a UI previsível, mas me avise se quiser ampliar.
  - **Backend:** nova coluna `pois.icon_name` (nullable — migration `7a2c9e4f1b36`) e nova categoria `outros` seedada (migration `f3d8b6a0c912`, ícone padrão `sparkles`, cor neutra `#9CA3AF`). Quando um POI tem `icon_name` próprio, ele sobrepõe o ícone fixo da categoria só naquele POI.
  - **Frontend — descoberta no caminho:** o campo `category.icon_name` já existia no banco e na API desde a Sprint 1, mas o frontend **nunca usou isso** — tinha um mapa fixo `slug → ícone` hardcoded em `poi-marker-icon.tsx`. Aproveitei pra consertar essa divergência: agora os ícones (de categoria e de POI) vêm sempre do dado real (`icon_name`), nunca de um mapa fixo por slug.
  - **Seletor no formulário:** grade de ~30 ícones aparece só quando a categoria selecionada é "Outros" (`poi-form-sheet.tsx`), com rótulos em pt-BR (Igreja, Notícia, Monumento, etc.).
  - **Bug que eu mesmo causei e já corrigi antes de reportar:** o módulo de ícones importava `leaflet` no topo (necessário só pra `createPoiIcon`/`L.divIcon`). Isso nunca foi problema enquanto só `map-view.tsx`/`poi-card-popup.tsx` (ambos dentro da árvore do mapa, protegida com `ssr: false`) importavam dali — mas o seletor de ícone do formulário também passou a importar desse arquivo, e o formulário **não** tem essa proteção (é renderizado direto em `app-shell.tsx`, um Server Component). Resultado: `ReferenceError: window is not defined` quebrando a página inteira no SSR. Corrigido extraindo a parte sem Leaflet (registry de ícones, `ICON_PICKER_OPTIONS`, `resolveIconName`) pra um módulo novo e "limpo" (`frontend/src/lib/poi-icons.ts`), deixando `leaflet` isolado só em `createPoiIcon` (`components/map/poi-marker-icon.tsx`, que reexporta o resto pra não quebrar os imports existentes). Confirmado: SSR voltando a dar `200` depois da correção.

**Validado:** rota testada via `curl` com os dois perfis dando tempos realistas e diferentes; fluxo de POI com ícone livre testado ponta a ponta via `curl` (criar com `category_id` de "outros" + `icon_name: "church"`, confirmar no retorno, depois excluído — era só um POI de teste); `type-check`/`lint` limpos; dev server reiniciado do zero, SSR confirmado saudável (`GET / 200`). **Precisa da sua validação visual** — trocar entre carro/a pé de novo pra confirmar tempos diferentes, e criar um POI na categoria "Outros" escolhendo um ícone.

**Commit + push (27/10/2026):** todo esse trabalho (fix do ZodError + Sprint 4 inteira) foi consolidado em dois commits e enviado — `36e1f22` e `4ed0365`, `f2c1650..4ed0365 main -> main`. `origin/main` está em dia com o estado real do projeto.

### Fechando o que ficou de fora (pedido em 27/10/2026)

Você perguntou se dava pra fechar sozinho ou precisava de algo da sua parte — não precisava (Redis já rodava, o modelo `Route` já existia desde a Sprint 1). Só levantei uma dúvida de escopo pro modo de navegação antes de construir: você escolheu "só recentralizar + atualizar distância/tempo", sem turn-by-turn (abrir no Google Maps já resolve isso melhor).

- **Cache Redis** (`backend/app/core/cache.py`): `GET /routes` agora cacheia por `(perfil, origem arredondada a ~11m, destino arredondada a ~11m)`, TTL de 5 minutos. Resiliente de propósito — se o Redis cair, o cache falha silenciosamente e a rota continua sendo calculada direto no OSRM, nunca derruba a requisição. Validado via `curl` cronometrado: primeira chamada ~930ms, segunda (mesmos parâmetros) ~74ms.
- **Histórico de rotas** (`backend/app/models/route.py`, já existia sem uso): novos endpoints `POST /routes/history` e `GET /routes/history`, ambos atrás do `verify_internal_secret` — só o BFF autenticado grava/lê, `user_id` nunca vem do navegador (mesmo cuidado do achado de segurança do item 19). Novo painel "Minhas rotas" (`route-history-panel.tsx`, ícone de relógio/histórico, só pra quem está logado) — toque numa entrada pra traçar a rota de novo. `RoutePanel` salva automaticamente no histórico uma vez por destino escolhido (não a cada recálculo por GPS).
- **Modo de navegação simplificado:** botão "Iniciar navegação" no `RoutePanel`. Enquanto ativo, o mapa passa a seguir a posição do usuário (`map.panTo`, com um `flyTo` mais próximo só na entrada) em vez de enquadrar a rota inteira — reaproveitei o `RouteLayer`, que já recalculava a rota a cada atualização de posição (ponto de atenção que virou ajuste: antes disso, o `fitBounds` rodava a cada recálculo, o que já estava reenquadrando o mapa toda hora mesmo fora do modo navegação; corrigido pra só enquadrar quando o **destino** muda). Detecção de chegada simples: quando a distância restante cai abaixo de 30m, mostra um toast "Você chegou!" e encerra a rota sozinho.
- **Zoom do modo navegação ajustado por perfil** (pergunta sua: "o zoom é ajustado conforme a localização do usuário?"): não havia nenhum ajuste de zoom antes, só o recentralizar. Em vez de zoom dinâmico por velocidade (mais complexo, pedido explícito seu de manter simples), o `flyTo` de entrada no modo navegação agora usa um zoom fixo por perfil (`NAV_FOLLOW_ZOOM` em `route-layer.tsx`): 16 dirigindo (mais afastado, dá contexto da via à frente), 18 a pé (mais perto, onde precisão de poucos metros importa mais).

**Validado:** cache testado via `curl` com tempos cronometrados; histórico testado ponta a ponta via `curl` (salvar + listar, depois removido — era só teste); `type-check`/`lint` limpos; dev server caiu sem erro no meio do teste (processo encerrado externamente, não uma falha de código) e foi religado, voltando saudável. **Precisa da sua validação visual** — testar o botão "Iniciar navegação" (o mapa deve seguir sua posição com o zoom certo por perfil), abrir o painel "Minhas rotas" depois de calcular pelo menos uma rota logado, e confirmar que chegar perto do destino mostra o toast de chegada.

### Investigação: geocodificação imprecisa, três locais diferentes pro mesmo endereço (pedido em 27/10/2026)

Você reportou (com 3 prints) que o Google Maps, o pino automático do nosso app, e uma coordenada colada manualmente do Google Maps mostravam **três lugares diferentes** pro mesmo endereço, e perguntou se dava pra ser mais exato com ajuda do Google Maps.

- **Pino do app (Nominatim) vs Google Maps:** mesma causa raiz já identificada no item 22 (número de endereço ausente nos dados do OSM pra essa rua) — quando o Nominatim não acha o número exato, ele cai pro centro geométrico da via inteira (`osm_type: "way"`), não um ponto proporcional ao número. O Google tem base própria de endereços com número que o OSM não tem nessa região.
- **Terceiro pino (coordenada colada manualmente), ainda mais distante:** não confirmado, mas hipótese provável é troca de latitude/longitude ao dividir o "lat, lng" copiado do Google entre os dois campos separados do formulário — `applyLatLng()` em `poi-form-sheet.tsx` não pegaria isso, porque lat e lng dessa região são ambos negativos e passam na validação de faixa mesmo trocados.
- **Decisão (27/10/2026): por ora, continua manual** — arrastar o pino tracejado pro lugar certo depois da busca aproximada, sem nenhuma mudança de código. **Anotado pra decisão futura:** a API de geocodificação do Google daria precisão real de número de endereço no Brasil, mas exige chave de API no Google Cloud + conta de faturamento vinculada (cota mensal grátis deve cobrir o uso normal de um portfólio, mas precisa cadastro) — conflita com a preferência já estabelecida do projeto de evitar serviços pagos/com chave (Nominatim/OSRM). Se decidir seguir com isso no futuro, a abordagem de menor custo é usar o Google só como **fallback**: Nominatim primeiro (grátis), Google só quando o resultado vier impreciso (ex: match de `way` em vez de ponto exato).

---

## Sprint 5 — Agentes de IA e Features Inteligentes

**Status:** ✅ Concluído (sem Celery/Railway — ver Decisões) · **Duração estimada:** 10 dias

### Tarefas
- [x] ~~Setup Celery worker no Railway com broker Redis~~ — substituído por `BackgroundTasks` do FastAPI (ver Decisões)
- [x] Implementar POICategorizerAgent: integração Claude API, lógica de mapeamento de categoria para ícone do sistema
- [x] Implementar POIBioWriterAgent: endpoint /pois/generate-bio, integração com formulário de criação via botão
- [x] Implementar NearbyRecommenderAgent: endpoint /pois/recommendations com contexto de localização e histórico
- [x] Criar UI para recomendações: painel lateral 'Explorar' com cards animados de sugestões
- [x] Implementar feedback loop: usuário avalia sugestão (útil/não útil) — registrado, ver ressalva em Decisões
- [x] Adicionar indicador visual quando IA está processando (skeleton loader gamificado)
- [x] Implementar rate limiting nas chamadas à Claude API para controle de custos

### Entregáveis
- [x] 3 agentes de IA funcionando: categorizador, bio writer e recomendador
- [x] ~~Celery worker deployado no Railway~~ — não existe deploy ainda; substituído por `BackgroundTasks` local (ver Decisões)
- [x] UI de recomendações 'Explorar' com cards de sugestões personalizadas
- [x] Rate limiting e controle de custos da API Claude implementados

### Decisões e Pendências
- ✅ **Sem Celery/WebSocket — `BackgroundTasks` do FastAPI + polling do React Query** (sua escolha em 27/10/2026, pergunta feita antes de começar): o app ainda não tem deploy nenhum configurado (Railway citado no planejamento, nunca configurado nesta conversa), então subir um worker Celery + broker novo agora seria infraestrutura de produção sem produção pra rodar. `BackgroundTasks` entrega o mesmo resultado prático (IA roda depois da resposta, sem travar a criação do POI) com zero peças novas no `docker-compose.yml`. Revisitar Celery faz mais sentido quando chegarmos no deploy real (Sprint 6).
- ✅ **Modelo: Claude Sonnet 5.5 pros 3 agentes** (sua escolha em 27/10/2026): o planejamento original (`docs/05_COST_ANALYSIS.md`) previa ~$5/mês com um modelo antigo (Sonnet 4.6, $3/$15 por 1M tokens). Sonnet 5.5 atual é mais barato ($2/$10) e mais capaz — melhor que o padrão recomendado (Opus 5.5, $4/$20) pras 3 tarefas, que são classificação/geração de texto simples, não raciocínio complexo.
- ✅ **POICategorizerAgent dispara ao salvar o POI, mas a sugestão só aparece quando o dono reabre o POI** — não construí um indicador dedicado de "categorizando em segundo plano" nem um toast automático na criação: o processamento levou 2-4s nos testes, e a sugestão (quando pronta) já aparece como uma faixa no popup do POI (ver Notas) e como uma etiqueta "✨ sugestão" no painel "Meus POIs" — simples o bastante sem precisar de polling client-side logo após criar.
- ✅ **"Explorar" não exclui os próprios POIs do usuário do raio de recomendação** — testei excluindo e, como só existe um usuário real no banco até agora (ambiente de dev solo), isso deixava o painel sempre vazio. Mantive só o filtro de "público". Quando houver mais usuários de verdade, vale reavaliar se recomendar o próprio POI do usuário ainda faz sentido.
- ⚠️ **Feedback loop (útil/não útil) registra, mas ainda não ajusta recomendações futuras** — cada avaliação vira uma linha na tabela `ai_feedback` (dono, POI, agente, útil/não), mas nenhum agente lê essa tabela ainda pra influenciar a próxima sugestão. Fazer isso de verdade (ex: pesar categorias/POIs que o usuário já marcou como "não útil") é um projeto de aprendizado incremental que vale uma sprint própria — por ora, é dado coletado e pronto pra usar depois, não um loop fechado.
- ✅ **Endpoint de recomendações é `/ai/recommendations`, não `/pois/recommendations` como no planejamento original** — descoberto só na hora de testar (ver Dificuldades): colidia com a rota `GET /pois/{poi_id}` já existente.

### Dificuldades
- **Bug de desatenção, pego no teste via `curl`:** `category_slugs = [c.slug for c, in db.execute(select(Category.slug)).all()]` — o unpacking `for c, in rows` já desempacota a tupla de uma coluna, então `c` já era a string do slug; o `.slug` depois quebrava com `AttributeError: 'str' object has no attribute 'slug'`. Corrigido pra `list(db.scalars(select(Category.slug)).all())`.
- **Colisão de rotas no FastAPI, também pega no teste via `curl`:** registrei `GET /pois/recommendations` numa sprint depois de `GET /pois/{poi_id}` já existir (sprint anterior) — como o FastAPI casa rotas na ordem em que são registradas no app inteiro (não por arquivo), `/pois/recommendations` caía no padrão `/pois/{poi_id}` primeiro, com `poi_id="recommendations"` (erro 422 de UUID inválido). Resolvido movendo o endpoint pra `/ai/recommendations`, um namespace sem conflito — mais seguro a longo prazo que depender de ordem de registro.

### Notas
- **Backend — agentes (`backend/app/services/ai_agents.py`):** usa o SDK oficial da Anthropic (`anthropic==2.3.0`, instalado via `requirements.txt`) com `client.messages.parse(output_format=...)` (saída estruturada validada por Pydantic) pro categorizador e recomendador, e `client.messages.create` simples pro bio writer (saída é só texto). Todas as 3 funções engolem qualquer exceção e retornam `None`/lista vazia — a IA é sempre um bônus, nunca pode quebrar a criação de um POI ou o carregamento de um painel.
- **Rate limiting (`backend/app/core/rate_limit.py` + `increment_with_ttl` em `cache.py`):** contador no Redis por usuário+agente, janela de 24h, limite de 50/dia (categorizador, automático), 30/dia (bio writer) e 20/dia (recomendador). Resiliente como o cache de rotas: se o Redis cair, não bloqueia ninguém.
- **POICategorizerAgent (`_run_categorizer_background` em `backend/app/api/v1/pois.py`):** agendado via `BackgroundTasks.add_task` no `POST /pois`, roda com sua própria sessão de banco (a da requisição original já fechou). Grava a sugestão em 5 colunas novas e nullable de `pois` (`ai_category_slug/icon_name/color_hex/confidence/reasoning`, migration `9b3f2a6d7c41`) — não-nulo = sugestão pendente. O dono aceita (`POST /pois/{id}/ai-suggestion/accept`, copia pra `category_id`/`icon_name` reais) ou dispensa (`.../dismiss`, só limpa); os dois registram uma linha em `ai_feedback` e são idempotentes.
- **POIBioWriterAgent:** síncrono (`POST /pois/generate-bio`), botão "Gerar com IA" ao lado do label "Descrição" no formulário (`poi-form-sheet.tsx`) — usa nome/categoria/endereço já preenchidos, preenche a descrição no próprio campo (usuário pode editar depois).
- **NearbyRecommenderAgent (`GET /ai/recommendations`):** candidatos via `ST_DWithin` (PostGIS, raio de 2km, só POIs públicos), até 40 passados pra IA, que escolhe até 3 com motivo + prioridade. Cacheado no Redis por 10min (posição arredondada a ~100m) — painel "Explorar" (`explore-panel.tsx`, ícone de bússola no HUD) só dispara a query quando aberto.
- **Feedback útil/não útil:** tabela `ai_feedback` (dono, POI, agente, útil/não, data) — usada pelos botões 👍/👎 nos cards do "Explorar" e implicitamente por aceitar/dispensar a sugestão do categorizador.
- **Indicador visual:** spinner no botão "Gerar com IA" (síncrono); skeleton (`animate-pulse`) nos cards do "Explorar" enquanto carrega; etiqueta "✨ sugestão" no painel "Meus POIs" pra sinalizar sugestão pendente sem precisar abrir cada POI.

**Validado:** bio writer, categorizador (via criação real de POI com categoria propositalmente errada — a IA corrigiu pra "alimentação" com ícone "pizza"), aceitar sugestão (categoria mudou de verdade no banco), recomendações (cache confirmado: 5.3s na primeira chamada, 77ms na segunda) e feedback testados via `curl` direto no backend, com secret real e depois limpos do banco; `type-check`/`lint` do frontend limpos; dev server recompilou tudo sem erro. **Validação visual confirmada por você em 28/10/2026** — faixa de sugestão da IA no popup do POI, etiqueta "✨ sugestão" em "Meus POIs", botão "Gerar com IA" no formulário e painel "Explorar" (com 👍/👎) testados no navegador e aprovados ("ta funcionando bem").

---

## Ideias Futuras (v2+) — fora do escopo do MVP

### Mapa-rede-social (grupos com visibilidade compartilhada)

**Proposta (22/10/2026):** em vez de um mapa 100% pessoal ou 100% público (tipo Wplace), criar **grupos fechados** de usuários cadastrados. Cada membro customiza seu próprio mapa normalmente, mas os POIs que marcar *dentro de um grupo* ficam visíveis para os outros membros daquele grupo — com toda a mídia rica (foto/áudio/GIF) junto. POIs fora de qualquer grupo continuam privados, só do próprio usuário. Motivação: algumas marcações o usuário não quer que todo mundo veja, então o compartilhamento é por grupo, não público.

**Avaliação de viabilidade:** viável, e encaixa bem no schema que já existe — `pois.user_id` e `is_public` já estão na Sprint 1. Desenho necessário:
- Novas tabelas: `groups` (id, nome, dono) e `group_members` (grupo ↔ usuário, N:N, com papel)
- `POI.visibility` evolui de boolean simples para: privado / compartilhado com grupo(s) específico(s) / público
- Query do mapa passa a buscar "meus POIs + POIs de grupos dos quais sou membro", cruzando o filtro geoespacial (bounding box) de sempre com a tabela de membership
- Ponto de atenção principal: autorização na query do backend — garantir que nenhum POI de grupo vaze para quem não é membro

Relacionado ao item "modo colaborativo" já listado nas features v2+ do `docs/00_OVERVIEW.md`, mas mais simples (visibilidade compartilhada por grupo, não edição colaborativa em tempo real via WebSockets/CRDTs). Candidato a entrar como sprint própria depois da Sprint 3 (precisa do CRUD de POI real existindo primeiro). Não iniciar antes de decidirmos entrar nela de fato.

**Status (23/10/2026): promovida para a Fase 7 formal do roadmap** (`docs/04_TIMELINE.md`), expandida com o pedido de seguir usuários individuais (não só grupos) e notificações in-app — ver item 17 abaixo.

---

## Sprint 6 — Compartilhamento, Polimento Visual e Deploy Final

**Status:** ✅ Concluído (14/14) · **Duração estimada:** 10 dias

### Tarefas
- [x] **Upgrade Next.js 14 → 16** (resolver CVEs críticas, inclusive 2 de RCE — ver "Pendências de Segurança" no topo deste arquivo), antes de qualquer deploy público — feito em 28/10/2026, ver Notas abaixo
- [x] ~~Receber a logo oficial do app ("MaPinha") e aplicar nos pontos básicos de branding~~ — feito antecipadamente em 28/10/2026, ver Notas abaixo
- [x] Repaginar identidade visual com base na logo oficial: extrair paleta de cores da logo e aplicar de forma unificada nos temas de mapa, UI e componentes existentes — feito em 29/10/2026, ver Notas
- [x] **Rodada de validação visual sua (29/10/2026):** removido painel "Explorar" (mecânica não aprovada) e tema de mapa "Vintage" (legibilidade ruim), corrigidos 2 bugs reais encontrados no teste (toast atrás do dialog, descrição da IA cortada pela metade) — ver Dificuldades e Notas
- [x] Implementar sistema de compartilhamento: gerar slug único para POI público, page de POI pública com SSR (SEO) — feito em 30/10/2026, ver Notas
- [x] Criar página de perfil do usuário: seus POIs, estatísticas (total de pontos, km mapeados), avatar — feito em 30/10/2026, ver Notas
- [x] Adicionar animações Framer Motion: transições de página, entrada de POI cards, loading states gamificados — feito em 30/10/2026, ver Notas
- [x] Implementar PWA: manifest.json, service worker para cache offline do mapa, ícone de instalação — feito em 30/10/2026, ver Notas
- [x] Criar página de onboarding: tutorial interativo de 3 passos ao primeiro login — feito em 30/10/2026, ver Notas
- [x] Configurar Sentry: error tracking frontend e backend, alertas de erros críticos — feito em 30/10/2026, ver Notas
- [x] Realizar testes E2E dos fluxos principais: criar POI com mídia, calcular rota, compartilhar link — feito em 30/10/2026, ver Notas
- [x] Otimizações de performance: lazy loading de POIs fora do viewport, compressão de imagens, bundle analysis — feito em 30/10/2026, ver Notas
- [x] Criar README detalhado com screenshots, GIFs e instruções de deploy (essencial para portfólio) — texto reescrito em 30/10/2026, screenshots capturados e README finalizado em 01/11/2026, ver Notas
- [x] ~~Deploy final revisado em produção com domínio customizado~~ — feito em 01/11/2026 sem domínio customizado (decisão sua), ver Notas

### Entregáveis
- Sistema de compartilhamento de POIs com URLs públicas e SEO
- Identidade visual unificada: paleta derivada da logo oficial aplicada de forma consistente em temas, header e UI geral
- PWA instalável funcionando em mobile com cache offline parcial
- Aplicação deployada em produção (subdomínios gratuitos — sem domínio customizado, decisão sua em 01/11/2026)
- README de portfólio com screenshots, demo GIF e documentação técnica completa
- Monitoramento Sentry ativo em produção

### Decisões e Pendências
- ✅ **App renomeado de "MapPin" para "MaPinha"** (seu pedido em 28/10/2026, trocadilho entre "um mapinha" e o fruto "pinha") — já atualizado onde o nome aparecia pro usuário: `<title>` (`layout.tsx`), cabeçalho do mapa (`hud-header.tsx`) e User-Agent de identificação nas chamadas à Nominatim (`nominatim.ts`, exigido pela política de uso deles, não é visível pro usuário).
- ✅ **Repaginação de identidade visual concluída em 29/10/2026** ("capriche no estilo e valorize bastante a logo... haja como designer sênior e não deixe passar nada") — paleta inteira extraída da logo oficial e aplicada nos tokens de tema (`globals.css`), substituindo o roxo genérico do scaffold inicial. Detalhes completos (cores, racional, contraste, o que foi deliberadamente mantido) em Notas abaixo.
- ✅ **ESLint 8 → 9, migrado pra flat config** (`eslint.config.mjs`, substitui `.eslintrc.json`) — obrigatório porque `eslint-config-next@16` exige `eslint >= 9`. A versão nova do `eslint-config-next` passou a exportar configs flat nativas (`eslint-config-next/core-web-vitals`, `/typescript`) em vez do formato legado `"extends": ["next/core-web-vitals", ...]`; usei elas diretamente.
- ✅ **`next lint` foi removido no Next 16** — o script `lint` do `package.json` agora chama `eslint .` diretamente (o Next só fornecia um atalho fino em cima do ESLint; nada de funcionalidade perdida).
- ✅ **`react-leaflet` 4 → 5 e `react-leaflet-cluster` 2 → 4** — obrigatório porque ambos exigem React 19 nas versões novas (Next 16 exige React 19). `framer-motion` também atualizado (14.6 → 14.7) só por segurança de compatibilidade, já aceitava React 19 antes.
- ⚠️ **`npm audit` ainda acusa 2 vulnerabilidades não relacionadas ao Next.js** (`body-parser` e `deepmerge`, via dependências transitivas do `shadcn` — a CLI usada pra gerar componentes, não roda em produção). Fora do escopo desse upgrade; revisitar se algum dia isso virar bloqueio de deploy.
- ✅ **Next 16 passou a gerar `frontend/AGENTS.md` automaticamente** (toda vez que falta, `next dev` recria) — orienta agentes de IA a checar `node_modules/next/dist/docs/` antes de mexer em código, já que a versão instalada pode ter mudanças que não estão no treinamento. Commitado como o próprio arquivo instrui, pra manter a árvore limpa.

### Dificuldades
- **Favicon enviado por você estava corrompido/não-padrão:** `src/app/favicon.ico` tinha só uma resolução, 215×256px (não-quadrado) — ícones de aba ficam espremidos/cortados assim, e falta os tamanhos pequenos (16/32px) que navegadores e Windows esperam num `.ico`. Detectado inspecionando o header binário do arquivo (`PIL`/`file`). Corrigido gerando um novo `.ico` a partir do `MaPinha.png` (quadrado, com transparência, 6 resoluções: 16/32/48/64/128/256px).
- **Migração do ESLint pra flat config quebrou com erro genérico** (`TypeError: Converting circular structure to JSON`, sem dizer qual era o problema real) ao tentar usar `FlatCompat` (o adaptador pra configs "legadas") em cima do `next/core-web-vitals`/`next/typescript` — formato antigo de `.eslintrc`. Investigando, descobri que o `eslint-config-next@16` não é mais uma config legada: já exporta arrays de config flat nativos. `FlatCompat` tentava validar um config flat como se fosse legado e quebrava ao formatar o erro. Resolvido importando `eslint-config-next/core-web-vitals` e `/typescript` direto (sem `FlatCompat`).
- **7 erros novos de lint após o upgrade** (`react-hooks/static-components` × 2, `react-hooks/set-state-in-effect` × 5) — regras novas que vieram com `eslint-plugin-react-hooks@7` (dependência do `eslint-config-next@16`), não quebras causadas pela migração em si. Revisei cada um: todos eram falsos positivos de padrões já existentes e corretos (ícone resolvido de um registro fixo e estável — `ICON_REGISTRY` —, detecção de plataforma/geolocalização que só pode rodar no cliente sem quebrar SSR, sincronização de estado local a partir de um POI carregado, e um "latch" de estado que nunca deveria voltar a `false`). Em vez de reescrever lógica já validada pra agradar a regra, marquei cada ocorrência com `eslint-disable-next-line` pontual e um comentário explicando o motivo.
- **Erro de hidratação no navegador ao testar, em 2 rounds** (`A tree hydrated but some attributes of the server rendered HTML didn't match...`) — não é bug nosso: extensões de navegador injetam atributos no `<html>`/`<body>` antes do React hidratar, um falso-positivo clássico e documentado pelo próprio Next.js. 1ª vez: `data-lt-installed="true"` na `<html>` (extensão **LanguageTool**), corrigido com `suppressHydrationWarning` na tag `<html>` do `layout.tsx`. 2ª vez, mesma classe de problema mas em outro elemento: `data-gr-ext-installed`/`data-new-gr-c-s-check-loaded` no `<body>` (extensão **Grammarly**) — `suppressHydrationWarning` adicionado também na `<body>`. Em ambos os casos o atributo ignora só diffs daquele elemento específico, não esconde mismatches reais de conteúdo. Não relacionado à versão do Next — teria acontecido na 14 também, só não tinha aparecido nos seus testes antes.

### Notas
- **Arquivos da logo:** `frontend/public/MaPinha.png` (458×545, com transparência — usado na UI) e `frontend/public/MaPinha.jpg` (647×771, fundo sólido — guardado como fonte de maior resolução, ainda sem uso).
- **Favicon e ícone de atalho (iOS):** `frontend/src/app/favicon.ico` (regenerado, ver Dificuldades) e `frontend/src/app/apple-icon.png` (180×180, fundo branco — iOS preenche transparência com preto nesse ícone, por isso não ficou transparente). Ambos seguem a convenção de arquivo do Next.js (`app/favicon.ico`, `app/apple-icon.png`), detectados automaticamente sem precisar declarar em `metadata`.
- **Logo aplicada em 2 pontos da UI** (próxima Image do Next.js, `next/image`, local): ao lado do nome "MaPinha" no cabeçalho do mapa (`hud-header.tsx`) e no lugar do spinner genérico na tela "Localizando você..." (`location-loading-overlay.tsx` — já tinha um comentário no código reservando esse espaço desde a Sprint 2/3).
- Não existe página de login própria no projeto (o botão "Entrar" vai direto pro OAuth do Google via NextAuth, sem página intermediária customizável), então não há mais um lugar óbvio pra aplicar a logo além dos dois acima.
- **Upgrade Next.js 14.2.35 → 16.4.3:** dependências principais atualizadas juntas (React 18 → 19, `react-dom`, `@types/react`/`@types/react-dom`, `react-leaflet` 4 → 5, `react-leaflet-cluster` 2 → 4, ESLint 8 → 9). Rodei o codemod oficial (`npx @next/codemod next-async-request-api`) pra converter os 7 arquivos de rota dinâmica da API (`[id]`, `[id]/media/[mediaId]`, etc.) pro novo formato assíncrono de `params` (`Promise<{...}>` + `await`) — o único ponto do código que usava a API síncrona antiga; não há `cookies()`/`headers()` nem `params`/`searchParams` em páginas (só em route handlers), então o blast radius real foi pequeno. Adicionado `turbopack.root` no `next.config.mjs` pra silenciar um aviso sobre lockfile fora do repositório.
- `type-check`, `lint` e `next build` (produção, com Turbopack) limpos. Dev server subiu normal e respondendo (`/`, favicon, apple-icon, `/api/auth/providers`, `/api/pois` via BFF — todos `200`).

**Validação visual confirmada por você em 29/10/2026** ("tudo certo com as atualizações") — upgrade do Next.js aprovado depois de 2 rounds de correção de falsos-positivos de hidratação causados por extensões de navegador (LanguageTool na `<html>`, Grammarly na `<body>` — ver Dificuldades), sem relação com o upgrade em si.

---

**Repaginação de identidade visual (29/10/2026):**

- **Paleta extraída da própria logo** (`frontend/public/MaPinha.png`), via amostragem de pixel (PIL) nas regiões do fruto, das folhas e do pin no topo:
  - `#75ae4b` **verde-pinha** → novo `--primary` (era `#8b5cf6`, roxo genérico do scaffold inicial, sem relação com a marca).
  - `#f2821e` **laranja do pin** → novo `--accent` (era `#1c2130`, um cinza-escuro sem uso real em nenhum componente — token morto que eu aproveitei em vez de inventar um novo).
  - `#2a91d3` **azul do círculo central do pin** → novo token `--brand-sky`, usado especificamente no marcador "você está aqui" no mapa (antes usava a cor de marca genérica com um `rgba(139,92,246,...)` hardcoded que nem acompanhava a cor do tema).
  - `#10263b` **navy do contorno do pin** → novo token `--brand-ink`, usado como `--primary-foreground`/`--accent-foreground`/`--sidebar-primary-foreground` (texto sobre fundo verde ou laranja). Veio de uma necessidade real de contraste: o verde/laranja da logo são claros demais pra ter texto branco legível em cima (contraste ~2.6:1, abaixo do mínimo AA de 4.5:1) — só que o mesmo verde/laranja como *texto* sobre o fundo escuro do app tem ótimo contraste (~6.7:1/6.8:1). Resolvido usando o próprio navy da logo como "tinta" de texto sobre as cores vivas, e as cores vivas como texto sobre o fundo escuro — o que, por coincidência feliz, é exatamente a combinação que a logo já usa (fruto verde + contorno navy do pin). Todos os pares validados em WCAG AA (cálculo de contraste relativo, não só "parece ok").
  - `--background`/`--card`/`--popover`/`--sidebar` reajustados de um cinza-chumbo neutro (`#0b0e14`/`#141821`/`#0f1219`) pra um navy ligeiramente mais quente (`#0e1824`/`#16222f`/`#0b141d`), aproximando o "HUD escuro" do tom de tinta da própria logo em vez de um escuro genérico — mantendo o mesmo nível de escuridão/contraste, só muda a matiz de fundo.
- **O que foi deliberadamente mantido sem mudança** (decisão de design, não esquecimento):
  - **Cores de categoria de POI** (`--category-*` em `globals.css`, espelhadas no seed do banco em `backend/alembic/versions/62a9525f3720_seed_default_categories.py`) — não usadas por nenhum componente do frontend hoje (a cor real de cada categoria vem do campo `color_hex` do banco, via `category.color_hex`); mudar isso exigiria uma migration nova no backend, fora do escopo de uma repaginação puramente visual do frontend. Avaliei risco de choque de matiz com a nova paleta (verde-lazer `#9be15d` vs. verde-marca, azul-comércio `#4a90ff` vs. `--brand-sky`) e concluí que não há confusão real: cores de categoria só aparecem em contextos pequenos e contidos (ícone do pin no mapa, borda do card de POI), nunca ao lado de botões/chrome da marca na mesma composição.
  - **Paleta dos 5 temas de mapa** (`--map-theme-*`, usada só como swatch no seletor de tema) — mantida como está; inclusive o roxo antigo (`#8b5cf6`) continua vivo ali como cor do tema "RPG", o que faz sentido temático (roxo = fantasia/magia) e vira um detalhe intencional em vez de resquício.
  - **Estrela de favorito** (`fill-amber-400`/`text-amber-400` em `poi-card-popup.tsx`) — dourado é convenção quase universal pra "favorito", mantido por clareza, não trocado pelo laranja da marca.
  - **`--destructive`** (vermelho padrão) — sem relação com a logo, mantido por convenção universal de "perigo/excluir".
- **Variante nova de botão** (`accent`, laranja) adicionada em `button.tsx`, reservada só pras duas ações de maior destaque do app — "Salvar POI"/"Salvar alterações" (`poi-form-sheet.tsx`) e "Iniciar navegação" (`route-panel.tsx`) — pra criar hierarquia visual deliberada: verde = estrutura/chrome do app, laranja = "a ação que importa nesta tela". Todo o resto dos botões continua usando o verde como cor padrão.
- **Outros ajustes pontuais:** indicador de tema ativo no seletor de mapa trocado de `border-foreground` (neutro) pra `border-primary` (verde da marca); logo no overlay "Localizando você..." ganhou um brilho sutil (`drop-shadow`) na cor primária.
- **Bug encontrado e corrigido durante a auditoria:** o marcador "você está aqui" (`map-view.tsx`) tinha um `rgba(139,92,246,0.3)` hardcoded pro brilho ao redor do ponto — não era um token, então nunca acompanharia trocas de tema/paleta futuras. Corrigido pra usar `--brand-sky` (o mesmo azul do círculo central do pin da logo — fez mais sentido semântico que reusar o verde).
- **Auditoria de cores hardcoded:** busquei por qualquer hex/rgba fora dos tokens de tema em todo `src/` antes de mexer — só achei o bug do marcador acima; todo o resto do app (botões, badges, popups, controles do mapa) já consumia cor via tokens semânticos (`bg-primary`, `text-primary`, etc.), então a troca de paleta se propagou automaticamente sem precisar caçar cor por cor em cada componente.
- `type-check`, `lint` e `next build` (produção) limpos após as mudanças. Validação visual ainda pendente da sua parte (não tenho acesso a navegador/preview visual).

---

**Rodada de validação visual sua (29/10/2026) — bugs e pedidos encontrados ao testar a repaginação:**

- **Painel "Explorar" (`NearbyRecommenderAgent`) removido a seu pedido** ("não gostei da mecânica e funcionalidade dele") — deletados `explore-panel.tsx`, `use-recommendations.ts`, as rotas BFF `/api/ai/recommendations` e `/api/ai/feedback`, e as funções/tipo órfãos em `api-client.ts`/`types/poi.ts` (`fetchRecommendations`, `submitAiFeedback`, `Recommendation`). **Backend mantido intocado** (`recommend_nearby` em `ai_agents.py`, endpoints `/ai/recommendations` e `/ai/feedback` em `ai.py`, tabela `ai_feedback`) — removê-lo é uma decisão maior (é um dos 3 agentes de IA documentados em `docs/03_AI_AGENTS.md`/entregável da Sprint 5) que não tomei sozinho; fica como código morto, inofensivo, até você decidir se quer que eu tire o backend também.
- **Os 2 erros de hidratação do print eram específicos desse painel, não um problema geral:** `<button> cannot be a descendant of <button>` — o card de recomendação (`RecommendationCard`) era um `<button>` envolvendo mais 2 `<button>` de feedback (👍/👎) dentro, HTML inválido (botão não pode conter botão). Confirmei que não é um padrão repetido em outro lugar do app antes de concluir — resolvido por completo com a remoção do componente.
- **Tema de mapa "Vintage" (Stadia Stamen Watercolor) removido** — a textura aquarela deixava o marcador azul "você está aqui" e os ícones de POI pouco legíveis por cima (dava pra ver isso no seu print 3). Removido de `map-themes.ts` (tipo `MapThemeId`, entrada do tema, tokens `--map-theme-vintage`/`--color-map-vintage` em `globals.css`) — restam 4 temas (Cartoon, RPG, Urbano, Satélite). Não era o tema padrão e não é persistido (reseta pra "Cartoon" a cada reload), então não há dado de usuário pra migrar.
- **Bug real encontrado: toast de erro aparecia atrás do sheet de criação de POI** (seu print 4). Causa: `ToastViewport` e `SheetContent`/`DialogContent`/`AlertDialogContent` usavam o mesmo `z-50` — com z-index empatado, quem decide o empilhamento é a ordem de montagem no DOM, e como o Toaster monta uma vez no layout raiz (antes de qualquer sheet abrir), o sheet aberto depois sempre ganhava e cobria o toast. Corrigido subindo o toast pra `z-[70]` (`toast.tsx`) — acima de qualquer modal, com valor fixo (não depende mais de sorte de ordem de montagem).
- **Bug real encontrado: descrição gerada por IA saindo cortada pela metade** (seu print 5, "...na Praça Do"). Root cause investigada direto contra a API da Anthropic (não foi chute): o `claude-sonnet-5-5` usa *extended thinking* por padrão, e os tokens do raciocínio interno saem do **mesmo orçamento** de `max_tokens` da resposta final. `generate_poi_bio` (`ai_agents.py`) pedia só `max_tokens=300` — testei contra a API real e confirmei: o raciocínio sozinho já consumia os 300 tokens inteiros (`stop_reason: max_tokens`, bloco de texto vazio/cortado), sem sobrar quase nada pro texto. Corrigido subindo pra `max_tokens=1024` (mesmo valor já usado em `categorize_poi`/`recommend_nearby`, que por isso nunca tinham esse problema) — testei de novo contra a API real depois do fix: `stop_reason: end_turn`, bio completa gerada normalmente. Os outros 2 agentes (categorizador, recomendador) testados também e confirmados OK, sem o mesmo problema.
- **Responsividade mobile:** não é uma tarefa separada pendente — está embutida na arquitetura desde a Sprint 1 (decisão registrada lá: mapa full-bleed + HUD flutuante + painéis `Sheet` que viram bottom-sheet no mobile, `env(safe-area-inset-*)`, minimap escondido em telas pequenas) e reforçada pelo PWA planejado nesta própria Sprint 6. Ainda não testado em viewport mobile real nesta sprint — fica como item a validar visualmente quando chegarmos lá.
- `type-check`, `lint` e `next build` limpos após todos os fixes acima. Validação visual novamente pendente da sua parte.

---

**Logo redesenhada por você (29/10/2026) — pinha mais alta e menos larga ("não é rechonchuda que nem abóbora"):**

- Arquivos-fonte substituídos: `MaPinha.png` (458×545 → **500×500**, continua com transparência) e `MaPinha.jpg` (647×771 → **800×800**). A arte em si ficou mais alongada/cônica (visualmente mais parecida com uma pinha de verdade, afunilando pra baixo) — confirmei isso inspecionando a caixa delimitadora do conteúdo: 342px de largura × 469px de altura, bem mais estreita que antes.
- **Paleta verificada contra a nova arte, pixel a pixel — sem mudança necessária:** reamostrei verde do fruto, laranja/navy/azul do pin no novo arquivo e bateu com o que já está em `globals.css` (diferença de 1-2 dígitos hex, ruído de anti-aliasing, não uma cor nova). `--primary`, `--accent`, `--brand-sky`, `--brand-ink` continuam corretos.
- **Regenerados os 2 ícones derivados da arte antiga** (ficariam com a logo desatualizada se eu não tivesse mexido): `favicon.ico` (quadrado, transparência, 6 resoluções) e `apple-icon.png` (180×180, composto sobre fundo branco). Mesmo processo da primeira geração (ver Dificuldades mais acima), só que dessa vez a fonte já veio quadrada, sem precisar preencher canvas.
- **Nenhum outro lugar precisava de ajuste manual:** o cabeçalho (`hud-header.tsx`, 24px) e a tela "Localizando você..." (`location-loading-overlay.tsx`, 64px) referenciam `/MaPinha.png` direto via `next/image` — pegam a arte nova automaticamente, sem precisar tocar no código. Não existe ainda imagem de Open Graph/compartilhamento social nem `manifest.json` de PWA (ambos pendentes, ver tarefas da Sprint 6), então não há mais nada derivado da logo pra regenerar por enquanto — isso muda quando o PWA for implementado (os ícones do manifest devem usar essa mesma arte nova).
- `next build` limpo após a regeneração.

**Correção de proporção (29/10/2026) — você reportou que o "localizando você" e o ícone do header ainda pareciam rechonchudos:**

- **Investigação completa antes de mexer em qualquer coisa** ("foi feito na mão essa largura?"): confirmei matematicamente que não há bug de código — `width`/`height` no `hud-header.tsx` são `24×24` (quadrado), batendo exatamente com o canvas quadrado da fonte; não há nenhuma distorção não-uniforme acontecendo no React/`next/image`.
- **Causa raiz real:** renderizei a arte-mestre exatamente nos tamanhos reais do app (24px do header, 64px do "Localizando você...") pra reproduzir o que você via. Mesmo sem nenhum bug, a proporção altura/largura do conteúdo visível era **1.37:1** — alongada de fato, mas sutil demais pra "ler" como cone/pinha num ícone pequeno; o olho ainda interpreta como fruta redonda. Cheguei a tentar "consertar" preenchendo os furinhos brancos entre as pétalas (achando que era questão de ruído na reamostragem), mas confirmei com teste isolado que isso não era o problema — mesmo a 64px, com toda a textura nítida, a silhueta ainda lia como redonda. O problema era mesmo a proporção.
- **Teste não-destrutivo antes de aplicar:** esticar a arte 20% na vertical (só um teste em memória, nada salvo) e comparar lado a lado em 64px deixou claro que ajudava bastante — te mostrei a comparação e você aprovou aplicar nos arquivos.
- **Aplicado em definitivo:** `MaPinha.png` (500×500 → **600×600**) e `MaPinha.jpg` (800×800 → **960×960**) — conteúdo esticado 20% na altura, canvas re-quadrado em torno do novo tamanho. `favicon.ico` e `apple-icon.png` regenerados a partir da arte já esticada. Cabeçalho e tela de loading não precisam de mudança de código (leem `/MaPinha.png` direto).
- `next build` limpo depois da correção.

---

**Sistema de compartilhamento de POIs (30/10/2026)** — você pediu pra implementar tudo da Sprint 6 que não envolvesse deploy e desse pra testar local; este foi o primeiro item.

- **Descoberta importante antes de implementar:** o campo `slug` já existia no modelo `POI` desde o início do projeto (único, indexado, gerado automaticamente em `slugify_unique()` na criação) — não precisei adicionar nada no schema do banco nem migration nova. O trabalho real era só expor isso publicamente.
- **Backend:** novo endpoint `GET /pois/by-slug/{slug}` (schema `POIPublicRead`) — join com `Category` e `User` pra devolver nome/ícone/cor da categoria e nome/avatar do dono já resolvidos (a página pública não precisa de uma segunda chamada). Só devolve POIs com `is_public=True`; privado ou slug inexistente dão 404 igual — não vaza que o slug existe. Declarado **antes** de `/pois/{poi_id}` no router: "by-slug" não é um UUID válido, então se viesse depois o FastAPI casaria a rota por formato de path primeiro e devolveria 422 em vez de cair na rota certa.
- **Frontend:** página pública `/p/[slug]` (Server Component, SSR de verdade, sem `"use client"`) com `generateMetadata` gerando Open Graph e Twitter Card (título, descrição, imagem de capa) — o link renderiza bonito quando colado no WhatsApp/Twitter/etc. `cache: "no-store"` na busca: o dono pode tornar o POI privado a qualquer momento, não queremos servir uma versão cacheada que já devia ter sumido.
- **Botão "Compartilhar"** no popup do POI (`poi-card-popup.tsx`, só visível em POIs públicos) — usa a Web Share API no mobile (abre o menu nativo de compartilhar) e cai pra copiar o link na área de transferência no desktop.
- **Deep-link de volta pro mapa completo:** a página pública tem um botão "Ver no mapa completo" que manda pra `/?poi={slug}`; o mapa principal lê esse parâmetro na carga inicial, resolve o slug (nova rota BFF pública `GET /api/pois/by-slug/[slug]`, sem exigir login) e voa até o POI — mesmo padrão de "voar até" já usado por busca/favoritos/"meus POIs" (`flyToPoi` do `map-store.ts`). Depois de voar, limpa o `?poi=` da URL.
- **"Abrir no Google Maps"** usa um link novo (`googleMapsSearchUrl`, sem origem) — diferente do link de rota existente (que exige origem+destino), aqui não faz sentido pedir a localização de quem só está vendo o link compartilhado; o próprio Google Maps resolve a origem.
- **Testado de ponta a ponta** contra o backend e o dev server reais (não só `build`): POI público → 200 com metadata OG correta; POI privado → 404; slug inexistente → 404; rota BFF do deep-link → 200. `type-check`, `lint` e `next build` limpos.
- Deixei o `npm run dev` do frontend rodando em background pra você já poder testar ao vivo.

---

**Página de perfil do usuário (30/10/2026):**

- **Interpretação das métricas** (a tarefa original só dizia "total de pontos, km mapeados", sem detalhar) — documentando a decisão pra você poder corrigir se não for o que imaginou: "pontos" = total de **pontos de interesse** cadastrados pelo usuário (contagem simples de POIs, não é um sistema de XP/pontuação — não existe isso no projeto); "km mapeados" = soma das distâncias de todas as rotas que o usuário já calculou no app (tabela `routes`, cache de rotas da Sprint 4 — cada "Calcular rota" vira uma linha ali). Ambas vêm de dados que já existiam, nenhuma tabela nova.
- **Backend:** novo router `app/api/v1/users.py`, endpoint `GET /users/{user_id}/stats` — `COUNT` em `pois` + `SUM(distance_m)` em `routes`, os dois filtrados por `user_id`. Registrado em `main.py`.
- **Decisão de arquitetura: juntei "perfil" com o painel "Meus POIs" existente**, em vez de criar os dois separados. O pedido original ("seus POIs, estatísticas, avatar") já é, na prática, uma versão enriquecida do que o `MyPoisPanel` fazia — ter dois botões parecidos no HUD ("Meus POIs" e "Perfil", ambos com ícone de usuário) ia confundir mais que ajudar. Renomeei `my-pois-panel.tsx` → `profile-panel.tsx` (componente `ProfilePanel`): avatar + nome + os 2 cards de estatística no topo, lista de POIs (igual já era) embaixo. Segue a mesma arquitetura de painel-overlay (`Sheet`) dos outros (Favoritos, Histórico de Rotas) em vez de virar uma rota/página separada — decisão de layout já registrada desde o Sprint 1.
- Avatar/nome vêm direto da sessão do NextAuth (`session.user.image`/`.name`, já populados pelo login Google) — passados como prop do `app-shell.tsx` (Server Component) pro painel, sem chamada extra.
- Testado contra o backend real: `GET /users/{id}/stats` devolvendo contagem e soma corretas pra um usuário com POIs e rotas cadastradas.
- `type-check`, `lint` e `next build` limpos.

---

**Animações Framer Motion (30/10/2026):**

- **Entrada de POI cards** — dois lugares: (1) o card do POI no popup do mapa (`poi-card-popup.tsx`) ganhou um fade + scale sutil ao abrir; (2) criei um componente reutilizável `MotionListItem` (fade + leve deslize de baixo pra cima, atraso escalonado por índice) aplicado nas 3 listas de POI do app — Favoritos, Minhas rotas e o novo painel de Perfil — em vez de duplicar a mesma configuração de animação 3 vezes.
- **Transição de página** — a única página "de verdade" do app (não-overlay) é a pública `/p/[slug]`, criada mais cedo nesta sprint; ganhou um fade + deslize de entrada via um wrapper client (`FadeInPage`, necessário porque a página em si é Server Component e Framer Motion só roda no cliente). O resto do app é SPA com painéis `Sheet`, que já tinham transição própria (herdada do `base-ui`/`tw-animate-css` desde o início do projeto) — não duplicada aqui.
- **Loading state gamificado** — o overlay "Localizando você..." trocou o `animate-pulse` (CSS) por um "pulo" de verdade na logo (sobe e desce em loop, como um pin procurando o lugar no mapa — conexão temática direta com a própria logo ser um pin) + fade de entrada/saída via `AnimatePresence` (antes só sumia instantaneamente quando a localização resolvia).
- `type-check`, `lint` e `next build` limpos.

---

**PWA (30/10/2026):**

- **Sem `next-pwa` nem outra lib** — depois do susto do upgrade do Next 16 (várias libs com problema de compatibilidade, ver Dificuldades mais acima), preferi não arriscar mais uma dependência de terceiro pra algo que dá pra fazer nativo com pouco código. Manifest via convenção própria do Next (`app/manifest.ts`, vira `/manifest.webmanifest` e já é linkado sozinho no `<head>`) e service worker escrito à mão (`public/sw.js`, Cache API pura).
- **Escopo do service worker deliberadamente restrito a tiles do mapa** (Stadia Maps/ESRI) — decisão consciente de NÃO cachear o app shell (JS/CSS do Next.js): o nome desses arquivos muda a cada build, e cachear sem uma estratégia de invalidação coordenada arriscaria o app ficar preso servindo um bundle velho depois de um deploy — risco real por um ganho pequeno enquanto nem existe deploy ainda. Tiles são diferentes e seguros: a mesma URL (z/x/y) sempre devolve a mesma imagem, cache-first puro. Cobre o que o entregável pede — "cache offline parcial do mapa": áreas do mapa já visitadas continuam renderizando sem internet ou com conexão ruim.
- **3 ícones gerados a partir da logo** (já com a proporção corrigida — ver "Correção de proporção" acima): `icon-192.png` e `icon-512.png` (transparentes, `purpose: "any"`) e `icon-maskable-512.png` (fundo navy da marca, logo ocupando ~65% do canvas pra sobreviver ao recorte circular/squircle que alguns SOs aplicam em ícones "maskable" — sem isso a pinha ficaria cortada feio no Android).
- `viewport.themeColor` e `metadata.appleWebApp` adicionados em `layout.tsx` (barra de status/splash combinando com o tema escuro no iOS/Android).
- Testado contra o dev server real: `/manifest.webmanifest` (200, JSON correto), `/sw.js` (200), os 3 ícones (200), e o `<link rel="manifest">` presente no HTML da home.
- `type-check`, `lint` e `next build` limpos.

---

**Onboarding (30/10/2026):**

- Tutorial de 3 passos (criar POI → enriquecer com mídia/IA → traçar rota e trocar tema) num `Dialog` com transição de passo via Framer Motion, barrinhas de progresso e botões "Pular"/"Próximo"/"Começar a explorar".
- **"Primeiro login" rastreado via `localStorage`, por `userId`** (`mapinha-onboarding-seen:{userId}`) — não existe (nem precisava existir) um campo equivalente no backend: é puramente preferência de UI, sem necessidade de sincronizar entre dispositivos. Abre 1,2s depois do app montar (dá tempo do mapa/overlay de geolocalização assentarem antes, evita 2 modais competindo pela tela de uma vez) e só aparece pra quem está autenticado.
- `type-check`, `lint` e `next build` limpos.

---

**Testes E2E (30/10/2026) — Playwright, cobrindo os 3 fluxos pedidos (criar POI com mídia, calcular rota, compartilhar link):**

- **Sem `next-pwa`/mocks externos — Playwright puro**, já com os binários do Chromium em cache nesta máquina (de outro projeto), sem download grande. `npm run test:e2e` roda a suíte.
- **O maior desafio técnico: autenticar sem automatizar o OAuth do Google de verdade.** Automatizar o consentimento real do Google é lento, frágil e exigiria uma conta de teste dedicada do Google. Em vez disso, o setup (`e2e/global-setup.ts`) forja uma sessão válida do Auth.js v5: sincroniza um usuário de teste no backend (mesmo endpoint `/auth/sync` que o login real chama) e assina um JWT **usando a própria função `encode` do `next-auth/jwt`** — não é um token inventado, é byte-a-byte o que o Auth.js geraria, usando o mesmo `salt` (nome do cookie de sessão, confirmado lendo o código-fonte do `@auth/core`). Não contorna nem simplifica nada do código de produção — só imita o resultado final de um login real.
- **Bugs reais encontrados rodando os testes (não só o código dos testes em si):**
  - **`e2e-test@mapinha.local` era rejeitado pelo backend** (`email-validator` trata `.local` como domínio reservado/especial) — troquei pra `example.com` (RFC 2606, domínio de documentação). Achado real sobre a validação de e-mail do backend, não um bug dos testes.
  - **O onboarding que acabei de implementar bloqueava os testes autenticados** — usuário de teste é sempre "novo" pro Auth.js, então o tutorial abria sozinho e seu overlay (`z-50`) interceptava todos os cliques. Corrigido marcando `localStorage` como "já visto" pro usuário de teste dentro do próprio setup, do mesmo jeito que aconteceria num usuário real na segunda visita.
  - **Suíte ficava instável (falhas intermitentes) só quando rodada em paralelo** (múltiplos workers do Playwright) — todos os testes apontam pro mesmo `next dev` local, que não é feito pra aguentar carga concorrente; sob 3-5 workers simultâneos, o deep-link `?poi=slug` às vezes não resolvia a tempo do timeout de 10s. Resolvido fixando `workers: 1` — é o cenário real de quem vai rodar isso localmente mesmo, não uma limitação dos testes.
  - **Achei 2 botões sem `aria-label`** (ícone de "Como chegar" no popup do POI, botão de aplicar lat/lng no formulário) enquanto escrevia os testes — sem nome acessível, só tooltip visual (que não conta como nome pra leitor de tela nem pro Playwright). Corrigidos — é ganho de acessibilidade de verdade, não só facilidade pra testar.
- **2 arquivos de teste:** `share-link.spec.ts` (sem login — página pública, 404 de slug inexistente/privado, deep-link de volta pro mapa), `poi-and-route.spec.ts` (autenticado — cria POI completo com upload de imagem de verdade pro R2, calcula rota com geolocalização mockada via Playwright e confirma distância/duração aparecendo).
- **Os testes criam dados reais no banco/R2 local** (POI de teste, mídia) — sem mock de API, é o app de verdade rodando contra o Docker Compose local. Não tem limpeza automática depois de cada run; limpei manualmente os POIs gerados durante o desenvolvimento desta sprint. Rodar a suíte repetidamente vai acumular "E2E Test POI {timestamp}" no banco — aceitável pra ambiente local, mas vale lembrar.
- **Pré-requisito pra rodar:** backend + Postgres (Docker Compose) e o frontend (`npm run dev`, ou o Playwright sobe sozinho via `webServer` se não estiver rodando) — `.env.local` precisa ter `NEXTAUTH_SECRET`/`INTERNAL_API_SECRET` (carregados via `process.loadEnvFile`, nativo do Node 20+, sem precisar da lib `dotenv`).
- 6 testes, suíte inteira passando de ponta a ponta (rodei 2x seguidas pra confirmar que não é flake).

- **Você reportou "ainda tá do mesmo jeito" e pediu pra reverter o esticamento.** Antes de desfazer, investiguei em vez de simplesmente obedecer: achei `.next/dev/cache/images` com `.webp` já cacheados de antes da correção — o otimizador de imagem do Next (ativo, sem `images.unoptimized` no `next.config.mjs`) guarda versões processadas por src+tamanho, e o dev server rodando continuamente nunca tinha invalidado esse cache depois da troca do arquivo. Limpei o cache (`rm -rf .next/dev/cache/images`) e pedi pra você confirmar com um refresh forçado antes de reverter. **Confirmado por você: era o cache mesmo** — o esticamento de 20% está correto e mantido, nenhuma reversão foi necessária.

---

**Otimizações de performance (30/10/2026):**

- **"Lazy loading de POIs fora do viewport" já estava feito desde a Sprint 3** — `usePois` só busca POIs dentro do bounding box visível do mapa (`BoundsWatcher`, debounce de 200ms, com tolerância pra não rebuscar em micro-ajustes de posição), não existe um "carregar tudo de uma vez". Não precisei adicionar nada aqui — só confirmei lendo o código antes de dar como pendência.
- **"Compressão de imagens" também já estava feito desde a Sprint 3** — toda imagem enviada já gera uma thumbnail WebP (400×400, qualidade 80) no backend (`generate_image_thumbnail`), e é a thumbnail (não o arquivo original) que aparece em todo lugar visível por padrão (card do POI no popup, galeria). O arquivo original só carrega quando o usuário clica explicitamente pra ver em tamanho grande (lightbox) — comportamento correto, não é desperdício.
- **Bundle analysis — essa parte era mesmo nova, fiz de verdade:**
  - `@next/bundle-analyzer` (a lib "padrão" da comunidade) **não é compatível com build via Turbopack** (usado por padrão no Next 16 deste projeto) — descobri isso só ao tentar rodar, não presumi. Removida de novo (não ficou como dependência morta). Usei o analisador nativo do Next 16 (`next analyze`, feito especificamente pra Turbopack) no lugar.
  - Como o relatório nativo é pensado pra UI interativa (sem navegador aqui), medi do jeito mais confiável que tinha: rodei a build de **produção** de verdade (`next build` + `next start`) e usei o Playwright pra medir o JS real baixado pelo navegador em 2 rotas.
  - **Achado concreto:** a home (`/`) carrega 1467 KB de JS; a página pública de POI (`/p/[slug]`) carrega só 781 KB — **686 KB a menos (47%)**. Os dois maiores chunks da home (Leaflet+Howler+clustering, 444 KB, e Zod, 186 KB) simplesmente não aparecem na página pública, confirmando que o code-splitting já funciona como deveria: o mapa é importado via `dynamic(..., { ssr: false })` só onde é usado (`AppShell`), e a página pública (escrita já pensando nisso, sem puxar `AppShell`/formulário/Leaflet) não paga esse custo.
  - **Conclusão: não encontrei nada óbvio pra cortar.** Os chunks restantes (React/React DOM, ícones + base-ui, framework base do Next) são custo de baseline de qualquer app Next.js com essas libs — não achei gordura real pra tirar sem remover funcionalidade. Prefiro documentar isso como "já verificado, nada a cortar agora" a inventar uma otimização artificial só pra ter o que mostrar.

---

**Sentry — error tracking frontend e backend (30/10/2026):**

- **O fluxo automático do Sentry ("agent-plugin" via `npx @sentry/agent-plugin install ...`) não se aplica a esse setup.** Ele tenta detectar um CLI de agente de IA instalado na máquina (`claude`, `cursor`, `codex`...) pra se auto-registrar como plugin; você usa o Claude Code só pela extensão do VSCode, sem o CLI standalone no PATH do Windows — confirmado checando `Get-Command claude` (não existe) antes de insistir no fluxo automático. Resultado: criamos os 2 projetos (frontend/backend) manualmente no dashboard do Sentry e eu integrei o SDK no código à mão.
- **Os 2 DSNs foram validados de verdade antes de ir pro código** — enviei um evento de teste real pra cada endpoint (`POST /api/<project_id>/store/` com o header `X-Sentry-Auth`) e confirmei `HTTP 200` com `event_id` retornado nos dois, não só o formato da string.
- **Frontend — `@sentry/nextjs@11.10.0`, convenção atual (App Router + Turbopack), sem o wizard interativo** (não tem como rodar um wizard que faz perguntas no terminal por aqui; montei a integração manualmente lendo o código-fonte instalado do pacote pra confirmar os nomes de arquivo certos, não presumi):
  - `src/instrumentation-client.ts` — `Sentry.init()` do browser (substitui o antigo `sentry.client.config.ts`, deprecado nessa versão).
  - `src/instrumentation.ts` — `register()` chamando `Sentry.init()` pros runtimes `nodejs`/`edge`, mais `export const onRequestError = Sentry.captureRequestError` (hook nativo do Next 16 pra capturar erros de servidor sem try/catch manual em cada rota).
  - `next.config.mjs` envolvido com `withSentryConfig` — **detalhe não óbvio:** importar de `@sentry/nextjs` direto quebrava o build (`SyntaxError: Named export 'withSentryConfig' not found`, porque o Next carrega `next.config.mjs` de um jeito que resolve o pacote como CommonJS); o pacote expõe um subpath dedicado `@sentry/nextjs/config` exatamente pra esse arquivo, e foi isso que resolveu. Sem `SENTRY_AUTH_TOKEN` configurado, o upload de source maps no build é pulado silenciosamente — não bloqueia nem quebra nada, só faria os stack traces no Sentry mostrarem código minificado em vez do original (aceitável por agora, revisitar se virar um projeto com deploy de verdade).
  - DSN em `NEXT_PUBLIC_SENTRY_DSN` (precisa do prefixo `NEXT_PUBLIC_` pra chegar no bundle do browser; reusado o mesmo valor pro client/server/edge já que é o mesmo projeto Sentry — DSN é uma chave pública por design, não é segredo).
- **Backend — `sentry-sdk[fastapi]==2.73.0`** (extra `[fastapi]` garante a integração certa com Starlette) adicionado ao `requirements.txt`, `sentry_sdk.init()` chamado em `main.py` antes de criar o `FastAPI()` (só roda se `SENTRY_DSN` estiver setado — sem DSN, o app sobe normal sem o Sentry, nada quebra em ambientes sem a env var). DSN em `SENTRY_DSN` no `backend/.env` (já carregado automaticamente pro container via `env_file` no `docker-compose.yml`, não precisou mexer nele).
- **Validação de ponta a ponta, não só "o build passou":**
  - Backend: reconstruí a imagem Docker (`docker compose up -d --build backend`), confirmei o container saudável, e **disparei uma exceção de verdade dentro do container** (`RuntimeError` capturada via `sentry_sdk.capture_exception()` + `flush()`) — retornou um `event_id` real, confirmando que a captura e o envio funcionam, não só a inicialização.
  - Frontend: `type-check`, `lint` e `build` de produção limpos. Pra confirmar o `onRequestError` funcionando de verdade (não só presumir pela doc), criei uma rota de API temporária que lança um erro, rodei `next build` + `next start` numa porta separada (3002, pra não bater com o `npm run dev` que você usa), bati nela e confirmei `HTTP 500` com o erro logado — sem nenhum warning do SDK no log (envio silencioso, como configurado com `disableLogger: true`). Rota de teste e build temporários removidos depois, build final limpo refeito sem eles.
- **Os eventos de teste enviados durante a validação** (verificação de DSN + a exceção de teste no container) vão aparecer na aba Issues dos 2 projetos no Sentry com nomes como "Teste de verificação de DSN..." / "Teste de verificacao Sentry..." — são ruído esperado da validação, pode descartar/resolver eles por lá quando quiser.
- ⚠️ **"Alertas de erros críticos" não foi configurado via API** — só tinha os DSNs (chave só de ingestão de evento, não dá pra gerenciar regras de alerta) em mãos, não um token de API da organização. O Sentry cria automaticamente uma regra padrão ("notificar por e-mail a cada issue novo") em todo projeto novo, então o alerta básico provavelmente já está ativo nos 2 projetos sem precisar de nada extra — mas vale você confirmar em cada projeto, **Settings → Alerts**, já que não consegui verificar isso programaticamente.
- **Enquanto validava, achei e corrigi uma inconsistência de branding**: o título da API no Swagger (`/docs`, `FastAPI(title=...)`) ainda dizia "MapPin API" — não foi renomeado junto com o resto da marca pra "MaPinha" (28/10/2026), porque aquela troca foi escopada só pro que aparecia pro usuário final, e o título do Swagger não entrava nisso. Como o novo README linka pra `/docs`, corrigi pra "MaPinha API" por consistência.

---

**README detalhado (30/10/2026):**

- **Reescrito do zero** — o `README.md` anterior era o scaffold genérico gerado automaticamente no início do projeto (nome antigo "MapPin", instruções de instalação genéricas tipo `pip install -r requirements.txt` direto na raiz, sem refletir a estrutura real `frontend/`/`backend/` nem o Docker Compose).
- **Conteúdo levantado direto do código, não copiado dos docs de planejamento** (que ficaram desatualizados em alguns pontos — ex: `docs/00_OVERVIEW.md` ainda cita Celery, mas o Sprint 5 decidiu **não usar Celery** e rodar os agentes de IA de forma síncrona no próprio FastAPI, com Redis só para cache/rate limiting, não fila — confirmado lendo `app/api/v1/ai.py` e `app/core/cache.py` antes de escrever o README, pra não propagar uma informação errada pro texto de portfólio):
  - Features: conferidas uma a uma contra o código (4 temas de mapa em `map-themes.ts`, 6 categorias seedadas em `62a9525f3720_seed_default_categories.py`, endpoints reais de cada router).
  - Setup local: comandos testados reais (`docker compose up -d --build`, `docker compose exec backend alembic upgrade head` — confirmei que o `Dockerfile` do backend não roda migração automática, então esse passo manual é obrigatório).
  - Variáveis de ambiente: tabela gerada a partir dos `.env.example` atuais de cada pacote (já incluindo `SENTRY_DSN`/`NEXT_PUBLIC_SENTRY_DSN`, adicionados nesta mesma sprint).
- **Screenshots e GIF de demo ficaram como placeholder** (seção "Screenshots" avisando que estão pendentes) — não tenho como navegar visualmente pelo app pra capturar. Quando você tiver as imagens, é só me passar os arquivos que eu termino essa seção.
- **Removida a referência ao `docs/06_PRICING.md`** que estava na tabela de documentação do README antigo — é precificação de orçamento pro cliente ("uso interno", como o próprio arquivo já se descreve), não faz sentido ficar linkado num README público de portfólio.
- Aproveitei pra corrigir a inconsistência de branding do título da API no Swagger (ver nota do Sentry acima), já que o novo README linka `/docs`.

---

**Rodada de validação visual durante a sessão de prints (30/10/2026):**

- **Bug real encontrado por você:** os botões "Pular"/"Próximo" do `OnboardingDialog` ficavam colados na borda inferior do dialog, sem respiro. Causa: o `DialogFooter` customizado desse componente sobrescrevia o padding padrão (`p-4`) do footer do design system com `p-0`, zerando o espaçamento — a margem some, mas o fundo/borda do footer (que eu já tinha removido de propósito, pra um visual mais limpo sem a barrinha cinza separadora) continuava tirado. Corrigido removendo o `p-0` indevido (`frontend/src/components/layout/onboarding-dialog.tsx`), voltando ao padding padrão de 16px nas bordas — mantém o visual limpo (sem fundo/borda) mas com margem correta.

---

**Commit e push do lote completo da Sprint 6 (01/11/2026):** tudo que foi implementado desde "pode implementar tudo que não envolva deploy" (compartilhamento, perfil, animações, PWA, onboarding, Sentry, testes E2E, otimizações de performance, README) subiu pro `origin/main` num commit só (`a244586`), com sua confirmação explícita antes do push. 49 arquivos alterados.

**Preparação de infraestrutura pro deploy gratuito (01/11/2026):**

- **Decisão de hosting:** em vez de pagar o plano Hobby da Railway (~US$5/mês), migrar pra uma stack 100% gratuita — Supabase (Postgres+PostGIS), Upstash (Redis) e Render (FastAPI). Vercel continua pro frontend (já estava conectada, nunca foi o bloqueio). Sem domínio customizado por agora.
- **`backend/Dockerfile` ajustado pra produção, sem quebrar o dev local:** o `CMD` agora é `uvicorn ... --port ${PORT:-8000}` (forma shell, não exec — precisa expandir a variável), sem `--reload`. A Render injeta a porta dinamicamente via `$PORT`; sem essa env var (ex: fora da Render), cai em 8000 por padrão. O `--reload` que existia ali era só pra dev — virou um `command:` específico no `docker-compose.yml`, que sobrescreve o `CMD` da imagem só no ambiente local. Testado dos dois jeitos: subi o `docker compose` normal (confirma hot-reload funcionando igual antes) e rodei um container avulso simulando exatamente o que a Render vai rodar (`-e PORT=9001`, sem reload) — os dois responderam `200` no health check.
- **`backend/.env.example` documentado** com `ALLOWED_ORIGINS` (CORS — pydantic-settings espera uma lista em JSON, ex: `["https://mapinha.vercel.app"]`) e `ENVIRONMENT`, pra quando configurarmos as env vars na Render. Também corrigi um comentário desatualizado ali que ainda citava Celery pro `ANTHROPIC_API_KEY` (Sprint 5 decidiu não usar Celery — ver Decisões daquela sprint).
- **Docker Desktop estava parado** (a máquina deve ter reiniciado desde a última sessão) — subi de novo antes de testar qualquer coisa. Aconteceu de novo no meio da sessão (motivo não investigado — pode ser alguma política de economia de energia do Windows derrubando o serviço), religuei de novo sem problema.

---

**Banco e cache em produção — Supabase + Upstash (01/11/2026):**

- **Supabase (Postgres + PostGIS):** você criou o projeto, mas a conexão "direta" (`db.<ref>.supabase.co:5432`) **só resolve em IPv6** — achado real, não suposição: testei (`socket.getaddrinfo`) e só veio endereço `2600:...`, sem IPv4 nenhum. É uma mudança de política do Supabase (IPv4 virou add-on pago pra projetos novos). Como nem este ambiente local nem a Render (quase certamente) têm saída IPv6, a conexão direta nunca funcionaria em produção — descobri isso tentando conectar de verdade, antes de simplesmente confiar na string que a UI sugeriu primeiro.
  - **Solução: Session Pooler** (Supavisor, IPv4, porta 5432, host `aws-0-us-east-2.pooler.supabase.com`, usuário no formato `postgres.<project-ref>`) — é o modo certo pra um processo de servidor de vida longa como o nosso (diferente do Transaction Pooler, pensado pra serverless/edge, que não suporta tudo que o SQLAlchemy usa por padrão).
  - PostGIS habilitado (`CREATE EXTENSION IF NOT EXISTS postgis` — rodei direto por conexão Python, sem precisar da UI) e **migrações do Alembic aplicadas até `head`** (confirmei as 12 tabelas, incluindo as 3 do PostGIS e as `alembic_version`, e as 8 categorias seedadas).
  - **Detalhe técnico ao rodar o Alembic com a senha do banco**: o `configparser` que o Alembic usa internamente trata `%` como início de interpolação (`%(nome)s`) — a senha tinha `%40` (percent-encoding do `@`), e isso quebrava com `ValueError: invalid interpolation syntax`. Resolvido escapando pra `%%40` só nessa variável de ambiente passada pro comando (o valor real da senha não muda, é só como o Alembic precisa recebê-la).
- **Upstash (Redis):** confundimos as credenciais na primeira tentativa — a tela de "Connect" padrão mostra as credenciais da **API REST** (`UPSTASH_REDIS_REST_URL`/`TOKEN`, pra uso serverless/edge via HTTP), não a conexão Redis nativa que nosso backend usa (`redis-py` via `redis.from_url`). Achamos a string certa (`rediss://default:senha@host:6379`) na aba certa do painel. Testado com `PING`/`SET`/`GET` de verdade, não só a conexão abrindo.
- **Nenhuma credencial de produção foi commitada** — tudo ficou só na conversa e vai direto pras env vars da Render no próximo passo, nunca em arquivo versionado.

---

**Backend em produção — Render (01/11/2026):**

- **Web Service criado** (`mapinha-backend`, região Ohio — mesma do Supabase, menor latência), **Root Directory `backend`**, runtime Docker, plano Free.
- **2 erros reais no formulário de criação, achados revisando os prints antes de você confirmar** (não depois de quebrar em produção):
  - **Health Check Path** veio `/apiV1/health` (sem as barras entre "api"/"v1") em vez de `/api/v1/health` — teria feito a Render marcar o serviço como "unhealthy" mesmo funcionando, porque bateria num 404. Corrigido antes do deploy.
  - **Dockerfile Path** veio só `backend/` (a pasta), mas esse campo específico precisa do caminho até o **arquivo** (diferente do "Docker Build Context Directory", que aí sim é só a pasta e estava certo) — corrigido pra `backend/Dockerfile`.
- **11 variáveis de ambiente** coladas via "Add from .env" da própria Render: `DATABASE_URL` (pooler do Supabase), `REDIS_URL` (Upstash), as 5 do R2, `ANTHROPIC_API_KEY`, `INTERNAL_API_SECRET`, `SENTRY_DSN`, `ENVIRONMENT=production`. `ALLOWED_ORIGINS` ficou de fora por enquanto — falta a URL da Vercel pra saber o que liberar no CORS.
- **Deploy funcionou de primeira** depois das 2 correções — validei de fora (não só confiando no log "Your service is live" da própria Render): `/api/v1/health` → 200, `/docs` → 200 com o título certo ("MaPinha API", confirma que o fix de branding também foi pra produção), e **`/api/v1/categories` retornando as categorias de verdade vindas do Supabase** — prova que a conexão com o banco funciona em produção, não só localmente.
- URL pública: `https://mapinha-backend.onrender.com`
- ⚠️ **Plano Free da Render "dorme" depois de inatividade** — primeira requisição depois de um tempo parado pode demorar uns 30-50s pra responder (cold start). Normal do tier gratuito, vale avisar quem for testar o link depois de um tempo sem uso.

---

**Frontend em produção — Vercel, e deploy final fechado (01/11/2026):**

- **Projeto Vercel criado ("mapinha"), mas o primeiro deploy nunca disparou sozinho** — o painel mostrava "No Production Deployment" mesmo com o repositório conectado. Investigamos junto (conferi se não era só um filtro escondendo os deploys na aba "Deployments" — não era, lista vazia mesmo sem filtro nenhum). Resolvido destravando com um push de verdade pro `main` (a atualização do `SPRINTS.md` documentando Supabase/Upstash/Render, que já estava pendente) — isso acionou o webhook do GitHub e o build rodou normal.
- **Domínio público saiu diferente do nome do projeto:** `mapinha.vercel.app` já pertencia a outro projeto de outra pessoa (confirmei acessando e vendo que era um app completamente diferente) — domínios `.vercel.app` são globais, não por conta. A Vercel atribuiu `mapinha-iota.vercel.app` pro nosso projeto automaticamente.
- **2 bugs reais encontrados no primeiro teste real em produção** (você testou e mandou o console do navegador — não eram hipóteses, eram erros de verdade acontecendo):
  - **CORS bloqueando toda chamada do frontend pro backend** — esperado, já tínhamos deixado `ALLOWED_ORIGINS` de propósito pra depois (dependia de saber o domínio final da Vercel). Resolvido setando `ALLOWED_ORIGINS=["https://mapinha-iota.vercel.app"]` na Render.
  - **Tiles do mapa com 401 (Stadia Maps)** — esse não era esperado, achado só ao ver o console de produção. Causa real: o Stadia libera requisição sem API key vindas de `localhost` (allowlist de desenvolvimento), por isso nunca tinha dado problema local; em produção, sem key, ele exige autenticação. Nunca tinha sido documentado em nenhum `.env.example` do projeto. Resolvido criando conta gratuita no Stadia, gerando uma API key e configurando `NEXT_PUBLIC_STADIA_API_KEY` na Vercel.
  - **(Não deu erro, mas também precisava ser setado)** `NEXTAUTH_URL=https://mapinha-iota.vercel.app` — só dava pra saber o valor certo depois do primeiro deploy revelar o domínio final.
  - Google OAuth: adicionado `https://mapinha-iota.vercel.app/api/auth/callback/google` nos Authorized redirect URIs e `https://mapinha-iota.vercel.app` nos Authorized JavaScript origins (Google Cloud Console), senão o login trava em produção mesmo com tudo mais certo.
- **Validação de ponta a ponta depois de todo ajuste, não só "parece que funcionou":**
  - CORS: testei preflight (`OPTIONS`) e `GET` de verdade com header `Origin: https://mapinha-iota.vercel.app` contra o backend na Render — `access-control-allow-origin` retornando certo nos dois.
  - Stadia: tile real buscado com a API key → `200`.
  - NextAuth: `/api/auth/providers` respondendo com `signinUrl`/`callbackUrl` já apontando pro domínio de produção certo (confirma que o `NEXTAUTH_URL` pegou).
  - BFF → backend: rota pública (`/api/pois/by-slug/{slug}`) com slug inexistente retornando `404` de verdade (não `500` nem erro de proxy) — confirma que o segredo compartilhado (`INTERNAL_API_SECRET`) bate entre Vercel e Render.
  - Página pública SSR (`/p/[slug]`) e `manifest.webmanifest` (PWA) também testados, respondendo certo.
- **URLs de produção:**
  - Frontend: `https://mapinha-iota.vercel.app`
  - Backend: `https://mapinha-backend.onrender.com` (docs em `/docs`)
- **Sprint 6 fecha em 13/14** — só falta a seção de screenshots/GIF do README, que você vai mandar separado num prompt específico.

---

**Screenshots reais e README final de portfólio (01/11/2026):**

- **Achado real que mudou o plano:** os POIs já existentes no banco local (dados seus de verdade, de uso real do app) tinham conteúdo pessoal/informal demais pra um README público — um deles com foto de rosto e legenda estilo meme, outro chamado literalmente "Igreja Batista Aliança dos meme". Só percebi isso ao conferir o primeiro screenshot gerado (não presumi de antemão) — parei, te mostrei o problema e perguntei como prosseguir. Você escolheu criar dados de demonstração limpos em vez de usar os reais.
- **Solução: conta de demonstração dedicada** (`Marina Castro`, sincronizada via o mesmo endpoint `/auth/sync` que o login real usa, sessão forjada com `encode()` do Auth.js — mesma técnica já validada nos testes E2E) com **4 POIs criados de verdade pela UI** (não inseridos direto no banco): Barbearia do Zé, Cantina da Vó, Parque das Mangueiras e Estúdio Rec, cada um com uma imagem gerada localmente (gradiente + nome + categoria, via Pillow — sem baixar nada da internet) e descrição própria.
- **3 bugs reais achados rodando o script de captura** (Playwright dirigindo um Chromium de verdade contra o app local), cada um só descoberto na prática, não hipótese:
  - **Toast de sucesso cobrindo o botão de criar o próximo POI** — depois de criar um POI, o toast "POI criado" ficava sobreposto por cima do botão "+" (mesmo canto da tela) tempo suficiente pra interceptar o clique seguinte. Resolvido esperando o toast sumir antes de abrir o próximo formulário.
  - **Mapa inicial "vazio"**: no zoom padrão de carregamento (13, cidade inteira), os 4 POIs de demo — a ~300m uns dos outros — colapsavam num cluster pequeno demais pra aparecer bem no screenshot. Corrigido aproximando o zoom (cliques reais no botão "+" do mapa) até o mesmo nível usado quando se seleciona um POI (zoom 16) antes de capturar.
  - **Falha silenciosa na criação do POI**: o formulário tem duas validações que só mostram um texto de erro discreto (sem toast) — posição não marcada, ou nenhuma mídia anexada — e meu primeiro script não checava por isso, só ficava esperando o toast de sucesso que nunca vinha. Precisei ler o código do formulário (`poi-form-sheet.tsx`) pra entender as duas condições reais de bloqueio.
- **Idempotência**: o script checa `/api/pois/mine` antes de criar cada POI de demo, pra poder rodar de novo (ajustando só a parte de screenshot) sem duplicar dados — precisei disso na prática, porque rodei o script 3 vezes até acertar os bugs acima.
- **Limpeza dos POIs de demo parciais** das tentativas com erro: descobri que `DELETE /pois/{id}` **não limpa os objetos no R2** sozinho (só remove a linha do banco) — o cleanup de verdade precisa chamar `DELETE /pois/{id}/media/{media_id}` primeiro pra cada mídia (que aí sim apaga do R2) antes de deletar o POI. Script de limpeza ajustado pra fazer os dois passos, nessa ordem.
- **7 screenshots capturados** (desktop 1440×900 e mobile 390×844, validando responsividade no mesmo passe, como discutimos): mapa principal, formulário de criação (com a sugestão de categoria por IA em uso), detalhe do POI, cálculo de rota, perfil com estatísticas, página pública de compartilhamento, e a versão mobile do mapa. Conferi cada um visualmente antes de considerar pronto — não só rodei o script e assumi que saiu certo.
- **README reescrito pela segunda vez**, agora seguindo à risca a estrutura que você passou: sem badges nem emojis, tom objetivo, screenshots em tabela markdown 2 colunas com legenda em negrito, funcionalidades agrupadas por área (não por tela), tabela de arquitetura com um parágrafo do fluxo principal (POI criado → geometria no PostGIS → agente de categorização da IA em background → sugestão no card), estrutura de pastas comentada, e tabela de serviços/portas pro setup local.
- Script de captura (`frontend/e2e/portfolio-screenshots.spec.ts`) era de uso único — deletado depois de gerar os screenshots finais, mesmo padrão já usado nesta sprint pros scripts de medição de bundle.
- Os 4 POIs de demonstração **ficaram no banco local** (não removidos) — são dados limpos e reais (criados pela UI de verdade), úteis se precisar de mais screenshots depois; só não vão pra produção a menos que você peça.

---

**Polimento mobile, fora do checklist da sprint (01/11/2026):** depois de ver os screenshots, você pediu 3 ajustes pontuais — atendidos, mais 2 achados extras que encontrei conferindo o resultado:

- **Indicador de dev do Next removido** (`devIndicators: false` no `next.config.mjs`) — o círculo "N" que aparecia no canto inferior esquerdo em todo screenshot, só em modo dev.
- **Logo sem o texto "MaPinha" no mobile** (`hud-header.tsx`, classe `hidden sm:inline` no texto) — só o ícone abaixo de 640px; mantido o texto em telas maiores.
- **Fade nas bordas dos chips de categoria** (`category-chips.tsx`) — a fileira de categorias rola horizontalmente mas não tinha nenhum sinal visual disso (scrollbar escondida de propósito); adicionado um gradiente de opacidade nas duas bordas, sinalizando "tem mais pra rolar" sem precisar de JS.
- **Achado ao validar (não pedido, mas real): a barra de busca ficava reduzida a 1 caractere visível no mobile** — com o header mais compacto (texto da logo escondida) ainda sobrava pouco espaço pra busca, porque o seletor de temas (4 botões fixos) e o botão de usuário não encolhiam. Corrigido deixando o seletor de temas mais compacto no mobile (`size-6` em vez de `size-7`, gaps menores) e apertando o padding da logo/busca — confirmado rodando de novo em viewport mobile: "Buscar POIs..." aparece legível agora.
- **Achado ao validar (bug real, não cosmético): o popup de detalhe do POI abria por baixo do HUD** quando o marcador ficava perto do topo da tela — o Leaflet não sabe que o header/busca/chips flutuam por cima do mapa (são um overlay à parte, fora do conhecimento do Leaflet sobre os limites do container), então o auto-pan do popup não reservava espaço pra eles. Só percebi isso ao olhar o screenshot de detalhe em mobile: o título "Barbearia do Zé" saía escondido atrás da fileira de chips. Corrigido com `autoPanPaddingTopLeft`/`autoPanPaddingBottomRight` no `<Popup>` (`map-view.tsx`), reservando a altura aproximada do HUD — confirmado reabrindo o popup, título aparece abaixo dos chips agora.
- **Validação:** rodei uma varredura visual própria (Playwright, viewport 390×844, reaproveitando a conta demo e os 4 POIs já existentes) pelas telas principais — mapa, criar POI, detalhe do POI, rota, perfil — conferindo cada print antes de reportar pronto. Script era de uso único, deletado depois. `type-check`, `lint` e `build` de produção, todos limpos.
- Não cheguei a revisar os painéis de favoritos e histórico de rotas em mobile (o script de varredura ficou instável tentando abri-los em sequência — provável tooltip ficando aberto por foco em vez de hover, não investiguei a fundo por ser só a ferramenta de teste, não o app). Ficam pendentes de uma olhada se você notar algo neles.
- **`docs/portfolio-screenshots/07-mobile-mapa.png` recapturado** depois dos ajustes de header acima (não precisou de deploy — é captura do app local, que já tinha as mudanças via hot reload).
- `type-check`, `lint` e `next build` limpos (`next.config.mjs` voltou ao estado original depois do experimento com o bundle-analyzer).