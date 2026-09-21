"""
Integration tests for API Gateway
"""

import os
import sys
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from gateway.main import app

client = TestClient(app)


def test_gateway_health():
    resp = client.get("/api/health")
    # Returns 200 or 207 (degraded when downstream services are not active locally during standalone unit testing)
    assert resp.status_code in [200, 207]
    data = resp.json()
    assert "ShipPulse API Gateway" in data["service"]
    assert "microservices" in data


def test_gateway_security_headers():
    resp = client.get("/api/health")
    assert resp.headers.get("X-Content-Type-Options") == "nosniff"
    assert resp.headers.get("X-Frame-Options") == "DENY"
    assert "max-age=31536000" in resp.headers.get("Strict-Transport-Security", "")
    assert resp.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
    assert "frame-ancestors 'none'" in resp.headers.get("Content-Security-Policy", "")
    assert resp.headers.get("Server") == "ShipPulse-Gateway"

