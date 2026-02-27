# Quick Start

## 1) Install

```bash
npm install
cp .env.example .env
```

Set provider/env values in `.env`.

## 2) Start Runner

```bash
node run.js --provider openrouter
# or
node run.js --provider groq
# or
node run.js --provider local
```

## 3) Check Runtime Health

```bash
npm run runner:status
```

## 4) Web Dashboard

```bash
npm run web:dev
```

Open `http://localhost:3000`.

## 5) Stop Runner

- In runner terminal: `Ctrl+C`
- Verify stopped:

```bash
npm run runner:status
```

## 6) Keep Skills Catalog Updated

```bash
npm run skills:sync
npm run skills:lint
npm run docs:sync
```
