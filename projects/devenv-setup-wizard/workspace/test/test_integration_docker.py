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
