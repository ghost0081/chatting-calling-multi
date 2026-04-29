import { useEffect, useState } from 'react';
import api from '../utils/api';
import { Key, Copy, Eye, EyeOff, ShieldCheck } from 'lucide-react';

const Keys = () => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSecret, setShowSecret] = useState({});

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const res = await api.get('/admin/tenants');
        if (res.data.success) setTenants(res.data.tenants);
      } catch (err) {
        console.error('Fetch tenants error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTenants();
  }, []);

  const toggleSecret = (id) => {
    setShowSecret(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Infrastructure API Keys</h1>
        <p className="text-gray-400">Manage security credentials for all tenant applications.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="text-gray-500 text-center py-12">Loading security credentials...</div>
        ) : tenants.map((tenant) => (
          <div key={tenant.id} className="bg-dark-panel border border-dark-border rounded-2xl p-6 hover:border-brand-500/30 transition-colors">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400 mr-4">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{tenant.name}</h3>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">App ID: {tenant.app_id}</p>
                </div>
              </div>
              <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-medium">
                Production Ready
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-dark-bg rounded-xl p-4 border border-dark-border">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium text-gray-500 uppercase">Public Key</span>
                  <button 
                    onClick={() => copyToClipboard(tenant.public_key)}
                    className="text-brand-400 hover:text-brand-300 text-xs flex items-center"
                  >
                    <Copy size={14} className="mr-1" /> Copy
                  </button>
                </div>
                <code className="text-sm text-gray-300 break-all">{tenant.public_key}</code>
              </div>

              <div className="bg-dark-bg rounded-xl p-4 border border-dark-border">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium text-gray-500 uppercase">Secret Key</span>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => toggleSecret(tenant.id)}
                      className="text-gray-400 hover:text-white text-xs flex items-center"
                    >
                      {showSecret[tenant.id] ? <EyeOff size={14} className="mr-1" /> : <Eye size={14} className="mr-1" />}
                      {showSecret[tenant.id] ? 'Hide' : 'Show'}
                    </button>
                    <button 
                      onClick={() => copyToClipboard(tenant.secret_key)}
                      className="text-brand-400 hover:text-brand-300 text-xs flex items-center"
                    >
                      <Copy size={14} className="mr-1" /> Copy
                    </button>
                  </div>
                </div>
                <code className="text-sm text-gray-300 break-all">
                  {showSecret[tenant.id] ? tenant.secret_key : '•'.repeat(40)}
                </code>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-dark-border flex items-center text-xs text-gray-500">
              <Key size={14} className="mr-2" />
              This secret key should never be shared or exposed in client-side code.
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Keys;
