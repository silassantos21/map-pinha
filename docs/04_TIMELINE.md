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
| | **Total** | **70 dias (10.0 semanas)** |

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
- [ ] Criar UI para recomendações: painel lateral 'Explorar' com cards animados de sugestões
- [ ] Implementar feedback loop: usuário avalia sugestão (útil/não útil) para melhorar recomendações futuras
- [ ] Adicionar indicador visual quando IA está processando (skeleton loader gamificado)
- [ ] Implementar rate limiting nas chamadas à Claude API para controle de custos

#### Entregáveis

- 3 agentes de IA funcionando: categorizador, bio writer e recomendador
- Celery worker deployado no Railway processando tarefas assíncronas
- UI de recomendações 'Explorar' com cards de sugestões personalizadas
- Rate limiting e controle de custos da API Claude implementados

---

### Fase 6: Fase 6 — Compartilhamento, Polimento Visual e Deploy Final (10 dias)

#### Tarefas

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

#### Entregáveis

- Sistema de compartilhamento de POIs com URLs públicas e SEO
- PWA instalável funcionando em mobile com cache offline parcial
- Aplicação deployada em produção com domínio customizado
- README de portfólio com screenshots, demo GIF e documentação técnica completa
- Monitoramento Sentry ativo em produção

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
