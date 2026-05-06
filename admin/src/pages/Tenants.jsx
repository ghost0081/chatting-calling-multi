import { useEffect, useState } from 'react';
import api from '../utils/api';
import { Plus, MoreVertical, Copy, ExternalLink, Database } from 'lucide-react';

const Tenants = () => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newTenant, setNewTenant] = useState({ 
    name: '', 
    db_config: { host: 'localhost', user: 'root', password: '', database: '', port: 3306 } 
  });

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

  useEffect(() => {
    fetchTenants();
  }, []);

  const [openDropdownId, setOpenDropdownId] = useState(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenDropdownId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/tenants', newTenant);
      if (res.data.success) {
        setShowModal(false);
        fetchTenants();
        setNewTenant({ name: '', db_config: { host: 'localhost', user: 'root', password: '', database: '', port: 3306 } });
      }
    } catch (err) {
      alert('Error creating tenant: ' + err.message);
    }
  };

  const handleDelete = async (tenantId) => {
    if (window.confirm('Are you sure you want to delete this tenant? This action cannot be undone.')) {
      alert('Delete API coming soon');
      // try {
      //   await api.delete(`/admin/tenants/${tenantId}`);
      //   fetchTenants();
      // } catch (err) { alert(err.message); }
    }
  };

  const handleEdit = (tenant) => {
    alert('Edit functionality coming soon for ' + tenant.name);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast here
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Tenant Management</h1>
          <p className="text-gray-400">Manage your communication infrastructure clients.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-xl flex items-center text-sm font-medium transition-all shadow-lg shadow-brand-500/20"
        >
          <Plus size={18} className="mr-2" />
          New Tenant
        </button>
      </div>

      <div className="bg-dark-panel border border-dark-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left overflow-visible">
            <thead>
              <tr className="bg-dark-bg border-b border-dark-border">
                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Tenant Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">App Credentials</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">DB Config</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border">
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">Loading tenants...</td></tr>
              ) : tenants.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">No tenants created yet.</td></tr>
              ) : tenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-dark-bg/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded bg-brand-500/20 flex items-center justify-center text-brand-400 font-bold mr-3">
                        {tenant.name.charAt(0)}
                      </div>
                      <span className="text-white font-medium">{tenant.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center text-xs">
                        <span className="text-gray-500 w-16">App ID:</span>
                        <code className="text-brand-400 bg-dark-bg px-1.5 py-0.5 rounded mr-2">{tenant.app_id}</code>
                        <button onClick={() => copyToClipboard(tenant.app_id)}><Copy size={12} className="text-gray-500 hover:text-white" /></button>
                      </div>
                      <div className="flex items-center text-xs">
                        <span className="text-gray-500 w-16">Public:</span>
                        <code className="text-gray-300 bg-dark-bg px-1.5 py-0.5 rounded mr-2">{tenant.public_key.substring(0, 15)}...</code>
                        <button onClick={() => copyToClipboard(tenant.public_key)}><Copy size={12} className="text-gray-500 hover:text-white" /></button>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">
                    <div className="flex items-center text-xs text-emerald-400">
                      <Database size={14} className="mr-1.5" />
                      Dynamic Isolated
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      tenant.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {tenant.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right relative">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenDropdownId(openDropdownId === tenant.id ? null : tenant.id);
                      }}
                      className="text-gray-500 hover:text-white p-1 rounded-md hover:bg-dark-bg"
                    >
                      <MoreVertical size={18} />
                    </button>
                    {openDropdownId === tenant.id && (
                      <div className="absolute right-6 top-10 mt-1 w-32 bg-dark-bg border border-dark-border rounded-lg shadow-xl z-10 py-1">
                        <button 
                          onClick={() => handleEdit(tenant)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-dark-panel hover:text-white transition-colors"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(tenant.id)}
                          className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-dark-panel hover:text-red-300 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-panel border border-dark-border rounded-2xl w-full max-w-lg p-8 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-6">Create New Tenant</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Company / App Name</label>
                <input 
                  type="text" 
                  required
                  className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-500 transition-colors"
                  placeholder="e.g. Acme Messenger"
                  value={newTenant.name}
                  onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                />
              </div>
              
              <div className="pt-2">
                <p className="text-sm font-medium text-white mb-3 flex items-center">
                  <Database size={16} className="mr-2 text-brand-400" />
                  Client Database Configuration (BYODB)
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">MySQL Host</label>
                    <input 
                      type="text" 
                      className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white"
                      value={newTenant.db_config.host}
                      onChange={(e) => setNewTenant({ ...newTenant, db_config: { ...newTenant.db_config, host: e.target.value } })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Database Name</label>
                    <input 
                      type="text" 
                      required
                      className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white"
                      value={newTenant.db_config.database}
                      onChange={(e) => setNewTenant({ ...newTenant, db_config: { ...newTenant.db_config, database: e.target.value } })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">User</label>
                    <input 
                      type="text" 
                      className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white"
                      value={newTenant.db_config.user}
                      onChange={(e) => setNewTenant({ ...newTenant, db_config: { ...newTenant.db_config, user: e.target.value } })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Password</label>
                    <input 
                      type="password" 
                      className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white"
                      value={newTenant.db_config.password}
                      onChange={(e) => setNewTenant({ ...newTenant, db_config: { ...newTenant.db_config, password: e.target.value } })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-dark-border text-gray-400 hover:bg-dark-bg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium transition-all"
                >
                  Create Tenant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tenants;
