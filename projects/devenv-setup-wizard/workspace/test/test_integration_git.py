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
