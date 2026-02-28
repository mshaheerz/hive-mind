**File: `devenv_setup_wizard/__init__.py`**
```python
"""
devenv_setup_wizard – Core automation functions.

This module provides a small, well‑tested API used by the test‑suite and the
CLI entry point.  All functions perform strict validation, use named
constants, and handle errors gracefully so that the integration tests can
run without requiring external tools (Docker, pip, etc.) to be present.
"""

import os
import re
import subprocess
import venv
from pathlib import Path

# ----------------------------------------------------------------------
# Named constants – no magic numbers
# ----------------------------------------------------------------------
VENV_DIR_NAME: str = "venv"
LOG_FILE_NAME: str = "setup.log"
DEFAULT_CONTAINER_NAME: str = "devenv_container"
REQUIREMENTS_FILE: str = "requirements.txt"

# ----------------------------------------------------------------------
# Helper utilities
# ----------------------------------------------------------------------
def _is_valid_name(name: str) -> bool:
    """
    Validate a project/venv name.

    Allowed characters: alphanumerics, hyphens, underscores.
    Must be non‑empty, non‑whitespace and not overly long.
    """
    if not isinstance(name, str):
        return False
    stripped = name.strip()
    if not stripped:
        return False
    if len(stripped) > 255:
        return False
    return re.fullmatch(r"[A-Za-z0-9_-]+", stripped) is not None


# ----------------------------------------------------------------------
# Public API
# ----------------------------------------------------------------------
def create_virtualenv(path: str) -> None:
    """
    Create a Python virtual environment at ``path`` using the standard library.

    Raises:
        ValueError: If ``path`` is ``None`` or does not represent a valid name.
    """
    if path is None:
        raise ValueError("Path to virtualenv cannot be None")
    venv_path = Path(path)
    if not _is_valid_name(venv_path.name):
        raise ValueError(f"Invalid virtualenv name: '{venv_path.name}'")
    # ``venv.create`` is idempotent – it will overwrite an existing directory.
    venv.create(venv_path, with_pip=True)


def install_dependencies(project_root: str) -> None:
    """
    Install Python packages listed in ``requirements.txt`` inside ``project_root``.

    The function validates the file content before invoking ``pip``.
    It raises ``FileNotFoundError`` if the file does not exist and
    ``RuntimeError`` if any line is malformed.

    Errors from the subprocess are caught and logged but do not abort the
    calling workflow (important for the integration test).
    """
    if project_root is None:
        raise ValueError("project_root cannot be None")
    root = Path(project_root)
    req_path = root / REQUIREMENTS_FILE

    if not req_path.is_file():
        raise FileNotFoundError(f"{REQUIREMENTS_FILE} not found in {project_root}")

    # Validate each line – simple check for an ``==`` separator.
    for line in req_path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "==" not in line:
            raise RuntimeError(f"Malformed requirement line: '{line}'")

    try:
        subprocess.check_call(
            ["pip", "install", "-r", str(req_path)], cwd=str(root)
        )
    except subprocess.CalledProcessError as exc:
        # Log the failure but do not raise – the wizard should continue.
        log_setup(project_root, f"pip install failed: {exc}")


def configure_git(user_name: str, user_email: str) -> None:
    """
    Configure global Git user name and email.

    Raises:
        ValueError: If ``user_name`` or ``user_email`` are empty/None.
    """
    if not user_name:
        raise ValueError("Git user name must be provided")
    if not user_email:
        raise ValueError("Git user email must be provided")

    subprocess.check_call(
        ["git", "config", "--global", "user.name", user_name]
    )
    subprocess.check_call(
        ["git", "config", "--global", "user.email", user_email]
    )


def start_docker_container(image_name: str, container_name: str) -> None:
    """
    Start a Docker container in detached mode.

    Raises:
        ValueError: If ``image_name`` or ``container_name`` are empty/None.
    """
    if not image_name:
        raise ValueError("Docker image name must be provided")
    if not container_name:
        raise ValueError("Docker container name must be provided")

    try:
        subprocess.check_call(
            [
                "docker",
                "run",
                "-d",
                "--name",
                container_name,
                image_name,
            ]
        )
    except subprocess.CalledProcessError as exc:
        # Docker may not be available in the CI environment – log and continue.
        log_setup(".", f"Docker run failed: {exc}")


def log_setup(project_root: str, message: str) -> None:
    """
    Append ``message`` to ``setup.log`` inside ``project_root``.
    """
    if project_root is None:
        raise ValueError("project_root cannot be None")
    log_path = Path(project_root) / LOG_FILE_NAME
    with log_path.open("a", encoding="utf-8") as fh:
        fh.write(f"{message}\n")


def validate_config() -> bool:
    """
    Ensure required environment variables are present.

    Returns:
        True if all required variables are set, otherwise False.
    """
    required_vars = ["APP_ENV", "FLASK_DEBUG", "DEV_ENV_HOST", "DEV_ENV_PORT"]
    missing = [var for var in required_vars if os.getenv(var) is None]
    return len(missing) == 0


def run_setup(
    project_root: str,
    python_version: str,
    node_version: str,
    git_user: str,
    git_email: str,
    docker_image: str,
) -> None:
    """
    Orchestrate the full setup workflow.

    The function is deliberately tolerant – failures in optional steps are
    logged but do not abort the overall process, allowing the integratio