"""
Tests for the Flask web server.

The test suite uses the Flask test client to verify that the core
endpoints are reachable and return the expected JSON payloads.
"""

import json

from src.web_server.app import create_app


def test_index_route():
    """The root URL should return HTML with a 200 status code."""
    app = create_app({"TESTING": True})
    client = app.test_client()
    response = client.get("/")
    assert response.status_code == 200
    assert b"DevEnv Setup Wizard" in response.data


def test_status_endpoint():
    """The /api/status endpoint must return a JSON payload with status 'ok'."""
    app = create_app({"TESTING": True})
    client = app.test_client()
    response = client.get("/api/status")
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data["status"] == "ok"
    assert "DevEnv Setup Wizard" in data["message"]
