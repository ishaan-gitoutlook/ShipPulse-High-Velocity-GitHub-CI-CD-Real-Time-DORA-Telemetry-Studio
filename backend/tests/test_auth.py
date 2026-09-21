"""
Unit tests for Auth & Identity Microservice
"""

import os
import sys
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from services.auth.main import app

client = TestClient(app)


def test_auth_health():
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert "Auth & Identity Service" in data["service"]


def test_get_auth_url():
    resp = client.get("/auth/url")
    assert resp.status_code == 200
    data = resp.json()
    assert "url" in data
    assert "github.com/login/oauth/authorize" in data["url"]
    assert "state" in data
    assert len(data["state"]) > 20


def test_exchange_missing_code():
    resp = client.post("/auth/exchange", json={"code": ""})
    assert resp.status_code == 400


def test_github_user_unauthorized():
    resp = client.get("/github/user")
    assert resp.status_code == 401


def test_github_repos_unauthorized():
    resp = client.get("/github/repos")
    assert resp.status_code == 401
