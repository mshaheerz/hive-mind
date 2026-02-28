**File: `test/test_env_loading.py`**
```python
import os
import builtins
import importlib
import pytest
from unittest import mock

# Assuming the wizard module is in src/wizard.py
wizard = importlib.import_module("wizard")

def test_env_file_parsed_correctly(tmp_path, monkeypatch):
    # Create a minimal .env file
    env_file = tmp_path / ".env"
    env_file.write_text("APP_ENV=development\nDEBUG=True\n")
    monkeypatch.setenv("APP_ENV", None)  # Ensure no global env
    # Load env
    env = wizard.load_env(str(env_file))
    assert env["APP_ENV"] == "development"
    assert env["DEBUG"] == "True"

def test_missing_env_file_raises(monkeypatch):
    with pytest.raises(FileNotFoundError):
        wizard.load_env("/non/existent/.env")

def test_env_var_overwrite(monkeypatch):
    # Simulate environment variable overriding file value
    monkeypatch.setenv("APP_ENV", "production")
    env = wizard.load_env(".env")
    assert env["APP_ENV"] == "production"

def test_empty_env_file(monkeypatch, tmp_path):
    empty_file = tmp_path / ".env"
    empty_file.write_text("")
    env = wizard.load_env(str(empty_file))
    assert env == {}

def test_invalid_line_skipped(monkeypatch, tmp_path):
    bad_file = tmp_path / ".env"
    bad_file.write_text("INVALID_LINE\nKEY=VALUE\n")
    env = wizard.load_env(str(bad_file))
    assert env["KEY"] == "VALUE"
    assert "INVALID_LINE" not in env
```

---

**File: `test/test_setup_wizard.py`**
```python
import importlib
import os
import sys
import pytest
from unittest import mock

wizard = importlib.import_module("wizard")

@pytest.fixture
def mock_subprocess_run(monkeypatch):
    mock = mock.Mock()
    monkeypatch.setattr("wizard.subprocess.run", mock)
    return mock

def test_setup_python_env_success(mock_subprocess_run):
    # Simulate success
    mock_subprocess_run.return_value.returncode = 0
    result = wizard.setup_python_env(env={"APP_ENV": "development"})
    assert result is True
    # Verify expected commands called
    calls = [mock.call(["python", "-m", "venv", "env"], check=True),
             mock.call(["pip", "install", "-r", "requirements.txt"], check=True)]
    mock_subprocess_run.assert_has_calls(calls, any_order=True)

def test_setup_python_env_failure(mock_subprocess_run):
    # Simulate failure
    mock_subprocess_run.side_effect = RuntimeError("Command failed")
    with pytest.raises(RuntimeError):
        wizard.setup_python_env(env={})
    mock_subprocess_run.assert_called()

def test_setup_node_env_success(mock_subprocess_run):
    # Simulate success
    mock_subprocess_run.return_value.returncode = 0
    result = wizard.setup_node_env(env={"APP_ENV": "development"})
    assert result is True
    # Verify npm install called
    mock_subprocess_run.assert_any_call(["npm", "install"], check=True)

def test_setup_node_env_failure(mock_subprocess_run):
    mock_subprocess_run.side_effect = RuntimeError("npm failed")
    with pytest.raises(RuntimeError):
        wizard.setup_node_env(env={})
```

---

**File: `test/test_logging.py`**
```python
import importlib
import os
import tempfile
import pytest
from unittest import mock

wizard = importlib.import_module("wizard")

def test_log_setup_writes_file(tmp_path):
    log_file = tmp_path / "setup.log"
    wizard.log_setup("Test message", logfile=str(log_file))
    assert log_file.exists()
    content = log_file.read_text()
    assert "Test message" in content

def test_log_setup_appends(tmp_path):
    log_file = tmp_path / "setup.log"
    wizard.log_setup("First", logfile=str(log_file))
    wizard.log_setup("Second", logfile=str(log_file))
    content = log_file.read_text()
    assert "First" in content and "Second" in content

def test_log_setup_no_file(tmp_path, monkeypatch):
    # Simulate permission denied
    monkeypatch.setattr("wizard.open", mock.Mock(side_effect=PermissionError))
    with pytest.raises(PermissionError):
        wizard.log_setup("Should fail")
```

---

**File: `test/test_integration_git.py`**
```python
import importlib
import os
import pytest
from unittest import mock

wizard = importlib.import_module("wizard")

def test_git_integration_initializes_repo(monkeypatch):
    mock_run = mock.Mock()
    monkeypatch.setattr("wizard.subprocess.run", mock_run)
    wizard.integrate_git()
    mock_run.assert_called_with(["git", "init"], check=True)
    # Check that a .git folder would exist (simulation)
    # In real code, you would verify the filesystem

def test_git_integration_failure(monkeypatch):
    mock_run = mock.Mock(side_effect=RuntimeError("git init failed"))
    monkeypatch.setattr("wizard.subprocess.run", mock_run)
    with pytest.raises(RuntimeError):
        wizard.integrate_git()
```

---

**File: `test/test_integration_docker.py`**
```python
import importlib
import os
import pytest
from unittest import mock

wizard = importlib.import_module("wizard")

def test_docker_integration_up(monkeypatch):
    mock_run = mock.Mock()
    monkeypatch.setattr("wizard.subprocess.run", mock_run)
    wizard.integrate_docker()
    mock_run.assert_called_with(["docker", "compose", "up", "-d"], check=True)

def test_docker_integration_missing_compose(monkeypatch):
    mock_run = mock.Mock(side_effect=FileNotFoundError)
    monkeypatch.setattr("wizard.subprocess.run", mock_run)
    with pytest.raises(FileNotFoundError):
        wizard.integrate_docker()
```

---

**File: `test/test_edge_cases.py`**
```python
import importlib
import pytest
from unittest import mock

wizard = importlib.import_module("wizard")

def test_empty_input_setup(monkeypatch):
    # Empty env dict should not crash
    result = wizard.setup_python_env(env={})
    assert result is True  # Assuming default behaviour

def test_null_env_var(monkeypatch):
    # Passing None as env should raise ValueError
    with pytest.raises(ValueError):
        wizard.setup_python_env(env=None)

def test_overflow_package_list(monkeypatch):
    # Simulate huge list of packages
    huge_list = ["pkg"] * 10000
    mock_run = mock.Mock()
    monkeypatch.setattr("wizard.subprocess.run", mock_run)
    wizard.install_packages(huge_list)
    # Ensure command built correctly
    mock_run.assert_called()
```

---

**File: `test/test_security.py`**
```python
import importlib
import os
import pytest
from unittest import mock

wizard = importlib.import_module("wizard")

def test_no_secrets_in_logs(monkeypatch, tmp_path):
    log_file = tmp_path / "setup.log"
    # Simulate a secret in env
    env = {"API_KEY": "super_secret_value"}
    # Capture log output
    monkeypatch.setattr("wizard.open", open)
    wizard.log_setup("Setup started", logfile=str(log_file))
    wizard.log_setup(f"Using API_KEY={env['API_KEY']}", logfile=str(log_file))
    content = log_file.read_text()
    # Ensure secret not present
    assert "super_secret_value" not in content
```

---

**File: `test/TEST_PLAN.md`**
```markdown
# DevEnv Setup Wizard – Test Plan

## 1. Unit Tests
| Test | Description | Pass Criteria |
|------|-------------|---------------|
| `test_env_loading` | Verify .env parsing, overrides, missing files | Correct dict returned / FileNotFoundError |
| `test_setup_wizard` | Check python/node setup commands executed | Return True / RuntimeError |
| `test_logging` | Log file creation and appending | File contains expected messages |
| `test_integration_git` | Git repo initialization | `git init` called |
| `test_integration_docker` | Docker Compose up | `docker compose up -d` called |
| `test_edge_cases` | Empty, null, huge inputs | No crashes, correct handling |
| `test_security` | Secrets not logged | Log file excludes secret values |

## 2. Integration Tests
- **Scenario A**: Run wizard with Python project template.
  - Verify virtual environment folder `env/` created.
  - Verify `requirements.txt` installed.
  - Verify `.git` directory created.
  - Verify Docker containers start if `docker-compose.yml` present.
- **Scenario B**: Run wizard with Node.js project template.
  - Verify `node_modules/` folder created.
  - Verify `npm install` executed.
  - Same git & docker checks.

## 3. Manual Testing Checklist
1. Execute `python -m wizard` with default arguments.
2. Inspect `setup.log` for clear steps.
3. Confirm local git repo initialized.
4. If Docker compose file exists, run `docker compose ps` to see containers.
5. Check that environment variables are correctly loaded into the process.
6. Verify that missing required env vars cause a user‑friendly error.

## 4. Security & Privacy
- Run wizard with a fake `API_KEY` env var.
- Ensure `API_KEY` value never appears in `setup.log`.

## 5. Performance
- Run wizard with a very large `requirements.txt` (10k packages) and ensure it does not crash.
- Measure total execution time; should be < 60s on a typical dev machine.

## 6. Failure Handling
- Simulate network failure during `pip install` or `npm install`.
- Verify wizard logs the error and exits gracefully with non‑zero status.

## 7. Smoke Test
- `pytest -q` should run all tests and report 0 failures.
```

---

**File: `test/smoke_test.sh`**
```bash
#!/usr/bin/env bash
set -e
# Simple smoke test: run wizard and check exit code
python -m wizard --env .env.example
echo "Smoke test passed: wizard exited with status 0"
```

---

## Test Configuration

If additional pytest configuration is required, create `pytest.ini` in the project root (already exists) or add a `pytest.ini` in `test/` with coverage settings:

**File: `test/pytest.ini`**
```ini
[pytest]
addopts = --cov=wizard --cov-report=term-missing
```

---

## Running the Tests

```bash
TEST_COMMAND: pytest -q
EXPECTED_RESULT: All tests pass, exit code 0
FAILURE_ACTION_ITEMS:
- Verify that the `wizard` module exists and exports the expected functions.
- Ensure all mocked subprocess calls match real command signatures.
- Check that environment files are correctly located and parsed.
- Update tests if new functions are added or signatures change.
- Run `pytest --cov=wizard` to confirm coverage > 80%.
```
