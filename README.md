# 🦾 HIVE MIND — Multi-Agent AI Workspace

A self-organizing multi-agent AI team with provider routing (`openrouter`, `groq`, `local` via Ollama).
9 specialized agents collaborate, propose, review, test, and ship projects from one repo.

---

## 🧠 The Team

| Agent | Role |
|-------|------|
| **APEX** | Operations Head (approval + strict execution control) |
| **NOVA** | Innovation Scout (new ideas) |
| **SCOUT** | Researcher (validation + feasibility) |
| **ATLAS** | Architect (system design + stack/template decisions) |
| **FORGE** | Developer (implementation + file materialization) |
| **LENS** | Code Reviewer (quality gate) |
| **PULSE** | Tester (test generation + execution gate) |
| **SAGE** | Documentation |
| **ECHO** | Launch/Social content |

Agent models are provider-specific and configured in [llm-client.js](./core/llm-client.js) with fallback chains.

---

## 📁 Repo Structure

```
hive-mind/
├── README.md                  ← You are here
├── .env.example               ← API keys config
├── hive.js                    ← Main CLI entry point
├── run.js                     ← Autonomous runner (cycle loop)
├── agents/                    ← Agent definitions & system prompts
│   ├── apex.js                ← APEX
│   ├── nova.js                ← NOVA
│   └── agents.js              ← SCOUT/FORGE/LENS/PULSE/ECHO/ATLAS/SAGE
├── core/
│   ├── llm-client.js          ← Multi-provider client + fallbacks
│   └── autonomous.js          ← schedules/deadlines/state
├── projects/                  ← All projects live here
│   ├── README.md              ← How to create projects
│   └── _template/             ← Copy this to start a new project
│       └── README.md
├── scripts/                   ← Operational scripts (status/probes/local advisor)
├── skills/                    ← Reusable skill modules
├── memory/                    ← Persistent agent memory (JSON)
├── logs/                      ← Full run logs
└── .hive/                     ← Internal config
    ├── queue.json             ← Proposal queue
    ├── deadlines.json         ← Stage deadlines
    └── runner.lock.json       ← active runner lock
```

---

## 🚀 Quick Start

### 1. Install
```bash
npm install               # installs dependencies (OpenRouter SDK + Groq SDK, etc.)
cp .env.example .env
# Configure provider in `.env`:
# LLM_PROVIDER=openrouter   # or groq or local
# OPENROUTER_API_KEY=...
# GROQ_API_KEY=...
# LOCAL_LLM_BASE_URL=http://localhost:11434
```
> For local provider, Ollama must be running separately (`ollama serve`).


### 2. Run Hive
```bash
node hive.js                        # Start the agent loop
node hive.js --provider groq run    # Force Groq provider for this run
node hive.js --provider local run   # Force local (Ollama) provider
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
The runner checks on a 5-minute interval. It also enforces:
- capacity gate (`HIVE_MAX_ACTIVE_PROJECTS`, default `2`, prioritized oldest projects)
- strict wake for blocked stage owners
- non-overlapping cycles (next interval skips if previous cycle is still running)
- per-project run artifacts in `projects/<name>/runs/<runId>/` (`proposal.md`, `tasks.md`, `context.json`, `decision.json`, `handoff.json`, `evidence/*`)

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
4. **Workspace bootstrap first** (Next.js/Vite/npm/python init attempts)
5. **FORGE writes code**, materialized into `projects/<name>/workspace/*`
6. **LENS reviews**, **PULSE generates+executes tests**, then SAGE docs
7. **ECHO drafts launch content** when ready
8. **Agents propose improvements** — all go back through APEX

Each project keeps markdown artifacts in `projects/<name>/output/*.md`, but actual runnable code is written into `projects/<name>/workspace/`.
Each stage execution also writes a run packet under `projects/<name>/runs/` for resumability and audit trails.

### Status schema additions
`projects/<name>/status.json` now tracks:
- `stageOwner`, `stageAttempt`
- `blockedReason`
- `lensVerdict` + structured `lensActionItems[]`
- `lastHandoffRunId`
- `escalationLevel`

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
- Provider support:
  - `openrouter` via `@openrouter/sdk`
  - `groq` via `groq-sdk`
  - `local` via Ollama HTTP API (`/api/chat`)
- Fallback behavior:
- Per-agent default model map per provider
- Provider fallback chain on transient/model availability errors
- Workspace dependency guard auto-fixes known invalid generated versions (e.g. `@tailwindcss/aspect-ratio` -> `^0.4.2`) before `npm install` during PULSE stage
- Useful ops commands:
  - `npm run runner:status`
  - `npm run test:openrouter:quick`
  - `npm run test:groq:quick`
  - `npm run test:local:quick`
  - `npm run local:advisor`
  - `npm run local:install`

## ⚠️ Troubleshooting: Provider / model errors
If agents fail to call models, check `logs/<date>-autonomous.log`.
Common fixes:

- 400 Developer instruction not enabled for model
    - Cause: some provider models (eg. Google Gemma variants) require a `developer instruction` toggle or different prompt format.
    - Fix: switch that agent to a model that supports system prompts, or enable developer instructions in the provider settings. Alternatively set a different model in `core/llm-client.js` or provide your own BYOK in OpenRouter settings.

- 429 Rate-limited
    - Cause: shared free endpoints can be rate-limited upstream.
    - Fix: add your own provider key at https://openrouter.ai/settings/integrations or use a different model to spread quota; the client already retries on 429 with exponential backoff.

- `fetch failed` (especially on `local`)
    - Cause: Ollama unavailable, overloaded, or request overlap from long runs.
    - Fix: ensure `ollama serve` is active, keep one runner process, use smaller local models, and verify with `npm run test:local:quick`.

- 404 No endpoints found for model (OpenRouter/Groq routes)
    - Cause: model unavailable on selected provider.
    - Fix: update provider model map/fallbacks in `core/llm-client.js`, or set env overrides.

Model overrides (examples):
```
LLM_PROVIDER=groq
GROQ_MODEL_NOVA=groq/compound-mini
MODEL_LENS=openai/gpt-oss-120b

LLM_PROVIDER=local
LOCAL_MODEL_FORGE=qwen2.5-coder:3b-instruct
LOCAL_MODEL_LENS=qwen2.5-coder:3b-instruct
```

Autonomous governance envs:
```bash
HIVE_APPROVAL_MODE=risk_based
HIVE_ESCALATION_REJECT_THRESHOLD=3
HIVE_RUNS_RETENTION_DAYS=30
HIVE_MAX_ACTIVE_PROJECTS=2
HIVE_STRICT_ORDER_OVERRIDE=false
```

### Quick model probe & fixes
Run quick probes to validate configured models:

```bash
# fast single-attempt probe (recommended)
npm run test:openrouter:quick
npm run test:groq:quick
npm run test:local:quick

# slower thorough probe with retries (will take longer)
npm run test:openrouter
```

After changing `.env` models/provider, restart runner:
```bash
pkill -f "^node run.js"
node run.js --provider <openrouter|groq|local>
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
