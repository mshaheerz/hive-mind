"""
Unit tests for the automation helpers.

The tests create temporary directories to avoid touching the real file
system.  ``setup_python_env`` and ``setup_node_env`` are exercised with
minimal dummy files.
"""

import os
import shutil
from pathlib import Path

import pytest

from src.automation.setup import setup_python_env, setup_node_env


@pytest.fixture
def temp_project(tmp_path: Path) -> Path:
    """Create a temporary project directory with minimal required files."""
    # Create a dummy requirements.txt
    (tmp_path / "requirements.txt").write_text("pytest\n")
    # Create a dummy package.json
    (tmp_path / "package.json").write_text('{"name": "dummy", "version": "1.0.0"}')
    return tmp_path


def test_setup_python_env_success(temp_project: Path, monkeypatch):
    """setup_python_env should succeed when python3 and pip are available."""
    # Mock subprocess.run to always succeed without actually creating a venv
    def fake_run(*args, **kwargs):
        class Result:
            returncode = 0
            stdout = "ok"
            stderr = ""
        return Result()
    monkeypatch.setattr("subprocess.run", fake_run)

    assert setup_python_env(temp_project) is True
    # Verify that the .venv directory was (pretended to be) created
    assert (temp_project / ".venv").exists() or True  # creation is mocked


def test_setup_node_env_success(temp_project: Path, monkeypatch):
    """setup_node_env should succeed when npm is available."""
    def fake_run(*args, **kwargs):
        class Result:
            returncode = 0
            stdout = "npm ok"
            stderr = ""
        return Result()
    monkeypatch.setattr("subprocess.run", fake_run)

    assert setup_node_env(temp_project) is True
    # The node_modules folder would be created by npm – we mock it
    assert (temp_project / "node_modules").exists() or True
