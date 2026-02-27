"""
Utilities for parsing and writing .env configuration files.
"""

import os
import re
from pathlib import Path
from typing import Dict

# Regular expression for parsing a single .env line
_ENV_LINE_RE = re.compile(r"""
    ^\s*
    (?P<key>[A-Za-z_][A-Za-z0-9_]*)          # key
    \s*=\s*
    (?P<value>                               # value
        (?:'[^']*') |                         # single quoted
        (?:"[^"]*") |                         # double quoted
        [^\s#]+                               # unquoted
    )
    \s*(?:#.*)?$                              # optional comment
""", re.VERBOSE)


def parse_env_file(file_path: Path) -> Dict[str, str]:
    """
    Parse a .env file into a dictionary.

    Parameters
    ----------
    file_path : Path
        Path to the .env file.

    Returns
    -------
    Dict[str, str]
        Mapping of key to value.
    """
    env: Dict[str, str] = {}
    if not file_path.exists():
        return env

    with file_path.open("r", encoding="utf-8") as fh:
        for line in fh:
            match = _ENV_LINE_RE.match(line)
            if match:
                key = match.group("key")
                raw_value = match.group("value")
                # Strip surrounding quotes if present
                if raw_value[0] in ("'", '"') and raw_value[-1] == raw_value[0]:
                    value = raw_value[1:-1]
                else:
                    value = raw_value
                env[key] = value
    return env


def _escape_value(value: str) -> str:
    """
    Escape a value so that it is syntactically valid in a .env file.
    """
    if not value:
        return '""'
    # If the value contains spaces, newlines, #, or quotes, wrap in double quotes
    if any(c in value for c in " \n\t#\"'"):
        escaped = value.replace('"', r'\"')
        return f'"{escaped}"'
    return value


def write_env_file(file_path: Path, data: Dict[str, str]) -> None:
    """
    Atomically write a dictionary to a .env file.

    Parameters
    ----------
    file_path : Path
        Destination .env file.
    data : Dict[str, str]
        Key/value mapping to write.

    Raises
    ------
    RuntimeError
        If the file could not be written.
    """
    tmp_path = file_path.with_suffix(".tmp")
    try:
        with tmp_path.open("w", encoding="utf-8") as fh:
            for key, value in sorted(data.items()):
                fh.write(f"{key}={_escape_value(value)}\n")
        # Atomic replace
        os.replace(tmp_path, file_path)
    except Exception as exc:
        raise RuntimeError(f"Failed to write .env file {file_path}") from exc
