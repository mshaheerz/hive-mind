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
