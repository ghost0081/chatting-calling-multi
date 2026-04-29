import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Tenants from './pages/Tenants';
import Keys from './pages/Keys';
import Logs from './pages/Logs';
import Infrastructure from './pages/Infrastructure';
import Settings from './pages/Settings';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <div className="flex h-screen bg-dark-bg overflow-hidden">
              <Sidebar />
              <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Navbar />
                <main className="flex-1 overflow-y-auto p-6">
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/tenants" element={<Tenants />} />
                      <Route path="/keys" element={<Keys />} />
                      <Route path="/logs" element={<Logs />} />
                      <Route path="/infra" element={<Infrastructure />} />
                      <Route path="/settings" element={<Settings />} />
                    </Routes>
                </main>
              </div>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
