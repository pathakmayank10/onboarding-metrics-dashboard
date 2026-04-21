import React, { useEffect, useRef } from 'react';
import { X, TrendingUp, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

declare const Chart: any;

interface MonthlyTrend {
  live: number;
  drop: number;
  openCreated: number;
  avgTTGL: number;
  slaPct: number;
}

export interface OMData {
  name: string;
  regions: string[];
  total: number;
  live: number;
  drop: number;
  open: number;
  liveRate: number;
  dropRate: number;
  avgTTGL: number;
  slaWithin: number;
  slaPct: number;
  openAvgAge: number;
  mrrRealised: number;
  mrrPending: number;
  mrrDropped: number;
  monthlyTrend: Record<string, MonthlyTrend>;
}

interface Props {
  om: OMData;
  onClose: () => void;
}

const MONTHS = ['Apr 2025','May 2025','Jun 2025','Jul 2025','Aug 2025','Sep 2025','Oct 2025','Nov 2025','Dec 2025','Jan 2026','Feb 2026','Mar 2026','Apr 2026'];

const fmtNum = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });
const fmtCur = (n: number) => '$' + fmtNum(n);

export const OMDetailPanel: React.FC<Props> = ({ om, onClose }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);

  const slaColor = (p: number) => p >= 0.75 ? '#22c55e' : p >= 0.5 ? '#f59e0b' : '#ef4444';

  useEffect(() => {
    if (!chartRef.current) return;
    if (chartInstance.current) chartInstance.current.destroy();

    const labels = MONTHS.map(m => m.replace(' 20', " '"));
    const liveData = MONTHS.map(m => om.monthlyTrend[m]?.live ?? 0);
    const dropData = MONTHS.map(m => om.monthlyTrend[m]?.drop ?? 0);
    const slaData = MONTHS.map(m => om.monthlyTrend[m]?.live ? (om.monthlyTrend[m].slaPct * 100) : null);
    const ttglData = MONTHS.map(m => om.monthlyTrend[m]?.live ? om.monthlyTrend[m].avgTTGL : null);

    chartInstance.current = new Chart(chartRef.current, {
      data: {
        labels,
        datasets: [
          {
            type: 'bar',
            label: 'Live',
            data: liveData,
            backgroundColor: 'rgba(59,130,246,0.7)',
            yAxisID: 'y',
            order: 2,
          },
          {
            type: 'bar',
            label: 'Dropped',
            data: dropData,
            backgroundColor: 'rgba(239,68,68,0.6)',
            yAxisID: 'y',
            order: 2,
          },
          {
            type: 'line',
            label: 'SLA % (≤14d)',
            data: slaData,
            borderColor: '#22c55e',
            backgroundColor: 'rgba(34,197,94,0.1)',
            pointBackgroundColor: '#22c55e',
            tension: 0.3,
            yAxisID: 'y2',
            order: 1,
            spanGaps: true,
          },
          {
            type: 'line',
            label: 'Avg TTGL (days)',
            data: ttglData,
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245,158,11,0.1)',
            pointBackgroundColor: '#f59e0b',
            tension: 0.3,
            yAxisID: 'y3',
            order: 1,
            spanGaps: true,
            borderDash: [4,3],
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
                if (ctx.dataset.label === 'SLA % (≤14d)') return ` SLA: ${ctx.raw?.toFixed(1)}%`;
                if (ctx.dataset.label === 'Avg TTGL (days)') return ` TTGL: ${ctx.raw?.toFixed(1)}d`;
                return ` ${ctx.dataset.label}: ${ctx.raw}`;
              }
            }
          }
        },
        scales: {
          x: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
          y: { position: 'left', ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' }, title: { display: true, text: 'Count', color: '#64748b', font: { size: 10 } } },
          y2: { position: 'right', min: 0, max: 100, ticks: { color: '#22c55e', font: { size: 10 }, callback: (v: number) => v + '%' }, grid: { display: false }, title: { display: true, text: 'SLA %', color: '#22c55e', font: { size: 10 } } },
          y3: { position: 'right', ticks: { color: '#f59e0b', font: { size: 10 }, callback: (v: number) => v + 'd' }, grid: { display: false }, title: { display: true, text: 'TTGL d', color: '#f59e0b', font: { size: 10 } } },
        },
      },
    });
    return () => { chartInstance.current?.destroy(); };
  }, [om]);

  return (
    <div style={{ background: '#0f172a', border: '1px solid #1e3a5f', borderRadius: 10, padding: 20, marginBottom: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>{om.name}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
            {om.regions.join(' · ')} &nbsp;·&nbsp; {om.total} total projects
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 4 }}>
          <X size={18} />
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 18 }}>
        {[
          { icon: <CheckCircle size={14} />, label: 'Live', val: om.live, sub: `${(om.liveRate*100).toFixed(0)}% rate`, color: '#22c55e' },
          { icon: <AlertTriangle size={14} />, label: 'Dropped', val: om.drop, sub: `${(om.dropRate*100).toFixed(0)}% rate`, color: '#ef4444' },
          { icon: <Clock size={14} />, label: 'Open', val: om.open, sub: `avg ${om.openAvgAge.toFixed(0)}d age`, color: '#f59e0b' },
          { icon: <Clock size={14} />, label: 'Avg TTGL', val: `${om.avgTTGL}d`, sub: `of ${om.live} closed live`, color: '#60a5fa' },
          { icon: <TrendingUp size={14} />, label: 'SLA %', val: `${(om.slaPct*100).toFixed(1)}%`, sub: `${om.slaWithin} within 14d`, color: slaColor(om.slaPct) },
        ].map((c, i) => (
          <div key={i} style={{ background: '#1e293b', borderRadius: 8, padding: '10px 12px', borderLeft: `3px solid ${c.color}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: c.color, marginBottom: 4 }}>{c.icon}<span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{c.label}</span></div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>{c.val}</div>
            <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* MRR row */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
        {[
          { label: 'MRR Realised', val: fmtCur(om.mrrRealised), color: '#22c55e' },
          { label: 'MRR Pending', val: fmtCur(om.mrrPending), color: '#f59e0b' },
          { label: 'MRR Dropped', val: fmtCur(om.mrrDropped), color: '#ef4444' },
        ].map((c, i) => (
          <div key={i} style={{ background: '#1e293b', borderRadius: 8, padding: '8px 14px', flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>{c.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: c.color, marginTop: 2 }}>{c.val}</div>
          </div>
        ))}
      </div>

      {/* Monthly trend chart */}
      <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Monthly Trend — Apr 2025 → Apr 2026</div>
      <div style={{ height: 200 }}>
        <canvas ref={chartRef} />
      </div>

      {/* Monthly table */}
      <div style={{ overflowX: 'auto', marginTop: 14 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: '#1e3a5f' }}>
              {['Month','Live','Drop','Avg TTGL','SLA %'].map(h => (
                <th key={h} style={{ padding: '5px 10px', color: '#93c5fd', textAlign: 'center', fontWeight: 600, border: '1px solid #1e3a5f' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MONTHS.map((m, i) => {
              const d = om.monthlyTrend[m];
              if (!d) return null;
              const hasDat = d.live > 0 || d.drop > 0;
              return (
                <tr key={m} style={{ background: i % 2 === 0 ? '#1e293b' : '#162032' }}>
                  <td style={{ padding: '4px 10px', color: '#cbd5e1', border: '1px solid #0f172a', fontWeight: 500 }}>{m}</td>
                  <td style={{ padding: '4px 10px', color: '#60a5fa', textAlign: 'center', border: '1px solid #0f172a' }}>{d.live || '—'}</td>
                  <td style={{ padding: '4px 10px', color: d.drop > 0 ? '#f87171' : '#475569', textAlign: 'center', border: '1px solid #0f172a' }}>{d.drop || '—'}</td>
                  <td style={{ padding: '4px 10px', color: '#f1f5f9', textAlign: 'center', border: '1px solid #0f172a', fontFamily: 'monospace' }}>{hasDat && d.avgTTGL ? `${d.avgTTGL.toFixed(1)}d` : '—'}</td>
                  <td style={{ padding: '4px 10px', textAlign: 'center', border: '1px solid #0f172a', fontFamily: 'monospace' }}>
                    {hasDat && d.live > 0
                      ? <span style={{ color: slaColor(d.slaPct), fontWeight: 600 }}>{(d.slaPct*100).toFixed(0)}%</span>
                      : <span style={{ color: '#475569' }}>—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
