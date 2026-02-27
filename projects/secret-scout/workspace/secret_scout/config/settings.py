"""
config.settings
================

Global constants used throughout the project.  Keeping them in a single
module makes it easy to adjust detection behaviour without touching the
core logic.
"""

from pathlib import Path
from typing import Final, Dict, Pattern
import re

# --------------------------------------------------------------------------- #
# Directory constants
# --------------------------------------------------------------------------- #
PROJECT_ROOT: Final[Path] = Path(__file__).resolve().parents[1]

# --------------------------------------------------------------------------- #
# Secret detection patterns
# --------------------------------------------------------------------------- #
# Each entry maps a human‑readable name to a compiled regular expression.
# The patterns aim for a good balance between detection rate and false‑positives.
SECRET_PATTERNS: Final[Dict[str, Pattern]] = {
    # AWS Access Key ID – 20 characters, starts with AKIA, ASIA, etc.
    "AWS_ACCESS_KEY": re.compile(r"AKIA[0-9A-Z]{16}"),
    # AWS Secret Access Key – 40 base64‑like characters
    "AWS_SECRET_KEY": re.compile(r"(?i)aws_secret_access_key[^\\w]*([0-9a-zA-Z/+]{40})"),
    # Generic API key – 32+ alphanumeric characters, often with hyphens/underscores
    "GENERIC_API_KEY": re.compile(r"[A-Za-z0-9]{32,}"),
    # Slack token – starts with xoxb‑ or xoxp‑
    "SLACK_TOKEN": re.compile(r"xox[bp]-(?:[0-9a-zA-Z]{10,48})"),
    # Private RSA key header (simple heuristic)
    "RSA_PRIVATE_KEY": re.compile(r"-----BEGIN RSA PRIVATE KEY-----"),
    # Password assignment in code (e.g., password = "secret")
    "PASSWORD_ASSIGN": re.compile(r"""(?i)(?:password|pwd|secret)\s*=\s*["']([^"']{4,})["']"""),
}

# --------------------------------------------------------------------------- #
# Severity mapping – higher number = more severe
# --------------------------------------------------------------------------- #
SEVERITY_LEVELS: Final[Dict[str, int]] = {
    "RSA_PRIVATE_KEY": 5,      # Critical – private key exposed
    "AWS_SECRET_KEY": 4,       # High – full secret key
    "AWS_ACCESS_KEY": 3,       # Medium – can be combined with secret key
    "SLACK_TOKEN": 4,
    "GENERIC_API_KEY": 2,
    "PASSWORD_ASSIGN": 2,
}
