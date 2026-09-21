"""
ShipPulse - High-Performance API Gateway (Port 5000)
Central asynchronous gateway routing incoming requests to domain microservices with unified health checks.
"""

import sys
import os
import time
import logging
from typing import Dict, Any, Optional
import httpx
from fastapi import FastAPI, Request, Response, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response

from contextlib import asynccontextmanager

# Add backend directory to sys.path to access common package
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from common.config import settings

logging.basicConfig(level=logging.INFO, format="[%(asctime)s] [%(levelname)s] [Gateway] %(message)s")
logger = logging.getLogger("api_gateway")

# Persistent HTTPX Client for async reverse proxying
http_client: Optional[httpx.AsyncClient] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global http_client
    http_client = httpx.AsyncClient(timeout=30.0)
    logger.info("ShipPulse API Gateway started. Downstream microservice endpoints registered.")
    yield
    if http_client:
        await http_client.aclose()


app = FastAPI(
    title="ShipPulse - Central API Gateway",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

allowed_origins = [settings.CORS_ORIGIN] if settings.CORS_ORIGIN and settings.CORS_ORIGIN != "*" else [
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Request-Id"]
)

# Standard Hop-by-Hop headers (RFC 7230)
HOP_BY_HOP_HEADERS = {
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailers",
    "transfer-encoding",
    "upgrade"
}


@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    """Enforces enterprise security headers and request payload size guardrails."""
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > 10 * 1024 * 1024:
        return JSONResponse(
            status_code=413,
            content={"error": "Payload Too Large: Request entity exceeds 10MB limit"}
        )

    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'none';"
    response.headers["Permissions-Policy"] = "accelerometer=(), camera=(), geolocation=(), microphone=(), payment=()"
    response.headers["Server"] = "ShipPulse-Gateway"
    return response


@app.get("/api/health")
async def aggregated_health_check():
    """Aggregates health check telemetry across all downstream Python microservices."""
    services = {
        "auth_service": f"{settings.AUTH_SERVICE_URL}/health",
        "workflow_service": f"{settings.WORKFLOW_SERVICE_URL}/health",
        "pipeline_service": f"{settings.PIPELINE_SERVICE_URL}/health",
        "webhook_service": f"{settings.WEBHOOK_SERVICE_URL}/health"
    }

    results: Dict[str, Any] = {}
    all_healthy = True

    for name, url in services.items():
        try:
            resp = await http_client.get(url, timeout=3.0)
            if resp.status_code == 200:
                results[name] = resp.json()
            else:
                results[name] = {"status": "unhealthy", "code": resp.status_code}
                all_healthy = False
        except Exception as e:
            results[name] = {"status": "offline"}
            all_healthy = False

    return JSONResponse(
        status_code=200 if all_healthy else 207,
        content={
            "status": "healthy" if all_healthy else "degraded",
            "service": "ShipPulse API Gateway",
            "timestamp": int(time.time()),
            "version": "1.0.0",
            "microservices": results
        }
    )


async def forward_request(target_url: str, request: Request) -> Response:
    """Streams and forwards HTTP requests to downstream microservice with hop-by-hop header cleanup."""
    body = await request.body()
    forward_headers = {
        k: v for k, v in request.headers.items()
        if k.lower() not in HOP_BY_HOP_HEADERS and k.lower() not in {"host", "content-length"}
    }

    try:
        resp = await http_client.request(
            method=request.method,
            url=target_url,
            params=request.query_params,
            headers=forward_headers,
            content=body
        )
        response_headers = {
            k: v for k, v in resp.headers.items()
            if k.lower() not in HOP_BY_HOP_HEADERS and k.lower() not in {"content-length", "content-encoding"}
        }
        return Response(
            content=resp.content,
            status_code=resp.status_code,
            headers=response_headers,
            media_type=resp.headers.get("content-type")
        )
    except httpx.ConnectError:
        logger.error(f"[Gateway] Downstream connection error for {target_url}")
        return JSONResponse(
            status_code=503,
            content={"error": "Downstream microservice temporarily unavailable"}
        )
    except Exception as e:
        logger.error(f"[Gateway] Forwarding error for {target_url}: {e}")
        return JSONResponse(
            status_code=502,
            content={"error": "Gateway communication error with downstream service"}
        )


# ==============================================================================
# ROUTE MULTIPLEXING & DOWNSTREAM PROXYING
# ==============================================================================

# 1. Auth & Identity Routes
@app.api_route("/api/auth/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def route_auth(path: str, request: Request):
    target = f"{settings.AUTH_SERVICE_URL}/auth/{path}"
    return await forward_request(target, request)


@app.api_route("/api/github/user", methods=["GET"])
async def route_github_user(request: Request):
    target = f"{settings.AUTH_SERVICE_URL}/github/user"
    return await forward_request(target, request)


@app.api_route("/api/github/repos", methods=["GET"])
async def route_github_repos(request: Request):
    target = f"{settings.AUTH_SERVICE_URL}/github/repos"
    return await forward_request(target, request)


# 2. Workflow & Workspace Routes
@app.api_route("/api/github/repos/{owner}/{repo}/files", methods=["GET"])
async def route_repo_files(owner: str, repo: str, request: Request):
    target = f"{settings.WORKFLOW_SERVICE_URL}/repos/{owner}/{repo}/files"
    return await forward_request(target, request)


@app.api_route("/api/github/repos/{owner}/{repo}/file", methods=["GET"])
async def route_repo_file(owner: str, repo: str, request: Request):
    target = f"{settings.WORKFLOW_SERVICE_URL}/repos/{owner}/{repo}/file"
    return await forward_request(target, request)


@app.api_route("/api/github/repos/{owner}/{repo}/save-file", methods=["POST"])
async def route_repo_save_file(owner: str, repo: str, request: Request):
    target = f"{settings.WORKFLOW_SERVICE_URL}/repos/{owner}/{repo}/save-file"
    return await forward_request(target, request)


@app.api_route("/api/github/repos/{owner}/{repo}/generate-workflow", methods=["POST"])
async def route_repo_generate_workflow(owner: str, repo: str, request: Request):
    target = f"{settings.WORKFLOW_SERVICE_URL}/repos/{owner}/{repo}/generate-workflow"
    return await forward_request(target, request)


@app.api_route("/api/github/repos/{owner}/{repo}/exec", methods=["POST"])
async def route_repo_exec(owner: str, repo: str, request: Request):
    target = f"{settings.WORKFLOW_SERVICE_URL}/repos/{owner}/{repo}/exec"
    return await forward_request(target, request)


@app.api_route("/api/yaml/lint", methods=["POST"])
async def route_yaml_lint(request: Request):
    target = f"{settings.WORKFLOW_SERVICE_URL}/yaml/lint"
    return await forward_request(target, request)


# 3. Pipeline & Telemetry Routes
@app.api_route("/api/github/deploy", methods=["POST"])
async def route_github_deploy(request: Request):
    target = f"{settings.PIPELINE_SERVICE_URL}/github/deploy"
    return await forward_request(target, request)


@app.api_route("/api/github/pipeline/{pipeline_id}/logs", methods=["GET"])
async def route_pipeline_logs(pipeline_id: str, request: Request):
    target = f"{settings.PIPELINE_SERVICE_URL}/pipeline/{pipeline_id}/logs"
    return await forward_request(target, request)


@app.api_route("/api/github/pipeline/{pipeline_id}/action", methods=["POST"])
async def route_pipeline_action(pipeline_id: str, request: Request):
    target = f"{settings.PIPELINE_SERVICE_URL}/pipeline/{pipeline_id}/action"
    return await forward_request(target, request)


# 4. Webhook & Event Routes
@app.api_route("/api/github/webhook", methods=["POST"])
async def route_incoming_webhook(request: Request):
    target = f"{settings.WEBHOOK_SERVICE_URL}/webhook"
    return await forward_request(target, request)


@app.api_route("/api/github/webhook/test", methods=["POST"])
async def route_test_webhook(request: Request):
    target = f"{settings.WEBHOOK_SERVICE_URL}/webhook/test"
    return await forward_request(target, request)


@app.api_route("/api/github/webhooks/history", methods=["GET"])
async def route_webhook_history(request: Request):
    target = f"{settings.WEBHOOK_SERVICE_URL}/webhooks/history"
    return await forward_request(target, request)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=settings.GATEWAY_PORT)
