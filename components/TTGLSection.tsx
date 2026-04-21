import React, { useEffect, useRef, useState } from 'react';
import { loadData } from '../utils/dataLoader';

declare const Chart: any;

// ── Types ────────────────────────────────────────────────────────────────────
interface SLACell { total: number; withinSLA: number; slaPct: number }
interface AgeingRow { region: string; total: number; gt7: number; gt14: number; gt28: number; gt60: number }
interface TTGLStore {
  computedAt: string;
  months: string[];
  ttglData: { region: string; months: Record<string, number | null> }[];
  liveCount: { region: string; months: Record<string, number> }[];
  openAgeData: { region: string; months: Record<string, number | null> }[];
  openCount: { region: string; months: Record<string, number> }[];
  totalCount: { region: string; months: Record<string, number> }[];
  droppedCount: { region: string; months: Record<string, number> }[];
  slaData: { region: string; months: Record<string, SLACell | null> }[];
  slaOverall: Record<string, { total: number; withinSLA: number; slaPct: number; avgTTGL: number }>;
  ageingData: AgeingRow[];
}

const REGION_COLORS: Record<string, string> = {
  INDIA: '#60a5fa', MEENA: '#93c5fd', UK: '#3b82f6', US: '#1d4ed8',
};

function getBadgeStyle(days: number | null): React.CSSProperties {
  if (days === null) return { backgroundColor: '#334155', color: '#94a3b8', borderRadius: '9999px', padding: '2px 8px', fontSize: '11px' };
  if (days <= 10)   return { backgroundColor: '#14532d', color: '#86efac', borderRadius: '9999px', padding: '2px 8px', fontSize: '11px' };
  if (days <= 20)   return { backgroundColor: '#422006', color: '#fcd34d', borderRadius: '9999px', padding: '2px 8px', fontSize: '11px' };
  return                   { backgroundColor: '#450a0a', color: '#fca5a5', borderRadius: '9999px', padding: '2px 8px', fontSize: '11px' };
}

const cardStyle: React.CSSProperties = { backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '16px' };
const thStyle: React.CSSProperties = { backgroundColor: '#1e3a5f', color: '#ffffff', padding: '6px 8px', textAlign: 'center', fontSize: '11px', fontWeight: 600, border: '1px solid #334155' };
const thLeftStyle: React.CSSProperties = { ...thStyle, textAlign: 'left' };

function getSLABadgeStyle(pct: number): React.CSSProperties {
  if (pct >= 75) return { backgroundColor: '#14532d', color: '#86efac', borderRadius: '9999px', padding: '2px 8px', fontSize: '11px', fontWeight: 600 };
  if (pct >= 50) return { backgroundColor: '#422006', color: '#fcd34d', borderRadius: '9999px', padding: '2px 8px', fontSize: '11px', fontWeight: 600 };
  return               { backgroundColor: '#450a0a', color: '#fca5a5', borderRadius: '9999px', padding: '2px 8px', fontSize: '11px', fontWeight: 600 };
}

export const TTGLSection: React.FC = () => {
  const [store, setStore] = useState<TTGLStore | null>(null);
  const [loading, setLoading] = useState(true);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);
  const slaChartRef = useRef<HTMLCanvasElement>(null);
  const slaChartInstance = useRef<any>(null);

  useEffect(() => {
    loadData('ttgl_data.json')
      .then((data: TTGLStore) => {
        setStore(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!store || !chartRef.current) return;
    if (chartInstance.current) chartInstance.current.destroy();
    const { months, ttglData } = store;
    const datasets = ttglData.map((row) => ({
      label: row.region,
      data: months.map((m) => row.months[m] ?? null),
      backgroundColor: REGION_COLORS[row.region] + '33',
      borderColor: REGION_COLORS[row.region],
      borderWidth: 2, pointRadius: 4, pointHoverRadius: 6, tension: 0.3, spanGaps: false,
    }));
    datasets.push({ label: 'Target (14 days)', data: months.map(() => 14), backgroundColor: 'transparent', borderColor: '#ef4444', borderWidth: 1.5, pointRadius: 0, pointHoverRadius: 0, tension: 0, spanGaps: true } as any);
    chartInstance.current = new Chart(chartRef.current, {
      type: 'line',
      data: { labels: months, datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#cbd5e1', font: { size: 12 } } },
          tooltip: { callbacks: { label: (ctx: any) => ctx.raw != null ? `${ctx.dataset.label}: ${ctx.raw.toFixed(1)} days` : `${ctx.dataset.label}: N/A` } },
        },
        scales: {
          x: { ticks: { color: '#94a3b8', maxRotation: 45, font: { size: 10 } }, grid: { color: '#1e293b' } },
          y: { ticks: { color: '#94a3b8', callback: (v: any) => `${v}d` }, grid: { color: '#1e293b' }, title: { display: true, text: 'Avg Days to Go Live', color: '#94a3b8' } },
        },
      },
    });
    return () => { if (chartInstance.current) chartInstance.current.destroy(); };
  }, [store]);

  useEffect(() => {
    if (!store || !slaChartRef.current) return;
    if (slaChartInstance.current) slaChartInstance.current.destroy();
    const { months, slaData } = store;
    const slaDatasets = slaData.map((row) => ({
      label: row.region,
      data: months.map((m) => row.months[m]?.slaPct ?? null),
      backgroundColor: REGION_COLORS[row.region] + '33',
      borderColor: REGION_COLORS[row.region],
      borderWidth: 2, pointRadius: 4, pointHoverRadius: 6, tension: 0.3, spanGaps: false,
    }));
    slaDatasets.push({ label: 'SLA Target (100%)', data: months.map(() => 100), backgroundColor: 'transparent', borderColor: '#ef4444', borderWidth: 1.5, pointRadius: 0, pointHoverRadius: 0, tension: 0, spanGaps: true } as any);
    slaChartInstance.current = new Chart(slaChartRef.current, {
      type: 'line',
      data: { labels: months, datasets: slaDatasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#cbd5e1', font: { size: 12 } } },
          tooltip: { callbacks: { label: (ctx: any) => ctx.raw != null ? `${ctx.dataset.label}: ${ctx.raw.toFixed(1)}%` : `${ctx.dataset.label}: N/A` } },
        },
        scales: {
          x: { ticks: { color: '#94a3b8', maxRotation: 45, font: { size: 10 } }, grid: { color: '#1e293b' } },
          y: { min: 0, max: 105, ticks: { color: '#94a3b8', callback: (v: any) => `${v}%` }, grid: { color: '#1e293b' }, title: { display: true, text: '% Within 14-Day SLA', color: '#94a3b8' } },
        },
      },
    });
    return () => { if (slaChartInstance.current) slaChartInstance.current.destroy(); };
  }, [store]);

  if (loading) return <div style={{ color: '#94a3b8', padding: '40px', textAlign: 'center' }}>Loading TTGL data…</div>;
  if (!store) return <div style={{ color: '#ef4444', padding: '40px', textAlign: 'center' }}>Failed to load data.</div>;

  const { months, ttglData, liveCount, openAgeData, openCount, totalCount, droppedCount, slaData, slaOverall, ageingData } = store;

  return (
    <div className="space-y-6">
      {/* Last updated */}
      <div style={{ fontSize: '10px', color: '#475569', textAlign: 'right' }}>Last refreshed: {store.computedAt}</div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3">
        {ttglData.map((row) => {
          const vals = months.map((m) => row.months[m]).filter((v) => v != null) as number[];
          const latest = vals[vals.length - 1];
          const prev = vals.length > 1 ? vals[vals.length - 2] : null;
          const trend = prev != null ? latest - prev : null;
          return (
            <div key={row.region} style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>{row.region}</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#f1f5f9' }}>
                {latest.toFixed(1)}<span style={{ fontSize: '13px', fontWeight: 400, color: '#64748b' }}> days</span>
              </div>
              {trend != null && (
                <div style={{ fontSize: '11px', marginTop: '4px', color: trend < 0 ? '#86efac' : '#fca5a5' }}>
                  {trend < 0 ? '▼' : '▲'} {Math.abs(trend).toFixed(1)}d vs prev month
                </div>
              )}
              <div style={{ fontSize: '10px', color: '#475569', marginTop: '4px' }}>Latest available month</div>
            </div>
          );
        })}
      </div>

      {/* Chart */}
      <div style={cardStyle}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9', marginBottom: '12px' }}>Avg TTGL Trend by Region (Apr 2025 – Apr 2026)</div>
        <div style={{ height: '240px' }}><canvas ref={chartRef} /></div>
      </div>

      {/* TTGL Table */}
      <div style={cardStyle}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9', marginBottom: '4px' }}>Avg Time to Go Live — Days (by project created month)</div>
        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '12px' }}>Each region shows two rows: <span style={{ color: '#86efac' }}>Closed Live avg</span> (Close − Created date) and <span style={{ color: '#fbbf24' }}>Open project current age</span> (today − Created date, n = count still open)</div>
        <div className="overflow-x-auto">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...thLeftStyle, width: '160px', position: 'sticky', left: 0, zIndex: 1 }}>Region / Type</th>
                {months.map((m) => <th key={m} style={thStyle}>{m}</th>)}
              </tr>
            </thead>
            <tbody>
              {ttglData.map((row, i) => {
                const openRow = openAgeData.find(r => r.region === row.region)!;
                const openCountRow = openCount.find(r => r.region === row.region)!;
                const bgMain = i % 2 === 0 ? '#1e293b' : '#162032';
                const bgOpen = i % 2 === 0 ? '#1a2535' : '#141d2e';
                return (
                  <React.Fragment key={row.region}>
                    <tr style={{ backgroundColor: bgMain }}>
                      <td style={{ padding: '7px 12px', color: '#f1f5f9', fontWeight: 700, fontSize: '13px', border: '1px solid #334155', borderBottom: 'none', position: 'sticky', left: 0, backgroundColor: bgMain, zIndex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: REGION_COLORS[row.region] }} />
                          {row.region}
                        </div>
                        <div style={{ fontSize: '10px', color: '#86efac', fontWeight: 400, marginLeft: '14px', marginTop: '1px' }}>&#10003; Closed Live</div>
                      </td>
                      {months.map((m) => {
                        const val = row.months[m];
                        const cnt = liveCount.find(r => r.region === row.region)?.months[m];
                        return (
                          <td key={m} style={{ padding: '7px 8px', textAlign: 'center', border: '1px solid #334155', borderBottom: 'none', backgroundColor: bgMain }}>
                            {val != null
                              ? <><span style={getBadgeStyle(val)}>{val.toFixed(1)}d</span><div style={{ fontSize: '9px', color: '#475569', marginTop: '2px' }}>n={cnt ?? 0}</div></>
                              : <span style={{ color: '#475569' }}>—</span>}
                          </td>
                        );
                      })}
                    </tr>
                    <tr style={{ backgroundColor: bgOpen }}>
                      <td style={{ padding: '5px 12px 8px 26px', color: '#fbbf24', fontSize: '10px', fontWeight: 400, border: '1px solid #334155', borderTop: 'none', position: 'sticky', left: 0, backgroundColor: bgOpen, zIndex: 1 }}>
                        &#9203; Open avg age
                      </td>
                      {months.map((m) => {
                        const val = openRow?.months[m];
                        const cnt = openCountRow?.months[m] ?? 0;
                        return (
                          <td key={m} style={{ padding: '5px 8px 8px 8px', textAlign: 'center', border: '1px solid #334155', borderTop: 'none', backgroundColor: bgOpen }}>
                            {val != null && cnt > 0
                              ? <><span style={{ backgroundColor: '#451a03', color: '#fbbf24', borderRadius: '9999px', padding: '1px 7px', fontSize: '11px' }}>{val.toFixed(1)}d</span><div style={{ fontSize: '9px', color: '#475569', marginTop: '2px' }}>n={cnt}</div></>
                              : <span style={{ color: '#334155', fontSize: '11px' }}>—</span>}
                          </td>
                        );
                      })}
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', gap: '20px', marginTop: '10px', fontSize: '11px', color: '#94a3b8', flexWrap: 'wrap' }}>
          <span style={{ color: '#64748b', fontWeight: 600 }}>Closed Live badges:</span>
          <span><span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#86efac', marginRight: '4px' }} />≤10 days</span>
          <span><span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#fcd34d', marginRight: '4px' }} />11–20 days</span>
          <span><span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#fca5a5', marginRight: '4px' }} />&gt;20 days</span>
        </div>
      </div>

      {/* ── SLA Section ─────────────────────────────────────────────────────── */}
      <div>
        <div style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ display: 'inline-block', width: '4px', height: '18px', backgroundColor: '#3b82f6', borderRadius: '2px' }} />
          Onboarding SLA Compliance
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 400, backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', padding: '2px 8px' }}>
            Target: ≤14 days · Closed Live projects only
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
          {slaData.map((row) => {
            const ov = slaOverall[row.region];
            const monthVals = months.map(m => row.months[m]).filter(v => v != null) as SLACell[];
            const latest = monthVals[monthVals.length - 1];
            const prev = monthVals.length > 1 ? monthVals[monthVals.length - 2] : null;
            const trend = prev != null ? latest.slaPct - prev.slaPct : null;
            const slaColor = ov.slaPct >= 75 ? '#86efac' : ov.slaPct >= 50 ? '#fcd34d' : '#fca5a5';
            const slaBg = ov.slaPct >= 75 ? '#14532d' : ov.slaPct >= 50 ? '#422006' : '#450a0a';
            return (
              <div key={row.region} style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>{row.region}</div>
                  <span style={{ backgroundColor: slaBg, color: slaColor, borderRadius: '9999px', padding: '2px 8px', fontSize: '11px', fontWeight: 700 }}>{ov.slaPct.toFixed(1)}%</span>
                </div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#f1f5f9' }}>
                  {ov.withinSLA}<span style={{ fontSize: '12px', fontWeight: 400, color: '#64748b' }}> / {ov.total}</span>
                </div>
                <div style={{ fontSize: '10px', color: '#475569', marginBottom: '8px' }}>within SLA (all-time)</div>
                <div style={{ backgroundColor: '#1e293b', borderRadius: '4px', height: '5px', overflow: 'hidden', marginBottom: '6px' }}>
                  <div style={{ width: `${Math.min(ov.slaPct, 100)}%`, height: '100%', backgroundColor: REGION_COLORS[row.region], transition: 'width 0.5s' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#475569' }}>
                  <span>Latest: <span style={{ color: slaColor, fontWeight: 600 }}>{latest?.slaPct.toFixed(1)}%</span></span>
                  {trend != null && <span style={{ color: trend > 0 ? '#86efac' : '#fca5a5' }}>{trend > 0 ? '▲' : '▼'} {Math.abs(trend).toFixed(1)}pp</span>}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ ...cardStyle, marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9', marginBottom: '12px' }}>
            Monthly SLA Compliance % — by Region
            <span style={{ fontSize: '11px', fontWeight: 400, color: '#64748b', marginLeft: '10px' }}>Red line = 100% target</span>
          </div>
          <div style={{ height: '240px' }}><canvas ref={slaChartRef} /></div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9', marginBottom: '4px' }}>SLA Compliance by Region &amp; Month</div>
          <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '12px' }}>
            Each cell: <span style={{ color: '#86efac' }}>within%</span> with count.
            <span style={{ marginLeft: '12px' }}>Colors: </span>
            <span style={{ marginLeft: '4px', backgroundColor: '#14532d', color: '#86efac', borderRadius: '4px', padding: '1px 6px', fontSize: '10px' }}>≥75%</span>
            <span style={{ marginLeft: '4px', backgroundColor: '#422006', color: '#fcd34d', borderRadius: '4px', padding: '1px 6px', fontSize: '10px' }}>50–74%</span>
            <span style={{ marginLeft: '4px', backgroundColor: '#450a0a', color: '#fca5a5', borderRadius: '4px', padding: '1px 6px', fontSize: '10px' }}>&lt;50%</span>
          </div>
          <div className="overflow-x-auto">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ ...thLeftStyle, width: '100px', position: 'sticky', left: 0, zIndex: 1 }}>Region</th>
                  {months.map(m => <th key={m} style={thStyle}>{m}</th>)}
                  <th style={{ ...thStyle, backgroundColor: '#172554', minWidth: '70px' }}>Overall</th>
                </tr>
              </thead>
              <tbody>
                {slaData.map((row, i) => {
                  const bg = i % 2 === 0 ? '#1e293b' : '#162032';
                  const ov = slaOverall[row.region];
                  return (
                    <tr key={row.region} style={{ backgroundColor: bg }}>
                      <td style={{ padding: '8px 12px', color: '#f1f5f9', fontWeight: 700, fontSize: '13px', border: '1px solid #334155', position: 'sticky', left: 0, backgroundColor: bg, zIndex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: REGION_COLORS[row.region] }} />
                          {row.region}
                        </div>
                      </td>
                      {months.map(m => {
                        const cell = row.months[m];
                        return (
                          <td key={m} style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #334155', backgroundColor: bg }}>
                            {cell != null
                              ? <><span style={getSLABadgeStyle(cell.slaPct)}>{cell.slaPct.toFixed(0)}%</span><div style={{ fontSize: '9px', color: '#475569', marginTop: '2px' }}>{cell.withinSLA}/{cell.total}</div></>
                              : <span style={{ color: '#334155' }}>—</span>}
                          </td>
                        );
                      })}
                      <td style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #334155', backgroundColor: '#172554' }}>
                        <span style={getSLABadgeStyle(ov.slaPct)}>{ov.slaPct.toFixed(1)}%</span>
                        <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '2px' }}>{ov.withinSLA}/{ov.total}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Ageing Section */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#f1f5f9' }}>Open Project Ageing — Region Wise</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Projects not yet Closed Live, as of {store.computedAt}</div>
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', padding: '4px 10px' }}>
            Total open: {ageingData.reduce((s, r) => s + r.total, 0)}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px' }}>
          {ageingData.map((row) => (
            <div key={row.region} style={{ backgroundColor: '#162032', border: '1px solid #334155', borderRadius: '8px', padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: REGION_COLORS[row.region], display: 'inline-block' }} />
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#f1f5f9' }}>{row.region}</span>
              </div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#f1f5f9', lineHeight: 1 }}>
                {row.total}<span style={{ fontSize: '11px', color: '#64748b', fontWeight: 400, marginLeft: '4px' }}>open</span>
              </div>
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {((): { label: string; val: number; color: string; bg: string }[] => {
                  const b0_7   = row.total - row.gt7;
                  const b7_14  = row.gt7   - row.gt14;
                  const b14_28 = row.gt14  - row.gt28;
                  const b28_60 = row.gt28  - row.gt60;
                  const b60p   = row.gt60;
                  return [
                    { label: '0–7d',   val: b0_7,   color: '#86efac', bg: '#14532d' },
                    { label: '7–14d',  val: b7_14,  color: '#fcd34d', bg: '#422006' },
                    { label: '14–28d', val: b14_28, color: '#fb923c', bg: '#431407' },
                    { label: '28–60d', val: b28_60, color: '#f87171', bg: '#450a0a' },
                    { label: '60d+',   val: b60p,   color: '#e879f9', bg: '#3b0764' },
                  ];
                })().map(({ label, val, color, bg }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '10px', color: '#94a3b8', width: '36px', flexShrink: 0 }}>{label}</span>
                    <div style={{ flex: 1, backgroundColor: '#0f172a', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                      <div style={{ width: `${row.total > 0 ? Math.round((val / row.total) * 100) : 0}%`, height: '100%', backgroundColor: color, borderRadius: '4px' }} />
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 600, color, backgroundColor: bg, borderRadius: '4px', padding: '1px 5px', minWidth: '28px', textAlign: 'center' }}>
                      {val} <span style={{ fontSize: '9px', fontWeight: 400, opacity: 0.8 }}>({row.total > 0 ? Math.round((val / row.total) * 100) : 0}%)</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Project Status Table */}
      <div style={cardStyle}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9', marginBottom: '4px' }}>Project Status Summary — Total / Live / Open / Dropped by Created Month</div>
        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '12px' }}>
          <span style={{ color: '#cbd5e1' }}>Tot</span> = all projects &nbsp;·&nbsp;
          <span style={{ color: '#86efac' }}>Live</span> = Closed Live &nbsp;·&nbsp;
          <span style={{ color: '#fbbf24' }}>Open</span> = still in progress &nbsp;·&nbsp;
          <span style={{ color: '#f87171' }}>Drop</span> = Closed Dropped
        </div>
        <div className="overflow-x-auto">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...thLeftStyle, position: 'sticky', left: 0, zIndex: 1 }} rowSpan={2}>Region</th>
                {months.map(m => <th key={m} colSpan={4} style={{ ...thStyle, borderBottom: '1px solid #1e3a5f' }}>{m}</th>)}
              </tr>
              <tr>
                {months.map(m => (
                  <React.Fragment key={m}>
                    <th style={{ ...thStyle, fontSize: '10px', fontWeight: 500, color: '#94a3b8', backgroundColor: '#162032' }}>Tot</th>
                    <th style={{ ...thStyle, fontSize: '10px', fontWeight: 500, color: '#86efac', backgroundColor: '#162032' }}>Live</th>
                    <th style={{ ...thStyle, fontSize: '10px', fontWeight: 500, color: '#fbbf24', backgroundColor: '#162032' }}>Open</th>
                    <th style={{ ...thStyle, fontSize: '10px', fontWeight: 500, color: '#f87171', backgroundColor: '#162032' }}>Drop</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {totalCount.map((row, i) => {
                const liveRow = liveCount.find(r => r.region === row.region)!;
                const openCountRow = openCount.find(r => r.region === row.region)!;
                const droppedRow = droppedCount.find(r => r.region === row.region)!;
                const bg = i % 2 === 0 ? '#1e293b' : '#162032';
                return (
                  <tr key={row.region} style={{ backgroundColor: bg }}>
                    <td style={{ padding: '10px 12px', color: '#f1f5f9', fontWeight: 700, fontSize: '13px', border: '1px solid #334155', position: 'sticky', left: 0, backgroundColor: bg, zIndex: 1 }}>
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: REGION_COLORS[row.region], marginRight: '8px' }} />
                      {row.region}
                    </td>
                    {months.map(m => {
                      const tot = row.months[m] ?? 0;
                      const live = liveRow.months[m] ?? 0;
                      const open = openCountRow.months[m] ?? 0;
                      const drop = droppedRow.months[m] ?? 0;
                      return (
                        <React.Fragment key={m}>
                          <td style={{ padding: '7px 5px', textAlign: 'center', border: '1px solid #334155', color: '#cbd5e1', fontSize: '12px', fontWeight: 600 }}>{tot || '—'}</td>
                          <td style={{ padding: '7px 5px', textAlign: 'center', border: '1px solid #334155' }}>
                            {live > 0 ? <span style={{ color: '#86efac', fontWeight: 600, fontSize: '12px' }}>{live}</span> : <span style={{ color: '#334155' }}>—</span>}
                          </td>
                          <td style={{ padding: '7px 5px', textAlign: 'center', border: '1px solid #334155' }}>
                            {open > 0 ? <span style={{ color: '#fbbf24', fontWeight: 600, fontSize: '12px' }}>{open}</span> : <span style={{ color: '#334155' }}>—</span>}
                          </td>
                          <td style={{ padding: '7px 5px', textAlign: 'center', border: '1px solid #334155' }}>
                            {drop > 0 ? <span style={{ color: '#f87171', fontWeight: 600, fontSize: '12px' }}>{drop}</span> : <span style={{ color: '#334155' }}>—</span>}
                          </td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                );
              })}
              <tr style={{ backgroundColor: '#172554' }}>
                <td style={{ padding: '10px 12px', border: '1px solid #334155', fontWeight: 700, color: '#f1f5f9', fontSize: '13px', position: 'sticky', left: 0, backgroundColor: '#172554', zIndex: 1 }}>TOTAL</td>
                {months.map(m => {
                  const tot  = totalCount.reduce((s, r) => s + (r.months[m] ?? 0), 0);
                  const live = liveCount.reduce((s, r) => s + (r.months[m] ?? 0), 0);
                  const open = openCount.reduce((s, r) => s + (r.months[m] ?? 0), 0);
                  const drop = droppedCount.reduce((s, r) => s + (r.months[m] ?? 0), 0);
                  return (
                    <React.Fragment key={m}>
                      <td style={{ padding: '7px 5px', textAlign: 'center', border: '1px solid #334155', color: '#f1f5f9', fontWeight: 700, fontSize: '12px' }}>{tot}</td>
                      <td style={{ padding: '7px 5px', textAlign: 'center', border: '1px solid #334155', color: '#86efac', fontWeight: 700, fontSize: '12px' }}>{live}</td>
                      <td style={{ padding: '7px 5px', textAlign: 'center', border: '1px solid #334155', color: '#fbbf24', fontWeight: 700, fontSize: '12px' }}>{open}</td>
                      <td style={{ padding: '7px 5px', textAlign: 'center', border: '1px solid #334155', color: '#f87171', fontWeight: 700, fontSize: '12px' }}>{drop}</td>
                    </React.Fragment>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
