"""
ShipPulse - Webhook & Event Microservice (Port 5004)
Handles GitHub webhook event ingestion, HMAC verification, push simulation, and audit history.
"""

import sys
import os
import time
import secrets
import logging
import hmac
import hashlib
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, Request, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

# Add backend directory to sys.path to access common package
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from common.config import settings
from common.schemas import (
    HealthResponse,
    WebhookEventRecord,
    WebhookHistoryResponse
)

logging.basicConfig(level=logging.INFO, format="[%(asctime)s] [%(levelname)s] [WebhookService] %(message)s")
logger = logging.getLogger("webhook_service")


def verify_github_signature(raw_body: bytes, signature_header: Optional[str], secret: str) -> bool:
    """Verifies GitHub HMAC-SHA256 webhook signature using constant-time comparison."""
    if not secret:
        return True
    if not signature_header or not signature_header.startswith("sha256="):
        return False
    expected_hash = hmac.new(secret.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()
    expected_signature = f"sha256={expected_hash}"
    return hmac.compare_digest(expected_signature, signature_header)


app = FastAPI(
    title="ShipPulse - Webhook & Event Service",
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

webhook_history: List[WebhookEventRecord] = []


@app.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="healthy",
        service="Webhook & Event Service",
        timestamp=int(time.time()),
        version="1.0.0"
    )


@app.post("/webhook")
async def handle_incoming_webhook(
    request: Request,
    x_github_event: Optional[str] = Header(None),
    x_github_delivery: Optional[str] = Header(None),
    x_hub_signature_256: Optional[str] = Header(None)
):
    """Processes incoming GitHub webhook events and triggers automated pipeline builds with cryptographic verification."""
    raw_body = await request.body()
    
    # Cryptographic verification if signature or secret is present
    if settings.WEBHOOK_SECRET and x_hub_signature_256:
        if not verify_github_signature(raw_body, x_hub_signature_256, settings.WEBHOOK_SECRET):
            logger.warning("[Security] Rejected webhook: Invalid HMAC-SHA256 signature")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Security validation failed: Invalid HMAC-SHA256 signature"
            )

    event = x_github_event or "push"
    delivery_id = x_github_delivery or f"del_{int(time.time() * 1000)}"
    payload = await request.json() if raw_body else {}
    iso_time = datetime.now(timezone.utc).isoformat()

    repo_full_name = payload.get("repository", {}).get("full_name") or payload.get("repo") or "user/repo"
    ref = payload.get("ref", "refs/heads/main")
    branch = ref.replace("refs/heads/", "") if isinstance(ref, str) else "main"
    sender = payload.get("sender", {}).get("login") or payload.get("pusher", {}).get("name") or "github-actions"

    commit_data = payload.get("head_commit") or (payload.get("commits", [{}])[0])
    commit_sha = commit_data.get("id", commit_data.get("sha", secrets.token_hex(4)))[:7]
    commit_msg = commit_data.get("message", "Triggered by push event")

    pipeline_id = f"pipe_{int(time.time())}_{secrets.randbelow(9000) + 1000}"
    live_url = f"/live/{pipeline_id}?repo={repo_full_name}&branch={branch}"

    webhook_log = WebhookEventRecord(
        id=delivery_id,
        event=event,
        repoFullName=repo_full_name,
        branch=branch,
        sender=sender,
        commitSha=commit_sha,
        commitMessage=commit_msg,
        timestamp=iso_time,
        actionTaken=f"Automated Pipeline Triggered (SHA: {commit_sha})",
        pipelineTriggered=pipeline_id,
        payloadSnippet=str(payload)[:300]
    )

    webhook_history.insert(0, webhook_log)
    if len(webhook_history) > 50:
        webhook_history.pop()

    return {
        "success": True,
        "message": f"GitHub webhook processed for {repo_full_name} on branch '{branch}'.",
        "event": event,
        "deliveryId": delivery_id,
        "timestamp": iso_time,
        "triggeredDeployment": {
            "pipelineId": pipeline_id,
            "repoFullName": repo_full_name,
            "branch": branch,
            "status": "Building",
            "commit": {
                "sha": commit_sha,
                "message": commit_msg,
                "author": sender
            },
            "liveUrl": live_url,
            "logs": [
                f"[{iso_time}] [Webhook] Incoming '{event}' event received from {sender}",
                f"[{iso_time}] [Trigger] Code push on branch '{branch}' matches deployment policy",
                f"[{iso_time}] [Git] Ref {branch} synced at commit {commit_sha}",
                f"[{iso_time}] [Build] Multi-stage build initiated in container"
            ]
        }
    }


@app.post("/webhook/test")
async def trigger_test_webhook(request: Request):
    """Dispatches a mock push event to test pipeline and webhook reactivity."""
    data = await request.json() if await request.body() else {}
    repo_full_name = data.get("repoFullName", "user/auto-deploy-repo")
    branch = data.get("branch", "main")
    author = data.get("author", "developer")
    message = data.get("message", "feat: automated feature commit")

    delivery_id = f"test_hook_{int(time.time() * 1000)}"
    iso_time = datetime.now(timezone.utc).isoformat()
    commit_sha = secrets.token_hex(4)
    pipeline_id = f"pipe_{int(time.time())}_{secrets.randbelow(9000) + 1000}"
    live_url = f"/live/{pipeline_id}?repo={repo_full_name}&branch={branch}"

    webhook_log = WebhookEventRecord(
        id=delivery_id,
        event="push",
        repoFullName=repo_full_name,
        branch=branch,
        sender=author,
        commitSha=commit_sha,
        commitMessage=message,
        timestamp=iso_time,
        actionTaken=f"Dispatched simulated push (SHA: {commit_sha})",
        pipelineTriggered=pipeline_id,
        payloadSnippet=str(data)[:300]
    )

    webhook_history.insert(0, webhook_log)
    if len(webhook_history) > 50:
        webhook_history.pop()

    return {
        "success": True,
        "message": f"Simulated push event processed for {repo_full_name} on branch '{branch}'.",
        "event": "push",
        "deliveryId": delivery_id,
        "timestamp": iso_time,
        "triggeredDeployment": {
            "pipelineId": pipeline_id,
            "repoFullName": repo_full_name,
            "branch": branch,
            "status": "Active",
            "commit": {
                "sha": commit_sha,
                "message": message,
                "author": author
            },
            "liveUrl": live_url,
            "logs": [
                f"[{iso_time}] [Webhook] Test push event dispatched for {repo_full_name}",
                f"[{iso_time}] [Trigger] Match verified on branch '{branch}'",
                f"[{iso_time}] [Container] Ephemeral container launched"
            ]
        }
    }


@app.get("/webhooks/history", response_model=WebhookHistoryResponse)
async def get_webhook_history():
    """Returns the recorded webhook delivery logs."""
    return WebhookHistoryResponse(
        success=True,
        total=len(webhook_history),
        events=webhook_history
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=settings.WEBHOOK_PORT)
