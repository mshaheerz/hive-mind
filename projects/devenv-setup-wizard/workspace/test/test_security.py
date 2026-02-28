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
