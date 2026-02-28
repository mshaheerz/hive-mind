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
        return jsonify({"status": "error", "mess