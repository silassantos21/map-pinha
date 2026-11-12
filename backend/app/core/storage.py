import uuid
from io import BytesIO
from typing import Callable

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from PIL import Image, UnidentifiedImageError

from app.core.config import settings
from app.models.poi_media import MediaType

# Assinaturas (primeiros bytes) dos contêineres de áudio aceitos no upload
# de POI — cobre tanto arquivo escolhido pelo usuário (`accept="audio/*"`,
# `media-uploader.tsx` na web) quanto o gravado no navegador via
# MediaRecorder (sempre vira `audio/webm`, mesma assinatura do Matroska).
_AUDIO_MAGIC_PREFIXES: tuple[bytes, ...] = (
    b"RIFF",  # WAV
    b"OggS",  # OGG
    b"ID3",  # MP3 com tag ID3
    b"\xff\xfb",  # MP3 sem tag ID3 (frame sync)
    b"\xff\xf3",
    b"\xff\xf2",
    b"\x1aE\xdf\xa3",  # WebM/Matroska
)

# Limite de tamanho por tipo de mídia de POI — nenhum existia antes (o
# presigned PUT do S3/R2 não suporta condição de tamanho como o presigned
# POST suportaria; por isso o limite real só pode ser conferido depois do
# upload já ter terminado, em `verify_uploaded_object` abaixo).
MAX_UPLOAD_BYTES: dict[MediaType, int] = {
    MediaType.image: 15 * 1024 * 1024,
    MediaType.gif: 20 * 1024 * 1024,
    MediaType.audio: 10 * 1024 * 1024,
}

# Content-Type permitido por tipo de mídia. `image/svg+xml` fica de fora de
# propósito — SVG é XML e pode embutir `<script>`, risco de XSS armazenado
# se um dia for servido/renderizado inline.
_ALLOWED_CONTENT_TYPE_CHECKS: dict[MediaType, Callable[[str], bool]] = {
    MediaType.image: lambda ct: ct.startswith("image/") and ct != "image/svg+xml",
    MediaType.gif: lambda ct: ct == "image/gif",
    MediaType.audio: lambda ct: ct.startswith("audio/"),
}


def is_allowed_content_type(media_type: MediaType, content_type: str) -> bool:
    check = _ALLOWED_CONTENT_TYPE_CHECKS.get(media_type)
    return check(content_type) if check else False


class UploadValidationError(Exception):
    """Levantado quando o arquivo já enviado ao R2 não bate com o que foi
    declarado no pedido de presigned URL (tipo ou tamanho)."""


def get_r2_client():
    return boto3.client(
        "s3",
        endpoint_url=f"https://{settings.r2_account_id}.r2.cloudflarestorage.com",
        aws_access_key_id=settings.r2_access_key_id,
        aws_secret_access_key=settings.r2_secret_access_key,
        region_name="auto",
        config=Config(signature_version="s3v4"),
    )


def build_object_key(media_type: str, filename: str) -> str:
    extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else "bin"
    return f"{media_type}/{uuid.uuid4()}.{extension}"


def build_public_url(object_key: str) -> str:
    return f"{settings.r2_public_url.rstrip('/')}/{object_key}"


def delete_object_by_public_url(public_url: str) -> None:
    """Apaga um objeto do R2 a partir da sua URL pública (usado ao remover
    mídia de um POI). Ignora silenciosamente URLs que não vieram do nosso
    bucket (nada a apagar)."""
    prefix = f"{settings.r2_public_url.rstrip('/')}/"
    if not public_url.startswith(prefix):
        return
    object_key = public_url[len(prefix) :]
    get_r2_client().delete_object(Bucket=settings.r2_bucket_name, Key=object_key)


def create_presigned_upload_url(object_key: str, content_type: str, expires_in: int = 300) -> str:
    client = get_r2_client()
    return client.generate_presigned_url(
        "put_object",
        Params={
            "Bucket": settings.r2_bucket_name,
            "Key": object_key,
            "ContentType": content_type,
        },
        ExpiresIn=expires_in,
    )


_HEIC_BRANDS: frozenset[bytes] = frozenset(
    {b"heic", b"heix", b"heim", b"heis", b"hevc", b"hevx", b"mif1", b"msf1"}
)


def _looks_like_heic(body: bytes) -> bool:
    """Fotos HEIC (padrão em câmera de iPhone) não têm suporte nativo no
    Pillow sem plugin extra — sem este fallback por assinatura de contêiner
    (box `ftyp` do formato ISOBMFF), `Image.open` rejeitaria uma foto real
    só por não conseguir decodificá-la."""
    return body[4:8] == b"ftyp" and body[8:12] in _HEIC_BRANDS


def _content_matches_media_type(media_type: MediaType, body: bytes) -> bool:
    """Checagem real dos bytes — o `Content-Type` guardado no R2 é só o que
    o cliente declarou no PUT, não garante nada sobre o conteúdo em si."""
    if media_type in (MediaType.image, MediaType.gif):
        try:
            image = Image.open(BytesIO(body))
            image_format = image.format
            image.verify()
        except (UnidentifiedImageError, OSError, ValueError):
            return media_type == MediaType.image and _looks_like_heic(body)
        return image_format == "GIF" if media_type == MediaType.gif else True
    if media_type == MediaType.audio:
        return body.startswith(_AUDIO_MAGIC_PREFIXES) or body[4:8] == b"ftyp"
    return False


def verify_uploaded_object(object_key: str, media_type: MediaType) -> None:
    """Confere, já com o upload terminado no R2 (chamado ao anexar a mídia
    no POI), que o arquivo de verdade bate com o que foi declarado no
    pedido de presigned URL — o cliente podia mentir o `content_type`
    naquele momento e mandar qualquer outro byte stream na hora do PUT
    (o S3/R2 nunca confere isso sozinho). Apaga o objeto do R2 e levanta
    `UploadValidationError` se o tamanho, o Content-Type declarado ou o
    conteúdo real não passarem na checagem."""
    client = get_r2_client()
    try:
        obj = client.get_object(Bucket=settings.r2_bucket_name, Key=object_key)
    except ClientError as exc:
        raise UploadValidationError("Upload not found in storage") from exc

    size = obj.get("ContentLength", 0)
    content_type = obj.get("ContentType", "")
    max_bytes = MAX_UPLOAD_BYTES.get(media_type, 0)

    valid = size <= max_bytes and is_allowed_content_type(media_type, content_type)
    body = b""
    if valid:
        body = obj["Body"].read()
        valid = _content_matches_media_type(media_type, body)

    if not valid:
        client.delete_object(Bucket=settings.r2_bucket_name, Key=object_key)
        raise UploadValidationError("Uploaded file failed type/size/content validation")
