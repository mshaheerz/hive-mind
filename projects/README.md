# 📁 Projects

This folder contains all Hive Mind projects.

---

## Creating a New Project

### Option A: Human creates it (manual)

1. Create a new folder:
   ```bash
   mkdir projects/my-project-name
   ```

2. Add a `README.md` inside it using the template below

3. Run the pipeline:
   ```bash
   node hive.js run --project my-project-name
   ```

   APEX will review it first. If approved, the full agent pipeline runs automatically.

---

### Option B: AI agent creates it (via NOVA)

NOVA can propose new projects at any time. All AI-proposed projects go through APEX approval before a folder is created.

```bash
node hive.js propose --title "My Project" --desc "What it does" --agent nova
node hive.js review  # APEX evaluates and creates folder if approved
```

**Only APEX can approve project creation.** This is a hard rule — no agent can create a project folder without APEX sign-off.

---

## Project README Template

When you create a project folder, your `README.md` should follow this structure:

```markdown
# Project Title

## What It Does
One paragraph describing the project clearly.

## Problem It Solves
What pain point or need does this address?

## Target Audience
Who will use this?

## Key Features
- Feature 1
- Feature 2
- Feature 3

## Technical Notes (optional)
Any constraints, preferred tech stack, or specific requirements.

## Definition of Done
How will we know when this project is complete?
```

The more detail you provide, the better the agents can do their work.

---

## Project Lifecycle

Each project folder contains:

```
my-project/
├── README.md          ← Your project definition (human-written)
├── status.json        ← Current pipeline stage (auto-managed)
└── output/            ← All agent outputs (auto-created)
    ├── research.md    ← SCOUT's research
    ├── architecture.md ← ATLAS's design
    ├── implementation.md ← FORGE's code
    ├── review.md      ← LENS's code review
    ├── tests.md       ← PULSE's test suite
    ├── docs.md        ← SAGE's documentation
    └── launch.md      ← ECHO's launch content
```

### Pipeline Stages

| Stage | Agent | Description |
|-------|-------|-------------|
| `new` | — | Folder created, awaiting APEX |
| `approved` | APEX | Approved, pipeline can start |
| `research` | SCOUT | Researching technology and approach |
| `architecture` | ATLAS | Designing system architecture |
| `implementation` | FORGE | Writing the code |
| `review` | LENS | Code review (mandatory) |
| `tests` | PULSE | Test suite and QA |
| `docs` | SAGE | Documentation |
| `launch` | ECHO | Social media & announcement content |
| `complete` | — | All stages done |

---

## Resuming a Project

The pipeline is resumable. If it stops at any stage, just run it again:

```bash
node hive.js run --project my-project-name
```

It picks up from where it left off.

---

## APEX Approval Rules

- **All new projects require APEX approval** (human or AI proposed)
- APEX evaluates: Feasibility, Scope, Risk, and Value (each scored 1-10)
- Projects scoring below 5 overall are rejected with written reasoning
- Projects scoring 5-6 get revision requests with specific feedback
- Projects scoring 7+ are approved
- APEX never approves without written reasoning — check `status.json`