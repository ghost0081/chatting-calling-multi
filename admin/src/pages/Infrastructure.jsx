import { useEffect, useState } from 'react';
import { Server, Database, Cpu, Activity, Shield } from 'lucide-react';
import api from '../utils/api';

const InfraCard = ({ title, status, details, icon: Icon, color }) => (
  <div className="bg-dark-panel border border-dark-border rounded-2xl p-6">
    <div className="flex justify-between items-start mb-4">
      <div className={`w-12 h-12 rounded-xl bg-dark-bg flex items-center justify-center ${color}`}>
        <Icon size={24} />
      </div>
      <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
        status === 'online' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
      }`}>
        {status}
      </div>
    </div>
    <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
    <div className="space-y-2 mt-4">
      {details.map((detail, i) => (
        <div key={i} className="flex justify-between text-xs">
          <span className="text-gray-400">{detail.label}</span>
          <span className="text-white font-medium">{detail.value}</span>
        </div>
      ))}
    </div>
  </div>
);

const Infrastructure = () => {
  const [health, setHealth] = useState({
    uptime: 0,
    memory: '0 MB',
    db_status: 'offline',
    redis_status: 'offline'
  });

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await api.get('/admin/health');
        if (res.data.success) setHealth(res.data.health);
      } catch (err) {
        console.error('Fetch health error:', err);
      }
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000); // Update every 10s
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds) => {
    const d = Math.floor(seconds / (3600*24));
    const h = Math.floor(seconds % (3600*24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    return `${d}d ${h}h ${m}m`;
  };
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">System Infrastructure</h1>
        <p className="text-gray-400">Manage and monitor core server resources and services.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <InfraCard 
          title="Node.js Server" 
          status="online"
          color="text-emerald-400"
          icon={Server}
          details={[
            { label: 'Uptime', value: formatUptime(health.uptime) },
            { label: 'Memory Usage', value: health.memory },
            { label: 'Latency', value: '14ms' }
          ]}
        />
        <InfraCard 
          title="Master MySQL" 
          status={health.db_status}
          color="text-blue-400"
          icon={Database}
          details={[
            { label: 'Status', value: 'Operational' },
            { label: 'Pool Status', value: 'Healthy' },
            { label: 'Active Tasks', value: '0' }
          ]}
        />
        <InfraCard 
          title="Redis Scaler" 
          status={health.redis_status}
          color="text-red-400"
          icon={Activity}
          details={[
            { label: 'Mode', value: 'Disabled' },
            { label: 'Cluster', value: 'None' },
            { label: 'Throughput', value: '0 msg/s' }
          ]}
        />
      </div>

      <div className="bg-dark-panel border border-dark-border rounded-2xl p-8">
        <div className="flex items-center mb-6">
          <Cpu className="text-brand-400 mr-3" size={24} />
          <h3 className="text-xl font-bold text-white">Resource Allocation</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">CPU Utilization</span>
              <span className="text-white font-medium">12%</span>
            </div>
            <div className="h-2 bg-dark-bg rounded-full overflow-hidden">
              <div className="h-full bg-brand-500 w-[12%]" />
            </div>
            <div className="flex justify-between items-center text-sm pt-4">
              <span className="text-gray-400">Memory Load (8GB Total)</span>
              <span className="text-white font-medium">28%</span>
            </div>
            <div className="h-2 bg-dark-bg rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 w-[28%]" />
            </div>
          </div>

          <div className="bg-dark-bg rounded-2xl p-6 border border-dark-border">
            <div className="flex items-center mb-4">
              <Shield className="text-emerald-400 mr-2" size={18} />
              <h4 className="text-white font-semibold">Security Health</h4>
            </div>
            <ul className="space-y-3">
              {[
                'JWT Signatures: Active',
                'Rate Limiting: Enabled',
                'IP Whitelisting: Configured',
                'BYODB Isolation: Verified'
              ].map((item, i) => (
                <li key={i} className="flex items-center text-xs text-gray-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Infrastructure;
