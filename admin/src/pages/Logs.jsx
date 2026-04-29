import { useEffect, useState } from 'react';
import { Database, Download, Search, Filter, ArrowUpRight } from 'lucide-react';
import api from '../utils/api';

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logStats, setLogStats] = useState({
    total_events: 0,
    webhook_health: '100%',
    error_rate: '0.0%'
  });

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get('/admin/logs');
        if (res.data.success) {
          setLogs(res.data.logs);
          setLogStats(res.data.stats);
        }
      } catch (err) {
        console.error('Fetch logs error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Activity Logs & Usage</h1>
          <p className="text-gray-400">Monitor real-time infrastructure events across all tenants.</p>
        </div>
        <button className="bg-dark-panel border border-dark-border text-white px-4 py-2 rounded-xl flex items-center text-sm font-medium hover:bg-dark-bg transition-all">
          <Download size={18} className="mr-2" />
          Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-dark-panel p-6 rounded-2xl border border-dark-border">
          <p className="text-gray-400 text-sm mb-1">Total Events Today</p>
          <h3 className="text-2xl font-bold text-white">{logStats.total_events.toLocaleString()}</h3>
          <div className="mt-2 text-emerald-500 text-xs flex items-center">
            <ArrowUpRight size={14} className="mr-1" /> Real-time tracking
          </div>
        </div>
        <div className="bg-dark-panel p-6 rounded-2xl border border-dark-border">
          <p className="text-gray-400 text-sm mb-1">Webhook Deliveries</p>
          <h3 className="text-2xl font-bold text-white">{logStats.webhook_health}</h3>
          <div className="mt-2 text-emerald-500 text-xs">Healthy</div>
        </div>
        <div className="bg-dark-panel p-6 rounded-2xl border border-dark-border">
          <p className="text-gray-400 text-sm mb-1">API Errors</p>
          <h3 className="text-2xl font-bold text-white">{logStats.error_rate}</h3>
          <div className="mt-2 text-emerald-500 text-xs">Below threshold</div>
        </div>
      </div>

      <div className="bg-dark-panel border border-dark-border rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-dark-border flex justify-between items-center bg-dark-bg/30">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input 
              type="text" 
              placeholder="Search logs..." 
              className="bg-dark-bg border border-dark-border rounded-lg pl-10 pr-4 py-2 text-sm text-white w-64 focus:outline-none focus:border-brand-500"
            />
          </div>
          <button className="text-gray-400 hover:text-white flex items-center text-sm">
            <Filter size={16} className="mr-2" /> Filters
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-dark-bg border-b border-dark-border">
                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Tenant</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Event</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border">
              {loading ? (
                <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-500">Loading logs...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-500">No events logged yet.</td></tr>
              ) : logs.map((log) => (
                <tr key={log.id} className="hover:bg-dark-bg/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-white font-medium">{log.tenant_name || 'System'}</td>
                  <td className="px-6 py-4 text-sm text-gray-300">
                    <div className="flex items-center">
                      <Database size={14} className="mr-2 text-brand-400" />
                      {log.event_type}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      log.status === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 
                      log.status === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Logs;
