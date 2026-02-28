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
    venv_path = project_path / VENV_DIR_NAME
    requirements_file = project_path / "requirements.txt"

    # 1. Create virtual environment if missing
    if not venv_path.exists():
        if not _run_command(["python3", "-m", "venv", str(venv_path)], cwd=project_path):
            return False

    # 2. Activate venv and install requirements
    pip_executable = venv_path / "bin" / "pip"
    if not pip_executable.exists():
        logger.error("pip executable not found in virtual environment")
        return False

    install_cmd = [str(pip_executable), "install", "-r", str(requirements_file)]
    return _run_command(install_cmd, cwd=project_path)


def setup_node_env(project_path: Path) -> bool:
    """
    Installs Node.js dependencies using ``npm install``.

    Args:
        project_path: Path to the root of the Node.js project (must contain ``package.json``).

    Returns:
        True on success, False on any failure.
    """
    package_json = project_path / "package.json"
    if not package_json.is_file():
        logger.error("package.json not found at %s", project_path)
        return False

    # Ensure ``node_modules`` directory exists (npm will create it)
    node_modules_path = project_path / NODE_MODULES_DIR
    if node_modules_path.exists():
        logger.info("node_modules already present – reinstalling")
    return _run_command(["npm", "install"], cwd=project_path)
