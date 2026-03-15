```markdown
<!-- README.md – cloud-cost-overview-card-set -->
<!-- 5-min quick-start, scannable, WHY over HOW, zero jargon -->

# ☁️ Cloud Cost Overview Card Set

Instant, copy-paste React cards that show **how much you spend on AWS, GCP and Azure today**—no heavy dashboards, no auth tokens, no learning curve.

## Why?

Engineering teams lose hours hunting for a simple “What did we spend this month?” number.  
These cards call the native Cost APIs, format the result, and look good in any React app.  
Copy → Paste → Ship in minutes.

## Quick Start (5 min)

1. Install
   ```bash
   npm i cloud-cost-overview-card-set
   ```

2. Add your read-only credentials (we only read, never write)
   ```bash
   # .env.local
   AWS_ACCESS_KEY_ID=AK…
   GCP_BILLING_PROJECT_ID=my-project
   AZURE_TENANT_ID=…
   ```

3. Drop a card anywhere
   ```jsx
   import { AwsCostCard } from 'cloud-cost-overview-card-set'

   function App() {
     return <AwsCostCard currency="USD" />
   }
   ```

4. Open your app → you’ll see today’s spend in plain English.

That’s it. No backend, no tokens, no 200 MB bundle.

## What’s Inside

| Card          | Size (gzip) | API call              | Auto-refresh |
|---------------|------------|-----------------------|-------------|
| `AwsCostCard`   | 4 kB       | AWS Cost Explorer     | every 10 min |
| `GcpCostCard`   | 4 kB       | GCP Cloud Billing API | every 10 min |
| `AzureCostCard` | 4 kB       | Azure Consumption API | every 10 min |

All cards share the same props:
```ts
currency?: 'USD' | 'EUR' | 'JPY'  // default USD
className?: string                 // tailwind or your own CSS
```

## Examples

### 1. One card
```jsx
<GcpCostCard currency="EUR" className="shadow-xl" />
```

### 2. All three in a grid
```jsx
<div className="grid grid-cols-3 gap-4">
  <AwsCostCard />
  <GcpCostCard />
  <AzureCostCard />
</div>
```

### 3. Dark mode
Cards automatically use `prefers-color-scheme`.  
Force dark with:
```jsx
<AwsCostCard className="dark" />
```

## Troubleshooting

| Symptom              | Fix |
|----------------------|-----|
| “No data”            | Check that billing is enabled on the account |
| “Access denied”      | Ensure the IAM role has `ce:GetCostAndUsage` (AWS), `billing.accounts.get` (GCP), or `Microsoft.Consumption/usageDetails/read` (Azure) |
| Numbers look wrong   | All costs are in **today’s UTC day**. If you just enabled billing, wait up to 24 h for first datapoint |

## Contributing

We ❤️ small PRs. Clone, branch, push:

```bash
git clone https://github.com/your-org/cloud-cost-overview-card-set.git
npm i
npm run dev   # hot-reload demo at localhost:3000
```

Please update tests and docs. CI runs on Node 20.

## Roadmap

- [ ] Multi-month sparkline toggle  
- [ ] Kubernetes namespace cost card  
- [ ] Vue & Svelte ports (open issue if you want them)

## License

MIT. Use at work, in products, wherever—just keep the copyright line.

---

Made with ☕ by engineers who hate surprise cloud bills.
```