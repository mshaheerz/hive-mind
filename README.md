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
npm install
cp .env.example .env
# Add your OPENROUTER_API_KEY to .env
```

### 2. Run Hive
```bash
node hive.js                        # Start the agent loop
node hive.js --task "build X"       # Give a specific task
node hive.js --agent apex           # Talk to one agent
node hive.js --review               # APEX reviews pending proposals
```

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