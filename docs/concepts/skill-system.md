# Skill System

Hive Mind local skills are JS modules under `skills/`.

## Source of Truth

- Primary source: `skills/*.js`
- Generated artifacts:
  - `skills/manifest.json`
  - `skills/README.md`
  - `docs/skills-catalog.md`

## Required Skill Fields

Each skill module must expose:

- `name`
- `version`
- `stage`
- `description`
- `agents[]`
- `params`
- `contract { input[], output[] }`
- `execute(params)`

## Commands

```bash
npm run skills:sync
npm run skills:lint
npm run docs:sync
```

## Runtime Registry

`skills/index.js` auto-loads all `skills/*.js` except `index.js`.
