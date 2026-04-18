# Urban Piper Onboarding Metrics Dashboard

Production-ready React dashboard with 3 tabs:
- **TTGL Tab**: Time to Go Live metrics, SLA compliance, project ageing
- **Revenue Realisation Tab**: Region-specific revenue cohort tables
- **OM Performance Tab**: Onboarding Manager leaderboard + monthly trends

## Quick Start (60 seconds)

### Option 1: Drag & Drop to Netlify (Fastest)
1. Go to https://netlify.com/drop
2. Drag this entire folder onto the page
3. **Done!** You get a live URL instantly

### Option 2: Connect GitHub + Auto-Updates (Recommended)
Follow detailed instructions in `DEPLOYMENT.md`

---

## Features

✅ **Real-time Data**: JSON files auto-refresh daily at 8 AM IST  
✅ **3 Interactive Dashboards**: All features from React app  
✅ **Dark Theme**: Navy/slate/white color scheme  
✅ **Responsive Design**: Works on desktop and tablet  
✅ **Fast Performance**: <1MB gzipped React bundle  

---

## Files Included

| File | Purpose | Size |
|------|---------|------|
| `index.html` | React app shell | 2.8 KB |
| `bundle.js` | Compiled React (all components) | 1.2 MB |
| `styles.css` | Custom styling | 121 B |
| `ttgl_data.json` | TTGL metrics (updated daily) | 16 KB |
| `revrec_data.json` | Revenue Realisation data (updated daily) | 15 KB |
| `om_performance.json` | OM leaderboard data (updated daily) | 121 KB |
| `netlify.toml` | Routing & cache configuration | - |

---

## Data Refresh

**Automatic daily at 8:00 AM IST** (via Tasklet scheduled trigger):
- Fetches latest data from Google Sheet
- Recomputes all metrics (TTGL, SLA, RevRec, OM Performance)
- Updates all 3 JSON files
- Changes reflected on Netlify within 1 hour (cache expires)

---

## Need Help?

See `DEPLOYMENT.md` for:
- GitHub setup with auto-updates
- Troubleshooting chart rendering
- Manual data refresh instructions
- Performance tuning
