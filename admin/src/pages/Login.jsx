import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Rocket } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // In production, point to the actual backend URL
      const response = await axios.post('http://localhost:5000/api/v1/auth/admin/login', {
        email,
        password
      });

      if (response.data.success) {
        localStorage.setItem('admin_token', response.data.token);
        // Quick reload to apply token in App.jsx
        window.location.href = '/';
      }
    } catch (err) {
      setError('Invalid admin credentials');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg p-4">
      <div className="max-w-md w-full bg-dark-panel rounded-2xl shadow-2xl p-8 border border-dark-border relative overflow-hidden">
        {/* Decorative background blur */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-brand-500 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 bg-blue-500 rounded-full blur-3xl opacity-20"></div>
        
        <div className="relative z-10">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-brand-400 to-brand-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
              <Rocket className="text-white w-8 h-8 -rotate-3" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-center text-white mb-2">Antigravity</h2>
          <p className="text-gray-400 text-center mb-8">Admin Control Center</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-lg mb-6 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-dark-bg border border-dark-border text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                placeholder="admin@antigravity.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-dark-bg border border-dark-border text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-brand-600 hover:bg-brand-500 text-white font-medium py-3 rounded-xl shadow-lg shadow-brand-500/30 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
            >
              Sign In to Mission Control
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
