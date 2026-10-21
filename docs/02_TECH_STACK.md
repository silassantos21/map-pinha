# Stack Tecnológica — MapPin — Mapa Interativo Gamificado com Pontos de Interesse Personalizados

| Camada | Tecnologia Principal | Complementos |
|--------|---------------------|-------------|
| Frontend | `Next.js 14 + TypeScript` | `Tailwind CSS`, `shadcn/ui`, `Framer Motion`, `Leaflet.js + React-Leaflet` |
| Backend | `FastAPI (Python 3.12)` | `SQLAlchemy 2.0`, `Pydantic v2`, `Alembic (migrations)`, `Pillow (processamento de imagens)` |
| Banco de Dados | `PostgreSQL 16 + PostGIS` | `PostGIS (extensão geoespacial)`, `SQLAlchemy ORM`, `Alembic migrations` |
| Autenticação | `NextAuth.js v5 (Auth.js)` | `JWT (sessions stateless)`, `OAuth2 Google`, `Credentials Provider (email/senha)` |
| Cache | `Redis (Upstash)` | `React Query (TanStack Query)`, `SWR para dados do mapa` |
| Infraestrutura | `Vercel (frontend) + Railway (backend + PostgreSQL + Redis)` | `GitHub Actions CI/CD`, `Docker (local dev)`, `Cloudflare R2 (storage de mídia — imagens, GIFs, áudios)`, `Docker Compose (desenvolvimento local)` |
| Monitoramento | `Sentry` | `Vercel Analytics`, `Railway Metrics (CPU/RAM/DB)` |
| IA / ML | `Claude claude-sonnet-4-6 API (Anthropic)` | `LangChain (orquestração de agentes)` |

---

## Frontend

**Tecnologia Principal:** `Next.js 14 + TypeScript`

**Complementos:**
- `Tailwind CSS`
- `shadcn/ui`
- `Framer Motion`
- `Leaflet.js + React-Leaflet`
- `Leaflet.markercluster`
- `React Hook Form + Zod`
- `Zustand (estado global do mapa)`
- `Howler.js (reprodução de áudio nos POIs)`

**Justificativa:** Next.js 14 com App Router oferece SSR para SEO nos mapas públicos e Client Components para a interatividade do mapa. Leaflet.js é escolhido sobre Google Maps SDK por ser open-source, gratuito, altamente customizável (tilesets, ícones, estilos) e ideal para a estética gamificada — permite usar tilesets customizados de Stadia Maps, Carto ou até tiles pixel art. Framer Motion garante animações fluidas nos POI cards e transições de tema.

## Backend

**Tecnologia Principal:** `FastAPI (Python 3.12)`

**Complementos:**
- `SQLAlchemy 2.0`
- `Pydantic v2`
- `Alembic (migrations)`
- `Pillow (processamento de imagens)`
- `python-multipart (upload de arquivos)`
- `httpx (chamadas externas)`

**Justificativa:** FastAPI oferece performance async nativa essencial para uploads de mídia (imagens, GIFs, áudios) e chamadas a APIs de rotas externas. A tipagem com Pydantic v2 garante validação robusta dos dados geoespaciais (lat/lng, polígonos de rota). SQLAlchemy 2.0 com suporte a PostGIS permite queries geoespaciais eficientes para buscar POIs por raio.

## Banco de Dados

**Tecnologia Principal:** `PostgreSQL 16 + PostGIS`

**Complementos:**
- `PostGIS (extensão geoespacial)`
- `SQLAlchemy ORM`
- `Alembic migrations`

**Justificativa:** PostgreSQL com extensão PostGIS é a escolha definitiva para dados geoespaciais: permite queries como 'buscar todos os POIs num raio de 5km', indexação espacial com GiST, e armazenamento nativo de geometrias POINT/LINESTRING para as rotas. É o padrão da indústria para aplicações de mapeamento sem custo de licença.

## Autenticação & Autorização

**Tecnologia Principal:** `NextAuth.js v5 (Auth.js)`

**Complementos:**
- `JWT (sessions stateless)`
- `OAuth2 Google`
- `Credentials Provider (email/senha)`

**Justificativa:** NextAuth.js v5 integra nativamente com Next.js 14 App Router, suporta OAuth Google (relevante pois o projeto integra com Google Maps) e permite sessions JWT para o backend FastAPI validar via middleware. O login com Google melhora a UX e cria coerência com a integração Maps.

## Cache & Sessão

**Tecnologia Principal:** `Redis (Upstash)`

**Complementos:**
- `React Query (TanStack Query)`
- `SWR para dados do mapa`

**Justificativa:** Redis via Upstash (serverless, free tier generoso) para cachear clusters de POIs por área geográfica (evitar queries PostGIS a cada pan do mapa) e dados de rotas frequentes. React Query no frontend para cache local de POIs já carregados e invalidação inteligente ao criar novos pontos.

## Infraestrutura & Deploy

**Tecnologia Principal:** `Vercel (frontend) + Railway (backend + PostgreSQL + Redis)`

**Complementos:**
- `GitHub Actions CI/CD`
- `Docker (local dev)`
- `Cloudflare R2 (storage de mídia — imagens, GIFs, áudios)`
- `Docker Compose (desenvolvimento local)`

**Justificativa:** Vercel é ideal para Next.js com edge functions e deploy automático. Railway oferece PostgreSQL com PostGIS, Redis e deploy do FastAPI em um único dashboard — simplificando infraestrutura para um projeto de portfólio. Cloudflare R2 como storage de objetos (S3-compatible) tem 10GB gratuitos — suficiente para armazenar as mídias dos POIs sem custo inicial.

## Monitoramento & Observabilidade

**Tecnologia Principal:** `Sentry`

**Complementos:**
- `Vercel Analytics`
- `Railway Metrics (CPU/RAM/DB)`

**Justificativa:** Sentry para rastrear erros em uploads de mídia (pontos críticos de falha) e erros nas queries geoespaciais. Vercel Analytics para entender o fluxo de usuários no mapa — quais regiões são mais exploradas, taxa de criação de POIs.

## IA / Machine Learning

**Tecnologia Principal:** `Claude claude-sonnet-4-6 API (Anthropic)`

**Complementos:**
- `LangChain (orquestração de agentes)`

**Justificativa:** IA é usada estrategicamente em 3 pontos: (1) Agente de categorização automática de POIs — analisa nome e descrição e sugere categoria/ícone ideal; (2) Agente de descrição assistida — ao criar um POI, o usuário descreve brevemente e a IA gera uma bio rica e formatada; (3) Agente de recomendação — sugere POIs próximos interessantes baseado no histórico e preferências do usuário. Estes agentes transformam o projeto de um simples mapa em uma ferramenta inteligente.

## Comandos de Setup Rápido

```bash
# Frontend
npx create-next-app@latest frontend --typescript --tailwind --app
npx shadcn@latest init
npm install @tanstack/react-query zustand zod react-hook-form

# Backend
pip install fastapi uvicorn sqlalchemy pydantic alembic python-jose passlib
```
