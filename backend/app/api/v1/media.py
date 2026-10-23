from fastapi import APIRouter, Depends

from app.api.v1.auth import verify_internal_secret
from app.core.storage import build_object_key, build_public_url, create_presigned_upload_url
from app.schemas.media import PresignedUploadRequest, PresignedUploadResponse

router = APIRouter(dependencies=[Depends(verify_internal_secret)])


@router.post("/media/presigned-url", response_model=PresignedUploadResponse)
def create_presigned_url(payload: PresignedUploadRequest):
    object_key = build_object_key(payload.media_type.value, payload.filename)
    upload_url = create_presigned_upload_url(object_key, payload.content_type)
    return PresignedUploadResponse(
        upload_url=upload_url,
        object_key=object_key,
        public_url=build_public_url(object_key),
    )
