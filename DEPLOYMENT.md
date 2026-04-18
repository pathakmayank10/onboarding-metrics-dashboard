# Netlify Deployment Guide

## Option A: Deploy via GitHub (Recommended - Auto-updates JSON daily)

### Step 1: Create GitHub Repository
```bash
# Initialize git in the deploy folder
cd /agent/home/netlify-deploy
git init
git add .
git commit -m "Initial deployment of Urban Piper Onboarding Metrics Dashboard"
git branch -M main
```

Then push to GitHub:
```
git remote add origin https://github.com/YOUR-USERNAME/onboarding-metrics.git
git push -u origin main
```

### Step 2: Connect to Netlify
1. Go to https://netlify.com
2. Click "Add new site" → "Import an existing project"
3. Choose GitHub and select `onboarding-metrics` repo
4. Deploy settings:
   - **Build command**: `echo 'Pre-built deployment'`
   - **Publish directory**: `.`
5. Click "Deploy site"

### Step 3: Set Up Daily Data Refresh
Your Tasklet agent has a daily trigger that runs at **8:00 AM IST** and updates:
- `ttgl_data.json`
- `revrec_data.json`
- `om_performance.json`

**To sync these updates to Netlify daily**, set up a GitHub Actions workflow:

Create `.github/workflows/sync-data.yml`:
```yaml
name: Sync Data Files
on:
  schedule:
    - cron: '30 2 * * *'  # 8:00 AM IST (UTC +5:30) = 2:30 AM UTC
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Download latest data from Tasklet
        run: |
          # Download JSON files from your storage
          curl -o ttgl_data.json YOUR_TASKLET_DATA_URL/ttgl_data.json
          curl -o revrec_data.json YOUR_TASKLET_DATA_URL/revrec_data.json
          curl -o om_performance.json YOUR_TASKLET_DATA_URL/om_performance.json
      
      - name: Commit and push
        run: |
          git config user.name "Data Bot"
          git config user.email "bot@example.com"
          git add *.json
          git commit -m "Auto-update data files at $(date)" || true
          git push
```

---

## Option B: Direct Netlify Upload (Manual)

If you just want to deploy once without GitHub:

1. Go to https://netlify.com/drop
2. Drag the entire `/agent/home/netlify-deploy/` folder onto the page
3. Your site will be live immediately

**Note**: JSON files won't update automatically. You'll need to manually re-upload after each refresh.

---

## File Structure (What Netlify Receives)

```
/
├── index.html          (React app shell)
├── bundle.js           (Compiled React app - 1.2 MB)
├── styles.css          (Styling)
├── ttgl_data.json      (TTGL metrics data)
├── revrec_data.json    (Revenue Realisation data)
├── om_performance.json (OM Performance data)
└── netlify.toml        (Routing & cache config)
```

---

## Data Refresh Flow

**Daily at 8:00 AM IST**:
1. Tasklet trigger fires
2. `dashboard_refresh.md` subagent runs:
   - Fetches all TTGL sheet data
   - Recomputes TTGL, SLA, RevRec, OM metrics
   - Writes 3 JSON files to `/agent/home/`
3. If using GitHub Actions workflow, new data auto-pushes
4. Netlify serves updated files (cache expires after 1 hour)

---

## Testing

After deployment:
- Visit your Netlify site
- Check all 3 tabs: TTGL, Revenue Realisation, OM Performance
- Charts, tables, and cards should display correctly
- "Last refreshed" timestamp should show current date/time

---

## Troubleshooting

**JSON files not loading?**
- Check browser DevTools Console (F12)
- Verify all 4 files are in deploy folder
- Ensure `netlify.toml` is in root

**Charts not rendering?**
- Check that Chart.js CDN is accessible
- Verify JSON structure matches component expectations

**Stale data?**
- Hard refresh (Ctrl+Shift+R) to bypass cache
- Check "Last refreshed" timestamp
- Verify daily trigger is running on schedule
