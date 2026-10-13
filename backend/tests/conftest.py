import os
from unittest.mock import MagicMock

# Settings()가 import 시점에 평가되므로 backend 모듈 import 전에 더미 환경변수를 주입한다
os.environ.setdefault("SUPABASE_URL", "http://localhost:54321")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key")


def make_builder(execute_result, *chain_methods: str) -> MagicMock:
    """체인 메서드가 자기 자신을 반환하고 execute()가 지정한 결과를 돌려주는 쿼리 빌더 mock."""
    builder = MagicMock()
    for name in chain_methods:
        getattr(builder, name).return_value = builder
    builder.execute.return_value = execute_result
    return builder


def make_response(data=None, count=None) -> MagicMock:
    response = MagicMock()
    response.data = data
    response.count = count
    return response


def make_db(builder: MagicMock) -> MagicMock:
    db = MagicMock()
    db.table.return_value = builder
    return db
