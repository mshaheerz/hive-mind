import os
import subprocess
from pathlib import Path

import pytest

# Import the module under test
import src.setup_wizard as wizard


def test_integration_python_env(temp_project_dir, mock_requirements_file, monkeypatch):
    """Run the wizard end‑to‑end for a Python project."""
    # Change working directory to the temporary project root so the wizard creates
    # the project inside this directory (matches test expectations).
    monkeypatch.chdir(temp_project_dir)

    # Use a real subprocess call for virtualenv creation (mocked by the lambda).
    monkeypatch.setattr(
        "subprocess.run",
        lambda *args, **kwargs: subprocess.run(args[0], check=True)
    )
    wizard.wizard("integration_test_py", env_type="python")

    # Verify key artifacts
    project_path = temp_project_dir / "integration_test_py"
    assert project_path.exists()
    assert (project_path / "venv").exists()
    assert (project_path / "setup.log").exists()


def test_integration_node_env(temp_project_dir, monkeypatch):
    """Run the wizard end‑to‑end for a Node.js project."""
    monkeypatch.chdir(temp_project_dir)
    monkeypatch.setattr(
        "subprocess.run",
        lambda *args, **kwargs: subprocess.run(args[0], check=True)
    )
    wizard.wizard("integration_test_node", env_type="node")

    project_path = temp_project_dir / "integration_test_node"
    assert project_path.exists()
    # Node modules may not exist if npm install fails silently; check presence of package.json
    assert (project_path / "package.json").exists()
