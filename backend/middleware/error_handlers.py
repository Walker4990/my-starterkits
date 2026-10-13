import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


def _request_id(request: Request) -> str:
    return getattr(request.state, "request_id", "unknown")


def _error_response(
    request: Request, status_code: int, message: str, code: str
) -> JSONResponse:
    # 프론트 ApiError(types/common.ts)와 동일한 형태
    return JSONResponse(
        status_code=status_code,
        content={
            "message": message,
            "code": code,
            "requestId": _request_id(request),
            "statusCode": status_code,
        },
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    detail = exc.detail
    if isinstance(detail, dict):
        message = str(detail.get("message", "요청에 실패했습니다."))
        code = str(detail.get("code", f"HTTP_{exc.status_code}"))
    else:
        message = str(detail)
        code = f"HTTP_{exc.status_code}"
    response = _error_response(request, exc.status_code, message, code)
    if exc.headers:
        response.headers.update(exc.headers)
    return response


async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    return _error_response(request, 422, "요청 값이 올바르지 않습니다.", "VALIDATION_ERROR")


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    # 내부 정보는 응답에 노출하지 않고, requestId와 함께 로그로 남긴다
    logger.error(
        "처리되지 않은 예외 requestId=%s",
        _request_id(request),
        exc_info=(type(exc), exc, exc.__traceback__),
    )
    return _error_response(
        request, 500, "서버 오류가 발생했습니다.", "INTERNAL_SERVER_ERROR"
    )


def register_error_handlers(app: FastAPI) -> None:
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)
