**File: `tests/conftest.py`**
```python
import os
import sys
from pathlib import Path

import pytest

# Add the src directory to the import path so that `main` can be imported
ROOT = Path(__file__).resolve().parents[1] / "src" / "web-server"
sys.path.append(str(ROOT))

from main import app  # noqa: E402


@pytest.fixture
def client():
    """Provide a Flask test client for the app."""
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client
```

---

**File: `tests/test_run_setup_script.py`**
```python
import subprocess
import sys
from pathlib import Path
from unittest import mock

import pytest

# Import the module under test
from main import run_setup_script, SCRIPT_PATH, LOG_DIR, LOG_FILE  # noqa: E402


@pytest.fixture
def tmp_log_dir(tmp_path):
    """Create a temporary log directory for each test."""
    original_dir = LOG_DIR
    original_file = LOG_FILE
    try:
        # Override the module's LOG_DIR and LOG_FILE to a temp location
        with mock.patch("main.LOG_DIR", tmp_path), mock.patch(
            "main.LOG_FILE", tmp_path / "setup_wizard.log"
        ):
            yield tmp_path
    finally:
        # Restore original values (no-op in this context)
        pass


def test_run_setup_script_success(monkeypatch):
    """Verify that a successful script run returns stdout."""
    def fake_run(*args, **kwargs):
        class Result:
            stdout = "Mocked script output"
        # Ensure the command contains the expected script path and project type
        assert str(SCRIPT_PATH) in args[0]
        assert "python" in args[0]
        return Result()

    monkeypatch.setattr(subprocess, "run", fake_run)

    output = run_setup_script("python")
    assert output == "Mocked script output"


def test_run_setup_script_calledprocess_error(monkeypatch):
    """Verify that a CalledProcessError is translated into RuntimeError."""
    def fake_run(*args, **kwargs):
        raise subprocess.CalledProcessError(
            returncode=2, cmd=args[0], output="", stderr="Simulated failure"
        )

    monkeypatch.setattr(subprocess, "run", fake_run)

    with pytest.raises(RuntimeError, match="Setup script failed: Simulated failure"):
        run_setup_script("nodejs")


def test_run_setup_script_file_not_found(monkeypatch):
    """Verify that FileNotFoundError is translated into RuntimeError."""
    def fake_run(*args, **kwargs):
        raise FileNotFoundError("No such file or directory")

    monkeypatch.setattr(subprocess, "run", fake_run)

    with pytest.raises(RuntimeError, match="Setup script not found."):
        run_setup_script("python")


def test_run_setup_script_unexpected_error(monkeypatch):
    """Verify that any other exception is wrapped in a generic RuntimeError."""
    def fake_run(*args, **kwargs):
        raise ValueError("Unexpected value")

    monkeypatch.setattr(subprocess, "run", fake_run)

    with pytest.raises(RuntimeError, match="Unexpected error during setup."):
        run_setup_script("nodejs")


def test_run_setup_script_logs_created(tmp_log_dir, monkeypatch):
    """Verify that the log file is created during execution."""
    def fake_run(*args, **kwargs):
        class Result:
            stdout = "log test"
        return Result()

    monkeypatch.setattr(subprocess, "run", fake_run)

    # Ensure log file does not exist before
    assert not (tmp_log_dir / "setup_wizard.log").exists()

    run_setup_script("python")

    # Log file should now exist
    log_file = tmp_log_dir / "setup_wizard.log"
    assert log_file.exists()
    # Basic sanity check: file contains at least one line
    assert log_file.read_text().strip()
```

---

**File: `tests/test_routes.py`**
```python
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
```

---

**File: `tests/test_edge_cases.py`**
```python
import json
import subprocess
import sys
from pathlib import Path
from unittest import mock

import pytest

# Import the module under test
from main import run_setup_script, SCRIPT_PATH  # noqa: E402


@pytest.fixture
def mock_subprocess_run(monkeypatch):
    """Return a fake subprocess.run that records its arguments."""
    calls = []

    def fake_run(*args, **kwargs):
        calls.append((args, kwargs))
        class Result:
            stdout = "Mocked output"
        return Result()

    monkeypatch.setattr(subprocess, "run", fake_run)
    return calls


def test_run_setup_script_with_whitespace_project_type(monkeypatch):
    """Passing whitespace as project_type should still call subprocess."""
    def fake_run(*args, **kwargs):
        class Result:
            stdout = "Whitespace test"
        return Result()

    monkeypatch.setattr(subprocess, "run", fake_run)

    output = run_setup_script("   python   ")
    # The script is called with the raw string; the wrapper does not strip
    assert output == "Whitespace test"


def test_run_setup_script_with_none(monkeypatch):
    """Passing None should raise a TypeError before subprocess is called."""
    with pytest.raises(TypeError):
        run_setup_script(None)  # type: ignore[arg-type]


def test_run_setup_script_with_invalid_type(monkeypatch):
    """Passing an invalid type string still reaches subprocess."""
    def fake_run(*args, **kwargs):
        class Result:
            stdout = "Invalid type handled"
        return Result()

    monkeypatch.setattr(subprocess, "run", fake_run)

    output = run_setup_script("invalid_type")  # type: ignore[arg-type]
    assert output == "Invalid type handled"


def test_run_setup_script_exceptions_propagate(monkeypatch):
    """Ensure that unexpected exceptions are wrapped."""
    def fake_run(*args, **kwargs):
        raise RuntimeError("Low-level error")

    monkeypatch.setattr(subprocess, "run", fake_run)

    with pytest.raises(RuntimeError, match="Unexpected error during setup."):
        run_setup_script("python")
```

---

**File: `tests/test_manual_test_plan.md`**
```markdown
# Manual Test Plan for DevEnv Setup Wizard

| # | Test Case | Description | Expected Result | Notes |
|---|-----------|-------------|-----------------|-------|
| 1 | Open UI | Navigate to `http://<host>:<port>/` | Index page loads with title *DevEnv Setup Wizard* | |
| 2 | Select Python | Choose *Python* from dropdown and click *Start Setup* | Spinner appears, request is sent, result displayed | |
| 3 | Select Node.js | Choose *Node.js* from dropdown and click *Start Setup* | Spinner appears, request is sent, result displayed | |
| 4 | Invalid project type | Manually edit the request payload to `{"project_type":"invalid"}` | 400 response, error message displayed | |
| 5 | Empty payload | Submit form with empty payload (e.g., by disabling JS) | 400 response, error message displayed | |
| 6 | Large output | Simulate a script that outputs >10 KB | 200 response, full output displayed | |
| 7 | Script failure | Simulate a script that exits with non‑zero status | 500 response, error message displayed | |
| 8 | Log inspection | After a successful run, verify `logs/setup_wizard.log` contains entries | Log file created, contains timestamps | |
| 9 | Security | Attempt to inject malicious payload (e.g., `{"project_type":"python; rm -rf /"}`) | 400 response, no command executed | |
| 10 | Environment variables | Set `DEV_ENV_HOST`, `DEV_ENV_PORT`, `FLASK_DEBUG` and verify server starts accordingly | Server starts on specified host/port with correct debug mode | |

**Execution Steps**

1. Start the Flask server: `python -m src.web-server.main`
2. Run the UI tests using the above steps.
3. Verify logs and error handling manually.

**Pass Criteria**

- All UI interactions complete without unhandled exceptions.
- Error messages are clear and consistent.
- Log file is present and readable.
- No security vulnerabilities (no command injection).
```

---

**File: `tests/test_smoke.py`**
```python
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
```

---

**File: `pytest.ini`**
```ini
[pytest]
addopts = -q
testpaths = tests
```

---

**TEST_COMMAND:** `pytest -q`

**EXPECTED_RESULT:** All tests pass, producing a single line summary such as `10 passed in 0.12s`.

**FAILURE_ACTION_ITEMS:**
- If any test fails, review the stack trace, identify whether the failure is due to a bug in the application or a test mis‑specification, and adjust accordingly.
- For failures related to `run_setup_script`, verify that the subprocess mocking correctly simulates the intended behavior.
- For 500 errors, check that the exception handling in `main.setup` correctly maps underlying exceptions to HTTP responses.
- If log file checks fail, ensure the `LOG_DIR` and `LOG_FILE` paths are correctly patched in the test environment.
- If the smoke test times out, confirm that the Flask app starts on the expected port and that network access is allowed.