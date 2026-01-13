import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../web_components/Header';
import './SuperAdminDashboard.css';

function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState('users');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) navigate('/login');
  }, [navigate]);

  return (
    <div className="flex h-screen overflow-hidden mt-15">
      <div className="flex-1 flex flex-col bg-gray-50">
        <Header/>

        {/* Super Admin Dashboard */}
        <div className="flex-1 overflow-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white px-8 py-6 shadow-lg">
            <h1 className="text-4xl font-bold text-white">Super Admin Dashboard</h1>
            <p className="text-purple-100 mt-2 text-lg">Manage users, data, and system configuration</p>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
            <div className="flex overflow-x-auto px-8">
              <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')}>
                👥 User Management
              </TabButton>
              <TabButton active={activeTab === 'export'} onClick={() => setActiveTab('export')}>
                📊 Export Data
              </TabButton>
              <TabButton active={activeTab === 'audit'} onClick={() => setActiveTab('audit')}>
                📋 Audit Logs
              </TabButton>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-8">
            {activeTab === 'users' && <UserManagement />}
            {activeTab === 'submissions' && <SubmissionsViewer />}
            {activeTab === 'export' && <ExportData />}
            {activeTab === 'audit' && <AuditLogs />}
            {activeTab === 'config' && <SystemConfig />}
            {activeTab === 'database' && <DatabaseManager />}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== TAB BUTTON ====================
function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-4 font-medium text-sm whitespace-nowrap border-b-2 transition ${
        active
          ? 'border-purple-600 text-purple-600'
          : 'border-transparent text-gray-600 hover:text-gray-900'
      }`}
    >
      {children}
    </button>
  );
}
    
// ==================== USER MANAGEMENT ====================
function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ username: '', email: '', password: '', role_id: 3 });

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (roleFilter) params.append('role_id', roleFilter);

      const response = await fetch(`http://localhost:5000/api/superadmin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/superadmin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowCreateModal(false);
        setFormData({ username: '', email: '', password: '', role_id: 3 });
        fetchUsers();
      }
    } catch (err) {
      console.error('Error creating user:', err);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/superadmin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        fetchUsers();
      }
    } catch (err) {
      console.error('Error deleting user:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="">All Roles</option>
          <option value="1">Super Admin</option>
          <option value="2">Admin (Instructor)</option>
          <option value="3">Student</option>
        </select>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
        >
          + Create User
        </button>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Create New User</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg"
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg"
              />
              <input
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg"
              />
              <select
                value={formData.role_id}
                onChange={(e) => setFormData({ ...formData, role_id: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg"
              >
                <option value={1}>Super Admin</option>
                <option value={2}>Admin (Instructor)</option>
                <option value={3}>Student</option>
              </select>
              <div className="flex gap-3">
                <button
                  onClick={handleCreateUser}
                  className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-300 text-gray-800 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-200 border-b border-gray-300">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Username</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Email</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Role</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Created At</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.user_id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{user.username}</td>
                  <td className="px-6 py-4 text-gray-700">{user.email}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        user.role_id === 1
                          ? 'bg-red-100 text-red-800'
                          : user.role_id === 2
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {user.role_name}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleDeleteUser(user.user_id)}
                      className="text-red-600 hover:text-red-800 font-medium text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==================== SUBMISSIONS VIEWER ====================
function SubmissionsViewer() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/superadmin/submissions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setSubmissions(data.submissions || []);
    } catch (err) {
      console.error('Error fetching submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-200 border-b border-gray-300">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Activity</th>
            <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Student</th>
            <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Grade</th>
            <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Submitted At</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                Loading...
              </td>
            </tr>
          ) : submissions.length === 0 ? (
            <tr>
              <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                No submissions found
              </td>
            </tr>
          ) : (
            submissions.map((sub) => (
              <tr key={sub.submission_id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{sub.activity_title}</td>
                <td className="px-6 py-4 text-gray-700">{sub.username}</td>
                <td className="px-6 py-4">
                  <span className={`font-semibold ${sub.grade >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                    {sub.grade || 'Not graded'}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-600 text-sm">
                  {new Date(sub.submitted_at).toLocaleString()}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ==================== EXPORT DATA ====================
function ExportData() {
  const [exporting, setExporting] = useState(false);

  const handleExport = async (type, format) => {
    setExporting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/superadmin/export?type=${type}&format=${format}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_export.${format}`;
      a.click();
    } catch (err) {
      console.error('Error exporting:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      {[
        { type: 'users', title: 'Users' },
        { type: 'submissions', title: 'Submissions' },
      ].map((item) => (
        <div key={item.type} className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4 text-gray-900">{item.title}</h3>
          <div className="flex gap-3">
            <button
              onClick={() => handleExport(item.type, 'json')}
              disabled={exporting}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              📄 JSON
            </button>
            <button
              onClick={() => handleExport(item.type, 'csv')}
              disabled={exporting}
              className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              📊 CSV
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ==================== AUDIT LOGS ====================
function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/superadmin/audit-logs?limit=50', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setLogs(data.logs || []);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-200 border-b border-gray-300">
          <tr>
            <th className="px-6 py-3 text-left font-bold text-gray-900">Action</th>
            <th className="px-6 py-3 text-left font-bold text-gray-900">Entity</th>
            <th className="px-6 py-3 text-left font-bold text-gray-900">User</th>
            <th className="px-6 py-3 text-left font-bold text-gray-900">IP Address</th>
            <th className="px-6 py-3 text-left font-bold text-gray-900">Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                Loading...
              </td>
            </tr>
          ) : logs.length === 0 ? (
            <tr>
              <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                No audit logs found
              </td>
            </tr>
          ) : (
            logs.map((log) => (
              <tr key={log.log_id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{log.action}</td>
                <td className="px-6 py-4 text-gray-700">{log.entity_type}</td>
                <td className="px-6 py-4 text-gray-700">{log.user_id}</td>
                <td className="px-6 py-4 text-gray-600 text-xs">{log.ip_address}</td>
                <td className="px-6 py-4 text-gray-600 text-xs">
                  {new Date(log.created_at).toLocaleString()}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ==================== SYSTEM CONFIG ====================
function SystemConfig() {
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/superadmin/config', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setConfig(data);
    } catch (err) {
      console.error('Error fetching config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/superadmin/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        alert('Configuration updated successfully');
      }
    } catch (err) {
      console.error('Error saving config:', err);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
      <h2 className="text-xl font-bold mb-6 text-gray-900">System Configuration</h2>
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">System Name</label>
            <input
              type="text"
              value={config.system_name || ''}
              onChange={(e) => setConfig({ ...config, system_name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Upload Size</label>
            <input
              type="text"
              value={config.max_upload_size || ''}
              onChange={(e) => setConfig({ ...config, max_upload_size: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.enable_analytics || false}
                onChange={(e) => setConfig({ ...config, enable_analytics: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <span className="ml-2 text-gray-700">Enable Analytics</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.maintenance_mode || false}
                onChange={(e) => setConfig({ ...config, maintenance_mode: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <span className="ml-2 text-gray-700">Maintenance Mode</span>
            </label>
          </div>
          <button
            onClick={handleSaveConfig}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
          >
            Save Configuration
          </button>
        </div>
      )}
    </div>
  );
}

// ==================== DATABASE MANAGER ====================
function DatabaseManager() {
  const [resetting, setResetting] = useState(false);

  const handleDatabaseReset = async (environment) => {
    if (
      !window.confirm(
        `⚠️ WARNING: This will reset the ${environment} database. All data will be deleted. Continue?`
      )
    ) {
      return;
    }

    setResetting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/superadmin/database/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ environment, confirm: true }),
      });

      if (response.ok) {
        alert(`${environment} database reset initiated`);
      }
    } catch (err) {
      console.error('Error resetting database:', err);
    } finally {
      setResetting(false);
    }
  };

  const handleBackupDatabase = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/superadmin/database/backup', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Backup initiated: ${data.filename}`);
      }
    } catch (err) {
      console.error('Error backing up database:', err);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold mb-4">Database Reset</h3>
        <p className="text-gray-600 text-sm mb-4">⚠️ Use with caution. Only for test/staging environments.</p>
        <div className="space-y-3">
          <button
            onClick={() => handleDatabaseReset('test')}
            disabled={resetting}
            className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            Reset Test Database
          </button>
          <button
            onClick={() => handleDatabaseReset('staging')}
            disabled={resetting}
            className="w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50"
          >
            Reset Staging Database
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold mb-4">Database Backup</h3>
        <p className="text-gray-600 text-sm mb-4">Create a backup of the current database.</p>
        <button
          onClick={handleBackupDatabase}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
        >
          💾 Create Backup
        </button>
      </div>
    </div>
  );
}

export default SuperAdminDashboard;
