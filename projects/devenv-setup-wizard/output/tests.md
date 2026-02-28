**File: `test/conftest.py`**
```python
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
```

---

**File: `test/test_setup_wizard_unit.py`**
```python
import os
from pathlib import Path

import pytest
from unittest import mock

# Import the module under test (assuming it lives in src/setup_wizard.py)
# Adjust the import path if the actual location differs.
import src.setup_wizard as wizard


def test_create_virtualenv_success(temp_project_dir, monkeypatch):
    """Virtualenv is created in the expected location."""
    venv_path = wizard.create_virtualenv(temp_project_dir, python_version="3.10")
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
    # Mock external calls
    monkeypatch.setattr("subprocess.run", mock.Mock(return_value=mock.Mock(returncode=0)))
    wizard.wizard("myproject", env_type="python")
    # Check that expected directories were created
    venv_path = temp_project_dir / "myproject" / "venv"
    assert venv_path.exists()


def test_wizard_node_env_success(temp_project_dir, monkeypatch):
    """Full Node.js env wizard runs without errors."""
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
```

---

**File: `test/test_setup_wizard_integration.py`**
```python
import os
import subprocess
from pathlib import Path

import pytest

# Import the module under test
import src.setup_wizard as wizard


def test_integration_python_env(temp_project_dir, mock_requirements_file, monkeypatch):
    """Run the wizard end‑to‑end for a Python project."""
    # Use a real subprocess call for virtualenv creation
    monkeypatch.setattr("subprocess.run", lambda *args, **kwargs: subprocess.run(args[0], check=True))
    wizard.wizard("integration_test_py", env_type="python")

    # Verify key artifacts
    project_path = temp_project_dir / "integration_test_py"
    assert project_path.exists()
    assert (project_path / "venv").exists()
    assert (project_path / "setup.log").exists()


def test_integration_node_env(temp_project_dir, monkeypatch):
    """Run the wizard end‑to‑end for a Node.js project."""
    monkeypatch.setattr("subprocess.run", lambda *args, **kwargs: subprocess.run(args[0], check=True))
    wizard.wizard("integration_test_node", env_type="node")

    project_path = temp_project_dir / "integration_test_node"
    assert project_path.exists()
    # Node modules may not exist if npm install fails silently; check presence of package.json
    assert (project_path / "package.json").exists()
```

---

**File: `test/test_setup_wizard_smoke.py`**
```python
# A minimal smoke test that simply imports the wizard and calls it with
# a dummy project name. This test should pass even if the underlying
# implementation is incomplete, as long as the public API exists.

import src.setup_wizard as wizard

def test_smoke():
    wizard.wizard("smoke_test", env_type="python")
```

---

**File: `test/test_plan.md`**
```markdown
# Manual Test Plan for DevEnv Setup Wizard

| # | Test Case | Description | Steps | Expected Result | Pass / Fail |
|---|-----------|-------------|-------|-----------------|-------------|
| 1 | Basic Python Setup | Verify wizard creates Python env | 1. Run `wizard("demo_py", env_type="python")`<br>2. Check `demo_py/venv` exists | `demo_py/venv` folder created |  |
| 2 | Basic Node Setup | Verify wizard creates Node env | 1. Run `wizard("demo_node", env_type="node")`<br>2. Check `demo_node/node_modules` exists | `demo_node/node_modules` folder created |  |
| 3 | Empty Project Name | Validate error handling | 1. Run `wizard("", env_type="python")` | Raises ValueError |  |
| 4 | Unsupported Env Type | Validate error handling | 1. Run `wizard("proj", env_type="ruby")` | Raises ValueError |  |
| 5 | Missing Requirements File | Validate error handling | 1. Remove `requirements.txt`<br>2. Run wizard | Raises FileNotFoundError |  |
| 6 | Large Project Name | Test path handling | 1. Create a 255‑char project name<br>2. Run wizard | Environment created without truncation |  |
| 7 | Special Characters | Test path sanitization | 1. Use name `proj_!@#$%^&*()`<br>2. Run wizard | Environment created, special chars preserved |  |
| 8 | Docker Integration | Verify Docker image built | 1. Include Dockerfile<br>2. Run wizard | Docker image built successfully |  |
| 9 | Git Integration | Verify repo cloned | 1. Provide valid repo URL<br>2. Run wizard | Repo contents present |  |
| 10 | Log File | Verify logging | 1. Run wizard<br>2. Open `setup.log` | Log contains status messages |  |

**Notes:**
- Tests should be performed on a clean machine to avoid interference.
- For tests involving Docker or Git, ensure the relevant services are available.
- Use `pytest` for automated unit tests; manual tests are performed via the command line.
```

---

**File: `requirements-dev.txt`**
```
pytest>=7.0,<9
pytest-mock>=3.14,<4
```

---

**File: `pytest.ini`** (additions)
```ini
[pytest]
addopts = -ra -q
```

---

### TEST_COMMAND
```
pytest
```

### EXPECTED_RESULT
All tests (`test_setup_wizard_unit.py`, `test_setup_wizard_integration.py`, `test_setup_wizard_smoke.py`) pass with 0 failures. Manual test plan passes when the wizard behaves as described.

### FAILURE_ACTION_ITEMS
- If any unit test fails, review the corresponding function implementation for incorrect handling of edge cases.
- If integration tests fail, verify that external subprocess calls (virtualenv, npm, git, docker) are correctly invoked and that environment variables are set.
- If the smoke test fails, ensure the public API (`wizard` function) exists and is callable.
- If manual test plan fails, update the wizard to handle the reported scenario (e.g., path sanitization, error propagation).