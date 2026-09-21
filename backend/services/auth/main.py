"""
ShipPulse - Auth & Identity Microservice (Port 5001)
Handles GitHub OAuth 2.0 flow, token exchange, account verification, and repo synchronization.
"""

import sys
import os
import time
import secrets
import logging
from typing import Optional, List, Dict, Any
import httpx
from fastapi import FastAPI, HTTPException, Header, Query, status
from fastapi.middleware.cors import CORSMiddleware

# Add backend directory to sys.path to access common package
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from common.config import settings
from common.schemas import (
    HealthResponse,
    OAuthUrlResponse,
    OAuthExchangeRequest,
    UserProfileResponse
)

logging.basicConfig(level=logging.INFO, format="[%(asctime)s] [%(levelname)s] [AuthService] %(message)s")
logger = logging.getLogger("auth_service")

app = FastAPI(
    title="ShipPulse - Auth & Identity Service",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.CORS_ORIGIN] if settings.CORS_ORIGIN != "*" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth_states: Dict[str, float] = {}


@app.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="healthy",
        service="Auth & Identity Service",
        timestamp=int(time.time()),
        version="1.0.0"
    )


@app.get("/auth/url", response_model=OAuthUrlResponse)
async def get_auth_url(host_url: Optional[str] = None):
    """Generates a secure GitHub OAuth 2.0 authorization URL."""
    base_url = settings.APP_URL or (host_url.rstrip("/") if host_url else "http://localhost:3000")
    redirect_uri = f"{base_url}/auth/callback"
    state = secrets.token_urlsafe(32)
    oauth_states[state] = time.time()

    scope = "repo user read:org"
    github_auth_url = (
        f"https://github.com/login/oauth/authorize?"
        f"client_id={settings.GITHUB_CLIENT_ID}&"
        f"redirect_uri={redirect_uri}&"
        f"scope={scope}&"
        f"state={state}"
    )
    return OAuthUrlResponse(
        url=github_auth_url,
        redirect_uri=redirect_uri,
        state=state
    )


@app.post("/auth/exchange")
async def exchange_oauth_code(payload: OAuthExchangeRequest):
    """Exchanges an OAuth code for a GitHub access token."""
    if not payload.code:
        raise HTTPException(status_code=400, detail="Authorization code is required")

    if not settings.GITHUB_CLIENT_ID or not settings.GITHUB_CLIENT_SECRET:
        logger.warning("GitHub OAuth credentials not set in environment.")
        raise HTTPException(status_code=500, detail="GitHub OAuth credentials not configured on backend server")

    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "User-Agent": "ShipPulse-AuthService/1.0"
    }
    request_data = {
        "client_id": settings.GITHUB_CLIENT_ID,
        "client_secret": settings.GITHUB_CLIENT_SECRET,
        "code": payload.code,
    }
    if payload.redirect_uri:
        request_data["redirect_uri"] = payload.redirect_uri

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.post("https://github.com/login/oauth/access_token", json=request_data, headers=headers)
            resp_data = resp.json()
            if "error" in resp_data:
                raise HTTPException(status_code=400, detail=resp_data.get("error_description", "OAuth exchange failed"))
            return resp_data
        except httpx.RequestError as exc:
            logger.error(f"GitHub OAuth network error: {exc}")
            raise HTTPException(status_code=502, detail=f"Failed to connect to GitHub OAuth server: {str(exc)}")


@app.get("/github/user", response_model=UserProfileResponse)
async def get_github_user(authorization: Optional[str] = Header(None)):
    """Validates user access token and returns sanitized profile details."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    headers = {
        "Authorization": authorization,
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "ShipPulse-AuthService/1.0"
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get("https://api.github.com/user", headers=headers)
            if resp.status_code != 200:
                raise HTTPException(status_code=resp.status_code, detail="Invalid or expired GitHub token")

            user_data = resp.json()
            return UserProfileResponse(
                id=user_data.get("id"),
                login=user_data.get("login"),
                name=user_data.get("name") or user_data.get("login"),
                avatar_url=user_data.get("avatar_url"),
                bio=user_data.get("bio") or "GitHub Developer",
                public_repos=user_data.get("public_repos", 0),
                total_private_repos=user_data.get("total_private_repos", 0),
                html_url=user_data.get("html_url")
            )
        except httpx.RequestError as exc:
            logger.error(f"GitHub User API error: {exc}")
            raise HTTPException(status_code=502, detail=f"GitHub API connection error: {str(exc)}")


@app.get("/github/repos")
async def get_repositories(
    authorization: Optional[str] = Header(None),
    visibility: str = "all",
    sort: str = "updated",
    per_page: int = Query(default=100, ge=1, le=100)
):
    """Fetches user repositories with pagination and sorting."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    headers = {
        "Authorization": authorization,
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "ShipPulse-AuthService/1.0"
    }
    url = f"https://api.github.com/user/repos?visibility={visibility}&sort={sort}&per_page={per_page}"

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            resp = await client.get(url, headers=headers)
            if resp.status_code != 200:
                raise HTTPException(status_code=resp.status_code, detail="Failed to fetch repositories from GitHub")
            return resp.json()
        except httpx.RequestError as exc:
            logger.error(f"GitHub repos error: {exc}")
            raise HTTPException(status_code=502, detail=f"GitHub API request failed: {str(exc)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=settings.AUTH_PORT)
