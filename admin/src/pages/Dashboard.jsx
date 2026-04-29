import { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, MessageSquare, PhoneCall, Activity, Plus } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const StatCard = ({ title, value, icon: Icon, trend }) => (
  <div className="bg-dark-panel rounded-2xl p-6 border border-dark-border relative overflow-hidden group hover:border-brand-500/50 transition-colors">
    <div className="flex justify-between items-start relative z-10">
      <div>
        <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-white">{value}</h3>
      </div>
      <div className="w-12 h-12 bg-dark-bg rounded-xl flex items-center justify-center text-brand-400 group-hover:scale-110 transition-transform">
        <Icon size={24} />
      </div>
    </div>
    <div className="mt-4 flex items-center text-sm">
      <span className="text-emerald-400 font-medium">{trend}</span>
      <span className="text-gray-500 ml-2">vs last month</span>
    </div>
    <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-brand-500/5 rounded-full group-hover:scale-150 transition-transform duration-500" />
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    total_clients: 0,
    active_users: 0,
    total_messages: 0,
    total_calls: 0
  });
  const [recentTenants, setRecentTenants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const api = (await import('../utils/api')).default;
        const [statsRes, tenantsRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/tenants')
        ]);
        
        if (statsRes.data.success) setStats(statsRes.data.stats);
        if (tenantsRes.data.success) setRecentTenants(tenantsRes.data.tenants.slice(0, 5));
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const chartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        fill: true,
        label: 'Messages Delivered',
        data: [12000, 19000, 15000, 22000, 18000, 28000, 25000],
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        grid: { color: 'rgba(51, 65, 85, 0.5)', drawBorder: false },
        ticks: { color: '#94a3b8' }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8' }
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
          <p className="text-gray-400">Welcome back, Admin. Here's your system status.</p>
        </div>
        <button className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-xl flex items-center text-sm font-medium transition-all shadow-lg shadow-brand-500/20">
          <Plus size={18} className="mr-2" />
          New Tenant
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Active Tenants" value={stats.total_clients} icon={Activity} trend="+12%" />
        <StatCard title="Live Users" value={stats.active_users.toLocaleString()} icon={Users} trend="+5%" />
        <StatCard title="Messages Sent" value={(stats.total_messages / 1000).toFixed(1) + 'k'} icon={MessageSquare} trend="+24%" />
        <StatCard title="Call Minutes" value={stats.total_calls.toLocaleString()} icon={PhoneCall} trend="-2%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-dark-panel border border-dark-border rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Traffic Overview</h3>
          <div className="h-72">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        <div className="bg-dark-panel border-border rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Recent Tenants</h3>
          <div className="space-y-4">
            {recentTenants.length > 0 ? (
              recentTenants.map((tenant, i) => (
                <div key={tenant.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-dark-bg transition-colors">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                      {tenant.name.charAt(0)}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-white">{tenant.name}</p>
                      <p className="text-xs text-gray-400">ID: {tenant.app_id.substring(0, 8)}...</p>
                    </div>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${tenant.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm text-center py-8">No tenants found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
