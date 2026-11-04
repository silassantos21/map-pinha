# Cronograma do Projeto — MapPin — Mapa Interativo Gamificado com Pontos de Interesse Personalizados

## Resumo

| # | Fase | Duração |
|---|------|---------|
| 1 | Fase 1 — Setup, Design System e Infraestrutura Base | 10 dias |
| 2 | Fase 2 — Mapa Interativo e Temas Visuais | 14 dias |
| 3 | Fase 3 — CRUD de POIs e Upload de Mídia | 16 dias |
| 4 | Fase 4 — Sistema de Rotas e Integração Google Maps | 10 dias |
| 5 | Fase 5 — Agentes de IA e Features Inteligentes | 10 dias |
| 6 | Fase 6 — Compartilhamento, Polimento Visual e Deploy Final | 10 dias |
| 7 | Fase 7 — Sistema Social (Seguir, Grupos) e Notificações | 18 dias |
| 8 | Fase 8 — Busca de Endereço no Mapa | 2 dias |
| 9 | Fase 9 — Galeria de Avatares Pré-definidos | 2 dias |
| | **Total** | **92 dias (13.1 semanas)** |

---

## Detalhamento das Fases

### Fase 1: Fase 1 — Setup, Design System e Infraestrutura Base (10 dias)

#### Tarefas

- [ ] Configurar monorepo: Next.js 14 + FastAPI + Docker Compose local
- [ ] Setup PostgreSQL local com extensão PostGIS habilitada
- [ ] Configurar GitHub Actions: lint, type-check, deploy automático Vercel + Railway
- [ ] Criar design system gamificado: paleta de cores (5 temas de mapa), tipografia (fonte pixelada + sans-serif funcional), tokens de design no Tailwind
- [ ] Configurar shadcn/ui com tema customizado (dark/light gamificado)
- [ ] Setup Cloudflare R2: bucket, CORS, política de acesso público para mídia
- [ ] Implementar NextAuth.js v5: OAuth Google + Credentials, sessão JWT
- [ ] Criar layout base do app: sidebar, header gamificado, área do mapa
- [ ] Definir e documentar schema do banco: tabelas users, poi, poi_media, routes, categories

#### Entregáveis

- Repositório configurado com CI/CD funcionando (deploy no Vercel + Railway)
- Design system documentado com todos os tokens visuais dos 5 temas de mapa
- Autenticação completa (login Google + email/senha) com sessão persistente
- Schema do banco de dados migrado no PostgreSQL+PostGIS em produção
- Bucket R2 configurado e testado com upload de arquivo de exemplo

---

### Fase 2: Fase 2 — Mapa Interativo e Temas Visuais (14 dias)

#### Tarefas

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

#### Entregáveis

- Mapa interativo funcionando com 5 temas visuais intercambiáveis via UI
- Geolocalização do usuário com ícone de avatar no mapa
- Sistema de clustering de markers funcionando
- Minimap HUD e controles gamificados implementados
- Performance: mapa carregando em menos de 2s na primeira visita

---

### Fase 3: Fase 3 — CRUD de POIs e Upload de Mídia (16 dias)

#### Tarefas

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

#### Entregáveis

- CRUD completo de POIs funcionando com persistência no PostgreSQL+PostGIS
- Upload de imagem, GIF e áudio funcionando via Cloudflare R2
- Formulário de criação de POI com preview em tempo real no mapa
- POI Card com popup rico: avatar, GIF animado, player de áudio
- Busca de POIs por nome e categoria funcionando

---

### Fase 4: Fase 4 — Sistema de Rotas e Integração Google Maps (10 dias)

#### Tarefas

- [ ] Integrar OSRM API (gratuita, open-source): endpoint FastAPI proxy para calcular rota entre dois pontos
- [ ] Implementar exibição de rota no mapa Leaflet: polyline com estilo gamificado (linha tracejada animada estilo videogame)
- [ ] Criar painel de informações de rota: distância em km, tempo estimado (carro/a pé), turn-by-turn simplificado
- [ ] Desenvolver deep-link para Google Maps: montar URL google.com/maps/dir/ com origem e destino, abrir em nova aba
- [ ] Implementar deep-link para Apple Maps (detecção de iOS via user-agent)
- [ ] Criar botão 'Como Chegar' em cada POI com opções: navegar no app ou abrir no Google/Apple Maps
- [ ] Implementar cache Redis para rotas frequentes (origem-destino já calculados)
- [ ] Adicionar indicador visual de rotas salvas: histórico de rotas do usuário
- [ ] Desenvolver modo de navegação simplificado: seguir a rota com geolocalização em tempo real (watchPosition)

#### Entregáveis

- Cálculo de rotas funcionando via OSRM com exibição visual no mapa
- Painel de rota com distância, tempo e instruções simplificadas
- Deep-link para Google Maps e Apple Maps funcionando em todos os dispositivos
- Cache de rotas no Redis implementado
- Modo de navegação básico com atualização de posição em tempo real

---

### Fase 5: Fase 5 — Agentes de IA e Features Inteligentes (10 dias)

#### Tarefas

- [ ] Setup Celery worker no Railway com broker Redis para tarefas assíncronas
- [ ] Implementar POICategorizerAgent: integração Claude API, lógica de mapeamento de categoria para ícone do sistema
- [ ] Implementar POIBioWriterAgent: endpoint /pois/generate-bio, integração com formulário de criação via botão
- [ ] Implementar NearbyRecommenderAgent: endpoint /pois/recommendations com contexto de localização e histórico
- [ ] ~~Criar UI para recomendações: painel lateral 'Explorar' com cards animados de sugestões~~ — implementado na Sprint 5, **removido na Sprint 6 em 29/10/2026** a pedido do dono do projeto (não gostou da mecânica/funcionalidade); endpoint do agente (`NearbyRecommenderAgent`) segue no backend, só sem UI que o acione — ver `SPRINTS.md`
- [ ] ~~Implementar feedback loop: usuário avalia sugestão (útil/não útil) para melhorar recomendações futuras~~ — removido junto com a UI acima (Sprint 6)
- [ ] Adicionar indicador visual quando IA está processando (skeleton loader gamificado)
- [ ] Implementar rate limiting nas chamadas à Claude API para controle de custos

#### Entregáveis

- 3 agentes de IA funcionando: categorizador, bio writer e recomendador
- Celery worker deployado no Railway processando tarefas assíncronas
- ~~UI de recomendações 'Explorar' com cards de sugestões personalizadas~~ — removida na Sprint 6 (ver acima)
- Rate limiting e controle de custos da API Claude implementados

---

### Fase 6: Fase 6 — Compartilhamento, Polimento Visual e Deploy Final (10 dias)

#### Tarefas

- [ ] Implementar sistema de compartilhamento: gerar slug único para POI público, page de POI pública com SSR (SEO)
- [ ] Criar página de perfil do usuário: seus POIs, estatísticas (total de pontos, km mapeados), avatar
- [x] Repaginar identidade visual com base na logo oficial "MaPinha": extrair paleta de cores da logo e aplicar de forma unificada nos temas de mapa, UI e componentes existentes
- [ ] Adicionar animações Framer Motion: transições de página, entrada de POI cards, loading states gamificados
- [ ] Implementar PWA: manifest.json, service worker para cache offline do mapa, ícone de instalação
- [ ] Criar página de onboarding: tutorial interativo de 3 passos ao primeiro login
- [ ] Configurar Sentry: error tracking frontend e backend, alertas de erros críticos
- [ ] Realizar testes E2E dos fluxos principais: criar POI com mídia, calcular rota, compartilhar link
- [ ] Otimizações de performance: lazy loading de POIs fora do viewport, compressão de imagens, bundle analysis
- [ ] Criar README detalhado com screenshots, GIFs e instruções de deploy (essencial para portfólio)
- [ ] Deploy final revisado em produção com domínio customizado

#### Entregáveis

- Sistema de compartilhamento de POIs com URLs públicas e SEO
- Identidade visual unificada: paleta derivada da logo oficial aplicada de forma consistente em temas, header e UI geral
- PWA instalável funcionando em mobile com cache offline parcial
- Aplicação deployada em produção com domínio customizado
- README de portfólio com screenshots, demo GIF e documentação técnica completa
- Monitoramento Sentry ativo em produção

---

### Fase 7: Fase 7 — Sistema Social (Seguir, Grupos) e Notificações (18 dias)

> Planejada em 23/10/2026, a pedido do dono do projeto. Formaliza e expande uma ideia já registrada como "v2+" em 22/10/2026 (grupos com visibilidade compartilhada — ver `SPRINTS.md`), somando o pedido novo de seguir contas individuais e de notificações in-app. Ampliada em 02/11/2026 com comentários em POIs (pedido novo do dono do projeto, mesma leva de perguntas que confirmou a visibilidade por seguidor já planejada aqui).

#### Tarefas

- [ ] Modelar schema: tabelas `follows` (follower_id, followed_id, únique, índice), `groups` (id, name, owner_id, created_at), `group_members` (group_id, user_id, role, joined_at), `notifications` (id, user_id, type, actor_id, poi_id nullable, group_id nullable, payload, read_at nullable, created_at), `comments` (id, poi_id, user_id, body, created_at, deleted_at nullable)
- [ ] Migrar `POI.is_public` (booleano) para um campo `visibility` (enum: `public` / `followers` / `group` / `private`) + `group_id` opcional quando `visibility=group` — migration Alembic com backfill (`is_public=True` → `public`, `is_public=False` → `private`) para não quebrar POIs já existentes
- [ ] Endpoints de seguir: `POST/DELETE /users/{id}/follow`, `GET /users/{id}/followers`, `GET /users/{id}/following`, `GET /users/me/following`
- [ ] Endpoint de busca/descoberta de usuários: `GET /users/search?q=` — expõe só nome/avatar/id, nunca email
- [ ] Ajustar `GET /pois` (query geoespacial) para incluir: meus POIs + públicos + de quem eu sigo (`visibility=followers`) + dos grupos dos quais participo (`visibility=group`), sem perder a performance do filtro por bounding box
- [ ] Endpoints de grupos: `POST /groups`, `GET /groups` (meus grupos), `PUT /groups/{id}`, `POST /groups/{id}/members`, `DELETE /groups/{id}/members/{user_id}`
- [ ] Trocar o checkbox "Visível publicamente" do formulário de POI por um seletor de visibilidade (Público / Seguidores / Grupo específico / Só eu)
- [ ] UI de perfil de usuário básico: nome, avatar, contagem de seguidores/seguindo, botão seguir/deixar de seguir — pré-requisito inexistente hoje (não há nenhuma tela que mostre outro usuário)
- [ ] UI de busca/descoberta de usuários para seguir
- [ ] UI de grupos: criar grupo, adicionar/remover membros, listar meus grupos
- [ ] Gerar notificação nos eventos: alguém começou a te seguir, alguém reagiu a um POI seu (reação já existe desde a Sprint 3, só falta notificar), alguém comentou em um POI seu, POI novo de alguém que você segue, convite para um grupo
- [ ] Endpoints de notificação: `GET /notifications` (paginado, mais recentes primeiro), `POST /notifications/{id}/read`, `POST /notifications/read-all`
- [ ] Sininho de notificações no HUD header: badge com contagem de não lidas, painel com a lista, atualização via polling (`refetchInterval` do React Query) — sem WebSocket por enquanto, para não introduzir infraestrutura nova antes de validar o uso real do recurso
- [ ] Endpoints de comentário: `POST /pois/{id}/comments`, `GET /pois/{id}/comments` (paginado, mais recentes primeiro), `DELETE /comments/{id}` (autor do comentário ou dono do POI)
- [ ] UI de comentários na Sheet de detalhe do POI (`PoiDetailSheet`): lista de comentários + campo de texto para novo comentário, reaproveitando o mesmo padrão visual das reações já existentes

#### Entregáveis

- Seguir/deixar de seguir usuários funcionando, com busca/descoberta básica
- Grupos funcionando: criar, adicionar/remover membros
- Novo modelo de visibilidade de POI (público/seguidores/grupo/privado) substituindo o booleano atual, com migration segura dos dados existentes
- Mapa mostrando POIs de quem você segue e dos seus grupos, além dos seus e dos públicos
- Notificações in-app funcionando (sininho + lista + marcar como lida) para: novo seguidor, reação ao seu POI, novo comentário no seu POI, novo POI de quem você segue, convite de grupo
- Comentários em POIs funcionando (criar, listar, excluir o próprio ou o do seu POI)

#### Observação de escopo

Para não cair no "risco de negócio 1" já listado em `docs/00_OVERVIEW.md` (escopo inflado), a ordem de prioridade dentro da fase é: (1) seguir usuários + notificações + visibilidade `followers` no mapa primeiro — isso sozinho já entrega o pedido original; (2) grupos depois, como extensão do mesmo modelo (`group_members` + `visibility=group`); (3) comentários por último, como extensão do mesmo padrão das reações. Se o prazo apertar, grupos e/ou comentários podem virar uma Fase 7.1 separada sem bloquear o resto.

---

### Fase 8: Fase 8 — Busca de Endereço no Mapa (2 dias)

> Planejada em 02/11/2026, a pedido do dono do projeto. Hoje a busca de endereço (geocodificação via Nominatim) só existe dentro do formulário de criação/edição de POI, para marcar a posição de um novo ponto — a barra de busca principal do mapa busca apenas entre POIs já cadastrados (`usePoiSearch`). Esta fase estende a busca principal para também aceitar endereços/lugares genéricos, reaproveitando o endpoint de geocodificação já existente no backend.

#### Tarefas

- [ ] Reaproveitar o endpoint de geocodificação já existente (`/api/geocode/search`) na SearchBar principal do mapa, além do uso atual no formulário de POI
- [ ] Unificar os resultados da SearchBar: POIs cadastrados e endereços/lugares geocodificados na mesma lista, diferenciados visualmente (ex.: ícone de pin de POI vs. ícone de endereço)
- [ ] Ao selecionar um resultado de endereço (em vez de um POI), mover o mapa até a coordenada (`flyTo`) sem criar nenhum POI nem abrir formulário

#### Entregáveis

- Busca unificada de POIs e endereços na barra de busca principal do mapa

---

### Fase 9: Fase 9 — Galeria de Avatares Pré-definidos (2 dias)

> Planejada em 02/11/2026, a pedido do dono do projeto. Substitui a ideia original de avatar gerado por IA a partir da foto real do usuário (descartada por questão de consentimento de imagem) e a ideia intermediária de um criador com campo de texto livre (exigiria chamada de API de geração de imagem em tempo real, com custo recorrente e necessidade de moderação do texto). Nesta versão final, ~20 avatares são gerados **uma única vez, fora do sistema** (prompts prontos em `docs/avatar-prompts.txt`, estilo "Cocoricó"/claymation, variando tom de pele, cabelo, óculos/acessório e roupa da cintura pra cima) e enviados manualmente ao bucket R2 já existente — sem nenhuma chamada de API de IA em produção, sem custo recorrente, sem dado pessoal de ninguém.

#### Tarefas

- [x] Gerar as 20 imagens a partir de `docs/avatar-prompts.txt` numa IA de imagem externa e subir manualmente no bucket R2 em `avatars/presets/avatar-01.jpg` até `avatar-20.jpg` (reaproveita o mesmo bucket/CDN já usado pra mídia de POI — `settings.r2_public_url` + chave do objeto)
- [x] Migration: novo campo `avatar_choice_url` (nullable) em `User` — **não reaproveitou o `avatar_url` atual**, porque esse campo já é sobrescrito a cada login com a foto do Google (`auth.ts` → `/auth/sync`); a escolha do usuário sobrevive a logins futuros
- [x] Backend: lista fixa (whitelist) dos 20 presets válidos (id + URL), para não aceitar URL arbitrária vinda do cliente — `PATCH /users/{id}/avatar` recebe um `preset_id` validado (`Field(ge=1, le=20)`), não uma URL livre
- [x] Ajustada leitura de avatar do usuário (header/HUD, perfil, onboarding, página pública `/p/[slug]`) para usar `avatar_choice_url ?? avatar_url` (prioriza a escolha; sem escolha, cai na foto do Google como antes)
- [x] UI: galeria de escolha (`AvatarPicker`) — grid com os 20 presets, destaque do selecionado, usada tanto no painel de perfil quanto como primeiro passo do onboarding (escolha já no "momento de criar a conta")

#### Entregáveis

- Usuário pode escolher um avatar entre 20 opções pré-geradas (sem upload de foto própria, sem chamada de IA em produção)
- Escolha persistente entre logins, exibida em todos os lugares que hoje mostram o avatar do Google

---

## Premissas

- Desenvolvedor sênior trabalhando em tempo parcial (~4-5h/dia), não em tempo integral
- OSRM API pública usada para rotas (sem custo), aceitando latência ligeiramente maior que Google Directions API
- Tiles do mapa usando CartoDB/Stadia free tier (até 75k requests/mês gratuitos)
- Design assets de ícones gamificados criados com Figma ou usando biblioteca open-source (Kenney.nl game assets)
- Não inclui desenvolvimento de app nativo (iOS/Android) — apenas PWA responsiva
- Upload de áudio limitado a clips de até 30 segundos para controlar storage no R2
- Funcionalidade de GIFs via URL externa (Giphy/Tenor) — upload direto de GIF é feature v2
- Testes automatizados básicos (unit tests nos agentes IA e endpoints críticos) — cobertura completa é v2
