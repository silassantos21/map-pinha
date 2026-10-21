# Arquitetura do Sistema — MapPin — Mapa Interativo Gamificado com Pontos de Interesse Personalizados

## Visão Geral

O frontend Next.js 14 renderiza o mapa Leaflet no cliente com tiles customizados (Stadia Maps/CartoDB) e se comunica com o backend FastAPI via REST API para operações CRUD de POIs e usuários. Arquivos de mídia (imagens, GIFs, áudios) são enviados diretamente do frontend para Cloudflare R2 via presigned URLs geradas pelo backend, evitando que binários trafeguem pelo servidor de aplicação. O PostgreSQL com PostGIS armazena geometrias dos POIs e índices espaciais para queries de raio; Redis cacheia clusters de POIs por tile geográfico para reduzir latência no pan/zoom do mapa. Para rotas, o backend orquestra chamadas à API OSRM (gratuita) para cálculo de direções e fornece o deep-link formatado para o Google Maps. Os agentes de IA Claude são invocados de forma assíncrona via Celery worker no Railway quando o usuário cria/edita um POI, enriquecendo os dados sem bloquear a UX.

## Diagrama de Arquitetura

```
USUÁRIO (Browser) → [Next.js 14 no Vercel] → Renderiza Leaflet Map com tiles do CartoDB/Stadia. NEXT.JS → [FastAPI no Railway]: chamadas REST autenticadas (JWT) para CRUD de POIs, autenticação, geração de presigned URLs e proxy de rotas. NEXT.JS → [Cloudflare R2]: upload direto de mídia (imagens/GIFs/áudios) via presigned URL. FASTAPI → [PostgreSQL+PostGIS no Railway]: queries geoespaciais (ST_DWithin para POIs num raio, ST_MakeLine para rotas). FASTAPI → [Redis no Railway/Upstash]: cache de clusters de POIs por bounding box do mapa. FASTAPI → [OSRM API (externa)]: cálculo de rotas turn-by-turn gratuito. FASTAPI → [Celery Worker]: disparo assíncrono de agentes IA. CELERY → [Claude API (Anthropic)]: agentes de categorização, descrição e recomendação de POIs. NEXT.JS Auth → [NextAuth.js]: OAuth Google + JWT session. DEEP-LINK → [Google Maps App/Web]: redirecionamento externo para navegação nativa.
```

## Componentes Principais

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

## Decisões Arquiteturais

As decisões foram baseadas no briefing do projeto e nas referências fornecidas.
Consulte [02_TECH_STACK.md](02_TECH_STACK.md) para justificativas detalhadas de cada escolha.

## Padrões de Projeto Recomendados

- **Frontend:** Component-driven development com Server Components (Next.js App Router)
- **Backend:** Clean Architecture (Domain → Application → Infrastructure)
- **API:** REST com versionamento (`/api/v1/`) ou tRPC para type-safety full-stack
- **Estado:** Zustand (client state) + React Query / TanStack Query (server state)
- **Testes:** Vitest (unit) + Playwright (E2E)
