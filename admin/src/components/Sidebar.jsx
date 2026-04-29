import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Key, Settings, Database, Server, Rocket } from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', to: '/' },
    { icon: Users, label: 'Tenants', to: '/tenants' },
    { icon: Key, label: 'API Keys', to: '/keys' },
    { icon: Database, label: 'Logs & Exports', to: '/logs' },
    { icon: Server, label: 'Infrastructure', to: '/infra' },
    { icon: Settings, label: 'Settings', to: '/settings' },
  ];

  return (
    <div className="w-64 bg-dark-panel border-r border-dark-border flex flex-col h-full hidden md:flex">
      <div className="h-20 flex items-center px-6 border-b border-dark-border">
        <div className="w-8 h-8 bg-gradient-to-br from-brand-400 to-brand-600 rounded-lg flex items-center justify-center mr-3 shadow-lg shadow-brand-500/30">
          <Rocket className="text-white w-4 h-4" />
        </div>
        <span className="text-xl font-bold text-white tracking-tight">Antigravity</span>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-brand-500/10 text-brand-400'
                  : 'text-gray-400 hover:bg-dark-bg hover:text-gray-200'
              }`
            }
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.label}
          </NavLink>
        ))}
      </div>

      <div className="p-4 border-t border-dark-border">
        <div className="bg-dark-bg rounded-xl p-4 border border-dark-border relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-brand-500/10 rounded-full blur-xl"></div>
          <p className="text-xs text-gray-400 mb-1">System Health</p>
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></div>
            <span className="text-sm font-medium text-white">All systems operational</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
