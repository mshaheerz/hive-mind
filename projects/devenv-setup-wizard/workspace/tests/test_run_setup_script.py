import subprocess
import sys
from pathlib import Path
from unittest import mock

import pytest

# Import the module under test
from main import run_setup_script, SCRIPT_PATH, LOG_DIR, LOG_FILE  # noqa: E402


@pytest.fixture
def tmp_log_dir(tmp_path):
    """Create a temporary log directory for each test."""
    original_dir = LOG_DIR
    original_file = LOG_FILE
    try:
        # Override the module's LOG_DIR and LOG_FILE to a temp location
        with mock.patch("main.LOG_DIR", tmp_path), mock.patch(
            "main.LOG_FILE", tmp_path / "setup_wizard.log"
        ):
            yield tmp_path
    finally:
        # Restore original values (no-op in this context)
        pass


def test_run_setup_script_success(monkeypatch):
    """Verify that a successful script run returns stdout."""
    def fake_run(*args, **kwargs):
        class Result:
            stdout = "Mocked script output"
        # Ensure the command contains the expected script path and project type
        assert str(SCRIPT_PATH) in args[0]
        assert "python" in args[0]
        return Result()

    monkeypatch.setattr(subprocess, "run", fake_run)

    output = run_setup_script("python")
    assert output == "Mocked script output"


def test_run_setup_script_calledprocess_error(monkeypatch):
    """Verify that a CalledProcessError is translated into RuntimeError."""
    def fake_run(*args, **kwargs):
        raise subprocess.CalledProcessError(
            returncode=2, cmd=args[0], output="", stderr="Simulated failure"
        )

    monkeypatch.setattr(subprocess, "run", fake_run)

    with pytest.raises(RuntimeError, match="Setup script failed: Simulated failure"):
        run_setup_script("nodejs")


def test_run_setup_script_file_not_found(monkeypatch):
    """Verify that FileNotFoundError is translated into RuntimeError."""
    def fake_run(*args, **kwargs):
        raise FileNotFoundError("No such file or directory")

    monkeypatch.setattr(subprocess, "run", fake_run)

    with pytest.raises(RuntimeError, match="Setup script not found."):
        run_setup_script("python")


def test_run_setup_script_unexpected_error(monkeypatch):
    """Verify that any other exception is wrapped in a generic RuntimeError."""
    def fake_run(*args, **kwargs):
        raise ValueError("Unexpected value")

    monkeypatch.setattr(subprocess, "run", fake_run)

    with pytest.raises(RuntimeError, match="Unexpected error during setup."):
        run_setup_script("nodejs")


def test_run_setup_script_logs_created(tmp_log_dir, monkeypatch):
    """Verify that the log file is created during execution."""
    def fake_run(*args, **kwargs):
        class Result:
            stdout = "log test"
        return Result()

    monkeypatch.setattr(subprocess, "run", fake_run)

    # Ensure log file does not exist before
    assert not (tmp_log_dir / "setup_wizard.log").exists()

    run_setup_script("python")

    # Log file should now exist
    log_file = tmp_log_dir / "setup_wizard.log"
    assert log_file.exists()
    # Basic sanity check: file contains at least one line
    assert log_file.read_text().strip()
