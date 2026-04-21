import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Clock, TrendingUp, Users } from 'lucide-react';
import { TTGLSection } from './components/TTGLSection';
import { RevRecSection } from './components/RevRecSection';
import { OMSection } from './components/OMSection';

type Tab = 'ttgl' | 'revrec' | 'om';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('ttgl');

  const tabButtonStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    border: `1px solid ${isActive ? '#3b82f6' : '#334155'}`,
    borderRadius: '6px',
    backgroundColor: isActive ? '#1e3a5f' : '#0f172a',
    color: isActive ? '#f1f5f9' : '#94a3b8',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: isActive ? 600 : 500,
    transition: 'all 0.2s',
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0e27', padding: '20px' }}>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button
          style={tabButtonStyle(activeTab === 'ttgl')}
          onClick={() => setActiveTab('ttgl')}
        >
          <Clock size={16} />
          Time to Go Live (TTGL)
        </button>
        <button
          style={tabButtonStyle(activeTab === 'revrec')}
          onClick={() => setActiveTab('revrec')}
        >
          <TrendingUp size={16} />
          Revenue Realisation
        </button>
        <button
          style={tabButtonStyle(activeTab === 'om')}
          onClick={() => setActiveTab('om')}
        >
          <Users size={16} />
          OM Performance
        </button>
      </div>

      <div style={{ backgroundColor: '#0f172a' }}>
        {activeTab === 'ttgl' && <TTGLSection />}
        {activeTab === 'revrec' && <RevRecSection />}
        {activeTab === 'om' && <OMSection />}
      </div>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(<App />);
