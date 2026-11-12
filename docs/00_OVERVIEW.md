# MapPin — Mapa Interativo Gamificado com Pontos de Interesse Personalizados

> MapPin é uma aplicação web fullstack que combina navegação geográfica real com estética cartunesca e gamificada, inspirada em jogos como GTA e RPGs clássicos. Usuários podem cadastrar Pontos de Interesse (POIs) personalizados com imagens, avatares, GIFs e áudios, além de calcular rotas entre localizações com integração ao Google Maps. O projeto é projetado para ser um diferencial de portfólio técnico com visual marcante e funcionalidades ricas.

**Tipo de Projeto:** `fullstack_web`
**Gerado em:** 21/10/2026 20:59
**Estimativa Total:** 92 dias (13.1 semanas) — inclui as Fases 7-9 (Sistema Social e Notificações, Busca de Endereço no Mapa, Galeria de Avatares Pré-definidos), todas planejadas após o MVP original das Fases 1-6
**Custo Mensal Estimado:** USD 15.00 / BRL 85.50

---

## Problema que Resolve

Ferramentas de mapeamento tradicionais (Google Maps, Apple Maps) são funcionais, mas genéricas e sem personalidade. Não permitem que o usuário crie um mapa visual e expressivo do seu próprio mundo — marcando pessoas, lugares e negócios com identidade visual única (avatares, GIFs, áudios), nem oferecem uma experiência gamificada e divertida de exploração geográfica pessoal.

## Público-Alvo

Desenvolvedores que buscam um projeto de portfólio impressionante, criadores de conteúdo e comunidades locais que desejam mapear seus pontos de interesse com personalidade, pequenos negócios que querem destacar sua localização de forma criativa, e gamers/entusiastas de RPG que valorizam estética cartográfica gamificada.

## Funcionalidades Principais

- Mapa interativo com estética cartunesca/gamificada customizável (temas: RPG, cartoon, retro, urbano)
- Cadastro de POIs com upload de imagem, avatar customizado, GIF animado e clip de áudio
- Categorização visual de pontos por tipo (comercial, lazer, barbearia, restaurante, amigos, etc.) com ícones temáticos
- Sistema de rotas: cálculo de distância/tempo da localização atual até qualquer POI cadastrado
- Atalho de deep-link para abrir rota diretamente no Google Maps (ou Apple Maps no iOS)
- Navegação fluida pelo mapa com zoom, pan e busca por nome/categoria
- Perfis de POI ricos: descrição, horário de funcionamento, links sociais e tags
- Sistema de autenticação para salvar mapas e POIs por usuário
- Minimap de visão geral estilo HUD de videogame
- Compartilhamento de POIs e mapas via link público
- Sistema social: seguir outros usuários e grupos fechados, com POIs visíveis conforme a visibilidade escolhida (público, seguidores, grupo ou só você) — ver Fase 7 em `docs/04_TIMELINE.md`
- Notificações in-app: novo seguidor, reação ao seu POI, POI novo de quem você segue, convite de grupo

## Diferenciais

- Estética visual gamificada única: temas de mapa inspirados em RPG, GTA e mapas cartográficos retrô — algo que nenhuma ferramenta mainstream oferece
- POIs multimedia ricos: combinação de imagem + avatar + GIF + áudio em um único ponto — muito além de um simples pin do Google Maps
- Switching de tema do mapa em tempo real: o usuário troca a 'skin' do mapa (cartoon, pixel art, vintage) sem recarregar a página
- Integração híbrida de mapas: usa Leaflet para renderização customizável + OSRM/GraphHopper para rotas gratuitas + deep-link para Google Maps quando necessário
- Experiência de portfólio técnico: projeto visualmente impressionante que demonstra domínio de mapas, uploads de mídia, autenticação, animações e design system customizado

## Escopo do MVP (Mínimo Produto Viável)

- [ ] Mapa Leaflet interativo com 2 temas visuais (Cartoon via CartoDB Voyager + Padrão) e geolocalização do usuário
- [ ] Autenticação básica (login Google via NextAuth.js)
- [ ] CRUD de POIs: criar ponto no mapa clicando, adicionar nome, categoria, descrição e 1 imagem (upload para R2)
- [ ] Sistema de categorias com 6 tipos predefinidos e ícones customizados por categoria
- [ ] Busca de POIs por nome no mapa atual (query por bounding box no PostGIS)
- [ ] Cálculo de rota da posição atual até o POI via OSRM com exibição no mapa e tempo estimado
- [ ] Botão 'Abrir no Google Maps' com deep-link funcional
- [ ] Deploy em produção (Vercel + Railway) com domínio acessível para o portfólio

## Funcionalidades Futuras (v2+)

- App nativo React Native (iOS/Android) com acesso ao GPS nativo e notificações push ao chegar perto de um POI cadastrado
- Modo colaborativo: múltiplos usuários editando o mesmo mapa compartilhado em tempo real (WebSockets + CRDTs)
- Sistema de 'Expedições': criar rotas com múltiplos POIs em sequência (tour guiado gamificado)
- Temas de mapa customizáveis pelo usuário: editor visual para criar próprio tileset/paleta
- Integração com Spotify API: associar uma música/playlist a um POI (ao visitar, toca a música do lugar)
- Sistema de conquistas e badges: 'Explorador' (100 POIs visitados), 'Cartógrafo' (50 POIs criados), etc.
- Exportar mapa como imagem PNG em estilo pôster (estética de mapa vintage para impressão)
- Analytics de POIs: criador vê quantas pessoas visualizaram, calcularam rota e abriram no Google Maps
- Modo offline completo: baixar tiles e POIs de uma região para uso sem internet
- Compartilhamento de localização em tempo real para grupos ou amigos específicos (estilo "live location" do WhatsApp/Google Maps) — pedido em 08/11/2026

## Riscos Identificados

- Risco técnico 1 — Leaflet + Next.js 14 SSR conflict: Leaflet usa APIs do browser (window, document) incompatíveis com SSR. Mitigação: usar dynamic import com { ssr: false } para todos os componentes Leaflet, criar wrapper MapClient separado do layout do servidor.
- Risco técnico 2 — PostGIS no Railway: a extensão PostGIS precisa ser habilitada manualmente (CREATE EXTENSION postgis) e pode não estar disponível automaticamente no plano base do Railway. Mitigação: verificar suporte PostGIS no Railway antes de começar (alternativa: usar Supabase que tem PostGIS nativo e free tier generoso).
- Risco técnico 3 — OSRM API pública rate limiting: o servidor público do OSRM (router.project-osrm.org) não tem SLA e pode ter indisponibilidade ou rate limiting sem aviso. Mitigação: implementar fallback para GraphHopper free tier e adicionar cache Redis agressivo das rotas calculadas.
- Risco técnico 4 — Web Audio API para gravação de áudio: compatibilidade cross-browser da API MediaRecorder varia (especialmente Safari iOS). Mitigação: usar biblioteca recorder.js como abstração, testar no Safari desde o início, e oferecer upload de arquivo de áudio como alternativa à gravação.
- Risco técnico 5 — Custo surpresa da Claude API: sem rate limiting adequado, usuários curiosos podem disparar centenas de chamadas aos agentes de IA rapidamente. Mitigação: implementar limite por usuário (10 chamadas/hora), queue com Celery e alertas de custo no dashboard da Anthropic.
- Risco de negócio 1 — Escopo inflado vs. prazo de portfólio: o projeto tem muitas features desejáveis que podem atrasar indefinidamente o lançamento. Mitigação: seguir rigorosamente o MVP Scope definido e fazer deploy público antes de adicionar features da fase 5 e 6.
- Risco de negócio 2 — Tiles de mapa com visual cartoon: os tilesets gratuitos (CartoDB, Stadia) são bonitos mas não têm visual 100% cartoon/gamificado como GTA. Mitigação: usar MapTiler (free tier 100K tiles/mês) que oferece estilos mais customizáveis, ou sobrepor SVG layers no Leaflet para criar a estética gamificada sem depender do tileset.

## Resumo das Referências Analisadas

As referências fornecidas criaram um mapa claro da identidade visual e funcional do projeto: (1) Wplace.live confirmou a viabilidade de mapas interativos colaborativos com estética não-convencional, validando a abordagem de um mapa web com identidade visual própria além do padrão Google Maps. (2) Mapa urbano West Point KY inspirou o sistema de color-coding por categoria de POI com legenda flutuante, tipografia mista (display + funcional) e paleta vintage como um dos 5 temas do MapPin. (3) Mapa RPG ASUKA definiu o tema mais diferenciado do projeto: node-based navigation com biomas visuais, ícones 16-32px estilo pixel art por categoria, compass animado e legenda compacta flutuante — features que fazem o MapPin ser visualmente único. (4) GTA San Andreas (overhead map) influenciou a hierarquia visual do mapa: diferenciação clara entre zonas urbanas, rurais e corpos d'água usando cores neutras que não poluem os dados dos POIs. (5) GTA V com POIs categorizados por cores (azul/vermelho/amarelo/verde) definiu o sistema de pins coloridos por categoria do MapPin, o layout multi-layer (cidade > bairro > local) e a tipografia bold hierárquica para nomes de regiões. A síntese dessas referências resulta em um aplicativo que é funcionalmente um Google Maps pessoal, mas visualmente um RPG/videogame — diferencial claro e memorável para portfólio técnico.
