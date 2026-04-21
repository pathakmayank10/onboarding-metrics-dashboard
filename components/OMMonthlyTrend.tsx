import React, { useEffect, useRef, useState, useMemo } from 'react';
import { OMData } from './OMDetailPanel';

declare const Chart: any;

interface Props {
  oms: OMData[];
  regionFilter: string;
}

const MONTHS = ['Apr 2025','May 2025','Jun 2025','Jul 2025','Aug 2025','Sep 2025','Oct 2025','Nov 2025','Dec 2025','Jan 2026','Feb 2026','Mar 2026','Apr 2026'];
const SHORT = MONTHS.map(m => m.replace(' 20', " '"));

type Metric = 'live' | 'sla' | 'ttgl' | 'drop';

const METRIC_OPTS: { key: Metric; label: string; unit: string }[] = [
  { key: 'live', label: 'Live Count', unit: '' },
  { key: 'sla', label: 'SLA %', unit: '%' },
  { key: 'ttgl', label: 'Avg TTGL', unit: 'd' },
  { key: 'drop', label: 'Drop Count', unit: '' },
];

function cellColor(metric: Metric, val: number | null): string {
  if (val === null) return '#0f172a';
  if (metric === 'live') {
    if (val >= 20) return 'rgba(59,130,246,0.85)';
    if (val >= 10) return 'rgba(59,130,246,0.55)';
    if (val >= 5)  return 'rgba(59,130,246,0.35)';
    if (val >= 1)  return 'rgba(59,130,246,0.18)';
    return '#0f172a';
  }
  if (metric === 'drop') {
    if (val === 0) return '#0f172a';
    if (val >= 5)  return 'rgba(239,68,68,0.8)';
    if (val >= 3)  return 'rgba(239,68,68,0.55)';
    return 'rgba(239,68,68,0.3)';
  }
  if (metric === 'sla') {
    if (val >= 75) return 'rgba(34,197,94,0.65)';
    if (val >= 50) return 'rgba(245,158,11,0.65)';
    return 'rgba(239,68,68,0.55)';
  }
  if (metric === 'ttgl') {
    if (val <= 7)  return 'rgba(34,197,94,0.65)';
    if (val <= 14) return 'rgba(59,130,246,0.55)';
    if (val <= 21) return 'rgba(245,158,11,0.6)';
    return 'rgba(239,68,68,0.6)';
  }
  return '#1e293b';
}

function cellText(metric: Metric, val: number | null): string {
  if (val === null) return '—';
  if (metric === 'sla') return val.toFixed(0) + '%';
  if (metric === 'ttgl') return val.toFixed(1) + 'd';
  return String(val) || '—';
}

function textColor(metric: Metric, val: number | null): string {
  if (val === null || val === 0) return '#334155';
  return '#f1f5f9';
}

export const OMMonthlyTrend: React.FC<Props> = ({ oms, regionFilter }) => {
  const [metric, setMetric] = useState<Metric>('live');
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);
  const [searchOM, setSearchOM] = useState('');

  // Filter OMs by region + search
  const filteredOMs = useMemo(() => {
    return oms.filter(o =>
      (regionFilter === 'All' || o.regions.includes(regionFilter)) &&
      o.name.toLowerCase().includes(searchOM.toLowerCase())
    ).sort((a, b) => b.live - a.live);
  }, [oms, regionFilter, searchOM]);

  // Aggregate totals per month across all filtered OMs
  const aggByMonth = useMemo(() => {
    return MONTHS.map(m => {
      const rows = filteredOMs.map(o => o.monthlyTrend[m]).filter(Boolean);
      const totalLive = rows.reduce((s, r) => s + (r.live ?? 0), 0);
      const totalDrop = rows.reduce((s, r) => s + (r.drop ?? 0), 0);
      const slaRows = rows.filter(r => r.live > 0);
      const avgSLA = slaRows.length ? slaRows.reduce((s, r) => s + r.slaPct * 100, 0) / slaRows.length : null;
      const ttglRows = rows.filter(r => r.live > 0 && r.avgTTGL > 0);
      const avgTTGL = ttglRows.length ? ttglRows.reduce((s, r) => s + r.avgTTGL, 0) / ttglRows.length : null;
      return { m, totalLive, totalDrop, avgSLA, avgTTGL };
    });
  }, [filteredOMs]);

  // Draw aggregate chart
  useEffect(() => {
    if (!chartRef.current) return;
    if (chartInstance.current) chartInstance.current.destroy();

    chartInstance.current = new Chart(chartRef.current, {
      data: {
        labels: SHORT,
        datasets: [
          {
            type: 'bar',
            label: 'Live',
            data: aggByMonth.map(a => a.totalLive),
            backgroundColor: 'rgba(59,130,246,0.65)',
            yAxisID: 'y',
            order: 2,
          },
          {
            type: 'bar',
            label: 'Dropped',
            data: aggByMonth.map(a => a.totalDrop),
            backgroundColor: 'rgba(239,68,68,0.55)',
            yAxisID: 'y',
            order: 2,
          },
          {
            type: 'line',
            label: 'Avg SLA % (≤14d)',
            data: aggByMonth.map(a => a.avgSLA),
            borderColor: '#22c55e',
            pointBackgroundColor: '#22c55e',
            tension: 0.35,
            yAxisID: 'y2',
            order: 1,
            spanGaps: true,
          },
          {
            type: 'line',
            label: 'Avg TTGL (days)',
            data: aggByMonth.map(a => a.avgTTGL),
            borderColor: '#f59e0b',
            pointBackgroundColor: '#f59e0b',
            tension: 0.35,
            yAxisID: 'y3',
            order: 1,
            spanGaps: true,
            borderDash: [4, 3],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { labels: { color: '#94a3b8', font: { size: 11 } } },
          tooltip: {
            callbacks: {
              label: (ctx: any) => {
                if (ctx.dataset.label === 'Avg SLA % (≤14d)') return ` SLA: ${ctx.raw?.toFixed(1)}%`;
                if (ctx.dataset.label === 'Avg TTGL (days)') return ` Avg TTGL: ${ctx.raw?.toFixed(1)}d`;
                return ` ${ctx.dataset.label}: ${ctx.raw}`;
              }
            }
          }
        },
        scales: {
          x: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
          y: {
            position: 'left',
            ticks: { color: '#64748b', font: { size: 10 } },
            grid: { color: 'rgba(255,255,255,0.04)' },
            title: { display: true, text: 'Projects', color: '#64748b', font: { size: 10 } },
          },
          y2: {
            position: 'right',
            min: 0, max: 100,
            ticks: { color: '#22c55e', font: { size: 10 }, callback: (v: number) => v + '%' },
            grid: { display: false },
            title: { display: true, text: 'SLA %', color: '#22c55e', font: { size: 10 } },
          },
          y3: {
            position: 'right',
            ticks: { color: '#f59e0b', font: { size: 10 }, callback: (v: number) => v + 'd' },
            grid: { display: false },
            title: { display: true, text: 'TTGL', color: '#f59e0b', font: { size: 10 } },
          },
        },
      },
    });
    return () => { chartInstance.current?.destroy(); };
  }, [aggByMonth]);

  // Cell value per OM per month
  const getCellVal = (om: OMData, m: string): number | null => {
    const d = om.monthlyTrend[m];
    if (!d) return null;
    if (metric === 'live') return d.live > 0 ? d.live : null;
    if (metric === 'drop') return d.drop > 0 ? d.drop : null;
    if (metric === 'sla') return d.live > 0 ? +(d.slaPct * 100).toFixed(1) : null;
    if (metric === 'ttgl') return d.live > 0 && d.avgTTGL > 0 ? +d.avgTTGL.toFixed(1) : null;
    return null;
  };

  // Totals row
  const totals = MONTHS.map(m => {
    const vals = filteredOMs.map(o => getCellVal(o, m)).filter(v => v !== null) as number[];
    if (vals.length === 0) return null;
    if (metric === 'live' || metric === 'drop') return vals.reduce((s, v) => s + v, 0);
    return +(vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1);
  });

  return (
    <div>
      {/* Aggregate Chart */}
      <div style={{ background: '#1e293b', borderRadius: 10, padding: 18, marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
          Team Monthly Trend — {regionFilter === 'All' ? 'All Regions' : regionFilter}
          <span style={{ marginLeft: 8, color: '#334155' }}>({filteredOMs.length} OMs)</span>
        </div>
        <div style={{ height: 220 }}>
          <canvas ref={chartRef} />
        </div>
      </div>

      {/* Heatmap Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>Show:</span>
          {METRIC_OPTS.map(opt => (
            <button
              key={opt.key}
              onClick={() => setMetric(opt.key)}
              style={{
                padding: '4px 12px',
                borderRadius: 6,
                border: '1px solid',
                borderColor: metric === opt.key ? '#3b82f6' : '#1e3a5f',
                background: metric === opt.key ? '#1e3a5f' : '#0f172a',
                color: metric === opt.key ? '#60a5fa' : '#64748b',
                fontSize: 11,
                cursor: 'pointer',
                fontWeight: metric === opt.key ? 700 : 400,
                transition: 'all 0.15s',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <input
          type="search"
          placeholder="Filter OM name…"
          value={searchOM}
          onChange={e => setSearchOM(e.target.value)}
          style={{
            background: '#1e293b', border: '1px solid #334155', borderRadius: 6,
            padding: '4px 10px', color: '#f1f5f9', fontSize: 12, width: 180,
            outline: 'none',
          }}
        />
      </div>

      {/* Color Legend */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 12, flexWrap: 'wrap' }}>
        {metric === 'live' && [
          { label: '≥20', bg: 'rgba(59,130,246,0.85)' },
          { label: '10–19', bg: 'rgba(59,130,246,0.55)' },
          { label: '5–9', bg: 'rgba(59,130,246,0.35)' },
          { label: '1–4', bg: 'rgba(59,130,246,0.18)' },
          { label: '0', bg: '#0f172a' },
        ].map((l, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 14, height: 14, borderRadius: 3, background: l.bg, border: '1px solid #1e3a5f' }} />
            <span style={{ fontSize: 10, color: '#64748b' }}>{l.label}</span>
          </div>
        ))}
        {metric === 'sla' && [
          { label: '≥75%', bg: 'rgba(34,197,94,0.65)' },
          { label: '50–74%', bg: 'rgba(245,158,11,0.65)' },
          { label: '<50%', bg: 'rgba(239,68,68,0.55)' },
        ].map((l, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 14, height: 14, borderRadius: 3, background: l.bg, border: '1px solid #1e3a5f' }} />
            <span style={{ fontSize: 10, color: '#64748b' }}>{l.label}</span>
          </div>
        ))}
        {metric === 'ttgl' && [
          { label: '≤7d', bg: 'rgba(34,197,94,0.65)' },
          { label: '8–14d', bg: 'rgba(59,130,246,0.55)' },
          { label: '15–21d', bg: 'rgba(245,158,11,0.6)' },
          { label: '>21d', bg: 'rgba(239,68,68,0.6)' },
        ].map((l, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 14, height: 14, borderRadius: 3, background: l.bg, border: '1px solid #1e3a5f' }} />
            <span style={{ fontSize: 10, color: '#64748b' }}>{l.label}</span>
          </div>
        ))}
        {metric === 'drop' && [
          { label: '≥5', bg: 'rgba(239,68,68,0.8)' },
          { label: '3–4', bg: 'rgba(239,68,68,0.55)' },
          { label: '1–2', bg: 'rgba(239,68,68,0.3)' },
          { label: '0', bg: '#0f172a' },
        ].map((l, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 14, height: 14, borderRadius: 3, background: l.bg, border: '1px solid #1e3a5f' }} />
            <span style={{ fontSize: 10, color: '#64748b' }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Heatmap Table */}
      <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #1e3a5f' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: '#1e3a5f' }}>
              <th style={{ padding: '7px 12px', color: '#93c5fd', textAlign: 'left', border: '1px solid #0f172a', fontWeight: 600, minWidth: 150, position: 'sticky', left: 0, background: '#1e3a5f', zIndex: 2 }}>OM Name</th>
              <th style={{ padding: '7px 8px', color: '#93c5fd', textAlign: 'center', border: '1px solid #0f172a', fontWeight: 600, width: 38 }}>Total</th>
              {SHORT.map(m => (
                <th key={m} style={{ padding: '7px 6px', color: '#93c5fd', textAlign: 'center', border: '1px solid #0f172a', fontWeight: 600, whiteSpace: 'nowrap', minWidth: 58 }}>{m}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredOMs.map((om, i) => {
              const rowTotal = metric === 'live' ? om.live
                : metric === 'drop' ? om.drop
                : metric === 'sla' ? +(om.slaPct * 100).toFixed(1)
                : om.avgTTGL;
              return (
                <tr key={om.name} style={{ background: i % 2 === 0 ? '#1e293b' : '#162032' }}>
                  <td style={{ padding: '5px 12px', color: '#f1f5f9', border: '1px solid #0f172a', fontWeight: 500, position: 'sticky', left: 0, background: i % 2 === 0 ? '#1e293b' : '#162032', zIndex: 1, whiteSpace: 'nowrap' }}>
                    {om.name}
                    {om.regions.map(r => (
                      <span key={r} style={{ marginLeft: 5, fontSize: 8, padding: '1px 4px', borderRadius: 3, background: r === 'INDIA' ? '#3b82f6' : r === 'MEENA' ? '#8b5cf6' : r === 'UK' ? '#f59e0b' : '#22c55e', color: '#fff', fontWeight: 700 }}>{r}</span>
                    ))}
                  </td>
                  <td style={{ padding: '5px 8px', textAlign: 'center', border: '1px solid #0f172a', color: '#60a5fa', fontWeight: 700, fontFamily: 'monospace' }}>
                    {metric === 'sla' ? rowTotal + '%' : metric === 'ttgl' ? rowTotal + 'd' : rowTotal}
                  </td>
                  {MONTHS.map(m => {
                    const val = getCellVal(om, m);
                    return (
                      <td
                        key={m}
                        style={{
                          padding: '5px 6px',
                          textAlign: 'center',
                          border: '1px solid #0f172a',
                          background: cellColor(metric, val),
                          color: textColor(metric, val),
                          fontFamily: 'monospace',
                          fontWeight: val !== null ? 600 : 400,
                          fontSize: 11,
                          transition: 'background 0.1s',
                        }}
                      >
                        {cellText(metric, val)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}

            {/* Totals / Avg row */}
            <tr style={{ background: '#172554' }}>
              <td style={{ padding: '6px 12px', color: '#93c5fd', border: '1px solid #0f172a', fontWeight: 700, position: 'sticky', left: 0, background: '#172554', zIndex: 1 }}>
                {metric === 'live' || metric === 'drop' ? 'Total' : 'Avg'}
              </td>
              <td style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #0f172a', color: '#60a5fa', fontWeight: 700, fontFamily: 'monospace' }}>
                {metric === 'live' ? filteredOMs.reduce((s, o) => s + o.live, 0)
                  : metric === 'drop' ? filteredOMs.reduce((s, o) => s + o.drop, 0)
                  : metric === 'sla' ? (filteredOMs.reduce((s, o) => s + o.slaPct * 100, 0) / (filteredOMs.length || 1)).toFixed(1) + '%'
                  : (filteredOMs.reduce((s, o) => s + o.avgTTGL, 0) / (filteredOMs.length || 1)).toFixed(1) + 'd'
                }
              </td>
              {totals.map((t, i) => (
                <td key={i} style={{ padding: '6px 6px', textAlign: 'center', border: '1px solid #0f172a', color: '#93c5fd', fontWeight: 700, fontFamily: 'monospace' }}>
                  {t !== null
                    ? (metric === 'sla' ? t + '%' : metric === 'ttgl' ? t + 'd' : t)
                    : '—'}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      {filteredOMs.length === 0 && (
        <div style={{ textAlign: 'center', padding: 30, color: '#475569' }}>No OMs match the current filters.</div>
      )}
    </div>
  );
};
