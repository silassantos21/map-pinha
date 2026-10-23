import type { MediaType, PoiMedia } from "@/types/poi";

interface PresignedResponse {
  upload_url: string;
  object_key: string;
  public_url: string;
}

export async function uploadMediaFile(
  file: File | Blob,
  filename: string,
  contentType: string,
  mediaType: MediaType,
): Promise<{ objectKey: string }> {
  const presignRes = await fetch("/api/media/presigned-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename, content_type: contentType, media_type: mediaType }),
  });
  if (!presignRes.ok) throw new Error("Falha ao gerar URL de upload");
  const presigned: PresignedResponse = await presignRes.json();

  const uploadRes = await fetch(presigned.upload_url, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: file,
  });
  if (!uploadRes.ok) throw new Error("Falha ao enviar arquivo para o storage");

  return { objectKey: presigned.object_key };
}

export async function attachMediaToPoi(
  poiId: string,
  objectKey: string,
  mediaType: MediaType,
): Promise<PoiMedia> {
  const res = await fetch(`/api/pois/${poiId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ object_key: objectKey, media_type: mediaType }),
  });
  if (!res.ok) throw new Error("Falha ao anexar mídia ao POI");
  return res.json();
}
