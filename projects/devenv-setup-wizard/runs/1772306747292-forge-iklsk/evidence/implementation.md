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

from flask import Flask, request, jsonify, render_template, abort
from dotenv import load_dotenv

# Load environment variables from .env if present
load_dotenv()

# ----------------------------------------------------------------------
# Constants
# ----------------------------------------------------------------------
VALID_PROJECT_TYPES = {"python", "nodejs"}  # Allowed values for project_type
BASE_DIR = Path(__file__).resolve().parent.parent
SCRIPT_PATH = BASE_DIR / "automation" / "setup_scripts.sh"

# ----------------------------------------------------------------------
# Logging configuration
# ----------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s - %(message)s",
    handlers=[
        logging.FileHandler(BASE_DIR / "logs" / "setup_wizard.log"),
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
        logger.info("Setup script completed successfully.")
        return result.stdout
    except subprocess.CalledProcessError as exc:
        logger.error(
            "Setup script failed (exit %s): %s",
            exc.returncode,
            exc.stderr.strip(),
        )
        raise RuntimeError(f"Setup script failed: {exc.stderr.strip()}") from exc
    except FileNotFoundError as exc:
        logger.exception("Setup script not found at %s", SCRIPT_PATH)
        raise RuntimeError("Setup script not found.") from exc

# ----------------------------------------------------------------------
# Routes
# ----------------------------------------------------------------------
@app.route("/", methods=["GET"])
def index():
    """Render the main UI."""
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
    data = request.get_json(silent=True)
    if not data:
        logger.warning("No JSON payload received.")
        abort(400, description="Invalid JSON payload.")

    project_type = data.get("project_type")
    if project_type not in VALID_PROJECT_TYPES:
        logger.warning("Invalid project_type received: %s", project_type)
        abort(400, description=f"project_type must be one of {VALID_PROJECT_TYPES}")

    try:
        output = run_setup_script(project_type)  # type: ignore[arg-type]
        return jsonify({"status": "success", "output": output}), 200
    except RuntimeError as exc:
        # Return a 500 error with a generic message; detailed log is stored server‑side
        logger.exception("Error during setup for %s", project_type)
        return jsonify({"status": "error", "message": str(exc)}), 500


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
# and logs each major step.
# =============================================================================

set -e  # Exit on any command failure

# -------------------------------------------------------------------------
# Constants & Helper Functions
# ----------