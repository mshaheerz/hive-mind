import os
import shutil
import tempfile
from pathlib import Path

import pytest


@pytest.fixture
def temp_project_dir():
    """Create and teardown a temporary directory for testing."""
    dir_path = Path(tempfile.mkdtemp(prefix="devenv_test_"))
    yield dir_path
    shutil.rmtree(dir_path)


@pytest.fixture
def mock_requirements_file(temp_project_dir):
    """Create a dummy requirements.txt file."""
    req_file = temp_project_dir / "requirements.txt"
    req_file.write_text("requests==2.31.0\n")
    return req_file


@pytest.fixture
def mock_dockerfile(temp_project_dir):
    """Create a dummy Dockerfile."""
    dockerfile = temp_project_dir / "Dockerfile"
    dockerfile.write_text("FROM python:3.10-slim\n")
    return dockerfile
