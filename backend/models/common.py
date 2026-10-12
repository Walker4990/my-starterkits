from pydantic import BaseModel
from typing import Generic, TypeVar, List
from datetime import datetime, timezone

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    data: T
    request_id: str
    timestamp: str = ""

    def model_post_init(self, __context) -> None:
        if not self.timestamp:
            self.timestamp = datetime.now(timezone.utc).isoformat()


class PaginatedResponse(BaseModel, Generic[T]):
    data: List[T]
    total: int
    page: int
    limit: int
    has_next: bool
    request_id: str
    timestamp: str = ""

    def model_post_init(self, __context) -> None:
        if not self.timestamp:
            self.timestamp = datetime.now(timezone.utc).isoformat()
