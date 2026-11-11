import uuid

from fastapi import APIRouter, Depends

from app.core.security import require_internal_secret_or_mobile_user
from app.core.storage import build_object_key, build_public_url, create_presigned_upload_url
from app.schemas.media import PresignedUploadRequest, PresignedUploadResponse

router = APIRouter()


@router.post("/media/presigned-url", response_model=PresignedUploadResponse)
def create_presigned_url(
    payload: PresignedUploadRequest,
    mobile_user_id: uuid.UUID | None = Depends(require_internal_secret_or_mobile_user),
):
    del mobile_user_id  # só precisa autenticar (BFF ou app mobile), sem lógica de ator aqui
    object_key = build_object_key(payload.media_type.value, payload.filename)
    upload_url = create_presigned_upload_url(object_key, payload.content_type)
    return PresignedUploadResponse(
        upload_url=upload_url,
        object_key=object_key,
        public_url=build_public_url(object_key),
    )
