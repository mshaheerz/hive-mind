import os
from pathlib import Path

import pytest
from unittest import mock

# Import the module under test (assuming it lives in src/setup_wizard.py)
import src.setup_wizard as wizard


def test_create_virtualenv_success(temp_project_dir, monkeypatch):
    """Virtualenv is created in the expected location."""
    venv_path = wizard.create_virtualenv(temp_project_dir, python_version="python3")
    assert venv_path.exists()
    assert venv_path.is_dir()


def test_create_virtualenv_invalid_python(monkeypatch):
    """Providing an unsupported Python version raises ValueError."""
    with pytest.raises(ValueError):
        wizard.create_virtualenv(Path("/tmp"), python_version="0.0")


def test_install_requirements_success(temp_project_dir, mock_requirements_file, monkeypatch):
    """Requirements are installed without errors."""
    venv_path = wizard.create_virtualenv(temp_project_dir)
    # Mock subprocess.run to avoid real pip install
    monkeypatch.setattr("subprocess.run", mock.Mock(return_value=mock.Mock(returncode=0)))
    wizard.install_requirements(venv_path, mock_requirements_file)
    # No exception means success


def test_install_requirements_file_missing(temp_project_dir, monkeypatch):
    """Missing requirements file raises FileNotFoundError."""
    venv_path = wizard.create_virtualenv(temp_project_dir)
    missing_file = temp_project_dir / "nonexistent.txt"
    with pytest.raises(FileNotFoundError):
        wizard.install_requirements(venv_path, missing_file)


def test_setup_git_repo_success(temp_project_dir, monkeypatch):
    """Cloning a repository succeeds."""
    repo_url = "https://github.com/example/repo.git"
    monkeypatch.setattr("subprocess.run", mock.Mock(return_value=mock.Mock(returncode=0)))
    wizard.setup_git_repo(temp_project_dir, repo_url)
    # No exception means success


def test_setup_git_repo_failure(monkeypatch):
    """Git clone failure raises RuntimeError."""
    monkeypatch.setattr("subprocess.run", mock.Mock(returncode=1))
    with pytest.raises(RuntimeError):
        wizard.setup_git_repo(Path("/tmp"), "https://invalid.url/repo.git")


def test_setup_docker_success(temp_project_dir, mock_dockerfile, monkeypatch):
    """Docker image builds successfully."""
    monkeypatch.setattr("subprocess.run", mock.Mock(return_value=mock.Mock(returncode=0)))
    wizard.setup_docker(temp_project_dir, mock_dockerfile)
    # No exception means success


def test_setup_docker_missing_file(temp_project_dir, monkeypatch):
    """Missing Dockerfile raises FileNotFoundError."""
    missing_file = temp_project_dir / "Dockerfile"
    with pytest.raises(FileNotFoundError):
        wizard.setup_docker(temp_project_dir, missing_file)


def test_setup_logging_success(temp_project_dir):
    """Logging is configured and log file is created."""
    log_file = temp_project_dir / "setup.log"
    wizard.setup_logging(log_file)
    assert log_file.exists()


def test_wizard_python_env_success(temp_project_dir, mock_requirements_file, monkeypatch):
    """Full Python env wizard runs without errors."""
    # Switch cwd so the wizard writes into the temporary directory.
    monkeypatch.chdir(temp_project_dir)

    # Mock external calls (virtualenv creation, pip install, etc.)
    monkeypatch.setattr("subprocess.run", mock.Mock(return_value=mock.Mock(returncode=0)))
    wizard.wizard("myproject", env_type="python")
    # Check that expected directories were created
    venv_path = temp_project_dir / "myproject" / "venv"
    assert venv_path.exists()


def test_wizard_node_env_success(temp_project_dir, monkeypatch):
    """Full Node.js env wizard runs without errors."""
    monkeypatch.chdir(temp_project_dir)

    monkeypatch.setattr("subprocess.run", mock.Mock(return_value=mock.Mock(returncode=0)))
    wizard.wizard("myproject", env_type="node")
    # Node-specific artifacts can be checked here (e.g., node_modules dir)
    node_modules = temp_project_dir / "myproject" / "node_modules"
    assert node_modules.exists()


def test_wizard_empty_project_name():
    """An empty project name should raise ValueError."""
    with pytest.raises(ValueError):
        wizard.wizard("", env_type="python")


def test_wizard_invalid_env_type():
    """Unsupported env_type raises ValueError."""
    with pytest.raises(ValueError):
        wizard.wizard("proj", env_type="ruby")
