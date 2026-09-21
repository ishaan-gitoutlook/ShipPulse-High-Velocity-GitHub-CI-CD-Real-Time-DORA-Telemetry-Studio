"""
Unit tests for Pipeline & Telemetry Microservice
"""

import os
import sys
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from services.pipeline.main import app

client = TestClient(app)


def test_pipeline_health():
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"


def test_trigger_deployment():
    payload = {
        "repoFullName": "org/my-project",
        "branch": "main",
        "environment": "Production"
    }
    resp = client.post("/github/deploy", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert "pipeline_id" in data["deployment"]


def test_pipeline_logs():
    resp = client.get("/pipeline/pipe_test_123/logs")
    assert resp.status_code == 200
    data = resp.json()
    assert data["pipelineId"] == "pipe_test_123"
    assert "newLog" in data
    assert "metrics" in data


def test_pipeline_action_control():
    # Pause action
    pause_resp = client.post("/pipeline/pipe_test_123/action", json={"action": "pause"})
    assert pause_resp.status_code == 200
    assert pause_resp.json()["status"] == "Paused"

    # Resume action
    resume_resp = client.post("/pipeline/pipe_test_123/action", json={"action": "resume"})
    assert resume_resp.status_code == 200
    assert resume_resp.json()["status"] == "Active"

    # Cancel action
    cancel_resp = client.post("/pipeline/pipe_test_123/action", json={"action": "cancel"})
    assert cancel_resp.status_code == 200
    assert cancel_resp.json()["status"] == "Cancelled"
