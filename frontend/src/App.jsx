import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from './api';
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

const getCountryFlag = (countryCode) => {
  if (!countryCode || countryCode === 'UNK' || countryCode === 'Unknown') return '🌐';
  if (countryCode === 'LAN') return '🏠';
  try {
    return countryCode
      .toUpperCase()
      .slice(0, 2)
      .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
  } catch (e) {
    return '🌐';
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
  const [scenario, setScenario] = useState('attack');
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

  // Next-Level Feature States: SOAR, Live Stream, Model Metrics
  const [socStreaming, setSocStreaming] = useState(false);
  const [streamCount, setStreamCount] = useState(0);
  const [mitigatingId, setMitigatingId] = useState(null);
  const [activeMitigationAlert, setActiveMitigationAlert] = useState(null);
  const [showMetricsModal, setShowMetricsModal] = useState(false);
  const [modelMetrics, setModelMetrics] = useState(null);
  const [copiedRule, setCopiedRule] = useState(null);

  useEffect(() => {
    fetchAlerts();
    axios.get(`${API_URL}/sample-scenarios`)
      .then((response) => {
        setScenarios(response.data);
        setScenariosLoaded(true);
      })
      .catch(() => setScenariosLoaded(false));

    const interval = setInterval(() => fetchAlerts(), 5000);
    return () => clearInterval(interval);
  }, []);

  // Real-Time SOC Traffic Streamer Effect
  useEffect(() => {
    if (!socStreaming || !scenariosLoaded) return;

    const streamIps = [
      { ip: '185.220.101.5', pattern: 'attack' },
      { ip: '8.8.8.8', pattern: 'normal' },
      { ip: '45.33.32.156', pattern: 'attack' },
      { ip: '1.1.1.1', pattern: 'normal' },
      { ip: '103.251.167.20', pattern: 'attack' },
      { ip: '192.168.1.105', pattern: 'normal' },
      { ip: '194.26.29.112', pattern: 'attack' },
      { ip: '172.217.16.206', pattern: 'normal' }
    ];

    const streamTimer = setInterval(() => {
      const choice = streamIps[Math.floor(Math.random() * streamIps.length)];
      const payload = {
        source_ip: choice.ip,
        dest_ip: '192.168.1.99',
        event_type: 'live_soc_stream',
        features: scenarios[choice.pattern] || {}
      };

      axios.post(`${API_URL}/events`, payload)
        .then((res) => {
          setStreamCount((c) => c + 1);
          if (res.data.alert_created) {
            fetchAlerts();
          }
        })
        .catch(() => {});
    }, 4200);

    return () => clearInterval(streamTimer);
  }, [socStreaming, scenariosLoaded, scenarios]);

  const fetchAlerts = () => {
    setLoading(true);
    axios.get(`${API_URL}/alerts`)
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
      features: scenarios[scenario] || {}
    };

    axios.post(`${API_URL}/events`, payload)
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

    axios.get(`${API_URL}/identify/${lookupIp}`)
      .then((response) => {
        setLookupResult(response.data);
        setLookupLoading(false);
      })
      .catch(() => {
        setLookupResult({ error: 'Lookup failed.' });
        setLookupLoading(false);
      });
  };

  const handleMitigate = (e, alert) => {
    e.stopPropagation();
    setMitigatingId(alert.id);
    axios.patch(`${API_URL}/alerts/${alert.id}/status`, { status: 'mitigated' })
      .then(() => {
        setAlerts((prev) => prev.map((a) => (a.id === alert.id ? { ...a, status: 'mitigated' } : a)));
        setActiveMitigationAlert({ ...alert, status: 'mitigated' });
        setMitigatingId(null);
      })
      .catch(() => {
        setMitigatingId(null);
        window.alert('Failed to update mitigation status.');
      });
  };

  const copyRule = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedRule(key);
    setTimeout(() => setCopiedRule(null), 2200);
  };

  const openMetricsModal = () => {
    setShowMetricsModal(true);
    if (!modelMetrics) {
      axios.get(`${API_URL}/model-metrics`)
        .then((res) => setModelMetrics(res.data))
        .catch(() => {});
    }
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
    const mitigated = alerts.filter(a => a.status === 'mitigated').length;
    return { total, critical, high, mitigated };
  };

  const getFilteredAlerts = () => {
    return alerts.filter((alert) => {
      const matchesLevel = filterLevel === 'All' || alert.risk_level === filterLevel;
      const matchesSearch = searchTerm === '' ||
        alert.threat_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.institution?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.city?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesLevel && matchesSearch;
    });
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const exportToCSV = () => {
    const headers = ['Event ID', 'Threat Type', 'Risk Score', 'Risk Level', 'Country', 'City', 'Institution', 'Status', 'Created'];
    const rows = getFilteredAlerts().map(a => [
      a.event_id, a.threat_type, a.risk_score, a.risk_level, a.country || 'Unknown', a.city || 'Unknown', a.institution, a.status, a.created_at
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
    axios.delete(`${API_URL}/alerts`)
      .then(() => {
        fetchAlerts();
      })
      .catch(() => {
        window.alert('Failed to clear alerts.');
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

  const stats = getStats();
  const statCards = [
    { label: 'Total Threats', value: stats.total, color: COLORS.accent, icon: '📊' },
    { label: 'Critical Alerts', value: stats.critical, color: COLORS.critical, icon: '🔴' },
    { label: 'High Priority', value: stats.high, color: COLORS.high, icon: '🟠' },
    { label: 'Mitigated (SOAR)', value: stats.mitigated, color: COLORS.low, icon: '🛡️' },
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
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.3;} }
        .live-dot { animation: pulse 1.4s infinite; }
        .theme-toggle { transition: background-color 0.2s ease; cursor: pointer; }
      `}</style>

      {/* Header bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '20px 32px', borderBottom: `1px solid ${COLORS.cardBorder}`,
        background: COLORS.headerGrad,
        marginBottom: '28px', flexWrap: 'wrap', gap: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '10px',
            background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accent2})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px',
            boxShadow: '0 4px 14px rgba(91,141,255,0.4)'
          }}>🛡️</div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '0.3px' }}>AI Threat Detection & Defense SOC</div>
            <div style={{ fontSize: '12px', color: COLORS.low, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span className="live-dot" style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: COLORS.low, display: 'inline-block' }}></span>
              Live Enterprise Telemetry Engine
            </div>
          </div>
        </div>

        {/* Action Controls in Header */}
        <div style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          
          {/* Real-Time SOC Streamer Toggle */}
          <button
            onClick={() => setSocStreaming(!socStreaming)}
            className="app-btn"
            style={{
              ...secondaryButtonStyle,
              borderColor: socStreaming ? COLORS.critical : COLORS.cardBorder,
              color: socStreaming ? '#fff' : COLORS.text,
              backgroundColor: socStreaming ? 'rgba(255,77,94,0.18)' : COLORS.pill,
              display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 14px'
            }}
          >
            <span className={socStreaming ? 'live-dot' : ''} style={{
              width: '8px', height: '8px', borderRadius: '50%',
              backgroundColor: socStreaming ? COLORS.critical : COLORS.textMuted
            }}></span>
            {socStreaming ? `Live SOC Stream Active (${streamCount})` : 'Start Live SOC Stream'}
          </button>

          {/* Model Benchmarks Modal Trigger */}
          <button onClick={openMetricsModal} className="app-btn" style={{ ...secondaryButtonStyle, padding: '8px 14px' }}>
            📊 Model Analytics
          </button>

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
          <button onClick={handleLogout} className="app-btn" style={{ ...secondaryButtonStyle, padding: '7px 14px' }}>
            Logout
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '0 20px' }}>

        {/* Live SOC Streamer Info Bar */}
        {socStreaming && (
          <div style={{
            padding: '12px 18px', backgroundColor: 'rgba(255, 77, 94, 0.12)',
            border: `1px solid ${COLORS.critical}`, borderRadius: '10px', marginBottom: '20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="live-dot" style={{ fontSize: '18px' }}>📡</span>
              <div>
                <strong>Autonomous SOC Traffic Stream Active</strong>
                <div style={{ fontSize: '12px', color: COLORS.textMuted }}>
                  Streaming simulated synthetic packet telemetry every 4.2 seconds into the AI classifier.
                </div>
              </div>
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: COLORS.critical }}>
              Packets Processed: {streamCount}
            </div>
          </div>
        )}

        {/* Event submission */}
        <div style={{ ...cardStyle, borderLeft: `4px solid ${COLORS.accent}` }}>
          <h3 style={{ marginTop: 0, marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🧪 Telemetry Analyzer & AI Inference Engine
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
                <option value="attack">DDoS / DoS Attack Pattern</option>
                <option value="normal">Normal / Benign Baseline</option>
              </select>
            </div>
            <button type="submit" disabled={submitting || !scenariosLoaded} className="app-btn" style={buttonStyle}>
              {submitting ? 'Running Inference...' : (scenariosLoaded ? 'Analyze Packet Flow' : 'Loading Model...')}
            </button>
          </form>

          {/* Inference Result & Explainable AI Breakdown */}
          {lastResult && !lastResult.error && (
            <div style={{
              marginTop: '22px', padding: '20px', backgroundColor: COLORS.cardAlt, borderRadius: '12px',
              border: `1px solid ${COLORS.cardBorder}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <RiskGauge score={lastResult.risk_score} level={lastResult.risk_level} />
                <div style={{ fontSize: '14px', lineHeight: 2, flex: 1, minWidth: '240px' }}>
                  <div>
                    <span style={{ color: COLORS.textMuted }}>Threat Type:</span>{' '}
                    <strong style={{ fontSize: '16px', color: COLORS.text }}>{lastResult.threat_type}</strong>
                    <span style={{ marginLeft: '10px', fontSize: '12px', color: COLORS.textMuted }}>
                      (Confidence: {(lastResult.confidence * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div>
                    <span style={{ color: COLORS.textMuted }}>Risk Assessment:</span>{' '}
                    <span style={{
                      color: '#fff', backgroundColor: getRiskColor(lastResult.risk_level),
                      padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 700
                    }}>{lastResult.risk_level}</span>
                  </div>
                  <div>
                    <span style={{ color: COLORS.textMuted }}>Origin Organization:</span>{' '}
                    <strong>{getCountryFlag(lastResult.country_code)} {lastResult.institution}</strong>
                    {lastResult.city !== 'Unknown' && <span style={{ color: COLORS.textMuted, fontSize: '12px', marginLeft: '6px' }}>({lastResult.city}, {lastResult.country})</span>}
                  </div>
                </div>

                {/* Quick SOAR Action Button */}
                {lastResult.firewall_rules && lastResult.risk_score >= 60 && (
                  <div>
                    <button
                      onClick={() => setActiveMitigationAlert({
                        id: lastResult.alert_id || 'Instant',
                        threat_type: lastResult.threat_type,
                        risk_score: lastResult.risk_score,
                        risk_level: lastResult.risk_level,
                        institution: lastResult.institution,
                        country: lastResult.country,
                        city: lastResult.city,
                        firewall_rule: lastResult.firewall_rules.iptables,
                        powershell_rule: lastResult.firewall_rules.powershell,
                        cisco_acl: lastResult.firewall_rules.cisco_acl
                      })}
                      className="app-btn"
                      style={{
                        ...buttonStyle,
                        backgroundColor: COLORS.critical,
                        backgroundImage: 'none',
                        boxShadow: '0 4px 14px rgba(255,77,94,0.4)',
                        fontSize: '13px'
                      }}
                    >
                      🛡️ Generate Firewall Mitigation
                    </button>
                  </div>
                )}
              </div>

              {/* Explainable AI (XAI) Section */}
              {lastResult.explanation && (
                <div style={{
                  padding: '16px', backgroundColor: COLORS.pill, borderRadius: '10px',
                  border: `1px solid ${COLORS.cardBorder}`, marginTop: '14px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '18px' }}>🧠</span>
                    <strong style={{ fontSize: '14px', color: COLORS.accent }}>Explainable AI (XAI) Decision Rationale</strong>
                  </div>
                  <p style={{ margin: '0 0 14px 0', fontSize: '13px', lineHeight: 1.6, color: COLORS.text }}>
                    {lastResult.explanation.summary}
                  </p>

                  {lastResult.explanation.top_factors?.length > 0 && (
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: COLORS.textMuted, marginBottom: '8px', textTransform: 'uppercase' }}>
                        Top Contributing Anomaly Factors:
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                        {lastResult.explanation.top_factors.map((factor, idx) => (
                          <div key={idx} style={{
                            padding: '10px 12px', backgroundColor: COLORS.card, borderRadius: '8px',
                            border: `1px solid ${COLORS.cardBorder}`, fontSize: '12px'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <strong style={{ color: COLORS.text }}>{factor.feature}</strong>
                              <span style={{
                                fontSize: '11px', padding: '1px 6px', borderRadius: '4px',
                                backgroundColor: factor.impact === 'High' ? 'rgba(255,77,94,0.2)' : 'rgba(91,141,255,0.2)',
                                color: factor.impact === 'High' ? COLORS.critical : COLORS.accent, fontWeight: 700
                              }}>{factor.impact} Impact</span>
                            </div>
                            <div style={{ color: COLORS.textMuted, marginBottom: '6px' }}>Value: <span style={{ color: COLORS.text, fontWeight: 600 }}>{factor.value}</span></div>
                            <div style={{ color: COLORS.textMuted, fontSize: '11px', lineHeight: 1.4 }}>{factor.description}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {lastResult && lastResult.error && (
            <p style={{ color: COLORS.critical, marginTop: '15px' }}>{lastResult.error}</p>
          )}
        </div>

        {/* Institution lookup */}
        <div style={{ ...cardStyle, borderLeft: `4px solid ${COLORS.accent2}` }}>
          <h3 style={{ marginTop: 0, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🏢 Geo-IP & Threat Origin Intelligence Lookup
          </h3>
          <p style={{ color: COLORS.textMuted, fontSize: '13px', marginTop: 0, marginBottom: '16px' }}>
            Inspect ASN organization and geographic geolocation for any host address.
          </p>
          <form onSubmit={handleLookup} style={{ display: 'flex', gap: '10px' }}>
            <input
              className="app-input" type="text" value={lookupIp} onChange={(e) => setLookupIp(e.target.value)}
              placeholder="Enter IP address (e.g. 1.1.1.1 or 8.8.8.8)" style={{ ...inputStyle, flex: 1 }}
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
              <div><span style={{ color: COLORS.textMuted }}>Host IP:</span> <strong>{lookupResult.ip_address}</strong></div>
              <div><span style={{ color: COLORS.textMuted }}>Origin Organization:</span> <strong>{lookupResult.institution}</strong></div>
              <div>
                <span style={{ color: COLORS.textMuted }}>Confidence:</span> <strong>{(lookupResult.confidence * 100).toFixed(0)}%</strong>
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

        {/* Threat Distribution Chart */}
        {!loading && !error && alerts.length > 0 && (
          <div style={cardStyle}>
            <h3 style={{ marginTop: 0, marginBottom: '15px' }}>📈 Threat Type Distribution (Live Classified)</h3>
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

        {/* Action button bar */}
        <div style={{ textAlign: 'center', marginBottom: '18px', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={fetchAlerts} className="app-btn" style={secondaryButtonStyle}>
            🔄 Refresh Feed
          </button>
          <button onClick={exportToCSV} disabled={alerts.length === 0} className="app-btn" style={secondaryButtonStyle}>
            ⬇️ Export Forensic CSV
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

        {loading && <p style={{ textAlign: 'center', color: COLORS.textMuted }}>Loading threat telemetry...</p>}
        {error && <p style={{ color: COLORS.critical, textAlign: 'center' }}>{error}</p>}
        {!loading && !error && alerts.length === 0 && <p style={{ textAlign: 'center', color: COLORS.textMuted }}>No security alerts recorded.</p>}

        {/* Alerts Table with SOAR Mitigation Actions */}
        {!loading && !error && alerts.length > 0 && (
          <>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                className="app-input" type="text" placeholder="🔍 Search threat, country, city, or institution..."
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
                Showing {getFilteredAlerts().length} of {alerts.length} incidents
              </span>
            </div>

            <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: COLORS.theadGrad, textAlign: 'left' }}>
                    {['Event ID', 'Threat Type', 'Risk', 'Level', 'Origin / Geo-IP', 'Status', 'SOAR Mitigation'].map((h) => (
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
                        <td style={{ padding: '13px 16px', color: COLORS.textMuted }}>
                          <span style={{ marginRight: '6px', fontSize: '16px' }}>{getCountryFlag(alert.country)}</span>
                          {alert.city && alert.city !== 'Unknown' && <span>{alert.city}, </span>}
                          {alert.country && alert.country !== 'Unknown' && <span>{alert.country} · </span>}
                          <strong>{alert.institution}</strong>
                        </td>
                        <td style={{ padding: '13px 16px' }}>
                          <span style={{
                            color: alert.status === 'mitigated' ? COLORS.low : COLORS.high,
                            fontWeight: 700, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px'
                          }}>
                            <span>{alert.status === 'mitigated' ? '✅' : '🔴'}</span>
                            {alert.status === 'mitigated' ? 'Mitigated' : 'Active Threat'}
                          </span>
                        </td>
                        <td style={{ padding: '13px 16px' }}>
                          {alert.status !== 'mitigated' ? (
                            <button
                              onClick={(e) => handleMitigate(e, alert)}
                              disabled={mitigatingId === alert.id}
                              className="app-btn"
                              style={{
                                padding: '5px 12px', fontSize: '12px', fontWeight: 700,
                                borderRadius: '6px', border: 'none', cursor: 'pointer',
                                backgroundColor: COLORS.critical, color: '#fff'
                              }}
                            >
                              {mitigatingId === alert.id ? 'Applying...' : '🛡️ Mitigate'}
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMitigationAlert(alert);
                              }}
                              className="app-btn"
                              style={{
                                padding: '5px 12px', fontSize: '12px', fontWeight: 700,
                                borderRadius: '6px', border: `1px solid ${COLORS.cardBorder}`, cursor: 'pointer',
                                backgroundColor: COLORS.pill, color: COLORS.low
                              }}
                            >
                              📋 View Rule
                            </button>
                          )}
                        </td>
                      </tr>
                      {expandedId === alert.id && (
                        <tr style={{ backgroundColor: COLORS.cardAlt }}>
                          <td colSpan={7} style={{ padding: '20px 30px', borderTop: `1px solid ${COLORS.cardBorder}` }}>
                            <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', fontSize: '13px', marginBottom: '16px' }}>
                              <div>
                                <div style={{ color: COLORS.textMuted, marginBottom: '4px' }}>Incident Alert ID</div>
                                <strong>#{alert.id}</strong>
                              </div>
                              <div>
                                <div style={{ color: COLORS.textMuted, marginBottom: '4px' }}>Associated Flow Event</div>
                                <strong>#{alert.event_id}</strong>
                              </div>
                              <div>
                                <div style={{ color: COLORS.textMuted, marginBottom: '4px' }}>Threat Classification</div>
                                <strong>{alert.threat_type}</strong>
                              </div>
                              <div>
                                <div style={{ color: COLORS.textMuted, marginBottom: '4px' }}>Risk Evaluation</div>
                                <strong style={{ color: getRiskColor(alert.risk_level) }}>{alert.risk_score} / 100</strong>
                              </div>
                              <div>
                                <div style={{ color: COLORS.textMuted, marginBottom: '4px' }}>Geolocation Origin</div>
                                <strong>{getCountryFlag(alert.country)} {alert.city}, {alert.country}</strong>
                              </div>
                              <div>
                                <div style={{ color: COLORS.textMuted, marginBottom: '4px' }}>Detection Timestamp</div>
                                <strong>{new Date(alert.created_at).toLocaleString()}</strong>
                              </div>
                              <div>
                                <div style={{ color: COLORS.textMuted, marginBottom: '4px' }}>Defense Status</div>
                                <strong style={{ color: alert.status === 'mitigated' ? COLORS.low : COLORS.critical }}>
                                  {alert.status.toUpperCase()}
                                </strong>
                              </div>
                            </div>

                            {/* Explainable AI breakdown inside expanded row */}
                            {(() => {
                              let exp = null;
                              try {
                                exp = typeof alert.explanation === 'string' ? JSON.parse(alert.explanation) : alert.explanation;
                              } catch (e) {
                                exp = null;
                              }
                              return exp && (
                                <div style={{
                                  padding: '12px 16px', backgroundColor: COLORS.pill, borderRadius: '8px',
                                  border: `1px solid ${COLORS.cardBorder}`, marginTop: '10px'
                                }}>
                                  <div style={{ fontWeight: 700, color: COLORS.accent, fontSize: '13px', marginBottom: '4px' }}>
                                    🧠 AI Decision Explanation:
                                  </div>
                                  <div style={{ fontSize: '13px', color: COLORS.text, marginBottom: '8px' }}>
                                    {exp.summary}
                                  </div>
                                  {exp.top_factors && (
                                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                      {exp.top_factors.map((f, i) => (
                                        <div key={i} style={{
                                          padding: '6px 10px', borderRadius: '6px', backgroundColor: COLORS.card,
                                          fontSize: '11px', border: `1px solid ${COLORS.cardBorder}`
                                        }}>
                                          <strong style={{ color: COLORS.text }}>{f.feature}</strong>: {f.value}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })()}

                            {/* Firewall Rule */}
                            {alert.firewall_rule && (
                              <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ fontSize: '12px', color: COLORS.textMuted }}>Recommended Linux Rule:</div>
                                <code style={{
                                  padding: '4px 8px', backgroundColor: COLORS.pill, borderRadius: '5px',
                                  fontSize: '12px', color: COLORS.accent
                                }}>{alert.firewall_rule}</code>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyRule(alert.firewall_rule, `alert-${alert.id}`);
                                  }}
                                  style={{
                                    padding: '4px 10px', fontSize: '11px', cursor: 'pointer',
                                    borderRadius: '5px', border: `1px solid ${COLORS.cardBorder}`,
                                    backgroundColor: COLORS.card, color: COLORS.text
                                  }}
                                >
                                  {copiedRule === `alert-${alert.id}` ? '✓ Copied' : 'Copy'}
                                </button>
                              </div>
                            )}
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

      {/* SOAR Automated Firewall Mitigation Modal */}
      {activeMitigationAlert && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px'
        }}>
          <div style={{
            ...cardStyle, maxWidth: '620px', width: '100%', margin: 0,
            border: `1px solid ${COLORS.accent}`, boxShadow: '0 8px 32px rgba(0,0,0,0.6)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>🛡️</span>
                <h3 style={{ margin: 0, fontSize: '18px' }}>Automated SOAR Firewall Mitigation</h3>
              </div>
              <button
                onClick={() => setActiveMitigationAlert(null)}
                style={{ background: 'none', border: 'none', color: COLORS.textMuted, fontSize: '20px', cursor: 'pointer' }}
              >✕</button>
            </div>

            <p style={{ fontSize: '13px', color: COLORS.textMuted, lineHeight: 1.5, marginTop: 0 }}>
              The AI classifier flagged malicious network flow from <strong>{activeMitigationAlert.institution}</strong>.
              Execute any of the following firewall rules on your boundary gateway to isolate the attacker:
            </p>

            {/* Linux iptables */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '5px' }}>
                <strong>🐧 Linux Gateway (iptables)</strong>
                <span
                  onClick={() => copyRule(activeMitigationAlert.firewall_rule || `sudo iptables -A INPUT -s ${activeMitigationAlert.institution} -j DROP`, 'modal-iptables')}
                  style={{ color: COLORS.accent, cursor: 'pointer', fontWeight: 700 }}
                >
                  {copiedRule === 'modal-iptables' ? '✓ Copied!' : 'Copy Rule'}
                </span>
              </div>
              <pre style={{
                margin: 0, padding: '10px 14px', backgroundColor: COLORS.cardAlt,
                borderRadius: '8px', border: `1px solid ${COLORS.cardBorder}`, color: COLORS.accent,
                fontSize: '12px', overflowX: 'auto'
              }}>
                {activeMitigationAlert.firewall_rule || `sudo iptables -A INPUT -s ${activeMitigationAlert.institution} -j DROP`}
              </pre>
            </div>

            {/* Windows Firewall */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '5px' }}>
                <strong>🪟 Windows Defender (PowerShell Administrator)</strong>
                <span
                  onClick={() => copyRule(`New-NetFirewallRule -DisplayName "Block-Threat-${activeMitigationAlert.id}" -Direction Inbound -Action Block`, 'modal-ps')}
                  style={{ color: COLORS.accent, cursor: 'pointer', fontWeight: 700 }}
                >
                  {copiedRule === 'modal-ps' ? '✓ Copied!' : 'Copy Rule'}
                </span>
              </div>
              <pre style={{
                margin: 0, padding: '10px 14px', backgroundColor: COLORS.cardAlt,
                borderRadius: '8px', border: `1px solid ${COLORS.cardBorder}`, color: COLORS.high,
                fontSize: '12px', overflowX: 'auto'
              }}>
                {`New-NetFirewallRule -DisplayName "Block-Threat-${activeMitigationAlert.id}" -Direction Inbound -Action Block`}
              </pre>
            </div>

            {/* Cisco Router ACL */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '5px' }}>
                <strong>🌐 Cisco IOS Router (ACL)</strong>
                <span
                  onClick={() => copyRule(`access-list 101 deny ip host ${activeMitigationAlert.institution} any`, 'modal-cisco')}
                  style={{ color: COLORS.accent, cursor: 'pointer', fontWeight: 700 }}
                >
                  {copiedRule === 'modal-cisco' ? '✓ Copied!' : 'Copy Rule'}
                </span>
              </div>
              <pre style={{
                margin: 0, padding: '10px 14px', backgroundColor: COLORS.cardAlt,
                borderRadius: '8px', border: `1px solid ${COLORS.cardBorder}`, color: COLORS.low,
                fontSize: '12px', overflowX: 'auto'
              }}>
                {`access-list 101 deny ip host ${activeMitigationAlert.institution} any`}
              </pre>
            </div>

            <button
              onClick={() => setActiveMitigationAlert(null)}
              className="app-btn"
              style={{ ...buttonStyle, width: '100%', padding: '10px' }}
            >
              Close Mitigation Dialog
            </button>
          </div>
        </div>
      )}

      {/* Model Analytics & Benchmark Modal */}
      {showMetricsModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px'
        }}>
          <div style={{
            ...cardStyle, maxWidth: '780px', width: '100%', margin: 0, maxHeight: '90vh', overflowY: 'auto',
            border: `1px solid ${COLORS.accent2}`, boxShadow: '0 8px 32px rgba(0,0,0,0.6)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>📊</span>
                <h3 style={{ margin: 0, fontSize: '18px' }}>AI Model Benchmarks & Scientific Evaluation</h3>
              </div>
              <button
                onClick={() => setShowMetricsModal(false)}
                style={{ background: 'none', border: 'none', color: COLORS.textMuted, fontSize: '20px', cursor: 'pointer' }}
              >✕</button>
            </div>

            {modelMetrics ? (
              <>
                {/* Active Model Scorecards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ padding: '12px', backgroundColor: COLORS.cardAlt, borderRadius: '8px', textAlign: 'center', border: `1px solid ${COLORS.cardBorder}` }}>
                    <div style={{ color: COLORS.textMuted, fontSize: '11px' }}>ACCURACY</div>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: COLORS.accent }}>
                      {(modelMetrics.active_model.accuracy * 100).toFixed(2)}%
                    </div>
                  </div>
                  <div style={{ padding: '12px', backgroundColor: COLORS.cardAlt, borderRadius: '8px', textAlign: 'center', border: `1px solid ${COLORS.cardBorder}` }}>
                    <div style={{ color: COLORS.textMuted, fontSize: '11px' }}>PRECISION</div>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: COLORS.accent2 }}>
                      {(modelMetrics.active_model.precision * 100).toFixed(2)}%
                    </div>
                  </div>
                  <div style={{ padding: '12px', backgroundColor: COLORS.cardAlt, borderRadius: '8px', textAlign: 'center', border: `1px solid ${COLORS.cardBorder}` }}>
                    <div style={{ color: COLORS.textMuted, fontSize: '11px' }}>RECALL</div>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: COLORS.low }}>
                      {(modelMetrics.active_model.recall * 100).toFixed(2)}%
                    </div>
                  </div>
                  <div style={{ padding: '12px', backgroundColor: COLORS.cardAlt, borderRadius: '8px', textAlign: 'center', border: `1px solid ${COLORS.cardBorder}` }}>
                    <div style={{ color: COLORS.textMuted, fontSize: '11px' }}>F1-SCORE</div>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: COLORS.high }}>
                      {modelMetrics.active_model.f1_score}
                    </div>
                  </div>
                  <div style={{ padding: '12px', backgroundColor: COLORS.cardAlt, borderRadius: '8px', textAlign: 'center', border: `1px solid ${COLORS.cardBorder}` }}>
                    <div style={{ color: COLORS.textMuted, fontSize: '11px' }}>INFERENCE LATENCY</div>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: COLORS.text }}>
                      {modelMetrics.active_model.inference_latency_ms} ms
                    </div>
                  </div>
                </div>

                {/* Model Comparison Table */}
                <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: COLORS.text }}>
                  🔬 Algorithmic Comparison (CICIDS2017 Dataset)
                </h4>
                <div style={{ overflowX: 'auto', marginBottom: '22px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: COLORS.theadGrad, textAlign: 'left' }}>
                        <th style={{ padding: '8px 10px', color: COLORS.textMuted }}>MODEL</th>
                        <th style={{ padding: '8px 10px', color: COLORS.textMuted }}>ACCURACY</th>
                        <th style={{ padding: '8px 10px', color: COLORS.textMuted }}>PRECISION</th>
                        <th style={{ padding: '8px 10px', color: COLORS.textMuted }}>RECALL</th>
                        <th style={{ padding: '8px 10px', color: COLORS.textMuted }}>F1</th>
                        <th style={{ padding: '8px 10px', color: COLORS.textMuted }}>LATENCY</th>
                        <th style={{ padding: '8px 10px', color: COLORS.textMuted }}>EVALUATION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modelMetrics.model_comparisons?.map((m, idx) => (
                        <tr key={idx} style={{ borderTop: `1px solid ${COLORS.cardBorder}` }}>
                          <td style={{ padding: '8px 10px', fontWeight: 700, color: idx === 0 ? COLORS.accent : COLORS.text }}>{m.model}</td>
                          <td style={{ padding: '8px 10px' }}>{m.accuracy}</td>
                          <td style={{ padding: '8px 10px' }}>{m.precision}</td>
                          <td style={{ padding: '8px 10px' }}>{m.recall}</td>
                          <td style={{ padding: '8px 10px' }}>{m.f1}</td>
                          <td style={{ padding: '8px 10px' }}>{m.latency}</td>
                          <td style={{ padding: '8px 10px', color: idx === 0 ? COLORS.low : COLORS.textMuted }}>{m.verdict}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Confusion Matrix Table */}
                <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: COLORS.text }}>
                  🎯 Multi-Class Confusion Matrix (Test Set: N=14,570)
                </h4>
                <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'center' }}>
                    <thead>
                      <tr style={{ background: COLORS.theadGrad }}>
                        <th style={{ padding: '8px', color: COLORS.textMuted, textAlign: 'left' }}>ACTUAL \ PREDICTED</th>
                        {modelMetrics.confusion_matrix.labels.map((lbl) => (
                          <th key={lbl} style={{ padding: '8px', color: COLORS.textMuted }}>{lbl}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {modelMetrics.confusion_matrix.matrix.map((row, rIdx) => (
                        <tr key={rIdx} style={{ borderTop: `1px solid ${COLORS.cardBorder}` }}>
                          <td style={{ padding: '8px', fontWeight: 700, textAlign: 'left' }}>
                            {modelMetrics.confusion_matrix.labels[rIdx]}
                          </td>
                          {row.map((val, cIdx) => (
                            <td key={cIdx} style={{
                              padding: '8px',
                              backgroundColor: rIdx === cIdx ? 'rgba(46, 204, 113, 0.15)' : 'transparent',
                              fontWeight: rIdx === cIdx ? 700 : 400,
                              color: rIdx === cIdx ? COLORS.low : COLORS.textMuted
                            }}>
                              {val}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <p style={{ textAlign: 'center', color: COLORS.textMuted }}>Loading benchmark dataset...</p>
            )}

            <button
              onClick={() => setShowMetricsModal(false)}
              className="app-btn"
              style={{ ...buttonStyle, width: '100%', padding: '10px' }}
            >
              Close Benchmark Center
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;