import uuid

import boto3
from botocore.config import Config

from app.core.config import settings


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
