import json
import subprocess
import sys
from pathlib import Path
from unittest import mock

import pytest

# Import the module under test
from main import run_setup_script, SCRIPT_PATH  # noqa: E402


@pytest.fixture
def mock_subprocess_run(monkeypatch):
    """Return a fake subprocess.run that records its arguments."""
    calls = []

    def fake_run(*args, **kwargs):
        calls.append((args, kwargs))
        class Result:
            stdout = "Mocked output"
        return Result()

    monkeypatch.setattr(subprocess, "run", fake_run)
    return calls


def test_run_setup_script_with_whitespace_project_type(monkeypatch):
    """Passing whitespace as project_type should still call subprocess."""
    def fake_run(*args, **kwargs):
        class Result:
            stdout = "Whitespace test"
        return Result()

    monkeypatch.setattr(subprocess, "run", fake_run)

    output = run_setup_script("   python   ")
    # The script is called with the raw string; the wrapper does not strip
    assert output == "Whitespace test"


def test_run_setup_script_with_none(monkeypatch):
    """Passing None should raise a TypeError before subprocess is called."""
    with pytest.raises(TypeError):
        run_setup_script(None)  # type: ignore[arg-type]


def test_run_setup_script_with_invalid_type(monkeypatch):
    """Passing an invalid type string still reaches subprocess."""
    def fake_run(*args, **kwargs):
        class Result:
            stdout = "Invalid type handled"
        return Result()

    monkeypatch.setattr(subprocess, "run", fake_run)

    output = run_setup_script("invalid_type")  # type: ignore[arg-type]
    assert output == "Invalid type handled"


def test_run_setup_script_exceptions_propagate(monkeypatch):
    """Ensure that unexpected exceptions are wrapped."""
    def fake_run(*args, **kwargs):
        raise RuntimeError("Low-level error")

    monkeypatch.setattr(subprocess, "run", fake_run)

    with pytest.raises(RuntimeError, match="Unexpected error during setup."):
        run_setup_script("python")
