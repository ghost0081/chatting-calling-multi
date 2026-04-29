import { Bell, Search, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    window.location.href = '/login';
  };

  return (
    <header className="h-20 bg-dark-panel/50 backdrop-blur-md border-b border-dark-border flex items-center justify-between px-6 sticky top-0 z-20">
      <div className="flex items-center bg-dark-bg rounded-xl px-3 py-2 border border-dark-border w-96 focus-within:border-brand-500/50 transition-colors">
        <Search className="text-gray-500 w-5 h-5" />
        <input 
          type="text" 
          placeholder="Search tenants, ID, or user..." 
          className="bg-transparent border-none text-sm text-white focus:outline-none ml-2 w-full placeholder-gray-500"
        />
      </div>

      <div className="flex items-center space-x-4">
        <button className="relative p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-dark-bg">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-dark-panel"></span>
        </button>
        
        <div className="h-8 w-px bg-dark-border mx-2"></div>

        <div className="flex items-center">
          <div className="text-right mr-3 hidden md:block">
            <p className="text-sm font-medium text-white">Admin User</p>
            <p className="text-xs text-gray-400">Superadmin</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-500 to-purple-600 flex items-center justify-center text-white font-bold cursor-pointer border border-white/10 shadow-sm">
            A
          </div>
          <button 
            onClick={handleLogout}
            className="ml-4 p-2 text-gray-400 hover:text-red-400 transition-colors rounded-lg hover:bg-dark-bg"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
