import React, { useEffect, useRef, useState } from 'react';
import { loadData } from '../utils/dataLoader';

declare const Chart: any;

// ── Types ───────────────────────────────────────────────────────────────────
interface CohortRow {
  month: string; cwValue: number;
  m0: number | null; m1: number | null; m2: number | null; m3: number | null;
  m4: number | null; m5: number | null; m6plus: number | null;
  revRealised: number; pctRealised: number;
}
interface RegionConfig { name: string; currency: string; color: string; cohorts: CohortRow[] }
interface RevRecStore {
  computedAt: string;
  regions: RegionConfig[];
  openPendingMRR: Record<string, { mrr: number; count: number }>;
}

const MILESTONES: { key: keyof CohortRow; label: string }[] = [
  { key: 'm0', label: 'M0' }, { key: 'm1', label: 'M1' }, { key: 'm2', label: 'M2' },
  { key: 'm3', label: 'M3' }, { key: 'm4', label: 'M4' }, { key: 'm5', label: 'M5' }, { key: 'm6plus', label: 'M6+' },
];

function computeTrend(cohorts: CohortRow[]): (number | null)[] {
  const totalCW = cohorts.reduce((s, r) => s + r.cwValue, 0);
  if (!totalCW) return MILESTONES.map(() => null);
  let cumulative = 0;
  return MILESTONES.map(({ key }) => {
    const total = cohorts.reduce((s, r) => { const v = r[key] as number | null; return s + (v ?? 0); }, 0);
    cumulative += total;
    const pct = cumulative / totalCW;
    const hasData = cohorts.some(r => (r[key] as number | null) !== null && (r[key] as number | null)! > 0);
    return hasData ? pct : null;
  });
}

function pctClass(v: number): string {
  if (v >= 0.95) return 'font-bold text-blue-300';
  if (v >= 0.75) return 'font-semibold text-blue-200';
  return 'font-semibold text-white/50';
}
function fmtNum(v: number | null): string {
  if (v === null || v === undefined) return '';
  return Math.round(v).toLocaleString();
}
function fmtPct(v: number): string { return (v * 100).toFixed(1) + '%'; }

const RegionCohortTable: React.FC<{ region: RegionConfig }> = ({ region }) => {
  const trend = computeTrend(region.cohorts);
  return (
    <div style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px' }}>
      <div style={{ padding: '12px 16px', fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#1e3a5f', color: '#ffffff' }}>
        <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: region.color }} />
        Revenue Realisation Efficiency — {region.name} (in {region.currency})
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#0f172a' }}>
              <td style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 500, whiteSpace: 'nowrap', border: '1px solid #334155', color: '#93c5fd', minWidth: '100px' }}>Realisation % trend →</td>
              <td style={{ padding: '8px 12px', textAlign: 'center', border: '1px solid #334155', fontSize: '11px', color: '#4b5563' }}>—</td>
              {trend.map((t, i) => (
                <td key={i} style={{ padding: '8px 12px', textAlign: 'center', border: '1px solid #334155', fontSize: '11px', fontWeight: 600, color: t !== null ? '#93c5fd' : '#4b5563' }}>
                  {t !== null ? fmtPct(t) : '—'}
                </td>
              ))}
              <td style={{ padding: '8px 12px', textAlign: 'center', border: '1px solid #334155', fontSize: '11px', color: '#6b7280' }}>Total</td>
              <td style={{ padding: '8px 12px', textAlign: 'center', border: '1px solid #334155', fontSize: '11px', color: '#6b7280' }}>%</td>
            </tr>
            <tr style={{ backgroundColor: '#1e3a5f' }}>
              <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', border: '1px solid #334155', fontWeight: 700, color: '#ffffff' }}>Month</th>
              <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: '11px', border: '1px solid #334155', fontWeight: 700, color: '#ffffff' }}>CW Value</th>
              {MILESTONES.map(m => <th key={m.label} style={{ padding: '8px 12px', textAlign: 'center', fontSize: '11px', border: '1px solid #334155', fontWeight: 700, color: '#ffffff' }}>{m.label}</th>)}
              <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: '11px', border: '1px solid #334155', fontWeight: 700, color: '#ffffff' }}>Rev Realised</th>
              <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: '11px', border: '1px solid #334155', fontWeight: 700, color: '#ffffff' }}>%-age realised</th>
            </tr>
          </thead>
          <tbody>
            {region.cohorts.map((row, i) => (
              <tr key={row.month} style={{ backgroundColor: i % 2 === 0 ? '#1e293b' : '#162032' }}>
                <td style={{ padding: '8px 12px', fontWeight: 500, border: '1px solid #334155', whiteSpace: 'nowrap', fontSize: '11px', color: '#f1f5f9' }}>{row.month}</td>
                <td style={{ padding: '8px 12px', textAlign: 'center', fontFamily: 'monospace', border: '1px solid #334155', fontSize: '11px', color: '#f1f5f9' }}>{fmtNum(row.cwValue)}</td>
                {(() => {
                  let cumulativeVal = 0;
                  return MILESTONES.map(({ key, label }) => {
                    const v = row[key] as number | null;
                    if (v !== null && v > 0) cumulativeVal += v;
                    const cumulativePct = (cumulativeVal > 0 && row.cwValue > 0) ? (cumulativeVal / row.cwValue) * 100 : null;
                    return (
                      <td key={label} style={{ padding: '8px 12px', textAlign: 'center', fontFamily: 'monospace', border: '1px solid #334155', fontSize: '11px' }}>
                        {v !== null && v > 0
                          ? <div>
                              <span style={{ color: '#cbd5e1' }}>{fmtNum(v)}</span>
                              <div style={{ color: '#64748b', fontSize: '9px', marginTop: '1px' }}>{cumulativePct!.toFixed(1)}%</div>
                            </div>
                          : <span style={{ color: '#475569' }}>—</span>}
                      </td>
                    );
                  });
                })()}
                <td style={{ padding: '8px 12px', textAlign: 'center', fontFamily: 'monospace', border: '1px solid #334155', fontSize: '11px', fontWeight: 600, color: '#f1f5f9' }}>{fmtNum(row.revRealised)}</td>
                <td style={{ padding: '8px 12px', textAlign: 'center', border: '1px solid #334155', fontSize: '11px' }}>
                  <span style={(() => { if (row.pctRealised >= 0.95) return { fontWeight: 700, color: '#93c5fd' }; if (row.pctRealised >= 0.75) return { fontWeight: 600, color: '#60a5fa' }; return { fontWeight: 600, color: '#ffffff', opacity: 0.5 }; })()}>{fmtPct(row.pctRealised)}</span>
                </td>
              </tr>
            ))}
            {(() => {
              const totalCW  = region.cohorts.reduce((s, r) => s + r.cwValue, 0);
              const totalRev = region.cohorts.reduce((s, r) => s + r.revRealised, 0);
              const totalPct = totalCW > 0 ? totalRev / totalCW : 0;
              const mTotals  = MILESTONES.map(({ key }) => region.cohorts.reduce((s, r) => s + ((r[key] as number | null) ?? 0), 0));
              return (
                <tr style={{ backgroundColor: '#172554' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 700, border: '1px solid #334155', fontSize: '11px', color: '#ffffff' }}>Total</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 700, border: '1px solid #334155', fontSize: '11px', color: '#ffffff' }}>{fmtNum(totalCW)}</td>
                  {(() => {
                    let cumTotals = 0;
                    return mTotals.map((t, i) => {
                      if (t > 0) cumTotals += t;
                      const pct = (cumTotals > 0 && totalCW > 0) ? (cumTotals / totalCW) * 100 : null;
                      return (
                        <td key={i} style={{ padding: '8px 12px', textAlign: 'center', fontFamily: 'monospace', border: '1px solid #334155', fontSize: '11px', color: t > 0 ? '#93c5fd' : '#475569' }}>
                          {t > 0 ? <div><span>{fmtNum(t)}</span><div style={{ color: '#6b7280', fontSize: '9px', marginTop: '1px' }}>{pct!.toFixed(1)}%</div></div> : '—'}
                        </td>
                      );
                    });
                  })()}
                  <td style={{ padding: '8px 12px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 700, border: '1px solid #334155', fontSize: '11px', color: '#ffffff' }}>{fmtNum(totalRev)}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', border: '1px solid #334155', fontSize: '11px' }}>
                    <span style={(() => { if (totalPct >= 0.95) return { fontWeight: 700, color: '#93c5fd' }; if (totalPct >= 0.75) return { fontWeight: 600, color: '#60a5fa' }; return { fontWeight: 600, color: '#ffffff', opacity: 0.5 }; })()}>{fmtPct(totalPct)}</span>
                  </td>
                </tr>
              );
            })()}
          </tbody>
        </table>
      </div>
      <div style={{ padding: '12px 16px', display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '11px', borderTop: '1px solid #334155', backgroundColor: '#0f172a', color: '#94a3b8' }}>
        <span>M0 = went live same month as CW</span><span>•</span>
        <span>M1 = went live following month</span><span>•</span>
        <span>Goal: 95%+ by M1</span>
        <span style={{ marginLeft: 'auto' }}>
          <span style={{ color: '#93c5fd', fontWeight: 700 }}>Blue</span> ≥95% &nbsp;
          <span style={{ color: '#60a5fa', fontWeight: 700 }}>Lt.Blue</span> 75–94% &nbsp;
          <span style={{ color: '#ffffff', opacity: 0.5, fontWeight: 700 }}>Grey</span> &lt;75%
        </span>
      </div>
    </div>
  );
};

const EfficiencyChart: React.FC<{ regions: RegionConfig[] }> = ({ regions }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInst = useRef<any>(null);
  const allMonths = ['Apr 2025','May 2025','Jun 2025','Jul 2025','Aug 2025','Sep 2025','Oct 2025','Nov 2025','Dec 2025','Jan 2026','Feb 2026','Mar 2026','Apr 2026'];

  useEffect(() => {
    if (!chartRef.current) return;
    if (chartInst.current) chartInst.current.destroy();
    chartInst.current = new Chart(chartRef.current, {
      type: 'bar',
      data: {
        labels: allMonths,
        datasets: regions.map(r => ({
          label: r.name,
          data: allMonths.map(m => { const c = r.cohorts.find(c => c.month === m); return c ? +(c.pctRealised * 100).toFixed(1) : null; }),
          backgroundColor: r.color + '77', borderColor: r.color, borderWidth: 2,
        })),
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#9ca3af', font: { size: 11 } } },
          tooltip: { callbacks: { label: (ctx: any) => ctx.raw != null ? `${ctx.dataset.label}: ${ctx.raw}%` : `${ctx.dataset.label}: N/A` } },
        },
        scales: {
          x: { ticks: { color: '#9ca3af' }, grid: { color: '#374151' } },
          y: { min: 0, max: 110, ticks: { color: '#9ca3af', callback: (v: any) => `${v}%` }, grid: { color: '#374151' } },
        },
      },
    });
    return () => { if (chartInst.current) chartInst.current.destroy(); };
  }, [regions]);

  return (
    <div style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '16px' }}>
      <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#f1f5f9' }}>Realisation Efficiency by Region &amp; Month (%)</div>
      <div style={{ height: '200px' }}><canvas ref={chartRef} /></div>
    </div>
  );
};

export const RevRecSection: React.FC = () => {
  const [store, setStore] = useState<RevRecStore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData('revrec_data.json')
      .then((data: RevRecStore) => {
        setStore(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: '#94a3b8', padding: '40px', textAlign: 'center' }}>Loading Revenue data…</div>;
  if (!store) return <div style={{ color: '#ef4444', padding: '40px', textAlign: 'center' }}>Failed to load data.</div>;

  const { regions, openPendingMRR } = store;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '11px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#94a3b8' }}>
        📊 Source: TTGL sheet · MRR values in USD (converted) · Cohort = month project was created · Only &quot;Closed Live&quot; projects count towards realisation
        <span style={{ marginLeft: '12px', color: '#475569' }}>Last refreshed: {store.computedAt}</span>
      </div>

      {/* Pending MRR cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {regions.map(r => {
          const totalRev = r.cohorts.reduce((s, c) => s + c.revRealised, 0);
          const pending  = openPendingMRR[r.name]?.mrr ?? 0;
          const openCnt  = openPendingMRR[r.name]?.count ?? 0;
          const pct      = (pending + totalRev) > 0 ? (totalRev / (totalRev + pending)) * 100 : 0;
          return (
            <div key={r.name} style={{ backgroundColor: '#1e293b', border: `2px solid ${r.color}`, borderRadius: '10px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: r.color, display: 'inline-block' }} />
                <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{r.name}</span>
              </div>
              <div style={{ color: '#f8fafc', fontSize: '22px', fontWeight: 800, fontFamily: 'monospace', marginBottom: '2px' }}>${pending.toLocaleString()}</div>
              <div style={{ color: '#64748b', fontSize: '11px', marginBottom: '2px' }}>Pending MRR · Open only (USD)</div>
              <div style={{ color: '#94a3b8', fontSize: '10px', marginBottom: '6px' }}>{openCnt} open project{openCnt !== 1 ? 's' : ''}</div>
              <div style={{ backgroundColor: '#0f172a', borderRadius: '4px', height: '5px', overflow: 'hidden', marginBottom: '6px' }}>
                <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', backgroundColor: r.color, transition: 'width 0.5s' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b' }}>
                <span>Realised: <span style={{ color: '#cbd5e1', fontWeight: 600 }}>${totalRev.toLocaleString()}</span></span>
                <span style={{ color: pct >= 75 ? r.color : '#ef4444', fontWeight: 700 }}>{pct.toFixed(1)}% realised</span>
              </div>
            </div>
          );
        })}
      </div>

      <EfficiencyChart regions={regions} />
      {regions.map(r => <RegionCohortTable key={r.name} region={r} />)}
    </div>
  );
};
