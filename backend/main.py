from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.middleware.request_id import RequestIdMiddleware
from backend.database.supabase import settings
from backend.routers import health, users, items

app = FastAPI(
    title="웹 개발 스타터킷 쇼케이스 API",
    version="0.1.0",
    docs_url="/docs" if settings.debug else None,
)

# 미들웨어 등록
app.add_middleware(RequestIdMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(health.router)
app.include_router(users.router)
app.include_router(items.router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug,
    )
