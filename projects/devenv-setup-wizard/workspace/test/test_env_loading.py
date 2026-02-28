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
