# Handoff — continuação de sessão

> Gerado em 05/11/2026 porque a sessão anterior ficou muito longa. Isso aqui é só
> o que **não** está documentado em outro arquivo: convenções de trabalho
> estabelecidas em conversa e o estado atual depois da última sessão. O stack e a
> estrutura do projeto já estão no `CLAUDE.md` (carregado automaticamente).

## Regras de trabalho (seguir sempre, sem exceção)

- Investigar a causa raiz antes de corrigir qualquer bug — nunca chutar. Testar
  empiricamente (curl, grep no código, reproduzir o cenário) antes de propor fix.
- Nunca commitar ou dar push sem confirmação explícita do dono do projeto antes.
- Documentar toda mudança relevante no `SPRINTS.md` (histórico cronológico
  autoritativo do projeto) — inclusive achados de investigação, não só código.
- Validar sempre com type-check + lint + build (frontend) e, quando fizer sentido,
  testes via curl no backend. Não há ferramenta de navegador disponível — o dono
  do projeto faz o QA visual/funcional manualmente depois.
- Mensagens de commit terminam com
  `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.
- Ambiente local: backend/db/redis via Docker Compose, frontend via `npm run dev`
  (Next.js). Se a porta 8000 parecer "fantasma" (container ok mas não responde no
  host), `docker compose restart backend` costuma resolver.

## Estado atual (tudo commitado e no push, branch main, commit `a578f58`)

Concluído até agora: Fases 1-6, 8 e 9 do roadmap (`docs/04_TIMELINE.md`), incluindo:

- Fase 8 (busca de endereço unificada na SearchBar, com `viewbox` pra priorizar
  por proximidade em vez de fixar país — funciona em qualquer lugar do mundo).
- Fase 9 (galeria de 20 avatares pré-definidos + escolha no onboarding).
- Busca mobile virou um painel de tela cheia (antes era um dropdown apertado).
- Avatar do HUD agora abre o painel de Perfil (não desloga mais direto); botão
  "Sair" próprio dentro do Perfil.

Dois bugs reais investigados e corrigidos na última sessão — vale lembrar os
padrões pra não reintroduzir:

1. `refetchOnWindowFocus` do React Query estava ligado por padrão (nunca tinha
   sido desativado) — causava refetch de todas as queries ativas da tela ao
   recuperar foco da janela. Desativado globalmente em `query-provider.tsx`
   (a app já invalida explicitamente após mutações, não precisa disso).
2. O `<header>` do HUD usa `pointer-events-none`, com cada filho clicável
   reativando via `pointer-events-auto`. Ao criar um elemento novo lá dentro
   (ex: um overlay/painel), é fácil esquecer de reativar isso — o que faz
   cliques atravessarem pro que está por baixo na mesma posição de tela (foi
   exatamente o que causou o "fechar a busca desloga sozinho" nessa sessão).
   Checar isso sempre que adicionar algo novo dentro do `hud-header.tsx`.

## Único item do roadmap que falta

Fase 7 — Sistema Social. Está inteira em `docs/04_TIMELINE.md` (seção "Fase 7"),
com uma ordem de prioridade já definida lá dentro (seguir+notificações+
visibilidade primeiro; grupos depois; comentários por último) pra não estourar
escopo.

**Parte 1 (seguir usuários, notificações in-app, visibilidade de POI
public/followers/private) já está implementada** (05/11/2026, commit a fazer
no próximo push) — ver entrada "Fase 7 Parte 1 implementada" no `SPRINTS.md`
pra detalhes completos (schema, endpoints, armadilha do Alembic com ENUM do
Postgres, decisões de notificação síncrona vs. background).

**Faltam Parte 2 (grupos: tabelas `groups`/`group_members`, `visibility=group`,
`group_id` em `pois`) e Parte 3 (comentários em POIs, estendendo o padrão já
existente das reações)** — nenhuma das duas foi tocada ainda. `group` não
existe no enum `poi_visibility` do banco (só `public`/`followers`/`private`);
entra via `ALTER TYPE poi_visibility ADD VALUE 'group'` numa migration própria
quando a Parte 2 começar (não pode estar na mesma transação que já usa o valor
novo — ver nota na migration `e7c3a9f52d81`).

**Não começar Parte 2/3 sem o dono do projeto pedir explicitamente** — só
perguntar quais são os próximos passos, ou aguardar instrução.

## O que fazer agora

[Preencher aqui o que o dono do projeto quer fazer nesta sessão]
