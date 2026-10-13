from fastapi import APIRouter, Request, Depends
from supabase import Client
from backend.models.user import User, UserCreate, UserUpdate
from backend.models.common import ApiResponse, PaginatedResponse
from backend.repositories.user_repository import UserRepository
from backend.services.user_service import UserService
from backend.database.supabase import get_supabase
from backend.dependencies.auth import CurrentUser, get_current_user

router = APIRouter(prefix="/api/v1/users", tags=["users"])


def get_service(db: Client = Depends(get_supabase)) -> UserService:
    return UserService(UserRepository(db))


@router.get("", response_model=PaginatedResponse[User])
async def list_users(
    request: Request,
    page: int = 1,
    limit: int = 20,
    service: UserService = Depends(get_service),
):
    users, total = service.get_users(page=page, limit=limit)
    return PaginatedResponse(
        data=users,
        total=total,
        page=page,
        limit=limit,
        has_next=(page * limit) < total,
        request_id=request.state.request_id,
    )


@router.get("/{user_id}", response_model=ApiResponse[User])
async def get_user(
    user_id: str,
    request: Request,
    service: UserService = Depends(get_service),
):
    user = service.get_user(user_id)
    return ApiResponse(data=user, request_id=request.state.request_id)


@router.post("", response_model=ApiResponse[User], status_code=201)
async def create_user(
    body: UserCreate,
    request: Request,
    current_user: CurrentUser = Depends(get_current_user),
    service: UserService = Depends(get_service),
):
    user = service.create_user(body, user_id=current_user.id)
    return ApiResponse(data=user, request_id=request.state.request_id)


@router.put("/{user_id}", response_model=ApiResponse[User])
async def update_user(
    user_id: str,
    body: UserUpdate,
    request: Request,
    current_user: CurrentUser = Depends(get_current_user),
    service: UserService = Depends(get_service),
):
    user = service.update_user(user_id, body, current_user_id=current_user.id)
    return ApiResponse(data=user, request_id=request.state.request_id)


@router.delete("/{user_id}", status_code=204)
async def delete_user(
    user_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    service: UserService = Depends(get_service),
):
    service.delete_user(user_id, current_user_id=current_user.id)
