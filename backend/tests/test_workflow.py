"""
Unit tests for Workflow & Workspace Microservice
"""

import os
import sys
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from services.workflow.main import app

client = TestClient(app)


def test_workflow_health():
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"


def test_list_repo_files():
    resp = client.get("/repos/test-org/scientific--calculator-2/files")
    assert resp.status_code == 200
    data = resp.json()
    assert "files" in data
    assert len(data["files"]) > 0


def test_get_single_file():
    resp = client.get("/repos/test-org/scientific--calculator-2/file?path=package.json")
    assert resp.status_code == 200
    data = resp.json()
    assert data["path"] == "package.json"
    assert "scientific--calculator-2" in data["content"]


def test_save_file():
    payload = {"path": "src/test.js", "content": "console.log('hot patch');"}
    resp = client.post("/repos/test-org/my-repo/save-file", json=payload)
    assert resp.status_code == 200
    assert resp.json()["success"] is True

    # Retrieve saved file
    get_resp = client.get("/repos/test-org/my-repo/file?path=src/test.js")
    assert get_resp.status_code == 200
    assert "hot patch" in get_resp.json()["content"]


def test_generate_workflow():
    payload = {
        "template": "nodejs",
        "filePath": ".github/workflows/ci.yml",
        "branch": "main",
        "commitMessage": "test workflow commit"
    }
    resp = client.post("/repos/test-org/my-repo/generate-workflow", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert ".github/workflows/ci.yml" in data["filePath"]


def test_exec_debug_command():
    resp = client.post("/repos/test-org/scientific--calculator-2/exec", json={"command": "npm test"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["exitCode"] == 0
    assert "test" in data["output"]


def test_exec_debug_command_security_rejection():
    # 1. Command chaining / injection attempt
    resp_inject = client.post("/repos/test-org/scientific--calculator-2/exec", json={"command": "npm test; rm -rf /"})
    assert resp_inject.status_code == 400
    assert "violation" in resp_inject.json()["detail"]

    # 2. Disallowed executable
    resp_disallow = client.post("/repos/test-org/scientific--calculator-2/exec", json={"command": "curl http://evil.com"})
    assert resp_disallow.status_code == 400



def test_yaml_lint_valid():
    valid = "name: CI\non: [push]\njobs:\n  build:\n    runs-on: ubuntu-latest\n"
    resp = client.post("/yaml/lint", json={"content": valid})
    assert resp.status_code == 200
    data = resp.json()
    assert data["isValid"] is True
    assert len(data["errors"]) == 0


def test_yaml_lint_invalid():
    invalid = "name: CI\non: [push\njobs:\n"
    resp = client.post("/yaml/lint", json={"content": invalid})
    assert resp.status_code == 200
    data = resp.json()
    assert data["isValid"] is False
    assert len(data["errors"]) > 0
