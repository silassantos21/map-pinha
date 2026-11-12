# Estimativa de Investimento e Precificação — MapPin — Mapa Interativo Gamificado com Pontos de Interesse Personalizados

> ⚠️ **Documento de uso interno** — apoia a decisão de quanto cobrar do cliente. Não confundir com [05_COST_ANALYSIS.md](05_COST_ANALYSIS.md), que trata do custo *operacional* (infra/APIs) do projeto já pronto.
>
> **Atualizado em 12/11/2026:** recalculado incluindo as Fases 7, 8 e 9 (todas pedidas e entregues depois das Fases 1–6 originais — ver `docs/04_TIMELINE.md`), que faltavam desde que a Fase 7 foi planejada em 23/10/2026. Sem uma ferramenta de recálculo automático disponível neste repositório (os números originais vieram de um gerador externo, citado em "Como Ajustar Este Valor" abaixo, que não faz parte deste projeto), as horas das 3 fases novas foram estimadas à mão por proporção direta aos dias de cada uma, usando a mesma razão horas/dia média das Fases 1–6 já calculadas (245.0h ÷ 70 dias = 3.5h/dia) — mesmo método implícito, não uma reavaliação de complexidade individual de cada tarefa nova. **Fase 10 (App Nativo) continua de fora de propósito** — é v2+ sem prazo comprometido (`docs/04_TIMELINE.md`), não faz parte do escopo fechado que este documento precifica.

## Resumo

| Item | Valor |
|------|-------|
| Horas totais estimadas | **322.0h** |
| Complexidade do projeto | **alta** (multiplicador 1.30x) |
| Valor/hora aplicado | R$ 80.00 (USD 14.04) |
| **Preço sugerido** | **R$ 30139.20 – R$ 38511.20** |

**Justificativa da complexidade:** O projeto combina múltiplas camadas de complexidade técnica simultaneamente: (1) Dados geoespaciais reais com PostGIS exigem conhecimento especializado em queries espaciais e indexação GiST; (2) Sistema de upload de mídia mista (imagem, GIF, áudio) com presigned URLs, processamento server-side e CDN requer orquestração cuidadosa; (3) Customização visual profunda do Leaflet com sistema de temas troca-em-tempo-real vai além do uso padrão da biblioteca; (4) 2 agentes de IA distintos (categorização automática e geração de descrição) adicionam complexidade de infraestrutura — um 3º agente (recomendação) chegou a ser implementado e foi removido por completo em 12/11/2026, sem custo operacional nem de precificação; (5) Sistema de rotas com OSRM + cache Redis + deep-link multiplataforma (Google/Apple Maps) envolve múltiplas integrações externas; (6) PWA com geolocalização em tempo real (watchPosition) e modo de navegação ativo; (7) Sistema social completo (seguir, grupos fechados, notificações in-app, comentários) com novo modelo de visibilidade de POI. A stack é moderna e pouco comum (FastAPI + PostGIS + Leaflet customizado + R2 + Claude), elevando o risco técnico de integração entre componentes.

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
| 7 | Fase 7 — Sistema Social (Seguir, Grupos) e Notificações | 18 | 63.0h *(estimado por proporção, ver nota acima)* |
| 8 | Fase 8 — Busca de Endereço no Mapa | 2 | 7.0h *(estimado por proporção, ver nota acima)* |
| 9 | Fase 9 — Galeria de Avatares Pré-definidos | 2 | 7.0h *(estimado por proporção, ver nota acima)* |
| | **Total** | **92** | **322.0h** |

---

## Detalhamento do Cálculo

| Etapa | Valor (BRL) | Valor (USD) |
|-------|-------------|-------------|
| Subtotal (322.0h × R$ 80.00/h) | R$ 25760.00 | USD 4519.30 |
| Buffer de complexidade/risco (1.30x) | R$ 7728.00 | USD 1355.79 |
| **Preço recomendado** | **R$ 33488.00** | **USD 5875.09** |
| Faixa sugerida (−10% / +15%) | R$ 30139.20 – R$ 38511.20 | — |

---

## Marcos de Pagamento Sugeridos

- 40% na assinatura (antes de iniciar Fase 1 — Setup, Design System e Infraestrutura Base)
- 30% na entrega de Fase 4 — Sistema de Rotas e Integração Google Maps
- 30% na entrega final (Fase 9 — Galeria de Avatares Pré-definidos, última fase do escopo fechado original + extensões 7/8/9)

---

## Evoluções Futuras

Este projeto tem 10 funcionalidade(s) futura(s) mapeada(s) (ver `future_features`), não incluídas nesta estimativa. Cobre horas adicionais separadamente se o cliente solicitar.

---

## Como Ajustar Este Valor

Esta é uma estimativa de apoio, não um preço final. Para recalcular com outro valor/hora:

- **CLI:** `python main.py run --hourly-rate <valor>`
- **API:** envie o campo `hourly_rate_brl` na requisição `POST /projects`
- Padrão atual: R$ 80.00/hora (configurável em `.env` via `DEFAULT_HOURLY_RATE_BRL`)
