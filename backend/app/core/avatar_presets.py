import uuid

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


# Fotos enviadas pelo próprio usuário (em vez de preset/foto do Google) ficam
# isoladas num prefixo por usuário — nunca em `avatars/presets/`, que é
# compartilhado entre todo mundo e nunca pode ser apagado por engano ao
# trocar de avatar.
ALLOWED_AVATAR_UPLOAD_EXTENSIONS = {"jpg": "JPEG", "jpeg": "JPEG", "png": "PNG", "webp": "WEBP"}
ALLOWED_AVATAR_UPLOAD_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}


def avatar_upload_prefix(user_id: object) -> str:
    return f"avatars/uploads/{user_id}/"


def avatar_upload_object_key(user_id: object, extension: str) -> str:
    return f"{avatar_upload_prefix(user_id)}{uuid.uuid4()}.{extension}"


def is_custom_avatar_upload(url: str | None, user_id: object) -> bool:
    """`True` só se `url` for um upload próprio deste usuário (nunca um
    preset) — usado pra decidir se um avatar antigo pode ser apagado do R2
    com segurança ao trocar pra outro (preset, Google ou novo upload)."""
    if not url:
        return False
    return url.startswith(build_public_url(avatar_upload_prefix(user_id)))
