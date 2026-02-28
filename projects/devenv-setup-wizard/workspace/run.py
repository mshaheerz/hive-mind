"""
Entry point for running the Flask development server.

Running ``python run.py`` starts the wizard on the host/port defined in
environment variables (or the defaults).
"""

from src.web_server.app import app, DEFAULT_HOST, DEFAULT_PORT

if __name__ == "__main__":
    app.run(host=DEFAULT_HOST, port=DEFAULT_PORT, debug=app.config["DEBUG"])
