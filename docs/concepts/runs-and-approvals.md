# Runs and Approvals

Hive Mind uses per-project run artifacts for resumability and auditability.

## Run Artifact Layout

Each stage execution writes to:

```text
projects/<project>/runs/<runId>/
├── proposal.md
├── tasks.md
├── context.json
├── decision.json
├── handoff.json
├── final.md
└── evidence/
```

## Why this exists

- Resume failed/stuck stages without chat history
- Keep clear handoff between agents
- Preserve evidence for debugging and review

## Risk Gate Model

`HIVE_APPROVAL_MODE=risk_based`

- `safe`: auto-approve
- `moderate`: auto-approve with evidence
- `high`: requires APEX approval artifact before execution

## Stage Guardrails

- Backward stage movement is blocked unless explicitly allowed by decision flow
- LENS rejection must include structured action items
- FORGE must map fixes to LENS item IDs (`FIX_MAP`)
