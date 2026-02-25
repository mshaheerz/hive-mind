# 🧩 Skills

Skills are reusable tools that agents can call during their work.
Think of them as plugins — any agent can use any skill it has access to.

---

## Available Skills

| Skill | File | Agents | Description |
|-------|------|--------|-------------|
| web-search | `web-search.js` | scout, nova | Search the web for information |
| file-writer | `file-writer.js` | forge, sage | Write files to disk |
| code-runner | `code-runner.js` | forge, pulse | Execute code in a sandbox |

---

## Creating a New Skill

```javascript
// skills/my-skill.js
module.exports = {
  name: "my-skill",
  version: "1.0.0",
  description: "What this skill does in one sentence",
  agents: ["forge", "scout"],    // Which agents can use it
  params: {                       // Parameters it accepts
    query: { type: "string", required: true, description: "The input" },
    limit: { type: "number", required: false, default: 10 },
  },

  async execute(params) {
    // Your implementation here
    // Must return: { success: boolean, result: any, error?: string }
    try {
      const result = await doSomething(params.query);
      return { success: true, result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
};
```

Then register it in `skills/index.js`:
```javascript
module.exports = {
  'my-skill': require('./my-skill'),
  // ...
};
```

---

## Skill Guidelines

- Skills should be **stateless** when possible
- Skills should **not** call other agents (that's the orchestrator's job)
- Skills should **always** return `{ success, result, error }` shape
- Skills should **handle their own errors** gracefully
- Keep skills **focused** — one job per skill

---

## Agent + Skill Access Matrix

| Skill | APEX | SCOUT | FORGE | LENS | PULSE | ECHO | ATLAS | SAGE | NOVA |
|-------|------|-------|-------|------|-------|------|-------|------|------|
| web-search | ✅ | ✅ | — | — | — | ✅ | ✅ | — | ✅ |
| file-writer | — | — | ✅ | — | — | — | — | ✅ | — |
| code-runner | — | — | ✅ | ✅ | ✅ | — | — | — | — |