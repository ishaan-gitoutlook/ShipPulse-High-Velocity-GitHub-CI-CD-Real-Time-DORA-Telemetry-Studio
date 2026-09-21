"""
Unit tests for Webhook & Event Microservice
"""

import os
import sys
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from services.webhook.main import app

client = TestClient(app)


def test_webhook_health():
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"


def test_handle_incoming_webhook():
    payload = {
        "repository": {"full_name": "developer/sample-repo"},
        "ref": "refs/heads/main",
        "sender": {"login": "octocat"},
        "head_commit": {"id": "1234567abcdef", "message": "feat: first push"}
    }
    headers = {"X-GitHub-Event": "push", "X-GitHub-Delivery": "del_abc123"}
    resp = client.post("/webhook", json=payload, headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["event"] == "push"
    assert "triggeredDeployment" in data


def test_test_webhook_and_history():
    payload = {
        "repoFullName": "developer/demo",
        "branch": "main",
        "author": "tester",
        "message": "test dispatch"
    }
    resp = client.post("/webhook/test", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True

    # Check history
    hist_resp = client.get("/webhooks/history")
    assert hist_resp.status_code == 200
    hist_data = hist_resp.json()
    assert hist_data["total"] >= 1


def test_webhook_hmac_signature_verification(monkeypatch):
    import hmac
    import hashlib
    import json
    from common.config import settings

    secret = "super-secret-key-123"
    monkeypatch.setattr(settings, "WEBHOOK_SECRET", secret)

    payload = {"repository": {"full_name": "secure/repo"}, "ref": "refs/heads/main"}
    body_bytes = json.dumps(payload).encode("utf-8")
    valid_sig = "sha256=" + hmac.new(secret.encode("utf-8"), body_bytes, hashlib.sha256).hexdigest()

    # 1. Valid signature -> 200 OK
    resp_valid = client.post("/webhook", content=body_bytes, headers={
        "Content-Type": "application/json",
        "X-Hub-Signature-256": valid_sig,
        "X-GitHub-Event": "push"
    })
    assert resp_valid.status_code == 200
    assert resp_valid.json()["success"] is True

    # 2. Tampered signature -> 403 Forbidden
    resp_invalid = client.post("/webhook", content=body_bytes, headers={
        "Content-Type": "application/json",
        "X-Hub-Signature-256": "sha256=tampered_invalid_digest",
        "X-GitHub-Event": "push"
    })
    assert resp_invalid.status_code == 403

