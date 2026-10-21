# SPRINTS — MapPin

Este arquivo acompanha a execução do projeto, sprint por sprint, espelhando o cronograma definido em [docs/04_TIMELINE.md](docs/04_TIMELINE.md). Cada sprint corresponde a uma fase do planejamento original.

**Legenda de status:** 🔜 Não iniciado · 🚧 Em andamento · ✅ Concluído · ⏸️ Bloqueado

Cada sprint tem três seções próprias, atualizadas conforme avançamos:
- **Decisões e Pendências** — escolhas que precisam da sua confirmação (configs, contas, anexos, credenciais)
- **Dificuldades** — obstáculos encontrados durante a execução e como foram resolvidos
- **Notas** — observações relevantes para quem revisar depois

---

## Sprint 1 — Setup, Design System e Infraestrutura Base

**Status:** 🚧 Em andamento · **Duração estimada:** 10 dias

### Tarefas
- [x] Configurar monorepo: Next.js 14 + FastAPI + Docker Compose local
- [x] Setup PostgreSQL local com extensão PostGIS habilitada
- [~] Configurar GitHub Actions: lint, type-check, deploy automático Vercel + Railway (CI de lint/type-check pronto; deploy automático será via integração nativa Vercel/Railway + GitHub, não via Actions — ver Notas)
- [ ] Criar design system gamificado: paleta de cores (5 temas de mapa), tipografia (fonte pixelada + sans-serif funcional), tokens de design no Tailwind
- [ ] Configurar shadcn/ui com tema customizado (dark/light gamificado)
- [ ] Setup Cloudflare R2: bucket, CORS, política de acesso público para mídia
- [ ] Implementar NextAuth.js v5: OAuth Google + Credentials, sessão JWT
- [ ] Criar layout base do app: sidebar, header gamificado, área do mapa
- [ ] Definir e documentar schema do banco: tabelas users, poi, poi_media, routes, categories

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
| Domínio customizado | ⏳ Não levantado | Sprint 6 (opcional) |
| Conta Sentry | ⏳ Não levantado | Sprint 6 (opcional) |
| Giphy API Key | ⏳ Não levantado | Opcional — MVP usa URL externa de GIF, sem key |
| Stadia Maps / MapTiler API Key | ⏳ Não levantado | Opcional — tema padrão usa CartoDB, sem key |

- ⏳ **Pendente — você:** me passar a URL do repositório remoto no GitHub para eu conectar (`git remote add origin ...`) e dar o primeiro push
- ⏳ **Pendente — você:** confirmar se já criou o serviço PostgreSQL no Railway e se conseguiu habilitar PostGIS nele (risco técnico 2 do `docs/00_OVERVIEW.md`) — se não tiver certeza, posso te guiar no passo a passo
- ⏳ **Pendente — você:** preencher `backend/.env` (R2 + Anthropic) e `frontend/.env.local` (Google OAuth + NEXTAUTH_SECRET) com os valores reais — arquivos já criados localmente (ignorados pelo git), só faltam os valores

### Dificuldades
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

---

## Sprint 2 — Mapa Interativo e Temas Visuais

**Status:** 🔜 Não iniciado · **Duração estimada:** 14 dias

### Tarefas
- [ ] Integrar React-Leaflet com Next.js 14 (SSR disabled para componente de mapa)
- [ ] Implementar sistema de temas de tileset: Cartoon (CartoDB Voyager), RPG (Stadia Alidade Smooth Dark customizado), Vintage (Stamen Toner/Watercolor), Urbano (CartoDB Positron), Satélite (ESRI)
- [ ] Criar componente de switcher de tema com animação Framer Motion (transição suave entre tilesets)
- [ ] Implementar geolocalização: obter posição atual do usuário, centralizar mapa, ícone de avatar do usuário no mapa
- [ ] Desenvolver sistema de ícones gamificados por categoria (SVG customizados, estilo pixel art/cartoon)
- [ ] Implementar Leaflet.markercluster para agrupamento visual de POIs densos
- [ ] Criar minimap HUD no canto inferior direito (estilo videogame) usando Leaflet Control
- [ ] Implementar controles de zoom gamificados substituindo UI padrão do Leaflet
- [ ] Adicionar compass/rosa dos ventos animada no mapa
- [ ] Setup React Query + Zustand para estado global do mapa (bounding box atual, tema ativo, POIs carregados)

### Entregáveis
- Mapa interativo funcionando com 5 temas visuais intercambiáveis via UI
- Geolocalização do usuário com ícone de avatar no mapa
- Sistema de clustering de markers funcionando
- Minimap HUD e controles gamificados implementados
- Performance: mapa carregando em menos de 2s na primeira visita

### Decisões e Pendências
_(a levantar quando chegarmos nesta sprint)_

### Dificuldades
_(nenhuma registrada ainda)_

### Notas
_(nenhuma ainda)_

---

## Sprint 3 — CRUD de POIs e Upload de Mídia

**Status:** 🔜 Não iniciado · **Duração estimada:** 16 dias

### Tarefas
- [ ] Desenvolver endpoints FastAPI: POST /pois, GET /pois (com filtros geoespaciais ST_DWithin), GET /pois/{id}, PUT /pois/{id}, DELETE /pois/{id}
- [ ] Implementar query geoespacial: buscar POIs pelo bounding box atual do mapa (ST_MakeEnvelope)
- [ ] Criar endpoint de presigned URL para upload no R2: POST /media/presigned-url
- [ ] Implementar processamento de imagens com Pillow: resize automático, geração de thumbnail, compressão WebP
- [ ] Desenvolver formulário de criação de POI: modal com drawer lateral, validação Zod, preview em tempo real no mapa
- [ ] Implementar upload multi-mídia no frontend: drag-and-drop de imagem/GIF, gravação/upload de áudio via Web Audio API, preview antes de salvar
- [ ] Criar componente POI Card: popup no mapa com avatar animado, reprodução de áudio (Howler.js), exibição de GIF
- [ ] Implementar sistema de categorias: CRUD de categorias com ícone e cor customizáveis
- [ ] Adicionar busca de POIs: SearchBar com autocomplete por nome e categoria
- [ ] Desenvolver painel lateral de detalhes do POI: informações completas, mídia, localização, ações

### Entregáveis
- CRUD completo de POIs funcionando com persistência no PostgreSQL+PostGIS
- Upload de imagem, GIF e áudio funcionando via Cloudflare R2
- Formulário de criação de POI com preview em tempo real no mapa
- POI Card com popup rico: avatar, GIF animado, player de áudio
- Busca de POIs por nome e categoria funcionando

### Decisões e Pendências
_(a levantar quando chegarmos nesta sprint)_

### Dificuldades
_(nenhuma registrada ainda)_

### Notas
_(nenhuma ainda)_

---

## Sprint 4 — Sistema de Rotas e Integração Google Maps

**Status:** 🔜 Não iniciado · **Duração estimada:** 10 dias

### Tarefas
- [ ] Integrar OSRM API (gratuita, open-source): endpoint FastAPI proxy para calcular rota entre dois pontos
- [ ] Implementar exibição de rota no mapa Leaflet: polyline com estilo gamificado (linha tracejada animada estilo videogame)
- [ ] Criar painel de informações de rota: distância em km, tempo estimado (carro/a pé), turn-by-turn simplificado
- [ ] Desenvolver deep-link para Google Maps: montar URL google.com/maps/dir/ com origem e destino, abrir em nova aba
- [ ] Implementar deep-link para Apple Maps (detecção de iOS via user-agent)
- [ ] Criar botão 'Como Chegar' em cada POI com opções: navegar no app ou abrir no Google/Apple Maps
- [ ] Implementar cache Redis para rotas frequentes (origem-destino já calculados)
- [ ] Adicionar indicador visual de rotas salvas: histórico de rotas do usuário
- [ ] Desenvolver modo de navegação simplificado: seguir a rota com geolocalização em tempo real (watchPosition)

### Entregáveis
- Cálculo de rotas funcionando via OSRM com exibição visual no mapa
- Painel de rota com distância, tempo e instruções simplificadas
- Deep-link para Google Maps e Apple Maps funcionando em todos os dispositivos
- Cache de rotas no Redis implementado
- Modo de navegação básico com atualização de posição em tempo real

### Decisões e Pendências
_(a levantar quando chegarmos nesta sprint)_

### Dificuldades
_(nenhuma registrada ainda)_

### Notas
_(nenhuma ainda)_

---

## Sprint 5 — Agentes de IA e Features Inteligentes

**Status:** 🔜 Não iniciado · **Duração estimada:** 10 dias

### Tarefas
- [ ] Setup Celery worker no Railway com broker Redis para tarefas assíncronas
- [ ] Implementar POICategorizerAgent: integração Claude API, lógica de mapeamento de categoria para ícone do sistema
- [ ] Implementar POIBioWriterAgent: endpoint /pois/generate-bio, integração com formulário de criação via botão
- [ ] Implementar NearbyRecommenderAgent: endpoint /pois/recommendations com contexto de localização e histórico
- [ ] Criar UI para recomendações: painel lateral 'Explorar' com cards animados de sugestões
- [ ] Implementar feedback loop: usuário avalia sugestão (útil/não útil) para melhorar recomendações futuras
- [ ] Adicionar indicador visual quando IA está processando (skeleton loader gamificado)
- [ ] Implementar rate limiting nas chamadas à Claude API para controle de custos

### Entregáveis
- 3 agentes de IA funcionando: categorizador, bio writer e recomendador
- Celery worker deployado no Railway processando tarefas assíncronas
- UI de recomendações 'Explorar' com cards de sugestões personalizadas
- Rate limiting e controle de custos da API Claude implementados

### Decisões e Pendências
_(a levantar quando chegarmos nesta sprint)_

### Dificuldades
_(nenhuma registrada ainda)_

### Notas
_(nenhuma ainda)_

---

## Sprint 6 — Compartilhamento, Polimento Visual e Deploy Final

**Status:** 🔜 Não iniciado · **Duração estimada:** 10 dias

### Tarefas
- [ ] Implementar sistema de compartilhamento: gerar slug único para POI público, page de POI pública com SSR (SEO)
- [ ] Criar página de perfil do usuário: seus POIs, estatísticas (total de pontos, km mapeados), avatar
- [ ] Adicionar animações Framer Motion: transições de página, entrada de POI cards, loading states gamificados
- [ ] Implementar PWA: manifest.json, service worker para cache offline do mapa, ícone de instalação
- [ ] Criar página de onboarding: tutorial interativo de 3 passos ao primeiro login
- [ ] Configurar Sentry: error tracking frontend e backend, alertas de erros críticos
- [ ] Realizar testes E2E dos fluxos principais: criar POI com mídia, calcular rota, compartilhar link
- [ ] Otimizações de performance: lazy loading de POIs fora do viewport, compressão de imagens, bundle analysis
- [ ] Criar README detalhado com screenshots, GIFs e instruções de deploy (essencial para portfólio)
- [ ] Deploy final revisado em produção com domínio customizado

### Entregáveis
- Sistema de compartilhamento de POIs com URLs públicas e SEO
- PWA instalável funcionando em mobile com cache offline parcial
- Aplicação deployada em produção com domínio customizado
- README de portfólio com screenshots, demo GIF e documentação técnica completa
- Monitoramento Sentry ativo em produção

### Decisões e Pendências
_(a levantar quando chegarmos nesta sprint)_

### Dificuldades
_(nenhuma registrada ainda)_

### Notas
_(nenhuma ainda)_
