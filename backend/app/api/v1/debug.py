from fastapi import APIRouter, Request

from app.core.cache import cache_get, cache_set

router = APIRouter(tags=["debug"])

# Endpoint temporário (10/11/2026) pra capturar o crash do app mobile em
# release/preview sem precisar de adb/logcat no aparelho do dono do projeto —
# sem autenticação de propósito (diagnóstico pontual, nenhum dado sensível
# trafega aqui). Remover depois de achar a causa do crash.
_CACHE_KEY = "debug:mobile_crash"


@router.post("/debug/mobile-crash")
async def report_mobile_crash(request: Request) -> dict:
    body = await request.body()
    cache_set(_CACHE_KEY, body.decode("utf-8", errors="replace"), ttl_seconds=86400)
    return {"ok": True}


@router.get("/debug/mobile-crash")
def get_mobile_crash() -> dict:
    return {"data": cache_get(_CACHE_KEY)}
