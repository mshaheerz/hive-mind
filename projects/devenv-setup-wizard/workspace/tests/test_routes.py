import json
import subprocess
import sys
from pathlib import Path
from unittest import mock

import pytest

# Import the module under test
from main import app, VALID_PROJECT_TYPES, SCRIPT_PATH  # noqa: E402


@pytest.fixture
def client():
    """Flask test client fixture."""
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_index_page(client):
    """GET / should return 200 and contain the page title."""
    resp = client.get("/")
    assert resp.status_code == 200
    assert b"DevEnv Setup Wizard" in resp.data


def test_setup_missing_json(client):
    """POST /setup with no JSON should return 400."""
    resp = client.post("/setup")
    assert resp.status_code == 400
    data = resp.get_json()
    assert data["status"] == "error"
    assert "Invalid JSON payload" in data["message"]


def test_setup_invalid_json(client):
    """POST /setup with malformed JSON should return 400."""
    resp = client.post(
        "/setup",
        data="not a json",
        content_type="application/json",
    )
    assert resp.status_code == 400
    data = resp.get_json()
    assert data["status"] == "error"
    assert "Invalid JSON payload" in data["message"]


def test_setup_missing_project_type(client):
    """POST /setup without project_type field should return 400."""
    resp = client.post(
        "/setup",
        data=json.dumps({"other_key": "value"}),
        content_type="application/json",
    )
    assert resp.status_code == 400
    data = resp.get_json()
    assert data["status"] == "error"
    assert "project_type must be one of" in data["message"]


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


def test_setup_success_python(monkeypatch, client):
    """POST /setup with a valid type should invoke the script and return 200."""
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


def test_setup_success_nodejs(monkeypatch, client):
    """POST /setup with nodejs should work similarly."""
    def fake_run(*args, **kwargs):
        class Result:
            stdout = "Mocked script output for nodejs"
        return Result()

    monkeypatch.setattr(subprocess, "run", fake_run)

    resp = client.post(
        "/setup",
        data=json.dumps({"project_type": "nodejs"}),
        content_type="application/json",
    )
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["status"] == "success"
    assert "Mocked script output for nodejs" in data["output"]


def test_setup_script_error(monkeypatch, client):
    """If the script fails, the endpoint should return 500."""
    def fake_run(*args, **kwargs):
        raise subprocess.CalledProcessError(
            returncode=1, cmd=args[0], output="", stderr="Simulated failure"
        )

    monkeypatch.setattr(subprocess, "run", fake_run)

    resp = client.post(
        "/setup",
        data=json.dumps({"project_type": "python"}),
        content_type="application/json",
    )
    assert resp.status_code == 500
    data = resp.get_json()
    assert data["status"] == "error"
    assert "Simulated failure" in data["message"]


def test_setup_unhandled_exception(monkeypatch, client):
    """Any unhandled exception should produce a generic 500."""
    def fake_run(*args, **kwargs):
        raise ValueError("Unexpected")

    monkeypatch.setattr(subprocess, "run", fake_run)

    resp = client.post(
        "/setup",
        data=json.dumps({"project_type": "nodejs"}),
        content_type="application/json",
    )
    assert resp.status_code == 500
    data = resp.get_json()
    assert data["status"] == "error"
    assert "Internal server error" in data["message"]


def test_setup_payload_with_extra_keys(monkeypatch, client):
    """Extra keys in the payload should be ignored."""
    def fake_run(*args, **kwargs):
        class Result:
            stdout = "Mocked output"
        return Result()

    monkeypatch.setattr(subprocess, "run", fake_run)

    resp = client.post(
        "/setup",
        data=json.dumps(
            {
                "project_type": "python",
                "extra": "value",
                "another": 123,
            }
        ),
        content_type="application/json",
    )
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["status"] == "success"


def test_setup_large_output(monkeypatch, client):
    """The endpoint should correctly return very large script output."""
    large_output = "A" * 10_000  # 10 KB of data

    def fake_run(*args, **kwargs):
        class Result:
            stdout = large_output
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
    assert data["output"] == large_output
