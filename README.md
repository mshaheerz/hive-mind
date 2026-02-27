# 🦾 HIVE MIND — Multi-Agent AI Workspace

A self-organizing, multi-agent AI team powered by free OpenRouter models.
9 specialized agents collaborate, propose, review, and ship projects — all from a single repo.

---

## 🧠 The Team

| Agent | Role | Model | Personality |
|-------|------|-------|-------------|
| **APEX** | Operations Head | Nous: Hermes 3 405B | Impartial. Final say on all approvals. Never biased. |
| **SCOUT** | Researcher | Mistral Small 3.1 24B | Curious, thorough, cites sources |
| **FORGE** | Lead Developer | Llama 3.2 3B Instruct | Clean code, comments everything |
| **LENS** | Code Reviewer | Google: Gemma 3 12B | Strict. No bad code ships. |
| **PULSE** | Tester | Google: Gemma 3 4B | Breaks things intentionally |
| **ECHO** | Social Media Head | Mistral Small 3.1 24B | Viral-brained, concise |
| **ATLAS** | Architect | Google: Gemma 3n 4B | Systems thinker, diagrams everything |
| **SAGE** | Documentation | Nous: Hermes 3 405B | Crystal clear, no jargon |
| **NOVA** | Innovation Scout | Google: Gemma 3 12B | Proposes wild ideas that actually work |

---

## 📁 Repo Structure

```
hive-mind/
├── README.md                  ← You are here
├── .env.example               ← API keys config
├── hive.js                    ← Main entry point (run this)
├── agents/                    ← Agent definitions & system prompts
│   ├── apex.js                ← Operations Head (gatekeeper)
│   ├── scout.js               ← Researcher
│   ├── forge.js               ← Developer
│   ├── lens.js                ← Code Reviewer
│   ├── pulse.js               ← Tester
│   ├── echo.js                ← Social Media Head
│   ├── atlas.js               ← Architect
│   ├── sage.js                ← Docs writer
│   └── nova.js                ← Innovation Scout
├── projects/                  ← All projects live here
│   ├── README.md              ← How to create projects
│   └── _template/             ← Copy this to start a new project
│       └── README.md
├── skills/                    ← Reusable agent skills/tools
│   ├── README.md
│   └── web-search.js
├── memory/                    ← Persistent agent memory (JSON)
├── logs/                      ← Full run logs
└── .hive/                     ← Internal config
    ├── config.json
    └── queue.json             ← Pending proposals awaiting APEX approval
```

---

## 🚀 Quick Start

### 1. Install
```bash
npm install               # installs dependencies including the official OpenRouter SDK
cp .env.example .env
# Configure provider in `.env`:
# LLM_PROVIDER=openrouter   # or groq or local
# OPENROUTER_API_KEY=...
# GROQ_API_KEY=...
# LOCAL_LLM_BASE_URL=http://localhost:11434
```
> **Note:** the client code now leverages the official `@openrouter/sdk` package instead of rolling its own HTTP calls. If you already had an older checkout, run `npm install` to pick up the new dependency.


### 2. Run Hive
```bash
node hive.js                        # Start the agent loop
node hive.js --provider groq run    # Force Groq provider for this run
node hive.js --task "build X"       # Give a specific task
node hive.js --agent apex           # Talk to one agent
node hive.js --review               # APEX reviews pending proposals
```

### AI-only (Autonomous) Mode
If you want the agents to run fully autonomously (no human interaction), start the autonomous runner:
```bash
node run.js                          # Start autonomous mode — agents run on a schedule
node run.js --provider groq          # Start autonomous mode on Groq
node run.js --provider local         # Start autonomous mode on local Ollama
```
The runner checks agents every 5 minutes by default and will autonomously propose, review, and advance projects.

### 3. Create a Project (Human)
```bash
cp -r projects/_template projects/my-project-name
# Edit projects/my-project-name/README.md with your project details
node hive.js --project my-project-name   # Agents pick it up
```

---

## 📋 How Projects Work

1. **Human or NOVA creates a project proposal** (fills out README)
2. **APEX reviews** — approves or rejects with reasoning
3. **On approval**, SCOUT researches, ATLAS architects, FORGE builds
4. **LENS reviews code**, PULSE tests, SAGE documents
5. **ECHO drafts launch content** when ready
6. **Agents propose improvements** — all go back through APEX

---

## 🔄 Agent Communication Flow

```
NOVA → proposes ideas
    ↓
SCOUT → researches feasibility
    ↓
APEX → approves/rejects (UNBIASED ALWAYS)
    ↓
ATLAS → designs architecture
    ↓
FORGE → writes code
    ↓
LENS → reviews code (mandatory)
    ↓
PULSE → tests (must pass)
    ↓
SAGE → documents
    ↓
ECHO → announces
```

---

## ⚙️ APEX Rules (Cannot Be Overridden)

- APEX **never approves their own ideas** (they don't propose)
- APEX **requires** LENS review before any code merges
- APEX **requires** PULSE sign-off before any release
- APEX considers: feasibility, scope, resources, risk
- APEX decisions include **full reasoning** (no black boxes)
- APEX can **send back** for revision (not just approve/reject)

---

## 🧩 Adding a New Skill

Create a file in `skills/`:
```javascript
// skills/my-skill.js
module.exports = {
  name: "my-skill",
  description: "What this skill does",
  agents: ["forge", "scout"], // which agents can use it
  execute: async (params) => {
    // implementation
  }
};
```

Then register it in `skills/index.js`.

---

## 📝 Notes

- All agent messages are logged to `logs/`
- Agent memory persists in `memory/` between runs  
- The `.hive/queue.json` tracks all pending APEX decisions
- Models are free via OpenRouter — no cost
- Client uses the **official `@openrouter/sdk`** under the hood for all API interactions

## ⚠️ Troubleshooting: OpenRouter / model errors
If agents fail to call the API you'll see errors in `logs/<date>-autonomous.log`. Common errors and fixes:

- 400 Developer instruction not enabled for model
    - Cause: some provider models (eg. Google Gemma variants) require a `developer instruction` toggle or different prompt format.
    - Fix: switch that agent to a model that supports system prompts, or enable developer instructions in the provider settings. Alternatively set a different model in `core/llm-client.js` or provide your own BYOK in OpenRouter settings.

- 429 Rate-limited
    - Cause: shared free endpoints can be rate-limited upstream.
    - Fix: add your own provider key at https://openrouter.ai/settings/integrations or use a different model to spread quota; the client already retries on 429 with exponential backoff.

- 404 No endpoints found for model
    - Cause: the requested model is not currently available through OpenRouter.
    - Fix: update `AGENT_MODELS` in `core/llm-client.js` to use a currently available model, or add a fallback chain.

If you want help picking stable models for your account, tell me which providers/keys you have and I can update `core/llm-client.js` accordingly.

### Quick model probe & fixes
If agents are failing (rate-limited / no endpoints), run a quick probe to see which models are reachable from your OpenRouter key. The helper scripts also use the SDK so they mirror the behaviour of the agents exactly:

```bash
# fast single-attempt probe (recommended)
npm run test:openrouter:quick
npm run test:groq:quick
npm run test:local:quick

# slower thorough probe with retries (will take longer)
npm run test:openrouter
```

If the probe shows failures like `429`, `404`, or `402` you have two options:

- Add your own provider/integration key at https://openrouter.ai/settings/integrations to increase quota and reduce rate limits.
- Override an agent's model in `.env` to one you know works for your account, e.g.:

```
OPENROUTER_MODEL_NOVA=stepfun/step-3.5-flash:free
OPENROUTER_MODEL_LENS=openai/gpt-oss-120b:free
```

The client will automatically use `OPENROUTER_MODEL_<AGENT>` values when present, so you can tune models without changing code. After editing `.env`, restart the autonomous runner:

```bash
npm run dev:autonomous   # for development (auto-restarts)
# or
node run.js              # start without watcher
```

Provider-aware model overrides:

```
LLM_PROVIDER=groq
GROQ_MODEL_NOVA=groq/compound-mini
MODEL_LENS=openai/gpt-oss-120b        # works across providers
```

### Local provider (Ollama)
1. Install Ollama and start it:
```bash
ollama serve
```
2. Check machine-fit recommendation and installed models:
```bash
npm run local:advisor
```
3. Auto-install the best recommended local model:
```bash
npm run local:install
```
4. Probe all agent model mappings on local endpoint:
```bash
npm run test:local:quick
```

## 🛠 Development: automatic reload for autonomous runner
When developing, edits to `core/` or agent code won't affect a running `node run.js` process — Node doesn't reload code automatically. Use `nodemon` to watch files and restart the runner on change.

Install dev deps and run the watcher:
```bash
npm install --save-dev nodemon
npm run dev:autonomous
```

`dev:autonomous` will restart the autonomous runner when files under `core/`, `agents/`, `.hive/`, or `run.js` change, giving you realtime feedback while editing.
