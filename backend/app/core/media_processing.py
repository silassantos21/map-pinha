from io import BytesIO

from PIL import Image

from app.core.config import settings
from app.core.storage import build_public_url, get_r2_client

THUMBNAIL_SIZE = (400, 400)


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
