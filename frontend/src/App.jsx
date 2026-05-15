import { useState, useEffect } from 'react'

const API_BASE = '/api/v1/admin'
const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_TOKEN || 'your_admin_token'

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ADMIN_TOKEN}`
  }
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span className="toast-icon">{t.type === 'success' ? '✅' : '❌'}</span>
          <span className="toast-msg">{t.msg}</span>
        </div>
      ))}
    </div>
  )
}

// ─── SIDEBAR ───────────────────────────────────────────────────────────────────
function Sidebar({ active, setActive }) {
  const navItems = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'tenants',   icon: '🏢', label: 'Tenants' },
    { id: 'logs',      icon: '📋', label: 'System Logs' },
    { id: 'health',    icon: '❤️', label: 'Health' },
  ]

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-mark">
          <div className="logo-icon">🏋️</div>
          <div className="logo-text">
            <h1>TheWiseGym</h1>
            <span>Admin Panel</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-title">Navigation</div>
        {navItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${active === item.id ? 'active' : ''}`}
            onClick={() => setActive(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="admin-profile">
          <div className="admin-avatar">A</div>
          <div className="admin-info">
            <h4>Admin</h4>
            <p>Super Admin</p>
          </div>
          <div className="admin-dot" />
        </div>
      </div>
    </aside>
  )
}

// ─── STATS CARD ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, change }) {
  return (
    <div className="stat-card">
      <div className="stat-header">
        <span className="stat-label">{label}</span>
        <span className="stat-icon">{icon}</span>
      </div>
      <div className="stat-value">{value ?? '—'}</div>
      {change && <div className="stat-change">{change}</div>}
    </div>
  )
}

// ─── COPY BUTTON ───────────────────────────────────────────────────────────────
function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button className="copy-btn" onClick={copy} title="Copy">
      {copied ? '✅' : '📋'}
    </button>
  )
}

// ─── CREATE TENANT MODAL ────────────────────────────────────────────────────────
function CreateTenantModal({ onClose, onSuccess }) {
  const [step, setStep] = useState(1) // 1 = form, 2 = success
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [form, setForm] = useState({
    name: '',
    db_host: '',
    db_user: '',
    db_password: '',
    db_database: '',
    db_port: '3306'
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.name.trim()) return alert('Tenant name is required')
    setLoading(true)
    try {
      const body = { name: form.name }
      if (form.db_host) {
        body.db_config = {
          host: form.db_host,
          user: form.db_user,
          password: form.db_password,
          database: form.db_database,
          port: parseInt(form.db_port) || 3306
        }
      }

      const res = await fetch(`${API_BASE}/tenants`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.message)
      setResult(data.tenant)
      setStep(2)
      onSuccess()
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div>
            <div className="modal-title">
              {step === 1 ? '🏢 Create New Tenant' : '🎉 Tenant Created!'}
            </div>
            <div className="modal-subtitle">
              {step === 1
                ? 'Add a new tenant client to your platform'
                : 'Save these credentials securely — secret key shown only once'}
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {step === 1 ? (
            <>
              {/* Basic Info */}
              <div className="section-label">Basic Information</div>
              <div className="form-group">
                <label className="form-label">Tenant Name *</label>
                <input
                  className="form-input"
                  placeholder="e.g. Acme Corp, FitStudio Pro"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                />
              </div>

              {/* Database Config */}
              <div className="section-label" style={{ marginTop: 24 }}>Remote Database (Optional)</div>
              <div className="form-group">
                <label className="form-label">Host / IP Address</label>
                <input
                  className="form-input"
                  placeholder="e.g. 82.25.121.102 or mysql.myhost.com"
                  value={form.db_host}
                  onChange={e => set('db_host', e.target.value)}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Database Username</label>
                  <input className="form-input" placeholder="e.g. u279359949_user" value={form.db_user} onChange={e => set('db_user', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input className="form-input" type="password" placeholder="••••••••" value={form.db_password} onChange={e => set('db_password', e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Database Name</label>
                  <input className="form-input" placeholder="e.g. u279359949_param" value={form.db_database} onChange={e => set('db_database', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Port</label>
                  <input className="form-input" placeholder="3306" value={form.db_port} onChange={e => set('db_port', e.target.value)} />
                </div>
              </div>
            </>
          ) : (
            <div className="result-box">
              {[
                { k: 'Tenant Name', v: result?.name },
                { k: 'App ID', v: result?.app_id },
                { k: 'Public Key', v: result?.public_key },
                { k: 'Secret Key ⚠️', v: result?.secret_key },
              ].map(row => (
                <div className="result-row" key={row.k}>
                  <span className="result-key">{row.k}</span>
                  <span className="result-val" style={{ maxWidth: 260, wordBreak: 'break-all', textAlign: 'right' }}>
                    {row.v}
                    {row.v && <CopyBtn text={row.v} />}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          {step === 1 ? (
            <>
              <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" onClick={submit} disabled={loading}>
                {loading ? 'Creating...' : '+ Create Tenant'}
              </button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={onClose}>Done</button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── EDIT TENANT MODAL ─────────────────────────────────────────────────────────
function EditTenantModal({ tenant, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const dbCfg = tenant.db_config || {}
  const [form, setForm] = useState({
    name: tenant.name || '',
    db_host: dbCfg.host || '',
    db_user: dbCfg.user || '',
    db_password: dbCfg.password || '',
    db_database: dbCfg.database || '',
    db_port: dbCfg.port || '3306'
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async () => {
    setLoading(true)
    try {
      const body = { name: form.name }
      if (form.db_host) {
        body.db_config = {
          host: form.db_host, user: form.db_user,
          password: form.db_password, database: form.db_database,
          port: parseInt(form.db_port) || 3306
        }
      }
      const res = await fetch(`${API_BASE}/tenants/${tenant.id}`, {
        method: 'PUT', headers: getHeaders(), body: JSON.stringify(body)
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.message)
      onSuccess('Tenant updated successfully')
      onClose()
    } catch (err) {
      alert('Error: ' + err.message)
    } finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div>
            <div className="modal-title">✏️ Edit Tenant</div>
            <div className="modal-subtitle">Update tenant details and database configuration</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="section-label">Basic Information</div>
          <div className="form-group">
            <label className="form-label">Tenant Name</label>
            <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="section-label" style={{ marginTop: 24 }}>Remote Database</div>
          <div className="form-group">
            <label className="form-label">Host / IP Address</label>
            <input className="form-input" value={form.db_host} onChange={e => set('db_host', e.target.value)} placeholder="e.g. 82.25.121.102" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Username</label>
              <input className="form-input" value={form.db_user} onChange={e => set('db_user', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" value={form.db_password} onChange={e => set('db_password', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Database Name</label>
              <input className="form-input" value={form.db_database} onChange={e => set('db_database', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Port</label>
              <input className="form-input" value={form.db_port} onChange={e => set('db_port', e.target.value)} />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={loading}>
            {loading ? 'Saving...' : '💾 Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── DELETE CONFIRM MODAL ─────────────────────────────────────────────────────
function DeleteModal({ tenant, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const del = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/tenants/${tenant.id}`, { method: 'DELETE', headers: getHeaders() })
      const data = await res.json()
      if (!data.success) throw new Error(data.message)
      onSuccess('Tenant deleted')
      onClose()
    } catch (err) { alert(err.message) }
    finally { setLoading(false) }
  }
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <div className="modal-title">🗑️ Delete Tenant</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{tenant.name}</strong>?
            This will permanently remove the tenant and all associated data. This action cannot be undone.
          </p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" onClick={del} disabled={loading}>
            {loading ? 'Deleting...' : '🗑️ Delete Tenant'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── VIEW USERS MODAL ─────────────────────────────────────────────────────────
function ViewUsersModal({ tenant, onClose }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_BASE}/tenants/${tenant.id}/users`, { headers: getHeaders() })
      .then(r => r.json())
      .then(d => { if (d.success) setUsers(d.users); setLoading(false) })
  }, [tenant.id])

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 800 }}>
        <div className="modal-header">
          <div>
            <div className="modal-title">👥 Users in {tenant.name}</div>
            <div className="modal-subtitle">View all registered users and their types</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ padding: 0 }}>
          <div className="table-wrapper" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            {loading ? <div className="loading-center"><div className="spinner" /></div> : (
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Last Seen</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.user_id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="admin-avatar" style={{ width: 30, height: 30, fontSize: 12 }}>{u.username[0]}</div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{u.username}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.user_id}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${u.user_type === 'astrologer' ? 'badge-purple' : 'badge-yellow'}`}>
                          {u.user_type}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${u.is_online ? 'badge-green' : 'badge-red'}`}>
                          {u.is_online ? 'Online' : 'Offline'}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {new Date(u.last_seen).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

// ─── TENANTS PAGE ──────────────────────────────────────────────────────────────
function TenantsPage({ addToast }) {
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editTenant, setEditTenant] = useState(null)
  const [deleteTenant, setDeleteTenant] = useState(null)
  const [viewUsers, setViewUsers] = useState(null)

  const fetchTenants = async () => {
    try {
      const res = await fetch(`${API_BASE}/tenants`, { headers: getHeaders() })
      const data = await res.json()
      if (data.success) setTenants(data.tenants)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchTenants() }, [])

  const toggleStatus = async (t) => {
    const newStatus = t.status === 'active' ? 'suspended' : 'active'
    try {
      await fetch(`${API_BASE}/tenants/${t.id}/status`, {
        method: 'PUT', headers: getHeaders(),
        body: JSON.stringify({ status: newStatus })
      })
      addToast(`Tenant ${newStatus}`, 'success')
      fetchTenants()
    } catch (e) { addToast('Failed to update status', 'error') }
  }

  const handleSuccess = (msg) => {
    addToast(msg || 'Tenant created!', 'success')
    fetchTenants()
  }

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <h2>Tenants</h2>
          <p>Manage all your client tenants and their database configurations</p>
        </div>
        <div className="topbar-right">
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            + New Tenant
          </button>
        </div>
      </div>

      <div className="page-content">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">All Tenants</div>
              <div className="card-subtitle">{tenants.length} tenant(s) registered</div>
            </div>
          </div>
          <div className="table-wrapper">
            {loading ? (
              <div className="loading-center"><div className="spinner" /></div>
            ) : tenants.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🏢</div>
                <h3>No tenants yet</h3>
                <p>Click "+ New Tenant" to onboard your first client</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Tenant</th>
                    <th>App ID</th>
                    <th>Database</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map(t => {
                    const cfg = typeof t.db_config === 'string' ? JSON.parse(t.db_config || '{}') : (t.db_config || {})
                    return (
                      <tr key={t.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{t.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>ID: {t.id}</div>
                        </td>
                        <td>
                          <div className="app-id-box">
                            <span className="app-id-text">{t.app_id}</span>
                            <CopyBtn text={t.app_id} />
                          </div>
                        </td>
                        <td>
                          {cfg.host ? (
                            <div>
                              <div style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{cfg.host}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{cfg.database}</div>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Default DB</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${t.status === 'active' ? 'badge-green' : 'badge-red'}`}>
                            <span className="badge-dot" />
                            {t.status}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                          {new Date(t.created_at).toLocaleDateString()}
                        </td>
                        <td>
                          <div className="actions">
                            <button className="btn btn-secondary btn-sm" onClick={() => setViewUsers(t)}>Users</button>
                            <button className="btn btn-secondary btn-sm" onClick={() => setEditTenant(t)}>Edit</button>
                            <button className="btn btn-secondary btn-sm" onClick={() => toggleStatus(t)}>
                              {t.status === 'active' ? 'Suspend' : 'Activate'}
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => setDeleteTenant(t)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {showCreate && <CreateTenantModal onClose={() => setShowCreate(false)} onSuccess={handleSuccess} />}
      {editTenant && <EditTenantModal tenant={editTenant} onClose={() => setEditTenant(null)} onSuccess={handleSuccess} />}
      {deleteTenant && <DeleteModal tenant={deleteTenant} onClose={() => setDeleteTenant(null)} onSuccess={handleSuccess} />}
      {viewUsers && <ViewUsersModal tenant={viewUsers} onClose={() => setViewUsers(null)} />}
    </>
  )
}

// ─── DASHBOARD PAGE ────────────────────────────────────────────────────────────
function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [health, setHealth] = useState(null)

  useEffect(() => {
    fetch(`${API_BASE}/stats`, { headers: getHeaders() })
      .then(r => r.json()).then(d => { if (d.success) setStats(d.stats) })
    fetch(`${API_BASE}/health`, { headers: getHeaders() })
      .then(r => r.json()).then(d => { if (d.success) setHealth(d.health) })
  }, [])

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <h2>Dashboard</h2>
          <p>Overview of your multi-tenant platform</p>
        </div>
        <div className="topbar-right">
          <span className="badge badge-green"><span className="badge-dot" />Live</span>
        </div>
      </div>
      <div className="page-content">
        <div className="stats-grid">
          <StatCard icon="🏢" label="Total Tenants" value={stats?.total_clients} change="All time" />
          <StatCard icon="👥" label="Online Users" value={stats?.active_users} change="Right now" />
          <StatCard icon="💬" label="Total Messages" value={stats?.total_messages} change="All time" />
          <StatCard icon="📞" label="Total Calls" value={stats?.total_calls} change="All time" />
        </div>

        {health && (
          <div className="card">
            <div className="card-header">
              <div className="card-title">❤️ System Health</div>
            </div>
            <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
              {[
                { label: 'Uptime', value: `${Math.floor(health.uptime / 60)} min` },
                { label: 'Memory', value: health.memory },
                { label: 'Database', value: health.db_status },
              ].map(row => (
                <div key={row.label} style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: 12, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>{row.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent-light)' }}>{row.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// ─── LOGS PAGE ─────────────────────────────────────────────────────────────────
function LogsPage() {
  const [logs, setLogs] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_BASE}/logs`, { headers: getHeaders() })
      .then(r => r.json())
      .then(d => {
        if (d.success) { setLogs(d.logs); setStats(d.stats) }
        setLoading(false)
      })
  }, [])

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <h2>System Logs</h2>
          <p>Recent platform activity and events</p>
        </div>
      </div>
      <div className="page-content">
        {stats && (
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 24 }}>
            <StatCard icon="📋" label="Events Today" value={stats.total_events} />
            <StatCard icon="🔗" label="Webhook Health" value={stats.webhook_health} />
            <StatCard icon="⚠️" label="Error Rate" value={stats.error_rate} />
          </div>
        )}
        <div className="card">
          <div className="card-header"><div className="card-title">Recent Events</div></div>
          <div className="table-wrapper">
            {loading ? <div className="loading-center"><div className="spinner" /></div> : (
              <table>
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Tenant</th>
                    <th>Details</th>
                    <th>Status</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 18 }}>
                            {log.event_type.includes('Started') ? '🟢' : 
                             log.event_type.includes('Accepted') ? '🤝' : 
                             log.event_type.includes('Rejected') ? '🚫' : 
                             log.event_type.includes('Cancelled') ? '🔴' : 
                             log.event_type.includes('Missed') ? '⏳' : 
                             log.event_type.includes('Busy') ? '📵' : 
                             log.event_type.includes('Ended') ? '🏁' : '📌'}
                          </span>
                          <span style={{ fontWeight: 500 }}>{log.event_type}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{log.tenant_name || '—'}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 12, maxWidth: 200 }}>{log.details}</td>
                      <td>
                        <span className={`badge ${
                          (log.event_type.includes('Failed') || log.event_type.includes('Missed') || log.event_type.includes('Rejected')) ? 'badge-red' : 
                          log.status === 'success' ? 'badge-green' : 'badge-red'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// ─── HEALTH PAGE ────────────────────────────────────────────────────────────────
function HealthPage() {
  const [health, setHealth] = useState(null)
  useEffect(() => {
    fetch(`${API_BASE}/health`, { headers: getHeaders() })
      .then(r => r.json()).then(d => { if (d.success) setHealth(d.health) })
  }, [])

  return (
    <>
      <div className="topbar">
        <div className="topbar-left"><h2>System Health</h2><p>Real-time server status</p></div>
      </div>
      <div className="page-content">
        {health ? (
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2,1fr)' }}>
            <StatCard icon="⏱️" label="Uptime" value={`${Math.floor(health.uptime / 60)} minutes`} change="Since last restart" />
            <StatCard icon="🧠" label="Memory Usage" value={health.memory} />
            <StatCard icon="🗄️" label="Database" value={health.db_status} change="Master DB" />
            <StatCard icon="📡" label="Redis" value={health.redis_status} />
          </div>
        ) : <div className="loading-center"><div className="spinner" /></div>}
      </div>
    </>
  )
}

// ─── APP ────────────────────────────────────────────────────────────────────────
export default function App() {
  const [activePage, setActivePage] = useState('dashboard')
  const [toasts, setToasts] = useState([])

  const addToast = (msg, type = 'success') => {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }

  const pages = {
    dashboard: <DashboardPage />,
    tenants: <TenantsPage addToast={addToast} />,
    logs: <LogsPage />,
    health: <HealthPage />,
  }

  return (
    <div className="layout">
      <Sidebar active={activePage} setActive={setActivePage} />
      <div className="main-content">
        {pages[activePage]}
      </div>
      <Toast toasts={toasts} />
    </div>
  )
}
