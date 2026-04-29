import { Settings as SettingsIcon, Shield, Bell, Globe, Palette } from 'lucide-react';

const Settings = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">System Settings</h1>
        <p className="text-gray-400">Configure global parameters and security protocols for Antigravity.</p>
      </div>

      <div className="bg-dark-panel border border-dark-border rounded-2xl overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-4 min-h-[500px]">
          <div className="border-r border-dark-border bg-dark-bg/30 p-4 space-y-2">
            {[
              { icon: Shield, label: 'Security & Auth' },
              { icon: Globe, label: 'API Configuration' },
              { icon: Bell, label: 'Notifications' },
              { icon: Palette, label: 'Appearance' },
              { icon: SettingsIcon, label: 'Advanced' }
            ].map((item, i) => (
              <button key={i} className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                i === 0 ? 'bg-brand-500/10 text-brand-400' : 'text-gray-400 hover:bg-dark-bg hover:text-gray-200'
              }`}>
                <item.icon size={18} className="mr-3" />
                {item.label}
              </button>
            ))}
          </div>

          <div className="col-span-3 p-8 space-y-8">
            <section>
              <h3 className="text-lg font-bold text-white mb-4">Security Protocols</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-dark-bg rounded-xl border border-dark-border">
                  <div>
                    <p className="text-sm font-medium text-white">Multi-Tenant Isolation</p>
                    <p className="text-xs text-gray-500">Enforce strict physical database separation for all clients.</p>
                  </div>
                  <div className="w-12 h-6 bg-brand-600 rounded-full relative">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-dark-bg rounded-xl border border-dark-border opacity-60">
                  <div>
                    <p className="text-sm font-medium text-white">Admin Authentication</p>
                    <p className="text-xs text-gray-400">Require JWT for admin dashboard access (Currently Disabled).</p>
                  </div>
                  <div className="w-12 h-6 bg-gray-700 rounded-full relative">
                    <div className="absolute left-1 top-1 w-4 h-4 bg-gray-500 rounded-full" />
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-bold text-white mb-4">System Identity</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-2">Platform Name</label>
                  <input type="text" defaultValue="Antigravity" className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-2">System Email</label>
                  <input type="text" defaultValue="admin@antigravity.io" className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-white" />
                </div>
              </div>
            </section>

            <div className="pt-6 border-t border-dark-border flex justify-end">
              <button className="bg-brand-600 hover:bg-brand-500 text-white px-6 py-2 rounded-xl font-medium transition-all">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
