"""
Utilities for parsing and writing .env configuration files.
"""

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
                if raw_value.startswith(("'", '"')) and raw_value.endswith(("'", '"')):
                    value = raw_value[1:-1]
                else:
                    value = raw_value
                env[key] = value
    return env


def write_env_file(env: Dict[str, str], file_path: Path) -> None:
    """
    Write a dictionary to a .env file.

    Parameters
    ----------
    env : Dict[str, str]
        Mapping of key to value.
    file_path : Path
        Path to the .env file to write.
    """
    lines = [f"{key}={value}" for key, value in env.items()]
    content = "\n".join(lines) + "\n"
    try:
        file_path.write_text(content, encoding="utf-8")
    except OSError as exc:
        raise RuntimeError(f"Failed to write .env file {file_path}") from exc
