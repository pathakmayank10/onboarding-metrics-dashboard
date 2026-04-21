import React, { useEffect, useState, useMemo } from 'react';
import { Search, ChevronUp, ChevronDown, Users, Target, Clock, TrendingUp, ChevronRight, BarChart2, List } from 'lucide-react';
import { OMDetailPanel, OMData } from './OMDetailPanel';
import { OMMonthlyTrend } from './OMMonthlyTrend';
import { loadData } from '../utils/dataLoader';

interface OMStore {
  summary: { totalOMs: number; totalProjects: number; overallSLAPct: number; overallAvgTTGL: number };
  oms: OMData[];
}

type SortKey = 'live' | 'drop' | 'open' | 'liveRate' | 'dropRate' | 'avgTTGL' | 'slaPct' | 'mrrRealised' | 'total';

const REGION_COLORS: Record<string, string> = {
  INDIA: '#3b82f6',
  MEENA: '#8b5cf6',
  UK: '#f59e0b',
  US: '#22c55e',
};

const slaColor = (p: number) => p >= 0.75 ? '#22c55e' : p >= 0.5 ? '#f59e0b' : '#ef4444';
const ttglColor = (d: number) => d <= 14 ? '#22c55e' : d <= 21 ? '#f59e0b' : '#ef4444';
const fmtCur = (n: number) => '$' + n.toLocaleString(undefined, { maximumFractionDigits: 0 });

const SortIcon: React.FC<{ active: boolean; dir: 'asc' | 'desc' }> = ({ active, dir }) => (
  active
    ? (dir === 'asc' ? <ChevronUp size={12} style={{ color: '#60a5fa' }} /> : <ChevronDown size={12} style={{ color: '#60a5fa' }} />)
    : <ChevronDown size={12} style={{ opacity: 0.3 }} />
);

export const OMSection: React.FC = () => {
  const [store, setStore] = useState<OMStore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState<string>('All');
  const [sortKey, setSortKey] = useState<SortKey>('live');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedOM, setSelectedOM] = useState<OMData | null>(null);
  const [view, setView] = useState<'leaderboard' | 'trend'>('leaderboard');

  useEffect(() => {
    loadData('om_performance.json')
      .then((data: OMStore) => {
        setStore(data);
        setLoading(false);
      })
      .catch((e: any) => {
        console.error('Failed to load OM data:', e);
        setError('Failed to load OM data');
        setLoading(false);
      });
  }, []);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const filtered = useMemo(() => {
    if (!store) return [];
    return store.oms
      .filter(o =>
        (regionFilter === 'All' || o.regions.includes(regionFilter)) &&
        o.name.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => {
        const v = (o: OMData) => o[sortKey] as number;
        return sortDir === 'asc' ? v(a) - v(b) : v(b) - v(a);
      });
  }, [store, search, regionFilter, sortKey, sortDir]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#64748b' }}>
      <span className="loading loading-spinner loading-lg" style={{ marginRight: 10 }} />
      Loading OM performance data…
    </div>
  );

  if (error || !store) return (
    <div style={{ color: '#ef4444', padding: 20 }}>{error || 'No data'}</div>
  );

  const { summary } = store;

  const thStyle = (key: SortKey): React.CSSProperties => ({
    padding: '8px 10px',
    color: sortKey === key ? '#60a5fa' : '#93c5fd',
    textAlign: 'center',
    fontWeight: 600,
    border: '1px solid #1e3a5f',
    cursor: 'pointer',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    fontSize: 11,
  });

  const colHeader = (label: string, key: SortKey) => (
    <th style={thStyle(key)} onClick={() => handleSort(key)}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
        {label} <SortIcon active={sortKey === key} dir={sortDir} />
      </div>
    </th>
  );

  return (
    <div>
      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { icon: <Users size={18} />, label: 'Total OMs', val: summary.totalOMs, sub: 'Active onboarding managers', color: '#3b82f6' },
          { icon: <TrendingUp size={18} />, label: 'Total Projects', val: summary.totalProjects, sub: 'Apr 2025 → Apr 2026', color: '#60a5fa' },
          { icon: <Target size={18} />, label: 'Overall SLA %', val: `${(summary.overallSLAPct * 100).toFixed(1)}%`, sub: 'Projects closed ≤14 days', color: slaColor(summary.overallSLAPct) },
          { icon: <Clock size={18} />, label: 'Overall Avg TTGL', val: `${summary.overallAvgTTGL}d`, sub: 'Avg days to go live', color: ttglColor(summary.overallAvgTTGL) },
        ].map((c, i) => (
          <div key={i} style={{ background: '#1e293b', borderRadius: 10, padding: '16px 18px', borderTop: `3px solid ${c.color}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: c.color }}>{c.icon}<span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: '#64748b' }}>{c.label}</span></div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#f1f5f9' }}>{c.val}</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Selected OM detail */}
      {selectedOM && (
        <OMDetailPanel om={selectedOM} onClose={() => setSelectedOM(null)} />
      )}

      {/* View Toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, alignItems: 'center' }}>
        <button
          onClick={() => setView('leaderboard')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 16px', borderRadius: 7, border: '1px solid',
            borderColor: view === 'leaderboard' ? '#3b82f6' : '#1e3a5f',
            background: view === 'leaderboard' ? '#1e3a5f' : '#0f172a',
            color: view === 'leaderboard' ? '#60a5fa' : '#64748b',
            fontSize: 12, fontWeight: view === 'leaderboard' ? 700 : 400, cursor: 'pointer',
          }}
        >
          <List size={13} /> Leaderboard
        </button>
        <button
          onClick={() => setView('trend')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 16px', borderRadius: 7, border: '1px solid',
            borderColor: view === 'trend' ? '#3b82f6' : '#1e3a5f',
            background: view === 'trend' ? '#1e3a5f' : '#0f172a',
            color: view === 'trend' ? '#60a5fa' : '#64748b',
            fontSize: 12, fontWeight: view === 'trend' ? 700 : 400, cursor: 'pointer',
          }}
        >
          <BarChart2 size={13} /> Monthly Trend
        </button>
      </div>

      {/* Monthly Trend View */}
      {view === 'trend' && (
        <OMMonthlyTrend oms={store.oms} regionFilter={regionFilter} />
      )}

      {/* Leaderboard View */}
      {view === 'leaderboard' && <>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <label className="input input-bordered flex items-center gap-2" style={{ flex: 1, maxWidth: 280, background: '#1e293b', borderColor: '#334155' }}>
          <Search size={14} style={{ opacity: 0.5 }} />
          <input
            type="search"
            className="grow"
            placeholder="Search OM name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ background: 'transparent', color: '#f1f5f9', fontSize: 13 }}
          />
        </label>

        <select
          className="select select-bordered select-sm"
          value={regionFilter}
          onChange={e => setRegionFilter(e.target.value)}
          style={{ background: '#1e293b', borderColor: '#334155', color: '#f1f5f9', fontSize: 12 }}
        >
          <option value="All">All Regions</option>
          {['INDIA','MEENA','UK','US'].map(r => <option key={r} value={r}>{r}</option>)}
        </select>

        <div style={{ fontSize: 12, color: '#64748b', marginLeft: 'auto' }}>
          {filtered.length} of {summary.totalOMs} OMs
        </div>
      </div>

      {/* Leaderboard Table */}
      <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #1e3a5f' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: '#1e3a5f' }}>
              <th style={{ padding: '8px 12px', color: '#93c5fd', textAlign: 'left', border: '1px solid #1e3a5f', fontSize: 11, width: 28 }}>#</th>
              <th style={{ padding: '8px 12px', color: '#93c5fd', textAlign: 'left', border: '1px solid #1e3a5f', fontSize: 11, minWidth: 150 }}>OM Name</th>
              <th style={{ padding: '8px 10px', color: '#93c5fd', textAlign: 'center', border: '1px solid #1e3a5f', fontSize: 11 }}>Region</th>
              {colHeader('Total', 'total')}
              {colHeader('Live', 'live')}
              {colHeader('Drop', 'drop')}
              {colHeader('Open', 'open')}
              {colHeader('Live %', 'liveRate')}
              {colHeader('Drop %', 'dropRate')}
              {colHeader('Avg TTGL', 'avgTTGL')}
              {colHeader('SLA %', 'slaPct')}
              {colHeader('MRR Realised', 'mrrRealised')}
              <th style={{ padding: '8px 10px', color: '#93c5fd', textAlign: 'center', border: '1px solid #1e3a5f', fontSize: 11, width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((om, i) => {
              const isSelected = selectedOM?.name === om.name;
              return (
                <tr
                  key={om.name}
                  style={{
                    background: isSelected ? '#1e3a5f' : i % 2 === 0 ? '#1e293b' : '#162032',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onClick={() => setSelectedOM(isSelected ? null : om)}
                  onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.background = '#273549'; }}
                  onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.background = i % 2 === 0 ? '#1e293b' : '#162032'; }}
                >
                  {/* Rank */}
                  <td style={{ padding: '7px 12px', color: '#475569', border: '1px solid #0f172a', fontWeight: 600 }}>{i + 1}</td>

                  {/* Name */}
                  <td style={{ padding: '7px 12px', color: '#f1f5f9', border: '1px solid #0f172a', fontWeight: 600 }}>{om.name}</td>

                  {/* Region badges */}
                  <td style={{ padding: '7px 10px', textAlign: 'center', border: '1px solid #0f172a' }}>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
                      {om.regions.map(r => (
                        <span key={r} style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: REGION_COLORS[r] || '#475569', color: '#fff', fontWeight: 700, letterSpacing: 0.5 }}>{r}</span>
                      ))}
                    </div>
                  </td>

                  {/* Total */}
                  <td style={{ padding: '7px 10px', color: '#cbd5e1', textAlign: 'center', border: '1px solid #0f172a', fontFamily: 'monospace' }}>{om.total}</td>

                  {/* Live */}
                  <td style={{ padding: '7px 10px', color: '#60a5fa', textAlign: 'center', border: '1px solid #0f172a', fontFamily: 'monospace', fontWeight: 600 }}>{om.live}</td>

                  {/* Drop */}
                  <td style={{ padding: '7px 10px', color: om.drop > 0 ? '#f87171' : '#475569', textAlign: 'center', border: '1px solid #0f172a', fontFamily: 'monospace' }}>{om.drop || '—'}</td>

                  {/* Open */}
                  <td style={{ padding: '7px 10px', color: om.open > 0 ? '#fbbf24' : '#475569', textAlign: 'center', border: '1px solid #0f172a', fontFamily: 'monospace' }}>{om.open || '—'}</td>

                  {/* Live % */}
                  <td style={{ padding: '7px 10px', textAlign: 'center', border: '1px solid #0f172a' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <span style={{ color: om.liveRate >= 0.8 ? '#22c55e' : om.liveRate >= 0.6 ? '#f59e0b' : '#ef4444', fontFamily: 'monospace', fontWeight: 600 }}>
                        {(om.liveRate * 100).toFixed(0)}%
                      </span>
                      <div style={{ width: 40, height: 3, background: '#1e293b', borderRadius: 2 }}>
                        <div style={{ width: `${om.liveRate * 100}%`, height: '100%', background: om.liveRate >= 0.8 ? '#22c55e' : om.liveRate >= 0.6 ? '#f59e0b' : '#ef4444', borderRadius: 2 }} />
                      </div>
                    </div>
                  </td>

                  {/* Drop % */}
                  <td style={{ padding: '7px 10px', textAlign: 'center', border: '1px solid #0f172a' }}>
                    <span style={{ color: om.dropRate > 0.15 ? '#ef4444' : om.dropRate > 0.08 ? '#f59e0b' : '#475569', fontFamily: 'monospace' }}>
                      {(om.dropRate * 100).toFixed(0)}%
                    </span>
                  </td>

                  {/* Avg TTGL */}
                  <td style={{ padding: '7px 10px', textAlign: 'center', border: '1px solid #0f172a', fontFamily: 'monospace' }}>
                    <span style={{ color: ttglColor(om.avgTTGL), fontWeight: 600 }}>{om.live > 0 ? `${om.avgTTGL}d` : '—'}</span>
                  </td>

                  {/* SLA % */}
                  <td style={{ padding: '7px 10px', textAlign: 'center', border: '1px solid #0f172a' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <span style={{ color: slaColor(om.slaPct), fontFamily: 'monospace', fontWeight: 600 }}>
                        {om.live > 0 ? `${(om.slaPct * 100).toFixed(0)}%` : '—'}
                      </span>
                      {om.live > 0 && (
                        <div style={{ width: 40, height: 3, background: '#1e293b', borderRadius: 2 }}>
                          <div style={{ width: `${om.slaPct * 100}%`, height: '100%', background: slaColor(om.slaPct), borderRadius: 2 }} />
                        </div>
                      )}
                    </div>
                  </td>

                  {/* MRR Realised */}
                  <td style={{ padding: '7px 10px', textAlign: 'center', border: '1px solid #0f172a', fontFamily: 'monospace', color: '#34d399' }}>
                    {om.mrrRealised > 0 ? fmtCur(om.mrrRealised) : '—'}
                  </td>

                  {/* Expand arrow */}
                  <td style={{ padding: '7px 10px', textAlign: 'center', border: '1px solid #0f172a', color: '#475569' }}>
                    <ChevronRight size={14} style={{ transform: isSelected ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#475569' }}>No OMs match the current filters.</div>
      )}
      </>}
    </div>
  );
};
