from io import BytesIO

from PIL import Image

from app.core.config import settings
from app.core.storage import build_public_url, get_r2_client

THUMBNAIL_SIZE = (400, 400)

AVATAR_SIZE = (512, 512)
# 5 MiB — o presigned PUT do R2 não tem como impor isso antes do upload (ver
# nota em `create_presigned_upload_url`); o limite real é aplicado aqui,
# depois que o arquivo já chegou no bucket, e o objeto é apagado se passar
# disso. Uma janela curta onde um arquivo grande pode ficar no bucket até
# essa checagem rodar é uma limitação conhecida da arquitetura atual (PUT
# presign, não POST com `Content-Length-Range`) — não é nova deste recurso,
# o upload de mídia de POI tem a mesma lacuna e não tem limite nenhum hoje.
MAX_AVATAR_UPLOAD_BYTES = 5 * 1024 * 1024
ALLOWED_AVATAR_FORMATS = {"JPEG", "PNG", "WEBP"}


class InvalidAvatarUpload(ValueError):
    """Upload de avatar rejeitado (arquivo grande demais, corrompido ou que
    não é uma imagem de verdade, mesmo que o navegador tenha afirmado que
    era) — sempre acompanhada da limpeza do objeto bruto no R2."""


def process_avatar_upload(object_key: str, user_id_prefix: str) -> str:
    """Valida e processa um avatar enviado pelo usuário (upload direto pro R2
    via presigned URL, bytes nunca vistos pelo backend até aqui): baixa o
    objeto bruto, confere tamanho e se é mesmo uma imagem decodificável,
    recorta em quadrado, redimensiona e reduz num WEBP fixo — nunca serve o
    arquivo original enviado (poderia ter dimensão/formato arbitrário, ou o
    `Content-Type` declarado pelo navegador pode não bater com os bytes
    reais). Resultado também vem sem EXIF (não é copiado ao reabrir/resalvar
    a imagem), o que incidentalmente remove dados sensíveis como geolocalização
    embutida na foto original.

    Levanta `InvalidAvatarUpload` e sempre apaga o objeto bruto do R2 em
    qualquer caso de rejeição — nunca deixa um upload inválido órfão no bucket.
    """
    if not object_key.startswith(user_id_prefix):
        raise InvalidAvatarUpload("Chave de objeto não pertence a este usuário")

    client = get_r2_client()
    try:
        original = client.get_object(Bucket=settings.r2_bucket_name, Key=object_key)
    except Exception as exc:
        raise InvalidAvatarUpload("Upload não encontrado no storage") from exc

    try:
        content_length = original.get("ContentLength", 0)
        if content_length > MAX_AVATAR_UPLOAD_BYTES:
            raise InvalidAvatarUpload("Arquivo maior que o limite de 5 MB")

        raw_bytes = original["Body"].read()
        try:
            image = Image.open(BytesIO(raw_bytes))
            image.load()  # força decodificar agora, não só ler o cabeçalho
        except Exception as exc:
            raise InvalidAvatarUpload("Arquivo não é uma imagem válida") from exc

        if image.format not in ALLOWED_AVATAR_FORMATS:
            raise InvalidAvatarUpload("Formato de imagem não permitido (use JPG, PNG ou WEBP)")

        image = image.convert("RGB")

        # Recorte central quadrado antes de redimensionar — sem isso, uma
        # foto retangular ficaria esticada/distorcida no círculo do avatar.
        width, height = image.size
        side = min(width, height)
        left = (width - side) // 2
        top = (height - side) // 2
        image = image.crop((left, top, left + side, top + side))
        image.thumbnail(AVATAR_SIZE)

        buffer = BytesIO()
        image.save(buffer, format="WEBP", quality=85)
        buffer.seek(0)

        processed_key = f"{object_key.rsplit('.', 1)[0]}_avatar.webp"
        client.put_object(
            Bucket=settings.r2_bucket_name,
            Key=processed_key,
            Body=buffer,
            ContentType="image/webp",
        )
        return build_public_url(processed_key)
    finally:
        # O original bruto nunca é servido nem mantido — só a versão
        # processada acima permanece no bucket, seja o upload aceito ou não.
        client.delete_object(Bucket=settings.r2_bucket_name, Key=object_key)


def generate_image_thumbnail(object_key: str) -> str:
    """Baixa a imagem original do R2, gera uma thumbnail WebP e sobe de volta.

    O upload original do navegador vai direto pro R2 via presigned URL (o
    binário nunca passa pelo FastAPI nessa etapa); só a thumbnail passa por
    aqui, depois que o upload já terminou.
    """
    client = get_r2_client()
    original = client.get_object(Bucket=settings.r2_bucket_name, Key=object_key)
    image = Image.open(BytesIO(original["Body"].read()))
    image = image.convert("RGB")
    image.thumbnail(THUMBNAIL_SIZE)

    buffer = BytesIO()
    image.save(buffer, format="WEBP", quality=80)
    buffer.seek(0)

    thumbnail_key = f"{object_key.rsplit('.', 1)[0]}_thumb.webp"
    client.put_object(
        Bucket=settings.r2_bucket_name,
        Key=thumbnail_key,
        Body=buffer,
        ContentType="image/webp",
    )
    return build_public_url(thumbnail_key)
