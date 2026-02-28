"""
Integration tests for the DevEnv Setup Wizard Flask server.

Uses Flask's test client to verify:
- The index page loads successfully.
- The /setup endpoint validates input.
- Successful execution returns a 200 status with expected JSON structure.
"""

import json
import os
import subprocess
import sys
from pathlib import Path

import pytest
from flask import Flask

# Adjust import path so that src/web-server can be imported
ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(ROOT / "src" / "web-server"))

from main import app, VALID_PROJECT_TYPES, SCRIPT_PATH  # noqa: E402

@pytest.fixture
def client():
    """Create a Flask test client."""
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client

def test_index_page(client):
    """GET / should return 200 and HTML content."""
    resp = client.get("/")
    assert resp.status_code == 200
    assert b"DevEnv Setup Wizard" in resp.data

def test_setup_missing_json(client):
    """POST /setup without JSON should return 400."""
    resp = client.post("/setup")
    assert resp.status_code == 400
    data = resp.get_json()
    assert data["status"] == "error"

def test_setup_invalid_project_type(client):
    """POST /setup with an invalid project_type should return 400."""
    resp = client.post(
        "/setup",
        data=json.dumps({"project_type": "invalid"}),
        content_type="application/json",
    )
    assert resp.status_code == 400
    data = resp.get_json()
    assert data["status"] == "error"
    assert "must be one of" in data["message"]

def test_setup_successful_python(monkeypatch, client):
    """POST /setup with a valid type should invoke the script and return 200."""
    # Mock subprocess.run to avoid actually running the heavy script
    def fake_run(*args, **kwargs):
        class Result:
            stdout = "Mocked script output for python"
        return Result()
    monkeypatch.setattr(subprocess, "run", fake_run)

    resp = client.post(
        "/setup",
        data=json.dumps({"project_type": "python"}),
        content_type="application/json",
    )
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["status"] == "success"
    assert "Mocked script output for python" in data["output"]

def test_setup_script_not_found(monkeypatch, client):
    """If the script path does not exist, the endpoint should return 500."""
    monkeypatch.setattr("main.SCRIPT_PATH", Path("/nonexistent/script.sh"))
    resp = client.post(
        "/setup",
        data=json.dumps({"project_type": "python"}),
        content_type="application/json",
    )
    assert resp.status_code == 500
    data = resp.get_json()
    assert data["status"] == "error"
    assert "Setup script not found" in data["message"]
