import { useState, useEffect } from 'react';
import axios from 'axios';
import Login from './Login';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
function App() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const [sourceIp, setSourceIp] = useState('8.8.8.8');
  const [destIp, setDestIp] = useState('192.168.1.99');
  const [scenario, setScenario] = useState('normal');
  const [lookupIp, setLookupIp] = useState('1.1.1.1');
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [filterLevel, setFilterLevel] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAlerts();
    axios.get('http://127.0.0.1:8000/sample-scenarios')
      .then((response) => {
        setScenarios(response.data);
        setScenariosLoaded(true);
      })
      .catch(() => {
        setScenariosLoaded(false);
      });

    // Auto-refresh alerts every 5 seconds
    const interval = setInterval(() => {
      fetchAlerts();
    }, 5000);

    // Cleanup: stop the interval when the component is removed
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

  // Pre-built sample feature sets for quick testing.
  // "normal" mimics benign traffic, "attack" mimics a DDoS-like flow.
    const [scenarios, setScenarios] = useState({ normal: {}, attack: {} });
  const [scenariosLoaded, setScenariosLoaded] = useState(false);

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
        fetchAlerts(); // refresh the table to show any new alert
      })
      .catch((err) => {
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

    const getChartData = () => {
    const counts = {};
    alerts.forEach((alert) => {
      counts[alert.threat_type] = (counts[alert.threat_type] || 0) + 1;
    });
    return Object.keys(counts).map((type) => ({
      threat_type: type,
      count: counts[type]
    }));
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
  const getStats = () => {
    const total = alerts.length;
    const critical = alerts.filter(a => a.risk_level === 'Critical').length;
    const high = alerts.filter(a => a.risk_level === 'High').length;
    const uniqueThreats = new Set(alerts.map(a => a.threat_type)).size;
    return { total, critical, high, uniqueThreats };
  };
  const getRiskColor = (level) => {
    if (level === 'Critical') return '#ff4444';
    if (level === 'High') return '#ff8800';
    if (level === 'Medium') return '#ffcc00';
    return '#44cc44';
  };
  const RiskGauge = ({ score, level }) => {
    const data = [{ name: 'risk', value: score, fill: getRiskColor(level) }];
    return (
      <div style={{ width: '160px', height: '110px', position: 'relative' }}>
        <ResponsiveContainer>
          <RadialBarChart
            innerRadius="70%"
            outerRadius="100%"
            data={data}
            startAngle={180}
            endAngle={0}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar dataKey="value" background={{ fill: '#333' }} cornerRadius={8} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div style={{
          position: 'absolute', top: '55%', left: '50%', transform: 'translate(-50%, -50%)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '22px', fontWeight: 'bold' }}>{score}</div>
          <div style={{ fontSize: '11px', color: '#aaa' }}>/ 100</div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
            <h1>🛡️ Threat Detection Dashboard <span style={{ fontSize: '14px', color: '#44cc44', fontWeight: 'normal' }}>● Live</span></h1>

      {/* Event submission form */}
      <div style={{ border: '1px solid #444', borderRadius: '8px', padding: '20px', marginBottom: '30px' }}>
        <h3 style={{ marginTop: 0 }}>Submit a Test Event</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '10px' }}>
            <label>Source IP: </label>
            <input
              type="text"
              value={sourceIp}
              onChange={(e) => setSourceIp(e.target.value)}
              style={{ marginLeft: '8px', padding: '4px 8px' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Destination IP: </label>
            <input
              type="text"
              value={destIp}
              onChange={(e) => setDestIp(e.target.value)}
              style={{ marginLeft: '8px', padding: '4px 8px' }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label>Traffic Pattern: </label>
            <select
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              style={{ marginLeft: '8px', padding: '4px 8px' }}
            >
              <option value="normal">Normal Traffic</option>
              <option value="attack">Suspicious / Attack-like Traffic</option>
            </select>
          </div>
          <button type="submit" disabled={submitting || !scenariosLoaded} style={{ padding: '8px 20px', cursor: 'pointer' }}>
            {submitting ? 'Analyzing...' : (scenariosLoaded ? 'Submit Event' : 'Loading scenarios...')}
          </button>
        </form>

        {lastResult && !lastResult.error && (
          <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#2a2a2a', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <RiskGauge score={lastResult.risk_score} level={lastResult.risk_level} />
            <div>
              <div><strong>Threat Type:</strong> {lastResult.threat_type}</div>
              <div><strong>Risk Level:</strong> {lastResult.risk_level}</div>
              <div><strong>Institution:</strong> {lastResult.institution}</div>
            </div>
          </div>
        )}
        {lastResult && lastResult.error && (
          <p style={{ color: 'red', marginTop: '15px' }}>{lastResult.error}</p>
        )}
      </div>
            <div style={{ border: '1px solid #444', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
        <h3 style={{ marginTop: 0 }}>🏢 Institution Identification Lookup</h3>
        <p style={{ color: '#aaa', fontSize: '14px', marginTop: '-5px' }}>
          Check which organization an IP address belongs to, independent of event analysis.
        </p>
        <form onSubmit={handleLookup} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            value={lookupIp}
            onChange={(e) => setLookupIp(e.target.value)}
            placeholder="Enter IP address"
            style={{ padding: '6px 10px', flex: 1 }}
          />
          <button type="submit" disabled={lookupLoading} style={{ padding: '8px 20px', cursor: 'pointer' }}>
            {lookupLoading ? 'Looking up...' : 'Lookup'}
          </button>
        </form>

        {lookupResult && !lookupResult.error && (
          <div style={{ marginTop: '15px', padding: '12px', backgroundColor: '#2a2a2a', borderRadius: '4px' }}>
            <div><strong>IP Address:</strong> {lookupResult.ip_address}</div>
            <div><strong>Institution:</strong> {lookupResult.institution}</div>
            <div>
              <strong>Confidence:</strong> {(lookupResult.confidence * 100).toFixed(0)}%
              <span style={{ color: '#888', fontSize: '12px', marginLeft: '8px' }}>
                (this is a best-effort identification, not a confirmed match)
              </span>
            </div>
          </div>
        )}
        {lookupResult && lookupResult.error && (
          <p style={{ color: 'red', marginTop: '15px' }}>{lookupResult.error}</p>
        )}
      </div>

            {!loading && !error && (
        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '140px', padding: '15px', borderRadius: '8px', backgroundColor: '#2a2a2a', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{getStats().total}</div>
            <div style={{ color: '#aaa', fontSize: '13px' }}>Total Alerts</div>
          </div>
          <div style={{ flex: 1, minWidth: '140px', padding: '15px', borderRadius: '8px', backgroundColor: '#3a1a1a', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ff4444' }}>{getStats().critical}</div>
            <div style={{ color: '#aaa', fontSize: '13px' }}>Critical</div>
          </div>
          <div style={{ flex: 1, minWidth: '140px', padding: '15px', borderRadius: '8px', backgroundColor: '#3a2a1a', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ff8800' }}>{getStats().high}</div>
            <div style={{ color: '#aaa', fontSize: '13px' }}>High</div>
          </div>
          <div style={{ flex: 1, minWidth: '140px', padding: '15px', borderRadius: '8px', backgroundColor: '#2a2a2a', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{getStats().uniqueThreats}</div>
            <div style={{ color: '#aaa', fontSize: '13px' }}>Threat Types Seen</div>
          </div>
        </div>
      )}
      {!loading && !error && alerts.length > 0 && (
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#1a1a1a', borderRadius: '8px' }}>
          <h3 style={{ marginTop: 0 }}>Threat Type Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={getChartData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="threat_type" stroke="#ccc" />
              <YAxis stroke="#ccc" allowDecimals={false} />
              <Tooltip contentStyle={{ backgroundColor: '#2a2a2a', border: 'none' }} />
              <Bar dataKey="count" fill="#4488ff" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <button onClick={fetchAlerts} style={{ padding: '8px 16px', marginBottom: '20px', cursor: 'pointer' }}>
        Refresh Alerts
      </button>

      {loading && <p>Loading alerts...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
            {!loading && !error && alerts.length > 0 && (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search threat type or institution..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '6px 10px', flex: 1, minWidth: '200px' }}
          />
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            style={{ padding: '6px 10px' }}
          >
            <option value="All">All Risk Levels</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <span style={{ color: '#888', fontSize: '13px' }}>
            Showing {getFilteredAlerts().length} of {alerts.length}
          </span>
        </div>
      )}
      {!loading && !error && alerts.length === 0 && <p>No alerts yet.</p>}

      {!loading && !error && alerts.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ccc', textAlign: 'left' }}>
              <th style={{ padding: '10px' }}>Event ID</th>
              <th style={{ padding: '10px' }}>Threat Type</th>
              <th style={{ padding: '10px' }}>Risk Score</th>
              <th style={{ padding: '10px' }}>Risk Level</th>
              <th style={{ padding: '10px' }}>Institution</th>
              <th style={{ padding: '10px' }}>Status</th>
              <th style={{ padding: '10px' }}>Created</th>
            </tr>
          </thead>
          <tbody>
            {getFilteredAlerts().map((alert) => (
              <tr key={alert.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '10px' }}>{alert.event_id}</td>
                <td style={{ padding: '10px' }}>{alert.threat_type}</td>
                <td style={{ padding: '10px' }}>{alert.risk_score}</td>
                <td style={{ padding: '10px' }}>
                  <span style={{
                    backgroundColor: getRiskColor(alert.risk_level),
                    color: 'white', padding: '4px 10px', borderRadius: '4px', fontSize: '13px'
                  }}>
                    {alert.risk_level}
                  </span>
                </td>
                <td style={{ padding: '10px' }}>{alert.institution}</td>
                <td style={{ padding: '10px' }}>{alert.status}</td>
                <td style={{ padding: '10px' }}>{new Date(alert.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default App;