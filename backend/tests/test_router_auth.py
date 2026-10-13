from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from backend.database.supabase import get_supabase
from backend.main import app


@pytest.fixture
def client():
    # 더미 키로 실제 Supabase 클라이언트를 만들지 않도록 교체한다
    app.dependency_overrides[get_supabase] = lambda: MagicMock()
    yield TestClient(app, raise_server_exceptions=False)
    app.dependency_overrides.clear()


@pytest.mark.parametrize(
    "method, path",
    [
        ("post", "/api/v1/items"),
        ("put", "/api/v1/items/item-1"),
        ("delete", "/api/v1/items/item-1"),
        ("post", "/api/v1/users"),
        ("put", "/api/v1/users/user-1"),
        ("delete", "/api/v1/users/user-1"),
    ],
)
def test_쓰기_엔드포인트는_토큰이_없으면_401이다(client, method, path):
    kwargs = {} if method == "delete" else {"json": {"title": "t", "username": "u"}}

    response = getattr(client, method)(path, **kwargs)

    assert response.status_code == 401
    assert response.json()["code"] == "UNAUTHORIZED"
    assert response.json()["requestId"]
