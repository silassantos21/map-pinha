import logging

from pydantic import BaseModel, Field

from app.core.ai_client import AI_MODEL, get_ai_client

logger = logging.getLogger(__name__)


class CategorizationResult(BaseModel):
    category_slug: str
    icon_name: str
    color_hex: str
    confidence: float = Field(ge=0, le=1)
    reasoning: str


def categorize_poi(
    name: str,
    description: str | None,
    address: str | None,
    category_slugs: list[str],
) -> CategorizationResult | None:
    """POICategorizerAgent — sugere categoria/ícone/cor pro POI recém-criado.
    Roda em segundo plano (BackgroundTasks) logo após o POI ser salvo; o dono
    aceita ou dispensa a sugestão depois. Retorna `None` em qualquer falha —
    é um bônus, nunca pode quebrar a criação do POI."""
    try:
        response = get_ai_client().messages.parse(
            model=AI_MODEL,
            max_tokens=1024,
            system=(
                "Você é um especialista em categorização de pontos de interesse geográficos "
                "brasileiros para um mapa gamificado. Analise o nome, descrição e endereço do "
                "local e escolha a categoria mais adequada entre as disponíveis (pelo slug "
                "exato), mais um nome de ícone temático do lucide-react em kebab-case e uma cor "
                "hex pro pin no mapa. Justificativa em 1 frase curta."
            ),
            messages=[{
                "role": "user",
                "content": (
                    f"Nome: '{name}'\n"
                    f"Descrição: '{description or 'não informada'}'\n"
                    f"Endereço: '{address or 'não informado'}'\n\n"
                    f"Categorias disponíveis (escolha exatamente uma, pelo slug): "
                    f"{', '.join(category_slugs)}."
                ),
            }],
            output_format=CategorizationResult,
        )
        return response.parsed_output
    except Exception:
        logger.exception("Falha ao categorizar POI via IA")
        return None


def generate_poi_bio(
    name: str,
    category_name: str,
    address: str | None,
    user_notes: str | None,
) -> str | None:
    """POIBioWriterAgent — gera uma bio curta e animada pro POI. Chamado
    sincronamente pelo botão 'Gerar descrição com IA' no formulário."""
    try:
        response = get_ai_client().messages.create(
            model=AI_MODEL,
            max_tokens=300,
            system=(
                "Você é um copywriter especialista em apps de mapeamento gamificados, com "
                "linguagem jovem, extrovertida e divertida — como se estivesse descrevendo um "
                "local em um RPG do mundo real. Escreva uma descrição de 2-3 frases em "
                "Português do Brasil, tom informal e animado, descrevendo o local como um ponto "
                "especial em um mapa de aventura. Não use emojis. Seja criativo e específico. "
                "Nunca invente informações que o usuário não forneceu. Responda só com a "
                "descrição, sem comentários extras nem aspas."
            ),
            messages=[{
                "role": "user",
                "content": (
                    f"Nome do local: '{name}'\n"
                    f"Categoria: '{category_name}'\n"
                    f"Endereço: '{address or 'não informado'}'\n"
                    f"Informações extras do usuário: '{user_notes or 'nenhuma'}'"
                ),
            }],
        )
        text = next((b.text for b in response.content if b.type == "text"), None)
        return text.strip() if text else None
    except Exception:
        logger.exception("Falha ao gerar bio do POI via IA")
        return None


class RecommendationItem(BaseModel):
    poi_id: str
    reason: str
    priority_score: int = Field(ge=1, le=10)


class _RecommendationResult(BaseModel):
    recommendations: list[RecommendationItem]


def recommend_nearby(
    user_lat: float,
    user_lng: float,
    nearby_pois: list[dict],
    current_time_iso: str,
) -> list[RecommendationItem]:
    """NearbyRecommenderAgent — escolhe até 3 POIs do raio de 2km mais
    relevantes pro usuário explorar agora, com motivo curto cada."""
    if not nearby_pois:
        return []
    try:
        response = get_ai_client().messages.parse(
            model=AI_MODEL,
            max_tokens=1024,
            system=(
                "Você é um guia turístico digital especializado em descobertas locais para um "
                "app de mapeamento gamificado. Selecione até 3 POIs da lista mais relevantes "
                "pro usuário explorar agora. Para cada um, use o poi_id exato como veio na "
                "lista, dê um motivo curto e animado (1 frase, em Português do Brasil) e um "
                "priority_score de 1 a 10. Nunca invente um POI que não está na lista."
            ),
            messages=[{
                "role": "user",
                "content": (
                    f"Localização atual do usuário: lat={user_lat}, lng={user_lng}.\n"
                    f"Horário atual: {current_time_iso}.\n"
                    f"POIs disponíveis no raio de 2km (JSON): {nearby_pois}"
                ),
            }],
            output_format=_RecommendationResult,
        )
        return response.parsed_output.recommendations
    except Exception:
        logger.exception("Falha ao gerar recomendações via IA")
        return []
