import logging
from dataclasses import dataclass
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import Client

from backend.database.supabase import get_supabase

logger = logging.getLogger(__name__)

# 에러 형식을 직접 통일하기 위해 auto_error는 끈다
_bearer = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class CurrentUser:
    id: str


def _unauthorized(message: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail={"message": message, "code": "UNAUTHORIZED"},
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
    db: Client = Depends(get_supabase),
) -> CurrentUser:
    """Authorization: Bearer 토큰을 Supabase Auth로 검증해 현재 유저를 반환한다."""
    if credentials is None:
        raise _unauthorized("인증이 필요합니다.")

    try:
        response = db.auth.get_user(credentials.credentials)
    except Exception:
        # 만료·위조 토큰 등. 원인은 로그에만 남기고 응답에는 노출하지 않는다
        logger.warning("토큰 검증 실패", exc_info=True)
        raise _unauthorized("유효하지 않은 토큰입니다.")

    if response is None or response.user is None:
        raise _unauthorized("유효하지 않은 토큰입니다.")

    return CurrentUser(id=response.user.id)
