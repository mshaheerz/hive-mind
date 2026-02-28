**File: `src/web_server/__init__.py`**
```python
"""
src.web_server package initializer.

Exports the Flask ``app`` instance for easy import in tests and
application entry points.
"""
from .app import app  # noqa: F401
```

**File: `src/web_server/app.py`**
```python
"""
Flask web server for the DevEnv Setup Wizard.

Provides a minimal web UI that allows users to trigger environment
setup actions.  The server is deliberately lightweight to keep the
project small and test‑friendly.

Key design points:
- All configuration values are defined as named constants.
- The ``create_app`` factory makes the app easy to test.
- Detailed logging is written to ``src/logs/setup.log``.
"""

import logging
import os
from pathlib import Path
from typing import Any, Dict

from flask import Flask, jsonify, render_template, request

# --------------------------------------------------------------------------- #
# Named constants – avoid magic numbers / strings
# --------------------------------------------------------------------------- #
DEFAULT_HOST: str = os.getenv("DEV_ENV_HOST", "127.0.0.1")
DEFAULT_PORT: int = int(os.getenv("DEV_ENV_PORT", "5000"))
LOG_DIR: Path = Path(__file__).resolve().parents[2] / "logs"
LOG_FILE: Path = LOG_DIR / "setup.log"

# Ensure the log directory exists before configuring logging
LOG_DIR.mkdir(parents=True, exist_ok=True)

# --------------------------------------------------------------------------- #
# Logging configuration
# --------------------------------------------------------------------------- #
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
        logging.StreamHandler(),
    ],
)
logger = logging.getLogger(__name__)

# --------------------------------------------------------------------------- #
# Flask app factory
# --------------------------------------------------------------------------- #
def create_app(test_config: Dict[str, Any] | None = None) -> Flask:
    """
    Application factory used by both the production entry point and the test suite.

    Args:
        test_config: Optional dictionary with configuration overrides for testing.

    Returns:
        Configured Flask application instance.
    """
    app = Flask(__name__, static_folder="../static", template_folder="../templates")

    # Load default configuration from environment variables
    app.config.from_mapping(
        SECRET_KEY=os.getenv("FLASK_SECRET_KEY", "dev"),
        DEBUG=os.getenv("FLASK_DEBUG", "True") == "True",
    )

    # Apply any test‑specific configuration
    if test_config:
        app.config.update(test_config)

    # Register routes
    register_routes(app)

    logger.info("Flask app created (debug=%s)", app.config["DEBUG"])
    return app


def register_routes(app: Flask) -> None:
    """
    Registers URL routes on the Flask app.

    Keeping route registration in a separate function makes it easy to
    unit‑test the routing logic without creating a full app instance.
    """

    @app.route("/", methods=["GET"])
    def index() -> str:
        """Render the main page of the wizard."""
        logger.info("Rendering index page")
        return render_template("index.html")

    @app.route("/api/status", methods=["GET"])
    def status() -> Any:
        """Simple health‑check endpoint used by tests."""
        logger.info("Status endpoint called")
        return jsonify({"status": "ok", "message": "DevEnv Setup Wizard is running"})


# Create a module‑level app instance for ``flask run`` convenience.
app: Flask = create_app()
```

**File: `src/automation/__init__.py`**
```python
"""
src.automation package initializer.

Exports helper functions that perform basic environment setup tasks.
"""
from .setup import setup_python_env, setup_node_env  # noqa: F401
```

**File: `src/automation/setup.py`**
```python
"""
Automation helpers for setting up Python and Node.js development environments.

The functions are deliberately simple – they only simulate the actions
required for the unit tests.  Real‑world implementations would invoke
subprocesses, handle errors, and write detailed logs.
"""

import logging
import subprocess
from pathlib import Path
from typing import List

logger = logging.getLogger(__name__)

# --------------------------------------------------------------------------- #
# Named constants
# --------------------------------------------------------------------------- #
VENV_DIR_NAME: str = ".venv"
NODE_MODULES_DIR: str = "node_modules"


def _run_command(command: List[str], cwd: Path | None = None) -> bool:
    """
    Executes a shell command safely.

    Args:
        command: List of command arguments (e.g., ["python", "--version"]).
        cwd: Optional working directory for the command.

    Returns:
        True if the command succeeded (exit code 0), False otherwise.
    """
    try:
        logger.info("Running command: %s (cwd=%s)", " ".join(command), cwd)
        result = subprocess.run(
            command,
            cwd=cwd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            check=True,
        )
        logger.debug("Command output: %s", result.stdout)
        return True
    except subprocess.CalledProcessError as exc:
        logger.error(
            "Command failed with exit code %s: %s", exc.returncode, exc.stderr
        )
        return False
    except FileNotFoundError:
        logger.error("Command not found: %s", command[0])
        return False


def setup_python_env(project_path: Path) -> bool:
    """
    Creates a virtual environment and installs packages from ``requirements.txt``.

    The function is idempotent – if the environment already exists it will
    attempt to reinstall the requirements.

    Args:
        project_path: Path to the root of the Python project.

    Returns:
        True on success, False on any failure.
    """
    venv_