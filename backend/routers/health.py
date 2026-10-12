from fastapi import APIRouter, Request
from datetime import datetime, timezone

router = APIRouter()


@router.get("/health")
async def health_check(request: Request):
    return {
        "status": "ok",
        "request_id": request.state.request_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
