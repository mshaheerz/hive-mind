#!/usr/bin/env bash
# =============================================================================
# DevEnv Setup Wizard - Automation Script
#
# This script automates the creation of a development environment for either
# a Python or a Node.js project. It exits immediately on any error (`set -e`)
# and logs each major step to a timestamped file.
# =============================================================================

set -e  # Exit on any command failure

# -------------------------------------------------------------------------
# Constants & Helper Functions
# -------------------------------------------------------------------------
SELECTED_TYPE="${1:-}"                     # The type of project to set up (python|nodejs)
VALID_TYPES=("python" "nodejs")           # Allowed project types

# Determine the directory that holds this script and create a logs folder there
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIRECTORY="${SCRIPT_DIR}/../logs"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
LOG_FILE="${LOG_DIRECTORY}/setup_${TIMESTAMP}.log"

# Ensure the logs directory exists
mkdir -p "${LOG_DIRECTORY}"

log() {
    # Write a timestamped message to both stdout and the log file
    echo "$(date '+%Y-%m-%d %H:%M:%S') $1" | tee -a "${LOG_FILE}"
}

# -------------------------------------------------------------------------
# Input validation
# -------------------------------------------------------------------------
if [[ -z "${SELECTED_TYPE}" ]]; then
    log "Error: No project type supplied."
    echo "Usage: $0 <project_type>"
    exit 1
fi

if [[ ! " ${VALID_TYPES[@]} " =~ " ${SELECTED_TYPE} " ]]; then
    log "Error: Invalid project type '${SELECTED_TYPE}'. Valid options are: ${VALID_TYPES[*]}"
    exit 1
fi

log "Starting setup for project type: ${SELECTED_TYPE}"

# -------------------------------------------------------------------------
# Setup steps per project type
# -------------------------------------------------------------------------
if [[ "${SELECTED_TYPE}" == "python" ]]; then
    log "Creating Python virtual environment..."
    python3 -m venv venv
    log "Activating virtual environment and upgrading pip..."
    source venv/bin/activate
    pip install --upgrade pip
    log "Installing common Python development packages..."
    pip install black flake8 pytest
    deactivate
    log "Python environment setup completed."
elif [[ "${SELECTED_TYPE}" == "nodejs" ]]; then
    log "Initializing npm project..."
    npm init -y
    log "Installing common Node.js development packages..."
    npm install --save-dev eslint prettier jest
    log "Node.js environment setup completed."
fi

log "Setup script finished successfully."
