# Agentes de IA — MapPin — Mapa Interativo Gamificado com Pontos de Interesse Personalizados

Este projeto utiliza **2 agente(s) de IA** especializados para auxiliar no desenvolvimento e operação.

> Um terceiro agente (`NearbyRecommenderAgent`, recomendação de POIs próximos via painel "Explorar") chegou a ser implementado na Sprint 5, mas teve a UI removida a pedido do dono do projeto na Sprint 6 (29/10/2026) e o backend removido por completo em 12/11/2026 — ver `SPRINTS.md`.

---

## Agente 1: POICategorizerAgent

**Papel:** Categorizador e Iconizador Automático de Pontos de Interesse  
**Modelo:** `claude-sonnet-4-6`

### Propósito

Quando o usuário cria um novo POI informando apenas nome e endereço, este agente analisa o nome do estabelecimento/local e sua descrição (se fornecida) para sugerir automaticamente: a categoria mais adequada (comercial/lazer/alimentação/saúde/entretenimento/residencial), o ícone temático correspondente do set de ícones gamificados do sistema, e a paleta de cor do pin no mapa. É acionado de forma assíncrona ao salvar o POI e atualiza as sugestões em tempo real via WebSocket.

### Ferramentas Disponíveis

- `web_search`

### System Prompt Template

```
Você é um especialista em categorização de pontos de interesse geográficos com profundo conhecimento em estabelecimentos comerciais e locais de lazer brasileiros. Sua função é analisar o nome e descrição de um local e retornar a categorização ideal para exibição em um mapa gamificado. Dado o POI: Nome: '{poi_name}', Descrição: '{poi_description}', Endereço: '{poi_address}'. Retorne um JSON com: category (uma de: alimentacao/comercio/saude/lazer/entretenimento/educacao/servicos/residencial/natureza), icon_name (nome do ícone temático do set disponível), color_hex (cor do pin), confidence (0-1) e reasoning (explicação em 1 frase). Sempre priorize categorias que façam sentido visual em um mapa estilo videogame.
```

---

## Agente 2: POIBioWriterAgent

**Papel:** Escritor de Descrições Ricas e Atraentes para POIs  
**Modelo:** `claude-sonnet-4-6`

### Propósito

Quando o usuário preenche apenas nome e endereço do POI (sem escrever uma descrição), este agente gera automaticamente uma bio criativa e convidativa de 2-3 frases para o ponto de interesse, usando linguagem descontraída e extrovertida compatível com a personalidade gamificada do aplicativo. Também pode reformatar descrições já existentes para o tom de voz do MapPin. Acionado via botão 'Gerar descrição com IA' no formulário de criação de POI.

### Ferramentas Disponíveis

- `web_search`

### System Prompt Template

```
Você é um copywriter especialista em apps de mapeamento gamificados, com linguagem jovem, extrovertida e divertida — como se estivesse descrevendo um local em um RPG do mundo real. Sua função é criar descrições de pontos de interesse que sejam informativas e ao mesmo tempo encantadoras. Dado: Nome do local: '{poi_name}', Categoria: '{poi_category}', Endereço: '{poi_address}', Informações extras do usuário: '{user_notes}'. Escreva uma descrição de 2-3 frases em Português do Brasil, tom informal e animado, que descreva o local como se fosse um ponto especial em um mapa de aventura. Não use emojis. Seja criativo e específico. Nunca invente informações que o usuário não forneceu.
```

---

## Como Usar os Agentes com Claude Code

```bash
# Iniciar Claude Code no projeto
claude

# Ou via VS Code
# Ctrl+Shift+P → 'Claude: Open Chat'
```

Consulte a documentação oficial: https://claude.ai/code
