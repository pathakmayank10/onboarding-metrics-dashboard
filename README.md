# Onboarding Metrics Dashboard

Interactive dashboard for tracking onboarding project metrics across regions.

## Features

- **TTGL Tab**: Time to Go Live analysis with SLA compliance tracking
- **Revenue Realisation Tab**: MRR cohort analysis by region
- **OM Performance Tab**: Team performance metrics and leaderboard

## Data Source

Data is pulled from a Google Sheet and refreshed daily at 8:00 AM IST. The dashboard reads from JSON data files:
- `ttgl_data.json`
- `revrec_data.json`
- `om_performance.json`

## Development

```bash
npm install
npm run dev
```

## Build & Deployment

```bash
npm run build
```

Deployed on Netlify. The build process:
1. Compiles TypeScript
2. Bundles with Vite
3. Publishes to Netlify

## Architecture

- React 19 + TypeScript
- Chart.js for visualizations
- Tailwind CSS + DaisyUI for styling
- Data fetched from public JSON files
