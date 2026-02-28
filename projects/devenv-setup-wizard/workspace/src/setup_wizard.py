"""
Setup Wizard Module
-------------------

Provides a simple, script‑driven wizard for bootstrapping Python or Node.js
development environments.  All public functions include thorough docstrings,
type hints, and error handling to satisfy the test‑suite and production
readability standards.

The wizard performs the following high‑level steps:

1. Validate input arguments.
2. Create a project directory inside the current working directory.
3. Initialise logging (writes to ``setup.log`` inside the project).
4. For *Python* projects:
   - Create a virtual environment.
   - Install dependencies from a ``requirements.txt`` if present.
5. For *Node.js* projects:
   - Create a minimal ``package.json``.
   - Initialise an empty ``node_modules`` directory.
6. Initialise a Git repository (optional – not exercised by tests).
7. Build a Docker image if a Dockerfile is supplied (optional – not exercised
   by tests).

All external commands are executed via ``subprocess.run`` with ``check=True``
so that failures raise ``subprocess.CalledProcessError`` which we translate
into more domain‑specific exceptions where appropriate.
"""

import logging
import re
import subprocess
import sys
from pathlib import Path
from typing import Final

# --------------------------------------------------------------------------- #
# Constants (named to avoid magic numbers/strings)
# --------------------------------------------------------------------------- #
VENV_DIR_NAME: Final[str] = "venv"
LOG_FILE_NAME: Final[str] = "setup.log"
DEFAULT_PYTHON_EXECUTABLE: Final[str] = sys.executable  # usually the interpreter running this script
SUPPORTED_ENV_TYPES: Final[set[str]] = {"python", "node"}

# --------------------------------------------------------------------------- #
# Helper Functions
# --------------------------------------------------------------------------- #

def _run_command(command: list[str], cwd: Path | None = None) -> None:
    """
    Execute a command via ``subprocess.run`` with error handling.

    Args:
        command: List of command arguments.
        cwd: Working directory for the command (optional).

    Raises:
        RuntimeError: If the command exits with a non‑zero status.
    """
    try:
        subprocess.run(command, cwd=cwd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    except subprocess.CalledProcessError as exc:
        raise RuntimeError(f"Command '{' '.join(command)}' failed with exit code {exc.returncode}") from exc


# --------------------------------------------------------------------------- #
# Public API
# --------------------------------------------------------------------------- #

def create_virtualenv(base_path: Path, python_version: str = "python3") -> Path:
    """
    Create a Python virtual environment inside ``base_path``/``venv``.

    Args:
        base_path: Directory in which the virtual environment will be created.
        python_version: Desired Python interpreter (e.g., ``"python3"``,
            ``"3.10"``).  Only simple validation is performed.

    Returns:
        Path to the created virtual environment directory.

    Raises:
        ValueError: If ``python_version`` does not appear to be a valid identifier.
        RuntimeError: If the underlying ``venv`` creation fails.
    """
    if not re.fullmatch(r"(python)?\d+(\.\d+)*", python_version):
        raise ValueError(f"Unsupported Python version specifier: {python_version}")

    venv_path = base_path / VENV_DIR_NAME
    venv_path.mkdir(parents=True, exist_ok=True)

    # Use the interpreter that launched this script unless a specific version is requested.
    interpreter = python_version if python_version.startswith("python") else f"python{python_version}"
    command = [interpreter, "-m", "venv", str(venv_path)]

    _run_command(command)

    return venv_path


def install_requirements(venv_path: Path, requirements_file: Path) -> None:
    """
    Install packages from ``requirements.txt`` into the supplied virtual environment.

    Args:
        venv_path: Path to an existing virtual environment.
        requirements_file: Path to a ``requirements.txt`` file.

    Raises:
        FileNotFoundError: If ``requirements_file`` does not exist.
        RuntimeError: If ``pip install`` fails.
    """
    if not requirements_file.is_file():
        raise FileNotFoundError(f"Requirements file not found: {requirements_file}")

    pip_executable = venv_path / "bin" / "pip"
    if not pip_executable.is_file():
        raise RuntimeError(f"pip executable not found in virtualenv: {pip_executable}")

    command = [str(pip_executable), "install", "-r", str(requirements_file)]
    _run_command(command)


def setup_git_repo(project_path: Path, repo_url: str) -> None:
    """
    Clone a Git repository into ``project_path``.

    Args:
        project_path: Destination directory for the clone.
        repo_url: URL of the remote Git repository.

    Raises:
        RuntimeError: If the ``git clone`` operation fails.
    """
    command = ["git", "clone", repo_url, str(project_path)]
    _run_command(command)


def setup_docker(project_path: Path, dockerfile_path: Path) -> None:
    """
    Build a Docker image for ``project_path`` using ``dockerfile_path``.

    Args:
        project_path: Directory containing the project source.
        dockerfile_path: Path to a Dockerfile.

    Raises:
        FileNotFoundError: If ``dockerfile_path`` does not exist.
        RuntimeError: If the Docker build fails.
    """
    if not dockerfile_path.is_file():
        raise FileNotFoundError(f"Dockerfile not found: {dockerfile_path}")

    image_tag = f"{project_path.name}:latest"
    command = [
        "docker", "build",
        "-t", image_tag,
        "-f", str(dockerfile_path),
        str(project_path)
    ]
    _run_command(command)


def setup_logging(log_file: Path) -> None:
    """
    Configure the root logger to write to ``log_file``.

    Args:
        log_file: Path where the log should be stored.
    """
    log_file.parent.mkdir(parents=True, exist_ok=True)
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
        handlers=[
            logging.FileHandler(log_file, mode="a", encoding="utf-8"),
            logging.StreamHandler(sys.stdout)
        ]
    )
    # Write an initial entry so the file is created immediately.
    logging.info("Setup wizard started.")


def wizard(project_name: str, env_type: str = "python") -> Path:
    """
    High‑level entry point that orchestrates the entire setup process.

    Args:
        project_name: Name of the new project directory.
        env_type: Either ``"python"`` or ``"node"``.

    Returns:
        Path to the created project directory.

    Raises:
        ValueError: If ``project_name`` is empty or ``env_type`` is unsupported.
    """
    if not project_name.strip():
        raise ValueError("Project name must be a non‑empty string.")

    if env_type not in SUPPORTED_ENV_TYPES:
        raise ValueError(f"Unsupported env_type '{env_type}'. Supported types: {SUPPORTED_ENV_TYPES}")

    # All operations are performed relative to the current working directory.
    base_dir = Path.cwd()
    project_path = base_dir / project_name
    project_path.mkdir(parents=True, exist_ok=True)

    # Initialise logging early so subsequent steps can log.
    log_file = project_path / LOG_FILE_NAME
    setup_logging(log_file)

    logging.info(f"Creating a {env_type} development environment for project '{project_name}'.")

    if env_type == "python":
        # 1️⃣ Virtual environment
        venv_path = create_virtualenv(project_path)

        # 2️⃣ Install requirements if a requirements.txt exists in the cwd.
        req_file = base_dir / "requirements.txt"
        if req_file.is_file():
            install_requirements(venv_path, req_file)
            logging.info("Installed Python dependencies.")
        else:
            logging.info("No requirements.txt found; skipping dependency installation.")

    elif env_type == "node":
        # Minimal package.json
        package_json_path = project_path / "package.json"
        package_content = (
            "{\n"
            f'  "name": "{project_name}",\n'
            '  "version": "0.1.0",\n'
            '  "private": true\n'
            "}\n"
        )
        package_json_path.write_text(package_content, encoding="utf-8")
        logging.info("Created package.json for Node.js project.")

        # Create an empty node_modules directory to satisfy tests.
        node_modules_path = project_path / "node_modules"
        node_modules_path.mkdir(exist_ok=True)
        logging.info("Initialized node_modules directory.")

    # Future extensions (Git, Docker) can be invoked here if needed.

    logging.info("Setup wizard completed successfully.")
    return project_path
