import { useState, useEffect } from 'react';
import axios from 'axios';
import Login from './Login';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';

const PALETTES = {
  dark: {
    bg: '#0a0c10',
    bgGradient: 'radial-gradient(circle at 20% 0%, #131722 0%, #0a0c10 55%)',
    card: '#12151c',
    cardAlt: '#0a0c10',
    cardBorder: '#232733',
    headerGrad: 'linear-gradient(90deg, #12151c 0%, #161a24 100%)',
    theadGrad: 'linear-gradient(90deg, #171b25, #1c2029)',
    pill: '#1c2029',
    text: '#eef0f4',
    textMuted: '#8a90a0',
    accent: '#5b8dff',
    accent2: '#7c5cff',
    critical: '#ff4d5e',
    high: '#ff9f43',
    medium: '#ffd93d',
    low: '#2ecc71',
    scrollTrack: '#0a0c10',
    scrollThumb: '#2a2f3d',
  },
  light: {
    bg: '#f4f6fb',
    bgGradient: 'radial-gradient(circle at 20% 0%, #ffffff 0%, #eef1f8 55%)',
    card: '#ffffff',
    cardAlt: '#f4f6fb',
    cardBorder: '#e1e5ee',
    headerGrad: 'linear-gradient(90deg, #ffffff 0%, #f4f6fb 100%)',
    theadGrad: 'linear-gradient(90deg, #f0f2f8, #e9ecf5)',
    pill: '#eef1f8',
    text: '#1b1f2a',
    textMuted: '#6b7180',
    accent: '#3b6fe0',
    accent2: '#6a4de0',
    critical: '#e0324a',
    high: '#e5822a',
    medium: '#d9a900',
    low: '#1f9d55',
    scrollTrack: '#eef1f8',
    scrollThumb: '#c7cce0',
  }
};

function App() {
  const [themeName, setThemeName] = useState(localStorage.getItem('theme') || 'dark');
  const COLORS = PALETTES[themeName];

  const toggleTheme = () => {
    const next = themeName === 'dark' ? 'light' : 'dark';
    setThemeName(next);
    localStorage.setItem('theme', next);
  };

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const [sourceIp, setSourceIp] = useState('8.8.8.8');
  const [destIp, setDestIp] = useState('192.168.1.99');
  const [scenario, setScenario] = useState('normal');
  const [scenarios, setScenarios] = useState({ normal: {}, attack: {} });
  const [scenariosLoaded, setScenariosLoaded] = useState(false);

  const [lookupIp, setLookupIp] = useState('1.1.1.1');
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  const [filterLevel, setFilterLevel] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const [token, setToken] = useState(localStorage.getItem('token'));
  const [username, setUsername] = useState(localStorage.getItem('username'));

  useEffect(() => {
    fetchAlerts();
    axios.get('http://127.0.0.1:8000/sample-scenarios')
      .then((response) => {
        setScenarios(response.data);
        setScenariosLoaded(true);
      })
      .catch(() => setScenariosLoaded(false));

    const interval = setInterval(() => fetchAlerts(), 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = () => {
    setLoading(true);
    axios.get('http://127.0.0.1:8000/alerts')
      .then((response) => {
        setAlerts(response.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Could not load alerts. Is the backend running?');
        setLoading(false);
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setLastResult(null);

    const payload = {
      source_ip: sourceIp,
      dest_ip: destIp,
      event_type: 'manual_submission',
      features: scenarios[scenario]
    };

    axios.post('http://127.0.0.1:8000/events', payload)
      .then((response) => {
        setLastResult(response.data);
        setSubmitting(false);
        fetchAlerts();
      })
      .catch(() => {
        setLastResult({ error: 'Submission failed. Check backend connection.' });
        setSubmitting(false);
      });
  };

  const handleLookup = (e) => {
    e.preventDefault();
    setLookupLoading(true);
    setLookupResult(null);

    axios.get(`http://127.0.0.1:8000/identify/${lookupIp}`)
      .then((response) => {
        setLookupResult(response.data);
        setLookupLoading(false);
      })
      .catch(() => {
        setLookupResult({ error: 'Lookup failed.' });
        setLookupLoading(false);
      });
  };

  const handleLoginSuccess = (newToken, newUsername) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('username', newUsername);
    setToken(newToken);
    setUsername(newUsername);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setToken(null);
    setUsername(null);
  };

  const getRiskColor = (level) => {
    if (level === 'Critical') return COLORS.critical;
    if (level === 'High') return COLORS.high;
    if (level === 'Medium') return COLORS.medium;
    return COLORS.low;
  };

  const RiskGauge = ({ score, level }) => {
    const data = [{ name: 'risk', value: score, fill: getRiskColor(level) }];
    return (
      <div style={{ width: '150px', height: '100px', position: 'relative' }}>
        <ResponsiveContainer>
          <RadialBarChart innerRadius="70%" outerRadius="100%" data={data} startAngle={180} endAngle={0}>
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar dataKey="value" background={{ fill: COLORS.pill }} cornerRadius={8} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div style={{ position: 'absolute', top: '58%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 800, color: COLORS.text }}>{score}</div>
          <div style={{ fontSize: '11px', color: COLORS.textMuted }}>/ 100</div>
        </div>
      </div>
    );
  };

  const getChartData = () => {
    const counts = {};
    alerts.forEach((a) => { counts[a.threat_type] = (counts[a.threat_type] || 0) + 1; });
    return Object.keys(counts).map((type) => ({ threat_type: type, count: counts[type] }));
  };

  const getStats = () => {
    const total = alerts.length;
    const critical = alerts.filter(a => a.risk_level === 'Critical').length;
    const high = alerts.filter(a => a.risk_level === 'High').length;
    const uniqueThreats = new Set(alerts.map(a => a.threat_type)).size;
    return { total, critical, high, uniqueThreats };
  };

  const getFilteredAlerts = () => {
    return alerts.filter((alert) => {
      const matchesLevel = filterLevel === 'All' || alert.risk_level === filterLevel;
      const matchesSearch = searchTerm === '' ||
        alert.threat_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.institution.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesLevel && matchesSearch;
    });
  };
    const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };
    const exportToCSV = () => {
    const headers = ['Event ID', 'Threat Type', 'Risk Score', 'Risk Level', 'Institution', 'Status', 'Created'];
    const rows = getFilteredAlerts().map(a => [
      a.event_id, a.threat_type, a.risk_score, a.risk_level, a.institution, a.status, a.created_at
    ]);
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `threat_alerts_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const clearAllAlerts = () => {
    if (!window.confirm('Are you sure you want to delete ALL alerts? This cannot be undone.')) {
      return;
    }
    axios.delete('http://127.0.0.1:8000/alerts')
      .then(() => {
        fetchAlerts();
      })
      .catch(() => {
        alert('Failed to clear alerts.');
      });
  };


  if (!token) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const cardStyle = {
    backgroundColor: COLORS.card,
    border: `1px solid ${COLORS.cardBorder}`,
    borderRadius: '14px',
    padding: '24px',
    marginBottom: '22px',
    boxShadow: themeName === 'dark' ? '0 4px 24px rgba(0,0,0,0.35)' : '0 4px 18px rgba(30,40,70,0.08)'
  };

  const inputStyle = {
    padding: '10px 13px',
    backgroundColor: COLORS.cardAlt,
    border: `1px solid ${COLORS.cardBorder}`,
    borderRadius: '7px',
    color: COLORS.text,
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.15s ease'
  };

  const buttonStyle = {
    padding: '10px 24px',
    cursor: 'pointer',
    backgroundImage: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accent2})`,
    border: 'none',
    borderRadius: '7px',
    color: '#fff',
    fontWeight: 700,
    fontSize: '14px',
    boxShadow: '0 3px 12px rgba(91,141,255,0.35)'
  };

  const secondaryButtonStyle = {
    ...buttonStyle,
    backgroundImage: 'none',
    backgroundColor: COLORS.pill,
    color: COLORS.text,
    boxShadow: 'none',
    border: `1px solid ${COLORS.cardBorder}`
  };

  const statCards = [
    { label: 'Total Alerts', value: getStats().total, color: COLORS.accent, icon: '📊' },
    { label: 'Critical', value: getStats().critical, color: COLORS.critical, icon: '🔴' },
    { label: 'High', value: getStats().high, color: COLORS.high, icon: '🟠' },
    { label: 'Threat Types Seen', value: getStats().uniqueThreats, color: COLORS.accent2, icon: '🧬' },
  ];

  return (
    <div style={{
      fontFamily: "'Segoe UI', Arial, sans-serif",
      background: COLORS.bgGradient,
      backgroundColor: COLORS.bg,
      color: COLORS.text,
      minHeight: '100vh',
      paddingBottom: '50px',
      transition: 'background-color 0.2s ease, color 0.2s ease'
    }}>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        ::-webkit-scrollbar { width: 10px; height: 10px; }
        ::-webkit-scrollbar-track { background: ${COLORS.scrollTrack}; }
        ::-webkit-scrollbar-thumb { background: ${COLORS.scrollThumb}; border-radius: 10px; }
        .app-input:focus, .app-select:focus { border-color: ${COLORS.accent} !important; box-shadow: 0 0 0 3px rgba(91,141,255,0.15); }
        .app-btn { transition: transform 0.12s ease, box-shadow 0.12s ease, opacity 0.12s ease; }
        .app-btn:hover { transform: translateY(-1px); opacity: 0.92; }
        .app-btn:active { transform: translateY(0); }
        .stat-card { transition: transform 0.15s ease, border-color 0.15s ease; }
        .stat-card:hover { transform: translateY(-3px); border-color: ${COLORS.accent}; }
        .app-row:hover { background-color: ${COLORS.pill} !important; }
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
        .live-dot { animation: pulse 1.6s infinite; }
        .theme-toggle { transition: background-color 0.2s ease; cursor: pointer; }
      `}</style>

      {/* Header bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '20px 32px', borderBottom: `1px solid ${COLORS.cardBorder}`,
        background: COLORS.headerGrad,
        marginBottom: '28px', flexWrap: 'wrap', gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '10px',
            background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accent2})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px',
            boxShadow: '0 4px 14px rgba(91,141,255,0.4)'
          }}>🛡️</div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '0.3px' }}>Threat Detection Dashboard</div>
            <div style={{ fontSize: '12px', color: COLORS.low, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span className="live-dot" style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: COLORS.low, display: 'inline-block' }}></span>
              Live monitoring
            </div>
          </div>
        </div>
        <div style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            onClick={toggleTheme}
            className="theme-toggle"
            title="Toggle theme"
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px',
              backgroundColor: COLORS.pill, borderRadius: '20px', border: `1px solid ${COLORS.cardBorder}`,
              fontSize: '13px', userSelect: 'none'
            }}
          >
            <span>{themeName === 'dark' ? '🌙' : '☀️'}</span>
            <span>{themeName === 'dark' ? 'Dark' : 'Light'}</span>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px',
            backgroundColor: COLORS.pill, borderRadius: '20px', border: `1px solid ${COLORS.cardBorder}`
          }}>
            <span style={{
              width: '26px', height: '26px', borderRadius: '50%',
              background: `linear-gradient(135deg, ${COLORS.accent2}, ${COLORS.accent})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: 800, color: '#fff'
            }}>{username?.[0]?.toUpperCase()}</span>
            <strong>{username}</strong>
          </div>
          <button onClick={handleLogout} className="app-btn" style={secondaryButtonStyle}>
            Logout
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '980px', margin: '0 auto', padding: '0 20px' }}>

        {/* Event submission */}
        <div style={{ ...cardStyle, borderLeft: `4px solid ${COLORS.accent}` }}>
          <h3 style={{ marginTop: 0, marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🧪 Submit a Test Event
          </h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: COLORS.textMuted, marginBottom: '6px' }}>Source IP</label>
              <input className="app-input" type="text" value={sourceIp} onChange={(e) => setSourceIp(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: COLORS.textMuted, marginBottom: '6px' }}>Destination IP</label>
              <input className="app-input" type="text" value={destIp} onChange={(e) => setDestIp(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: COLORS.textMuted, marginBottom: '6px' }}>Traffic Pattern</label>
              <select className="app-select" value={scenario} onChange={(e) => setScenario(e.target.value)} style={inputStyle}>
                <option value="normal">Normal Traffic</option>
                <option value="attack">Suspicious / Attack-like Traffic</option>
              </select>
            </div>
            <button type="submit" disabled={submitting || !scenariosLoaded} className="app-btn" style={buttonStyle}>
              {submitting ? 'Analyzing...' : (scenariosLoaded ? 'Submit Event' : 'Loading...')}
            </button>
          </form>

          {lastResult && !lastResult.error && (
            <div style={{
              marginTop: '20px', padding: '16px', backgroundColor: COLORS.cardAlt, borderRadius: '10px',
              display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap',
              border: `1px solid ${COLORS.cardBorder}`
            }}>
              <RiskGauge score={lastResult.risk_score} level={lastResult.risk_level} />
              <div style={{ fontSize: '14px', lineHeight: 2 }}>
                <div><span style={{ color: COLORS.textMuted }}>Threat Type:</span> <strong>{lastResult.threat_type}</strong></div>
                <div><span style={{ color: COLORS.textMuted }}>Risk Level:</span>{' '}
                  <span style={{
                    color: '#fff', backgroundColor: getRiskColor(lastResult.risk_level),
                    padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 700
                  }}>{lastResult.risk_level}</span>
                </div>
                <div><span style={{ color: COLORS.textMuted }}>Institution:</span> <strong>{lastResult.institution}</strong></div>
              </div>
            </div>
          )}
          {lastResult && lastResult.error && (
            <p style={{ color: COLORS.critical, marginTop: '15px' }}>{lastResult.error}</p>
          )}
        </div>

        {/* Institution lookup */}
        <div style={{ ...cardStyle, borderLeft: `4px solid ${COLORS.accent2}` }}>
          <h3 style={{ marginTop: 0, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🏢 Institution Identification Lookup
          </h3>
          <p style={{ color: COLORS.textMuted, fontSize: '13px', marginTop: 0, marginBottom: '16px' }}>
            Check which organization an IP address belongs to, independent of event analysis.
          </p>
          <form onSubmit={handleLookup} style={{ display: 'flex', gap: '10px' }}>
            <input
              className="app-input" type="text" value={lookupIp} onChange={(e) => setLookupIp(e.target.value)}
              placeholder="Enter IP address" style={{ ...inputStyle, flex: 1 }}
            />
            <button type="submit" disabled={lookupLoading} className="app-btn" style={buttonStyle}>
              {lookupLoading ? 'Looking up...' : 'Lookup'}
            </button>
          </form>

          {lookupResult && !lookupResult.error && (
            <div style={{
              marginTop: '15px', padding: '14px', backgroundColor: COLORS.cardAlt, borderRadius: '10px',
              fontSize: '14px', lineHeight: 2, border: `1px solid ${COLORS.cardBorder}`
            }}>
              <div><span style={{ color: COLORS.textMuted }}>IP Address:</span> <strong>{lookupResult.ip_address}</strong></div>
              <div><span style={{ color: COLORS.textMuted }}>Institution:</span> <strong>{lookupResult.institution}</strong></div>
              <div>
                <span style={{ color: COLORS.textMuted }}>Confidence:</span> <strong>{(lookupResult.confidence * 100).toFixed(0)}%</strong>
                <span style={{ color: COLORS.textMuted, fontSize: '12px', marginLeft: '8px', opacity: 0.7 }}>(best-effort, not a confirmed match)</span>
              </div>
            </div>
          )}
          {lookupResult && lookupResult.error && (
            <p style={{ color: COLORS.critical, marginTop: '15px' }}>{lookupResult.error}</p>
          )}
        </div>

        {/* Stat cards */}
        {!loading && !error && (
          <div style={{ display: 'flex', gap: '16px', marginBottom: '22px', flexWrap: 'wrap' }}>
            {statCards.map((stat, i) => (
              <div key={i} className="stat-card" style={{
                ...cardStyle, flex: 1, minWidth: '160px', textAlign: 'center',
                marginBottom: 0, padding: '20px', cursor: 'default'
              }}>
                <div style={{ fontSize: '22px', marginBottom: '6px' }}>{stat.icon}</div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: stat.color }}>{stat.value}</div>
                <div style={{ color: COLORS.textMuted, fontSize: '13px', marginTop: '4px' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Chart */}
        {!loading && !error && alerts.length > 0 && (
          <div style={cardStyle}>
            <h3 style={{ marginTop: 0, marginBottom: '15px' }}>📈 Threat Type Distribution</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={getChartData()}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.accent2} />
                    <stop offset="100%" stopColor={COLORS.accent} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.cardBorder} />
                <XAxis dataKey="threat_type" stroke={COLORS.textMuted} fontSize={12} />
                <YAxis stroke={COLORS.textMuted} allowDecimals={false} fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: COLORS.cardAlt, border: `1px solid ${COLORS.cardBorder}`, borderRadius: '8px', color: COLORS.text }} />
                <Bar dataKey="count" fill="url(#barGradient)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div style={{ textAlign: 'center', marginBottom: '18px', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={fetchAlerts} className="app-btn" style={secondaryButtonStyle}>
            🔄 Refresh Alerts
          </button>
          <button onClick={exportToCSV} disabled={alerts.length === 0} className="app-btn" style={secondaryButtonStyle}>
            ⬇️ Export CSV
          </button>
          <button
            onClick={clearAllAlerts}
            disabled={alerts.length === 0}
            className="app-btn"
            style={{ ...secondaryButtonStyle, color: COLORS.critical, borderColor: COLORS.critical }}
          >
            🗑️ Clear All Alerts
          </button>
        </div>

        {loading && <p style={{ textAlign: 'center', color: COLORS.textMuted }}>Loading alerts...</p>}
        {error && <p style={{ color: COLORS.critical, textAlign: 'center' }}>{error}</p>}
        {!loading && !error && alerts.length === 0 && <p style={{ textAlign: 'center', color: COLORS.textMuted }}>No alerts yet.</p>}

        {!loading && !error && alerts.length > 0 && (
          <>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                className="app-input" type="text" placeholder="🔍 Search threat type or institution..."
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                style={{ ...inputStyle, flex: 1, minWidth: '220px' }}
              />
              <select className="app-select" value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} style={inputStyle}>
                <option value="All">All Risk Levels</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
              <span style={{ color: COLORS.textMuted, fontSize: '13px' }}>
                Showing {getFilteredAlerts().length} of {alerts.length}
              </span>
            </div>

            <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: COLORS.theadGrad, textAlign: 'left' }}>
                    {['Event ID', 'Threat Type', 'Risk Score', 'Risk Level', 'Institution', 'Status', 'Created'].map((h) => (
                      <th key={h} style={{ padding: '13px 16px', color: COLORS.textMuted, fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                               <tbody>
                  {getFilteredAlerts().map((alert) => (
                    <>
                      <tr
                        key={alert.id}
                        className="app-row"
                        onClick={() => toggleExpand(alert.id)}
                        style={{ borderTop: `1px solid ${COLORS.cardBorder}`, transition: 'background-color 0.1s', cursor: 'pointer' }}
                      >
                        <td style={{ padding: '13px 16px', color: COLORS.textMuted }}>
                          <span style={{ marginRight: '6px', display: 'inline-block', transition: 'transform 0.15s', transform: expandedId === alert.id ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
                          #{alert.event_id}
                        </td>
                        <td style={{ padding: '13px 16px', fontWeight: 700 }}>{alert.threat_type}</td>
                        <td style={{ padding: '13px 16px' }}>
                          <span style={{ fontWeight: 700, color: getRiskColor(alert.risk_level) }}>{alert.risk_score}</span>
                        </td>
                        <td style={{ padding: '13px 16px' }}>
                          <span style={{
                            backgroundColor: getRiskColor(alert.risk_level), color: '#fff',
                            padding: '3px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700
                          }}>
                            {alert.risk_level}
                          </span>
                        </td>
                        <td style={{ padding: '13px 16px', color: COLORS.textMuted }}>{alert.institution}</td>
                        <td style={{ padding: '13px 16px' }}>
                          <span style={{ color: COLORS.low, fontWeight: 600, fontSize: '13px' }}>● {alert.status}</span>
                        </td>
                        <td style={{ padding: '13px 16px', color: COLORS.textMuted, fontSize: '13px' }}>
                          {new Date(alert.created_at).toLocaleString()}
                        </td>
                      </tr>
                      {expandedId === alert.id && (
                        <tr style={{ backgroundColor: COLORS.cardAlt }}>
                          <td colSpan={7} style={{ padding: '20px 30px', borderTop: `1px solid ${COLORS.cardBorder}` }}>
                            <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap', fontSize: '13px' }}>
                              <div>
                                <div style={{ color: COLORS.textMuted, marginBottom: '4px' }}>Alert ID</div>
                                <strong>{alert.id}</strong>
                              </div>
                              <div>
                                <div style={{ color: COLORS.textMuted, marginBottom: '4px' }}>Related Event ID</div>
                                <strong>{alert.event_id}</strong>
                              </div>
                              <div>
                                <div style={{ color: COLORS.textMuted, marginBottom: '4px' }}>Threat Type</div>
                                <strong>{alert.threat_type}</strong>
                              </div>
                              <div>
                                <div style={{ color: COLORS.textMuted, marginBottom: '4px' }}>Risk Score</div>
                                <strong style={{ color: getRiskColor(alert.risk_level) }}>{alert.risk_score} / 100</strong>
                              </div>
                              <div>
                                <div style={{ color: COLORS.textMuted, marginBottom: '4px' }}>Institution</div>
                                <strong>{alert.institution}</strong>
                              </div>
                              <div>
                                <div style={{ color: COLORS.textMuted, marginBottom: '4px' }}>Full Timestamp</div>
                                <strong>{new Date(alert.created_at).toString()}</strong>
                              </div>
                              <div>
                                <div style={{ color: COLORS.textMuted, marginBottom: '4px' }}>Status</div>
                                <strong>{alert.status}</strong>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;