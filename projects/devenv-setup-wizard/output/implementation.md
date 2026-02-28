**File: `requirements.txt`**
```txt
Flask>=2.2,<3
python-dotenv>=1.0,<2
```

**File: `.gitignore`**
```gitignore
__pycache__/
*.pyc
env/
venv/
instance/
*.log
.env
logs/
```

**File: `.env.example`**
```dotenv
# Flask configuration
FLASK_DEBUG=True
# Host configuration for the Flask server (default 127.0.0.1)
DEV_ENV_HOST=127.0.0.1
# Port configuration (default 5000)
DEV_ENV_PORT=5000
```

**File: `src/web-server/main.py`**
```python
"""
Flask web server for the DevEnv Setup Wizard.

Provides a simple UI to select a project type (Python or Node.js) and
triggers the corresponding automation script. All external subprocess
calls are wrapped with error handling, inputs are validated, and detailed
logging is performed for easier debugging.
"""

import os
import subprocess
import logging
from pathlib import Path
from typing import Literal

from flask import Flask, request, jsonify, render_template, abort, make_response
from dotenv import load_dotenv

# ----------------------------------------------------------------------
# Environment loading
# ----------------------------------------------------------------------
load_dotenv()  # Load .env if present

# ----------------------------------------------------------------------
# Constants
# ----------------------------------------------------------------------
VALID_PROJECT_TYPES = {"python", "nodejs"}  # Allowed values for project_type
BASE_DIR = Path(__file__).resolve().parent.parent
SCRIPT_PATH = BASE_DIR / "automation" / "setup_scripts.sh"
LOG_DIR = BASE_DIR / "logs"
LOG_FILE = LOG_DIR / "setup_wizard.log"

# Ensure the logs directory exists
LOG_DIR.mkdir(parents=True, exist_ok=True)

# ----------------------------------------------------------------------
# Logging configuration
# ----------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s - %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler(),
    ],
)
logger = logging.getLogger("DevEnvSetupWizard")

# ----------------------------------------------------------------------
# Flask app creation
# ----------------------------------------------------------------------
app = Flask(__name__, template_folder=str(BASE_DIR / "templates"))

# ----------------------------------------------------------------------
# Helper functions
# ----------------------------------------------------------------------
def run_setup_script(project_type: Literal["python", "nodejs"]) -> str:
    """
    Executes the setup script for the given project type.

    Args:
        project_type: Either "python" or "nodejs".

    Returns:
        The stdout output from the script.

    Raises:
        RuntimeError: If the script exits with a non‑zero status.
    """
    logger.info("Starting setup for project type: %s", project_type)

    try:
        # Using `subprocess.run` with `check=True` to raise CalledProcessError on failure
        result = subprocess.run(
            ["bash", str(SCRIPT_PATH), project_type],
            capture_output=True,
            text=True,
            check=True,
        )
        logger.info("Setup script completed successfully for %s.", project_type)
        return result.stdout
    except subprocess.CalledProcessError as exc:
        logger.error(
            "Setup script failed (exit %s) for %s: %s",
            exc.returncode,
            project_type,
            exc.stderr.strip(),
        )
        raise RuntimeError(f"Setup script failed: {exc.stderr.strip()}") from exc
    except FileNotFoundError as exc:
        logger.exception("Setup script not found at %s", SCRIPT_PATH)
        raise RuntimeError("Setup script not found.") from exc
    except Exception as exc:
        logger.exception("Unexpected error while running setup script.")
        raise RuntimeError("Unexpected error during setup.") from exc

# ----------------------------------------------------------------------
# Routes
# ----------------------------------------------------------------------
@app.route("/", methods=["GET"])
def index():
    """Render the main UI."""
    logger.info("Rendering index page.")
    return render_template("index.html")


@app.route("/setup", methods=["POST"])
def setup():
    """
    Endpoint to start environment setup.

    Expected JSON payload:
        {
            "project_type": "python" | "nodejs"
        }

    Returns:
        JSON with status and optional message.
    """
    logger.info("Received setup request from %s", request.remote_addr)

    try:
        data = request.get_json(silent=True)
        if not data:
            logger.warning("No JSON payload received.")
            return make_response(
                jsonify({"status": "error", "message": "Invalid JSON payload."}), 400
            )

        project_type = data.get("project_type")
        logger.debug("Requested project_type: %s", project_type)

        if project_type not in VALID_PROJECT_TYPES:
            logger.warning("Invalid project_type received: %s", project_type)
            return make_response(
                jsonify(
                    {
                        "status": "error",
                        "message": f"project_type must be one of {sorted(VALID_PROJECT_TYPES)}",
                    }
                ),
                400,
            )

        output = run_setup_script(project_type)  # type: ignore[arg-type]
        logger.info("Setup completed for %s.", project_type)
        return jsonify({"status": "success", "output": output}), 200

    except RuntimeError as exc:
        # Return a 500 error with a generic message; detailed log is stored server‑side
        logger.exception("Error during setup for %s", project_type)
        return jsonify({"status": "error", "message": str(exc)}), 500
    except Exception as exc:
        logger.exception("Unhandled exception in /setup endpoint.")
        return jsonify({"status": "error", "message": "Internal server error."}), 500

# ----------------------------------------------------------------------
# Application entry point
# ----------------------------------------------------------------------
if __name__ == "__main__":
    # Host and port are configurable via environment variables for security
    host = os.getenv("DEV_ENV_HOST", "127.0.0.1")
    port = int(os.getenv("DEV_ENV_PORT", "5000"))
    debug = os.getenv("FLASK_DEBUG", "False").lower() in {"true", "1", "yes"}

    logger.info("Starting Flask server on %s:%s (debug=%s)", host, port, debug)
    app.run(host=host, port=port, debug=debug)
```

**File: `src/automation/setup_scripts.sh`**
```bash
#!/usr/bin/env bash
# =============================================================================
# DevEnv Setup Wizard - Automation Script
#
# This script automates the creation of a development environment for either
# a Python or a Node.js project. It exits immediately on any error (`set -e`)
# and logs each major step to a timestamped file.
# =============================================================================

set -e  # Exit on any command failure

# -------------------------------------------------------------------------
# Constants & Helper Functions
# -------------------------------------------------------------------------
SELECTED_TYPE="${1:-}"                     # The type of project to set up (python|nodejs)
VALID_TYPES=("python" "nodejs")           # Allowed project types

# Determine the directory that holds this script and create a logs folder there
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIRECTORY="${SCRIPT_DIR}/../logs"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
LOG_FILE="${LOG_DIRECTORY}/setup_${TIMESTAMP}.log"

# Ensure the logs directory exists
mkdir -p "${LOG_DIRECTORY}"

log() {
    # Write a timestamped message to both stdout and the log file
    echo "$(date '+%Y-%m-%d %H:%M:%S') $1" | tee -a "${LOG_FILE}"
}

# -------------------------------------------------------------------------
# Input validation
# -------------------------------------------------------------------------
if [[ -z "${SELECTED_TYPE}" ]]; then
    log "Error: No project type supplied."
    echo "Usage: $0 <project_type>"
    exit 1
fi

if [[ ! " ${VALID_TYPES[@]} " =~ " ${SELECTED_TYPE} " ]]; then
    log "Error: Invalid project type '${SELECTED_TYPE}'. Valid options are: ${VALID_TYPES[*]}"
    exit 1
fi

log "Starting setup for project type: ${SELECTED_TYPE}"

# -------------------------------------------------------------------------
# Setup steps per project type
# -------------------------------------------------------------------------
if [[ "${SELECTED_TYPE}" == "python" ]]; then
    log "Creating Python virtual environment..."
    python3 -m venv venv
    log "Activating virtual environment and upgrading pip..."
    source venv/bin/activate
    pip install --upgrade pip
    log "Installing common Python development packages..."
    pip install black flake8 pytest
    deactivate
    log "Python environment setup completed."
elif [[ "${SELECTED_TYPE}" == "nodejs" ]]; then
    log "Initializing npm project..."
    npm init -y
    log "Installing common Node.js development packages..."
    npm install --save-dev eslint prettier jest
    log "Node.js environment setup completed."
fi

log "Setup script finished successfully."
```

**File: `templates/index.html`**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>DevEnv Setup Wizard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        /* Simple spinner */
        .spinner {
            border: 4px solid rgba(0, 0, 0, 0.1);
            width: 3rem;
            height: 3rem;
            border-radius: 50%;
            border-left-color: #4F46E5;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    </style>
</head>
<body class="bg-gray-100 flex items-center justify-center min-h-screen">
<div class="bg-white p-8 rounded shadow-md w-96">
    <h1 class="text-2xl font-bold mb-4 text-center">DevEnv Setup Wizard</h1>

    <form id="setupForm" class="space-y-4">
        <label class="block">
            <span class="text-gray-700">Project Type</span>
            <select name="project_type" id="projectType" class="mt-1 block w-full rounded border-gray-300">
                <option value="python">Python</option>
                <option value="nodejs">Node.js</option>
            </select>
        </label>

        <button type="submit"
                class="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700">
            Start Setup
        </button>
    </form>

    <!-- Spinner (hidden by default) -->
    <div id="spinner" class="flex justify-center mt-4 hidden">
        <div class="spinner"></div>
    </div>

    <!-- Result area -->
    <pre id="result" class="mt-4 p-2 bg-gray-100 rounded overflow-auto hidden"></pre>
</div>

<script>
    const form = document.getElementById('setupForm');
    const spinner = document.getElementById('spinner');
    const resultBox = document.getElementById('result');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        spinner.classList.remove('hidden');
        resultBox.classList.add('hidden');
        resultBox.textContent = '';

        const projectType = document.getElementById('projectType').value;

        try {
            const response = await fetch('/setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ project_type: projectType })
            });

            const data = await response.json();

            if (response.ok) {
                resultBox.textContent = data.output || 'Setup completed successfully.';
                resultBox.classList.remove('hidden');
            } else {
                resultBox.textContent = `Error: ${data.message || 'Unknown error.'}`;
                resultBox.classList.remove('hidden');
            }
        } catch (err) {
            resultBox.textContent = `Network error: ${err}`;
            resultBox.classList.remove('hidden');
        } finally {
            spinner.classList.add('hidden');
        }
    });
</script>
</body>
</html>
```

**File: `test/test_main.py`**
```python
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
```

## FIX_MAP
- C1 -> Added comprehensive try‑except blocks in `src/web-server/main.py` and ensured subprocess errors are caught and translated to HTTP 500 responses.  
- C2 -> Implemented explicit validation of `project_type` against `VALID_PROJECT_TYPES` with a 400 JSON error response.  
- C3 -> Host and debug settings are now sourced from environment variables (`DEV_ENV_HOST`, `FLASK_DEBUG`) instead of hard‑coded values.  
- C4 -> Added `set -e` at the top of `src/automation/setup_scripts.sh` to abort on any command failure.  
- W1 -> Inserted detailed logging statements throughout request handling and script execution in `src/web-server/main.py`.  
- S1 -> Updated `templates/index.html` to include a Tailwind‑styled spinner that appears while the setup request is processing.  
- S2 -> Added explanatory comments and renamed variables in `src/automation/setup_scripts.sh` for clarity (`SELECTED_TYPE`, `LOG_DIRECTORY`, etc.).  

## Dependencies
- **Python packages**
  - Flask>=2.2,<3
  - python-dotenv>=1.0,<2
  - pytest>=7,<9
  - pytest-flask>=1.2,<2

- **System utilities**
  - Bash (standard on Unix/macOS; Windows users should use WSL or Git Bash)
  - `python3`, `pip`, `npm` (for the scripts to function when actually run)