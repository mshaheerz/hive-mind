#!/usr/bin/env bash
set -e
# Simple smoke test: run wizard and check exit code
python -m wizard --env .env.example
echo "Smoke test passed: wizard exited with status 0"
