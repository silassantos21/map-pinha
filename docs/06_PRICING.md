# Estimativa de Investimento e Precificação — MapPin — Mapa Interativo Gamificado com Pontos de Interesse Personalizados

> ⚠️ **Documento de uso interno** — apoia a decisão de quanto cobrar do cliente. Não confundir com [05_COST_ANALYSIS.md](05_COST_ANALYSIS.md), que trata do custo *operacional* (infra/APIs) do projeto já pronto.

## Resumo

| Item | Valor |
|------|-------|
| Horas totais estimadas | **245.0h** |
| Complexidade do projeto | **alta** (multiplicador 1.30x) |
| Valor/hora aplicado | R$ 80.00 (USD 14.04) |
| **Preço sugerido** | **R$ 22932.00 – R$ 29302.00** |

**Justificativa da complexidade:** O projeto combina múltiplas camadas de complexidade técnica simultaneamente: (1) Dados geoespaciais reais com PostGIS exigem conhecimento especializado em queries espaciais e indexação GiST; (2) Sistema de upload de mídia mista (imagem, GIF, áudio) com presigned URLs, processamento server-side e CDN requer orquestração cuidadosa; (3) Customização visual profunda do Leaflet com sistema de temas troca-em-tempo-real vai além do uso padrão da biblioteca; (4) 3 agentes de IA distintos com LangChain e orquestração assíncrona via Celery adicionam complexidade de infraestrutura; (5) Sistema de rotas com OSRM + cache Redis + deep-link multiplataforma (Google/Apple Maps) envolve múltiplas integrações externas; (6) PWA com geolocalização em tempo real (watchPosition) e modo de navegação ativo. A stack é moderna e pouco comum (FastAPI + PostGIS + Leaflet customizado + R2 + Claude), elevando o risco técnico de integração entre componentes.

---

## Horas por Fase

| # | Fase | Dias | Horas |
|---|------|------|-------|
| 1 | Fase 1 — Setup, Design System e Infraestrutura Base | 10 | 35.0h |
| 2 | Fase 2 — Mapa Interativo e Temas Visuais | 14 | 50.0h |
| 3 | Fase 3 — CRUD de POIs e Upload de Mídia | 16 | 55.0h |
| 4 | Fase 4 — Sistema de Rotas e Integração Google Maps | 10 | 35.0h |
| 5 | Fase 5 — Agentes de IA e Features Inteligentes | 10 | 38.0h |
| 6 | Fase 6 — Compartilhamento, Polimento Visual e Deploy Final | 10 | 32.0h |
| | **Total** | **70** | **245.0h** |

---

## Detalhamento do Cálculo

| Etapa | Valor (BRL) | Valor (USD) |
|-------|-------------|-------------|
| Subtotal (245.0h × R$ 80.00/h) | R$ 19600.00 | USD 3438.60 |
| Buffer de complexidade/risco (1.30x) | R$ 5880.00 | USD 1031.58 |
| **Preço recomendado** | **R$ 25480.00** | **USD 4470.18** |
| Faixa sugerida (−10% / +15%) | R$ 22932.00 – R$ 29302.00 | — |

---

## Marcos de Pagamento Sugeridos

- 40% na assinatura (antes de iniciar Fase 1 — Setup, Design System e Infraestrutura Base)
- 30% na entrega de Fase 4 — Sistema de Rotas e Integração Google Maps
- 30% na entrega final (Fase 6 — Compartilhamento, Polimento Visual e Deploy Final)

---

## Evoluções Futuras

Este projeto tem 10 funcionalidade(s) futura(s) mapeada(s) (ver `future_features`), não incluídas nesta estimativa. Cobre horas adicionais separadamente se o cliente solicitar.

---

## Como Ajustar Este Valor

Esta é uma estimativa de apoio, não um preço final. Para recalcular com outro valor/hora:

- **CLI:** `python main.py run --hourly-rate <valor>`
- **API:** envie o campo `hourly_rate_brl` na requisição `POST /projects`
- Padrão atual: R$ 80.00/hora (configurável em `.env` via `DEFAULT_HOURLY_RATE_BRL`)
