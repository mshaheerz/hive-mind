"""
@fileoverview generate_docs.py
Generates a basic OpenAPI specification JSON file for the sample API.
The script can be extended to parse real source code/comments.
"""

import json
from pathlib import Path

# Named constants
OUTPUT_PATH = Path(__file__).parent / "api_data.json"

# Sample OpenAPI spec (kept minimal for demonstration)
SPEC = {
    "openapi": "3.0.2",
    "info": {
        "title": "Sample API",
        "version": "1.0.0",
        "description": "A minimal example API used for demonstrating the documentation generator."
    },
    "paths": {
        "/hello": {
            "get": {
                "summary": "Greeting endpoint",
                "description": "Returns a friendly greeting.",
                "responses": {
                    "200": {
                        "description": "Successful greeting",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "message": {
                                            "type": "string",
                                            "example": "Hello, world!"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}


def main() -> None:
    """Write SPEC to OUTPUT_PATH handling any I/O errors."""
    try:
        OUTPUT_PATH.write_text(json.dumps(SPEC, indent=2))
        print(f"OpenAPI spec written to {OUTPUT_PATH}")
    except OSError as exc:
        print(f"Failed to write OpenAPI spec: {exc}")


if __name__ == "__main__":
    main()
