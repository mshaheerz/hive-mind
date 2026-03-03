# Security Policy

## Supported Versions

The project team will focus security efforts on the `main` branch. Older versions are not officially supported.

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0.0 | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability within Hive Mind, please DO NOT report it via a public issue. Instead, report it privately via the project's security reporting channel (e.g., email or security tab on the repository).

We will acknowledge your report within 48 hours and provide a timeline for resolution. Once fixed, we will credit you (unless you prefer to remain anonymous).

---

## 🦾 Autonomous System Security

Hive Mind is an autonomous agent workspace. This presents unique security considerations.

### 🛡️ API Key Safety

- **Never commit `.env` files.** The `.env` file contains sensitive API keys for providers like OpenRouter and Groq.
- The `.gitignore` is pre-configured to exclude `.env`. Ensure this is respected.
- Leaked keys can lead to significant financial loss (API usage costs).

### ⚙️ Safe Execution Environments

- **Agent Control**: Agents can trigger shell commands and write to the filesystem via skills.
- **Sandboxing**: By default, Hive Mind relies on the host OS's isolation. For production usage, it is highly recommended to run Hive Mind inside a Docker container or a dedicated Virtual Machine.
- **LENS & PULSE**: These agents act as automated security/quality gates. Do not disable them. They are designed to catch malicious or dangerous code patterns before they are materialized.

### 🧠 Prompt Injection

- Be aware that user-provided tasks or project descriptions can be used for "Prompt Injection" attacks against the agents.
- Review system prompts in `agents/` to ensure they include strong "guardrail" instructions.

### 🔒 Sensitive Data in Prompts

- Agents send your code and task descriptions to external LLM providers (OpenRouter/Groq).
- **Never incorporate passwords, PII (Personally Identifiable Information), or secrets** in your project READMEs or code files, as these will be sent in the prompt context to external APIs.

## Security Practices for Contributors

- Ensure any new "Skills" validate their inputs thoroughly.
- Avoid using `eval()` or dangerous `child_process` calls without strict validation or sanitization.
- Stay updated with the latest security updates from dependencies like `groq-sdk` or `@openrouter/sdk`.
