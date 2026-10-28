import anthropic

from app.core.config import settings

# Sonnet 5.5: equilíbrio entre custo e qualidade suficiente pras 3 tarefas dos
# agentes (categorizar, escrever bio, recomendar) — decisão sua em 27/10/2026,
# ver SPRINTS.md Sprint 5.
AI_MODEL = "claude-sonnet-5-5"

_client: anthropic.Anthropic | None = None


def get_ai_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    return _client
