```markdown
# Team Retro Dashboard

A lightweight, self-hosted dashboard for running quick, anonymous team retrospectives. No accounts, no fuss—just create a board, share the link, and start collecting feedback in under 60 seconds.

**Live demo:** https://retro.example.com  
**Docker image:** ghcr.io/your-org/team-retrospective-dashboard

---

## 🚀 Quick Start (5 minutes)

1. **Clone & run**
   ```bash
   git clone https://github.com/your-org/team-retrospective-dashboard.git
   cd team-retrospective-dashboard
   docker compose up -d
   ```

2. **Open the app**  
   http://localhost:3000

3. **Create your first retro**  
   Click “New Board”, share the link with the team, and start dragging cards.

---

## 📖 Usage

1. **Create a board**  
   Give it a name and pick a template (Start-Stop-Continue, Mad-Sad-Glad, or blank).
2. **Share the link**  
   Anyone with the link can add cards—no sign-up required.
3. **Vote & group**  
   Team-mates up-vote topics that matter; drag cards into groups.
4. **Export**  
   One click to CSV or PDF for the meeting notes.

---

## 🛠️ API (for bots & integrations)

Base URL: `http://localhost:3000/api`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/boards` | Create board `{name, template}` |
| GET    | `/boards/:id` | Get board + cards |
| POST   | `/boards/:id/cards` | Add card `{text, column}` |
| PATCH  | `/cards/:id/vote` | +1 vote |

Example (curl):
```bash
curl -X POST http://localhost:3000/api/boards \
  -H "Content-Type: application/json" \
  -d '{"name":"Sprint 23","template":"start-stop-continue"}'
```

Full OpenAPI spec: http://localhost:3000/api/docs

---

## 🧑‍💻 Development

Stack: Node 20 + Express + SQLite + React + Vite  
Zero-config hot-reload included.

```bash
npm install
npm run dev:backend  # http://localhost:4000
npm run dev:frontend # http://localhost:5173
```

Tests:
```bash
npm test        # unit
npm run test:e2e # Cypress
```

---

## 🐳 Self-hosting

Docker Compose (production):
```yaml
services:
  retro:
    image: ghcr.io/your-org/team-retrospective-dashboard:latest
    ports: ["3000:3000"]
    volumes:
      - retro-data:/app/data
volumes:
  retro-data:
```

Environment variables:
| Var | Default | Purpose |
|-----|---------|---------|
| `PORT` | 3000 | HTTP port |
| `DB_PATH` | ./data/retro.db | SQLite file |
| `CORS_ORIGIN` | * | Browser origin whitelist |

---

## 🤝 Contributing

We welcome PRs! Please:

1. Fork & branch (`feature/short-desc`)
2. Add tests for new logic
3. Run `npm run lint` and `npm test`
4. Open a PR with screenshots if UI changes

Small issues are labeled “good first issue”.

---

## 📄 License

MIT © Your Org
```