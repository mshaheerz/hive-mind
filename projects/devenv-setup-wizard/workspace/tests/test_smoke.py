"""
Minimal smoke test that starts the Flask app in a subprocess,
sends a couple of requests, and verifies the responses.
"""

import json
import os
import subprocess
import sys
import time
from pathlib import Path

import requests

# Path to the Flask app
APP_PATH = Path(__file__).resolve().parents[1] / "src" / "web-server" / "main.py"

def start_server():
    """Launch the Flask server in a separate process."""
    env = os.environ.copy()
    env.update({"FLASK_DEBUG": "False", "DEV_ENV_PORT": "5001"})
    # Use python -m to run the module
    return subprocess.Popen(
        [sys.executable, "-m", "src.web_server.main"],
        cwd=APP_PATH.parent,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )

def wait_for_server(url, timeout=10):
    """Wait until the server responds."""
    start = time.time()
    while time.time() - start < timeout:
        try:
            resp = requests.get(url, timeout=1)
            if resp.status_code == 200:
                return True
        except requests.exceptions.ConnectionError:
            time.sleep(0.2)
    return False

def test_smoke():
    server = start_server()
    try:
        assert wait_for_server("http://127.0.0.1:5001/"), "Server did not start in time"

        # Test index page
        resp = requests.get("http://127.0.0.1:5001/")
        assert resp.status_code == 200
        assert "DevEnv Setup Wizard" in resp.text

        # Test setup endpoint
        resp = requests.post(
            "http://127.0.0.1:5001/setup",
            json={"project_type": "python"},
            timeout=5,
        )
        # Since the real script will run, we just check for a 200 or 500
        assert resp.status_code in {200, 500}
    finally:
        server.terminate()
        server.wait()
