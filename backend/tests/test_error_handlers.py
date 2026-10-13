import pytest
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient
from pydantic import BaseModel

from backend.middleware.error_handlers import register_error_handlers
from backend.middleware.request_id import RequestIdMiddleware


class Body(BaseModel):
    title: str


@pytest.fixture
def client() -> TestClient:
    app = FastAPI()
    app.add_middleware(RequestIdMiddleware)
    register_error_handlers(app)

    @app.get("/not-found")
    def not_found():
        raise HTTPException(
            status_code=404,
            detail={"message": "아이템을 찾을 수 없습니다.", "code": "ITEM_NOT_FOUND"},
        )

    @app.get("/plain")
    def plain():
        raise HTTPException(status_code=401, detail="Not authenticated")

    @app.post("/validate")
    def validate(body: Body):
        return body

    @app.get("/boom")
    def boom():
        raise RuntimeError("secret internal detail")

    return TestClient(app, raise_server_exceptions=False)


def test_dict_detail을_message_code로_펼치고_requestId를_포함한다(client):
    response = client.get("/not-found", headers={"X-Request-ID": "req_abc"})

    assert response.status_code == 404
    assert response.json() == {
        "message": "아이템을 찾을 수 없습니다.",
        "code": "ITEM_NOT_FOUND",
        "requestId": "req_abc",
        "statusCode": 404,
    }


def test_문자열_detail은_HTTP_상태코드_code로_변환한다(client):
    response = client.get("/plain")

    body = response.json()
    assert response.status_code == 401
    assert body["message"] == "Not authenticated"
    assert body["code"] == "HTTP_401"
    assert body["statusCode"] == 401
    assert body["requestId"] == response.headers["X-Request-ID"]


def test_검증_실패는_422와_VALIDATION_ERROR를_반환한다(client):
    response = client.post("/validate", json={})

    body = response.json()
    assert response.status_code == 422
    assert body["code"] == "VALIDATION_ERROR"
    assert body["statusCode"] == 422
    assert body["requestId"]


def test_미처리_예외는_500과_requestId를_반환하고_내부_정보를_숨긴다(client):
    response = client.get("/boom", headers={"X-Request-ID": "req_boom"})

    body = response.json()
    assert response.status_code == 500
    assert body["code"] == "INTERNAL_SERVER_ERROR"
    assert body["requestId"] == "req_boom"
    assert "secret internal detail" not in response.text
