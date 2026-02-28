**File: `src/web-server/__init__.py`**
```python
"""
Package initializer for the Flask web server.

Provides a `create_app` factory function that can be used by the
application itself and by the test suite. This avoids side‑effects
such as starting the server when the module is imported.
"""

from pathlib import Path
import os
import logging

from flask import Flask

# ----------------------------------------------------------------------
# Constants (mirroring those in main.py for consistency)
# ----------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parents[2]  # Project root directory
TEMPLATE_DIR = BASE_DIR / "templates"
LOG_DIR = BASE_DIR / "logs"
LOG_FILE = LOG_DIR / "setup_wizard.log"

# Ensure the logs directory exists
LOG_DIR.mkdir(parents=True, exist_ok=True)

# ----------------------------------------------------------------------
# Logging configuration (shared with the main module)
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

def create_app() -> Flask:
    """
    Application factory for the Flask web server.

    Returns:
        A configured Flask application instance.
    """
    # Import inside the factory to avoid circular imports
    from .main import VALID_PROJECT_TYPES, run_setup_script

    app = Flask(__name__, template_folder=str(TEMPLATE_DIR))

    @app.route("/", methods=["GET"])
    def index() -> str:
        """Render the main UI."""
        logger.info("Rendering index page.")
        return app.render_template("index.html")

    @app.route("/setup", methods=["POST"])
    def setup() -> tuple[dict, int]:
        """
        Endpoint to start environment setup.

        Expected JSON payload:
            {
                "project_type": "python" | "nodejs"
            }

        Returns:
            JSON with status and optional message.
        """
        from flask import request, jsonify

        logger.info("Received setup request from %s", request.remote_addr)

        try:
            data = request.get_json(silent=True)
            if not data:
                logger.warning("No JSON payload received.")
                return (
                    jsonify(
                        {"status": "error", "message": "Invalid JSON payload."}
                    ),
                    400,
                )

            project_type = data.get("project_type")
            logger.debug("Requested project_type: %s", project_type)

            if project_type not in VALID_PROJECT_TYPES:
                logger.warning("Invalid project_type received: %s", project_type)
                return (
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
            logger.exception("Error during setup for %s", project_type)
            return jsonify({"status": "error", "message": str(exc)}), 500
        except Exception as exc:  # pragma: no cover
            logger.exception("Unhandled exception in /setup endpoint.")
            return jsonify({"status": "error", "message": "Internal server error."}), 500

    return app
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

from flask import Flask, request, jsonify, render_template
from dotenv import load_dotenv

# ----------------------------------------------------------------------
# Environment loading
# ----------------------------------------------------------------------
load_dotenv()  # Load .env if present

# ----------------------------------------------------------------------
# Constants
# ----------------------------------------------------------------------
VALID_PROJECT_TYPES = {"python", "nodejs"}  # Allowed values for project_type
BASE_DIR = Path(__file__).resolve().parents[1]  # src/
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
# Flask app creation (via factory for testability)
# ----------------------------------------------------------------------
def create_app() -> Flask:
    """
    Create and configure the Flask application.

    Returns:
        Configured Flask app instance.
    """
    app = Flask(__name__, template_folder=str(BASE_DIR.parent / "templates"))
    return app

app = create_app()

# --------------------------------------------