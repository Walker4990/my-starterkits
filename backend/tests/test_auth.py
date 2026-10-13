from unittest.mock import MagicMock

import pytest
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient

from backend.database.supabase import get_supabase
from backend.dependencies.auth import CurrentUser, get_current_user
from backend.middleware.error_handlers import register_error_handlers
from backend.middleware.request_id import RequestIdMiddleware


def make_client(db: MagicMock) -> TestClient:
    app = FastAPI()
    app.add_middleware(RequestIdMiddleware)
    register_error_handlers(app)
    app.dependency_overrides[get_supabase] = lambda: db

    @app.get("/me")
    def me(user: CurrentUser = Depends(get_current_user)):
        return {"id": user.id}

    return TestClient(app)


def user_response(user_id: str) -> MagicMock:
    response = MagicMock()
    response.user.id = user_id
    return response


def test_토큰이_없으면_401을_반환한다():
    client = make_client(MagicMock())

    response = client.get("/me")

    assert response.status_code == 401
    assert response.json()["code"] == "UNAUTHORIZED"


def test_Bearer_형식이_아니면_401을_반환한다():
    client = make_client(MagicMock())

    response = client.get("/me", headers={"Authorization": "Basic abc"})

    assert response.status_code == 401
    assert response.json()["code"] == "UNAUTHORIZED"


def test_Supabase가_토큰을_거부하면_401을_반환한다():
    db = MagicMock()
    db.auth.get_user.side_effect = Exception("invalid JWT")
    client = make_client(db)

    response = client.get("/me", headers={"Authorization": "Bearer bad-token"})

    assert response.status_code == 401
    assert response.json()["code"] == "UNAUTHORIZED"


def test_유저가_없는_응답이면_401을_반환한다():
    db = MagicMock()
    db.auth.get_user.return_value = None
    client = make_client(db)

    response = client.get("/me", headers={"Authorization": "Bearer token"})

    assert response.status_code == 401


def test_유효한_토큰이면_유저_id를_주입한다():
    db = MagicMock()
    db.auth.get_user.return_value = user_response("user-1")
    client = make_client(db)

    response = client.get("/me", headers={"Authorization": "Bearer good-token"})

    assert response.status_code == 200
    assert response.json() == {"id": "user-1"}
    db.auth.get_user.assert_called_once_with("good-token")
