# Autonomous Flow Audit

Use this when projects appear stuck in loops (e.g. architecture <-> review).

## 1) Check runner and lock

```bash
npm run runner:status
```

If lock is stale and process is dead, restart runner.

## 2) Inspect project status

```bash
cat projects/<project>/status.json
```

Focus on:
- `stage`
- `stageOwner`
- `blockedReason`
- `lensVerdict`
- `lensActionItems`
- `escalationLevel`

## 3) Inspect latest run packet

```bash
ls -1 projects/<project>/runs | tail
```

Open latest:
- `decision.json`
- `handoff.json`
- `final.md`
- `evidence/*`

## 4) Common fixes

- Missing tests: ensure PULSE generated test files + valid test command
- Bad dependency versions: check sanitized `package.json`
- Garbage file blocks (`File:` names): rely on workspace cleanup guard
- Too much idle time: enable strict override for urgent runs:

```bash
HIVE_STRICT_ORDER_OVERRIDE=true node run.js --provider <provider>
```
