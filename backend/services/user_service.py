from typing import Optional
from fastapi import HTTPException, status
from backend.models.user import User, UserCreate, UserUpdate
from backend.repositories.user_repository import UserRepository


class UserService:
    def __init__(self, repository: UserRepository):
        self._repo = repository

    def get_users(self, page: int = 1, limit: int = 20) -> tuple[list[User], int]:
        return self._repo.find_many(page=page, limit=limit)

    def get_user(self, user_id: str) -> User:
        user = self._repo.find_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"message": "유저를 찾을 수 없습니다.", "code": "USER_NOT_FOUND"},
            )
        return user

    def create_user(self, data: UserCreate) -> User:
        return self._repo.create(data)

    def update_user(self, user_id: str, data: UserUpdate) -> User:
        user = self._repo.update(user_id, data)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"message": "유저를 찾을 수 없습니다.", "code": "USER_NOT_FOUND"},
            )
        return user

    def delete_user(self, user_id: str) -> None:
        deleted = self._repo.delete(user_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"message": "유저를 찾을 수 없습니다.", "code": "USER_NOT_FOUND"},
            )
