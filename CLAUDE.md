# MapPin — Mapa Interativo Gamificado com Pontos de Interesse Personalizados

## Contexto do Projeto

MapPin é uma aplicação web fullstack que combina navegação geográfica real com estética cartunesca e gamificada, inspirada em jogos como GTA e RPGs clássicos. Usuários podem cadastrar Pontos de Interesse (POIs) personalizados com imagens, avatares, GIFs e áudios, além de calcular rotas entre localizações com integração ao Google Maps. O projeto é projetado para ser um diferencial de portfólio técnico com visual marcante e funcionalidades ricas.

**Problema:** Ferramentas de mapeamento tradicionais (Google Maps, Apple Maps) são funcionais, mas genéricas e sem personalidade. Não permitem que o usuário crie um mapa visual e expressivo do seu próprio mundo — marcando pessoas, lugares e negócios com identidade visual única (avatares, GIFs, áudios), nem oferecem uma experiência gamificada e divertida de exploração geográfica pessoal.

**Público-alvo:** Desenvolvedores que buscam um projeto de portfólio impressionante, criadores de conteúdo e comunidades locais que desejam mapear seus pontos de interesse com personalidade, pequenos negócios que querem destacar sua localização de forma criativa, e gamers/entusiastas de RPG que valorizam estética cartográfica gamificada.

## Stack Tecnológica

- **Frontend:** Next.js 14 + TypeScript
- **Backend:** FastAPI (Python 3.12)
- **Banco de Dados:** PostgreSQL 16 + PostGIS
- **Infraestrutura:** Vercel (frontend) + Railway (backend + PostgreSQL + Redis)

Detalhes completos em [docs/02_TECH_STACK.md](docs/02_TECH_STACK.md).

## Estrutura do Projeto

```
mappin-mapa-gamificado-poi/
├── docs/           # Planejamento e documentação
│   ├── 00_OVERVIEW.md
│   ├── 01_ARCHITECTURE.md
│   ├── 02_TECH_STACK.md
│   ├── 03_AI_AGENTS.md
│   ├── 04_TIMELINE.md
│   ├── 05_COST_ANALYSIS.md
│   └── 06_PRICING.md
├── src/            # Código-fonte (a criar)
└── CLAUDE.md       # Este arquivo
```

## Funcionalidades Principais

- Mapa interativo com estética cartunesca/gamificada customizável (temas: RPG, cartoon, retro, urbano)
- Cadastro de POIs com upload de imagem, avatar customizado, GIF animado e clip de áudio
- Categorização visual de pontos por tipo (comercial, lazer, barbearia, restaurante, amigos, etc.) com ícones temáticos
- Sistema de rotas: cálculo de distância/tempo da localização atual até qualquer POI cadastrado
- Atalho de deep-link para abrir rota diretamente no Google Maps (ou Apple Maps no iOS)
- Navegação fluida pelo mapa com zoom, pan e busca por nome/categoria
- Sistema social (Fase 7): seguir usuários e grupos fechados, visibilidade de POI por público/seguidores/grupo/privado, notificações in-app

## Agentes de IA Disponíveis

- **POICategorizerAgent** — Categorizador e Iconizador Automático de Pontos de Interesse
- **POIBioWriterAgent** — Escritor de Descrições Ricas e Atraentes para POIs

Prompts completos em [docs/03_AI_AGENTS.md](docs/03_AI_AGENTS.md).

## Estimativa

- **Total:** 92 dias (13.1 semanas) — inclui as Fases 7-9 (Sistema Social e Notificações, Busca de Endereço no Mapa, Galeria de Avatares), todas planejadas após o MVP original das Fases 1-6
- **Custo Mensal:** USD 15.00 / BRL 85.50
- **Preço Sugerido:** R$ 30139.20 – R$ 38511.20 (ver [docs/06_PRICING.md](docs/06_PRICING.md)) — já inclui as Fases 7-9, recalculado em 12/11/2026

## Arquitetura

O frontend Next.js 14 renderiza o mapa Leaflet no cliente com tiles customizados (Stadia Maps/CartoDB) e se comunica com o backend FastAPI via REST API para operações CRUD de POIs e usuários. Arquivos de mídia (imagens, GIFs, áudios) são enviados diretamente do frontend para Cloudflare R2 via presigned URLs geradas pelo backend, evitando que binários trafeguem pelo servidor de aplicação. O PostgreSQL com PostGIS armazena geometrias dos POIs e índices espaciais para queries de raio; Redis cacheia clusters de POIs por tile geográfico para reduzir latência no pan/zoom do mapa. Para rotas, o backend orquestra chamadas à API OSRM (gratuita) para cálculo de direções e fornece o deep-link formatado para o Google Maps. Os agentes de IA Claude são invocados de forma assíncrona via Celery worker no Railway quando o usuário cria/edita um POI, enriquecendo os dados sem bloquear a UX.
