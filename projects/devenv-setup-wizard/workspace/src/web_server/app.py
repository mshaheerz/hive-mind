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
