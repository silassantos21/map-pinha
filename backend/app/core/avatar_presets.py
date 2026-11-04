from app.core.storage import build_public_url

# 20 avatares pré-gerados (Fase 9) — prompts em docs/avatar-prompts.txt,
# enviados manualmente pro bucket R2 em avatars/presets/avatar-01.jpg até
# avatar-20.jpg (04/11/2026). Fixo e pequeno o bastante pra não precisar de
# tabela própria no banco — só o preset_id escolhido é persistido no usuário.
AVATAR_PRESET_COUNT = 20


def avatar_preset_object_key(preset_id: int) -> str:
    return f"avatars/presets/avatar-{preset_id:02d}.jpg"


def avatar_preset_url(preset_id: int) -> str:
    return build_public_url(avatar_preset_object_key(preset_id))


def list_avatar_presets() -> list[dict[str, int | str]]:
    return [
        {"preset_id": preset_id, "url": avatar_preset_url(preset_id)}
        for preset_id in range(1, AVATAR_PRESET_COUNT + 1)
    ]
