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
