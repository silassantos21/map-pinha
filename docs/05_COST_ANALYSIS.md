# Análise de Custo-Benefício — MapPin — Mapa Interativo Gamificado com Pontos de Interesse Personalizados

## Resumo Financeiro

| Categoria | Mensal (USD) | Mensal (BRL) |
|-----------|-------------|-------------|
| Infraestrutura | $10.00 | R$ 57.00 |
| APIs Externas | $5.00 | R$ 28.50 |
| **Total Mensal** | **$15.00** | **R$ 85.50** |
| **Setup Inicial** | **$20.00** | **R$ 114.00** |

✅ **Este projeto pode começar com free tier** das ferramentas listadas.

---

## Infraestrutura & Hosting

| Serviço/Item | Mensal (USD) | Setup (USD) | Free Tier | Observações |
|--------------|-------------|------------|-----------|-------------|
| Vercel (frontend Next.js) | $0.00 | $0.00 | ✅ Sim | Hobby plan gratuito: 100GB bandwidth, 6000 min build/mês. Suficiente para portfólio. Pro ($20/mês) apenas se tiver tráfego alto. |
| Railway (FastAPI + PostgreSQL + Redis + Celery) | $10.00 | $0.00 | ✅ Sim | Trial de $5 créditos para começar. Uso estimado: FastAPI (~$3), PostgreSQL (~$4), Redis (~$2), Celery Worker (~$1). Total ~$10/mês para carga de portfólio. |
| Cloudflare R2 (storage de mídia: imagens, áudios) | $0.00 | $0.00 | ✅ Sim | 10GB storage gratuito + 1M operações de classe A gratuitas por mês. Para portfólio, o free tier é mais do que suficiente. Custo além: $0.015/GB. |
| Upstash Redis (cache serverless — alternativa ao Railway Redis) | $0.00 | $0.00 | ✅ Sim | Free tier: 10K comandos/dia, 256MB storage. Opção alternativa ao Redis do Railway. Se usar Railway Redis, este é $0. |
| Stadia Maps (tiles do mapa customizados) | $0.00 | $0.00 | ✅ Sim | Free tier: 200K tiles/mês para projetos non-commercial. CartoDB (via CARTO) é alternativa 100% gratuita. Para portfólio, CartoDB Voyager/Dark Matter suficiente sem custo. |
| Sentry (error monitoring) | $0.00 | $0.00 | ✅ Sim | Developer plan gratuito: 5K errors/mês, 1 usuário. Suficiente para monitorar portfólio em produção. |

## APIs & Serviços Externos

| Serviço/Item | Mensal (USD) | Setup (USD) | Free Tier | Observações |
|--------------|-------------|------------|-----------|-------------|
| OSRM API (rotas e direções — open-source) | $0.00 | $0.00 | ✅ Sim | API pública gratuita (router.project-osrm.org) para uso não-comercial. Alternativa: GraphHopper free tier (500 req/dia). Para produção com tráfego alto, self-host OSRM no Railway (~$5/mês extra). |
| Claude API — Anthropic (agentes de IA) | $5.00 | $5.00 | ❌ Não | Claude claude-sonnet-4-6: $3/1M input tokens, $15/1M output tokens. Estimativa para portfólio: ~500 chamadas/mês aos 2 agentes ativos (categorização automática e geração de descrição — um 3º agente de recomendação foi removido em 12/11/2026, ver `SPRINTS.md`) = ~$3-7/mês. Setup: crédito inicial de $5 para testes. Rate limiting implementado para controle de custo. |
| Google Maps Deep-link (redirecionamento externo) | $0.00 | $0.00 | ✅ Sim | Deep-links para google.com/maps/dir/ são URLs comuns — não requerem API key nem têm custo. Apenas a abertura em nova aba. Sem cobrança da Google para este caso de uso. |
| Giphy API (busca e embed de GIFs nos POIs) | $0.00 | $0.00 | ✅ Sim | Giphy Developer API gratuita: 100 req/hora, acesso a todo o catálogo. Usuário busca GIF no app e salva apenas a URL — sem armazenar binários. Suficiente para portfólio. |

## Ferramentas de Desenvolvimento

| Serviço/Item | Mensal (USD) | Setup (USD) | Free Tier | Observações |
|--------------|-------------|------------|-----------|-------------|
| Domínio customizado (ex: mappin.app ou mappin.com.br) | $1.50 | $15.00 | ❌ Não | Registro anual ~$18/ano (Namecheap/Porkbun). Custo mensal equivalente ao amortizar. |
| Figma (design de ícones e protótipo) | $0.00 | $0.00 | ✅ Sim | Free tier do Figma suficiente para projeto de portfólio solo (1 editor, projetos ilimitados). |

---

## Análise de ROI

Como projeto de portfólio, o ROI é medido em oportunidades profissionais geradas, não em receita direta. Custo mensal de $15 (R$85,50) é investimento em visibilidade técnica. Se o projeto gerar 1 oportunidade freelance de R$3.000+, o ROI já é positivo em mês 1. Para monetização futura: plano gratuito (até 20 POIs) + plano Pro $9,90/mês (POIs ilimitados, temas exclusivos, armazenamento de mídia estendido). Com 50 usuários pagantes, o projeto cobre custos e gera lucro. Métricas de sucesso: estrelas no GitHub (meta: 100+), visitas ao demo (meta: 500+/mês), tempo médio no app (meta: 5+ minutos).

---

## Notas sobre Escalabilidade de Custos

- Preços baseados em uso inicial (MVP/early stage)
- Custos aumentam com volume de usuários e dados
- Reavalie a stack se atingir 10k+ usuários ativos
- Considere contratos anuais para economias de 20-40%
