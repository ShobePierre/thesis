import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../web_components/Header';
import './SuperAdminDashboard.css';

function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState('users');
  const [stats, setStats] = useState({ totalUsers: 0, totalInstructors: 0, totalStudents: 0, totalAudits: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) navigate('/login');
    fetchStats();
  }, [navigate]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch users to calculate stats
      const usersResponse = await fetch('http://localhost:5000/api/superadmin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        const users = usersData.users || [];
        
        // Calculate stats from users data
        const totalUsers = users.length;
        const totalInstructors = users.filter(u => u.role_id === 2).length;
        const totalStudents = users.filter(u => u.role_id === 3).length;
        
        setStats({
          totalUsers,
          totalInstructors,
          totalStudents
        });
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden mt-15">
      <div className="flex-1 flex flex-col bg-gradient-to-br from-gray-50 via-blue-50 to-cyan-50">
        <Header/>

        {/* Super Admin Dashboard */}
        <div className="flex-1 overflow-auto">
          {/* Enhanced Header with Gradient */}
          <div className="bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 text-white px-8 py-10 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-black opacity-10"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h1 className="text-5xl font-extrabold text-white drop-shadow-lg">Super Admin Control</h1>
              </div>
              <p className="text-blue-100 mt-3 text-lg font-medium">Complete system management and oversight dashboard</p>
            </div>

            {/* Stats Cards in Header */}
            <div className="grid grid-cols-3 gap-4 mt-8 relative z-10">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500/30 p-3 rounded-lg">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white/80 text-sm font-medium">Total Users</p>
                    <p className="text-3xl font-bold text-white">{stats.totalUsers || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
                <div className="flex items-center gap-3">
                  <div className="bg-green-500/30 p-3 rounded-lg">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white/80 text-sm font-medium">Instructors</p>
                    <p className="text-3xl font-bold text-white">{stats.totalInstructors || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
                <div className="flex items-center gap-3">
                  <div className="bg-yellow-500/30 p-3 rounded-lg">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M12 14l9-5-9-5-9 5 9 5z" />
                      <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white/80 text-sm font-medium">Students</p>
                    <p className="text-3xl font-bold text-white">{stats.totalStudents || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Navigation Tabs */}
          <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10 shadow-sm">
            <div className="flex overflow-x-auto px-8">
              <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon="👥">
                User Management
              </TabButton>
              <TabButton active={activeTab === 'export'} onClick={() => setActiveTab('export')} icon="📊">
                Export Data
              </TabButton>
              <TabButton active={activeTab === 'audit'} onClick={() => setActiveTab('audit')} icon="📋">
                Audit Logs
              </TabButton>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-8">
            {activeTab === 'users' && <UserManagement onStatsUpdate={fetchStats} />}
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
function TabButton({ active, onClick, children, icon }) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-4 font-semibold text-sm whitespace-nowrap border-b-3 transition-all duration-300 flex items-center gap-2 ${
        active
          ? 'border-blue-600 text-blue-600 bg-blue-50/50'
          : 'border-transparent text-gray-600 hover:text-blue-500 hover:bg-gray-50'
      }`}
    >
      <span className="text-lg">{icon}</span>
      {children}
    </button>
  );
}
    
// ==================== USER MANAGEMENT ====================
function UserManagement({ onStatsUpdate }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [userToLock, setUserToLock] = useState(null);
  const [userToMessage, setUserToMessage] = useState(null);
  const [lockReason, setLockReason] = useState('');
  const [messageData, setMessageData] = useState({ title: '', content: '' });
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ username: '', email: '', password: '', role_id: 3 });

  useEffect(() => {
    fetchUsers();
    // Refresh users list every 30 seconds to show updates from other sources (e.g., student profile changes)
    const interval = setInterval(() => {
      fetchUsers();
    }, 30000);
    return () => clearInterval(interval);
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

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateUser = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const formDataToSend = new FormData();
      formDataToSend.append('username', formData.username);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('password', formData.password);
      formDataToSend.append('role_id', formData.role_id);
      
      if (profilePicture) {
        formDataToSend.append('profile_picture', profilePicture);
      }
      
      const response = await fetch('http://localhost:5000/api/superadmin/users', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      if (response.ok) {
        setShowCreateModal(false);
        setFormData({ username: '', email: '', password: '', role_id: 3 });
        setProfilePicture(null);
        setProfilePreview(null);
        fetchUsers();
        if (onStatsUpdate) onStatsUpdate();
      }
    } catch (err) {
      console.error('Error creating user:', err);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '', // Leave password empty for editing
      role_id: user.role_id
    });
    setProfilePreview(user.profile_picture ? `http://localhost:5000${user.profile_picture}` : null);
    setProfilePicture(null);
    setShowEditModal(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      const token = localStorage.getItem('token');
      
      const formDataToSend = new FormData();
      formDataToSend.append('username', formData.username);
      formDataToSend.append('email', formData.email);
      
      // Role is not editable via this form to prevent privilege changes
      // Only include password if it's not empty
      if (formData.password) {
        formDataToSend.append('password', formData.password);
      }
      
      // Include profile picture if changed
      if (profilePicture) {
        formDataToSend.append('profile_picture', profilePicture);
      }

      const response = await fetch(`http://localhost:5000/api/superadmin/users/${editingUser.user_id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      if (response.ok) {
        setShowEditModal(false);
        setEditingUser(null);
        setFormData({ username: '', email: '', password: '', role_id: 3 });
        setProfilePicture(null);
        setProfilePreview(null);
        fetchUsers();
        if (onStatsUpdate) onStatsUpdate();
      }
    } catch (err) {
      console.error('Error updating user:', err);
    }
  };

  const handleDeleteUser = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleLockUser = (user) => {
    setUserToLock(user);
    setLockReason('');
    setShowLockModal(true);
  };

  const handleMessageUser = (user) => {
    setUserToMessage(user);
    setMessageData({ title: '', content: '' });
    setShowMessageModal(true);
  };

  const sendMessage = async () => {
    if (!userToMessage || !messageData.title || !messageData.content) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/superadmin/messages', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          user_id: userToMessage.user_id,
          title: messageData.title,
          content: messageData.content
        }),
      });

      if (response.ok) {
        alert('Message sent successfully');
        setShowMessageModal(false);
        setUserToMessage(null);
        setMessageData({ title: '', content: '' });
      } else {
        const error = await response.json();
        alert('Error: ' + error.message);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Error sending message');
    }
  };

  const confirmLockUser = async () => {
    if (!userToLock) return;

    try {
      const token = localStorage.getItem('token');
      const isLocked = !userToLock.is_locked;
      const response = await fetch(`http://localhost:5000/api/superadmin/users/${userToLock.user_id}/lock`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          isLocked,
          reason: lockReason || 'Restricted by administrator'
        }),
      });

      if (response.ok) {
        fetchUsers();
        if (onStatsUpdate) onStatsUpdate();
      }
    } catch (err) {
      console.error('Error toggling user lock:', err);
    } finally {
      setShowLockModal(false);
      setUserToLock(null);
      setLockReason('');
    }
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/superadmin/users/${userToDelete.user_id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        fetchUsers();
        if (onStatsUpdate) onStatsUpdate();
      }
    } catch (err) {
      console.error('Error deleting user:', err);
    } finally {
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Search and Filter Bar with Enhanced Design */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[300px] relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 text-gray-900 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
          
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-5 py-3 bg-gray-50 text-gray-900 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition"
          >
            <option value="">All Roles</option>
            <option value="1">Super Admin</option>
            <option value="2">Admin (Instructor)</option>
            <option value="3">Student</option>
          </select>
          
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create User
          </button>
        </div>
      </div>

      {/* Create Modal with Enhanced Design */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl transform transition-all animate-slideUp">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-100 p-3 rounded-xl">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Create New User</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                <input
                  type="text"
                  placeholder="Enter username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 text-gray-900 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 text-gray-900 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Profile Picture</label>
                <div className="flex items-center gap-4">
                  {profilePreview ? (
                    <img src={profilePreview} alt="Preview" className="w-16 h-16 rounded-full object-cover border-2 border-blue-200" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white font-bold text-xl">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                      className="hidden"
                      id="create-profile-upload"
                    />
                    <label
                      htmlFor="create-profile-upload"
                      className="cursor-pointer inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition font-medium text-sm"
                    >
                      Choose File
                    </label>
                    <p className="text-xs text-gray-500 mt-1">JPG, PNG or GIF (max 5MB)</p>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 pr-12 bg-gray-50 text-gray-900 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                <select
                  value={formData.role_id}
                  onChange={(e) => setFormData({ ...formData, role_id: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 bg-gray-50 text-gray-900 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value={1}>Super Admin</option>
                  <option value={2}>Admin (Instructor)</option>
                  <option value={3}>Student</option>
                </select>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCreateUser}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 rounded-xl hover:from-blue-700 hover:to-cyan-700 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                >
                  Create User
                </button>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowPassword(false);
                    setProfilePicture(null);
                    setProfilePreview(null);
                    setSearch('');
                    setRoleFilter('');
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-xl hover:bg-gray-300 font-semibold transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl transform transition-all animate-slideUp">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-cyan-100 p-3 rounded-xl">
                <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Edit User</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                <input
                  type="text"
                  placeholder="Enter username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 text-gray-900 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 text-gray-900 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Profile Picture</label>
                <div className="flex items-center gap-4">
                  {profilePreview ? (
                    <img src={profilePreview} alt="Preview" className="w-16 h-16 rounded-full object-cover border-2 border-cyan-200" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold text-xl">
                      {editingUser?.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                      className="hidden"
                      id="edit-profile-upload"
                    />
                    <label
                      htmlFor="edit-profile-upload"
                      className="cursor-pointer inline-block px-4 py-2 bg-cyan-100 text-cyan-700 rounded-lg hover:bg-cyan-200 transition font-medium text-sm"
                    >
                      Change Picture
                    </label>
                    <p className="text-xs text-gray-500 mt-1">JPG, PNG or GIF (max 5MB)</p>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Leave blank to keep current password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 pr-12 bg-gray-50 text-gray-900 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Only fill this if you want to change the password</p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                <div className="w-full px-4 py-3 bg-gray-50 text-gray-700 border border-gray-300 rounded-xl">
                  {editingUser?.role_name || (formData.role_id === 1 ? 'Super Admin' : formData.role_id === 2 ? 'Admin (Instructor)' : 'Student')}
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleUpdateUser}
                  className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 text-white py-3 rounded-xl hover:from-cyan-700 hover:to-blue-700 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                >
                  Update User
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
                    setFormData({ username: '', email: '', password: '', role_id: 3 });
                    setShowPassword(false);
                    setProfilePicture(null);
                    setProfilePreview(null);
                    setSearch('');
                    setRoleFilter('');
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-xl hover:bg-gray-300 font-semibold transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl transform transition-all animate-slideUp">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-red-100 p-3 rounded-xl">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Confirm Deletion</h2>
            </div>
            
            <div className="space-y-4">
              <p className="text-gray-700">
                Are you sure you want to delete user <span className="font-bold text-gray-900">{userToDelete.username}</span>?
              </p>
              <p className="text-sm text-gray-500">
                This action cannot be undone. All data associated with this user will be permanently removed.
              </p>
              
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-red-800">User Details</h4>
                    <div className="mt-2 text-sm text-red-700 space-y-1">
                      <p><span className="font-medium">Email:</span> {userToDelete.email}</p>
                      <p><span className="font-medium">Role:</span> {userToDelete.role_name}</p>
                      <p><span className="font-medium">Created:</span> {new Date(userToDelete.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={confirmDelete}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-xl hover:from-red-700 hover:to-red-800 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                >
                  Yes, Delete User
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setUserToDelete(null);
                    setSearch('');
                    setRoleFilter('');
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-xl hover:bg-gray-300 font-semibold transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lock User Modal */}
      {showLockModal && userToLock && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl transform transition-all animate-slideUp">
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-3 rounded-xl ${userToLock.is_locked ? 'bg-green-100' : 'bg-orange-100'}`}>
                <svg className={`w-6 h-6 ${userToLock.is_locked ? 'text-green-600' : 'text-orange-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {userToLock.is_locked ? 'Unlock Account' : 'Restrict Account'}
              </h2>
            </div>
            
            <div className="space-y-4">
              <p className="text-gray-700">
                Are you sure you want to {userToLock.is_locked ? 'unlock' : 'restrict'} user <span className="font-bold text-gray-900">{userToLock.username}</span>?
              </p>
              
              {!userToLock.is_locked && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Reason for Restriction (optional)</label>
                  <textarea
                    value={lockReason}
                    onChange={(e) => setLockReason(e.target.value)}
                    placeholder="e.g., Violation of terms of service, Academic dishonesty, etc."
                    className="w-full px-4 py-2 bg-gray-50 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                    rows="3"
                  />
                </div>
              )}
              
              <div className={`border rounded-xl p-4 ${userToLock.is_locked ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <svg className={`w-5 h-5 ${userToLock.is_locked ? 'text-green-600' : 'text-orange-600'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${userToLock.is_locked ? 'text-green-800' : 'text-orange-800'}`}>
                      {userToLock.is_locked 
                        ? 'Account will be unlocked and user can log in again'
                        : 'User will not be able to log in until account is unlocked'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={confirmLockUser}
                className={`flex-1 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all ${
                  userToLock.is_locked
                    ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
                    : 'bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800'
                }`}
              >
                {userToLock.is_locked ? 'Yes, Unlock Account' : 'Yes, Restrict Account'}
              </button>
              <button
                onClick={() => {
                  setShowLockModal(false);
                  setUserToLock(null);
                  setLockReason('');
                  setSearch('');
                  setRoleFilter('');
                }}
                className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-xl hover:bg-gray-300 font-semibold transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message User Modal */}
      {showMessageModal && userToMessage && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl transform transition-all animate-slideUp">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-purple-100 p-3 rounded-xl">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Send Message</h2>
                <p className="text-sm text-gray-600 mt-1">To: {userToMessage.username}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Message Title</label>
                <input
                  type="text"
                  placeholder="Enter message title"
                  value={messageData.title}
                  onChange={(e) => setMessageData({ ...messageData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 text-gray-900 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Message Content</label>
                <textarea
                  placeholder="Enter your message..."
                  value={messageData.content}
                  onChange={(e) => setMessageData({ ...messageData, content: e.target.value })}
                  rows="6"
                  className="w-full px-4 py-3 bg-gray-50 text-gray-900 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition resize-none"
                />
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={sendMessage}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 rounded-xl hover:from-purple-700 hover:to-purple-800 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                >
                  Send Message
                </button>
                <button
                  onClick={() => {
                    setShowMessageModal(false);
                    setUserToMessage(null);
                    setMessageData({ title: '', content: '' });
                    setSearch('');
                    setRoleFilter('');
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-xl hover:bg-gray-300 font-semibold transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Table with Enhanced Design */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">Username</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">Created At</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="text-gray-500 font-medium">Loading users...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p className="text-gray-500 font-medium text-lg">No users found</p>
                      <p className="text-gray-400 text-sm">Try adjusting your search filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.user_id} className="hover:bg-blue-50/50 transition-colors duration-150">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {user.profile_picture ? (
                          <img 
                            src={`http://localhost:5000${user.profile_picture}`} 
                            alt={user.username}
                            className="w-10 h-10 rounded-full object-cover border-2 border-blue-200"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="font-semibold text-gray-900">{user.username}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{user.email}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm ${
                          user.role_id === 1
                            ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                            : user.role_id === 2
                            ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                            : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                        }`}
                      >
                        {user.role_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">
                      {new Date(user.created_at).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-blue-600 hover:text-white hover:bg-blue-600 font-semibold text-sm px-4 py-2 rounded-lg transition-all duration-200 border border-blue-600"
                        >
                          Manage
                        </button>
                        <button
                          onClick={() => handleMessageUser(user)}
                          className="text-purple-600 hover:text-white hover:bg-purple-600 font-semibold text-sm px-4 py-2 rounded-lg transition-all duration-200 border border-purple-600"
                        >
                          Message
                        </button>
                        <button
                          onClick={() => handleLockUser(user)}
                          className={`font-semibold text-sm px-4 py-2 rounded-lg transition-all duration-200 border ${
                            user.is_locked 
                              ? 'text-green-600 hover:text-white hover:bg-green-600 border-green-600' 
                              : 'text-orange-600 hover:text-white hover:bg-orange-600 border-orange-600'
                          }`}
                        >
                          {user.is_locked ? 'Unlock' : 'Restrict'}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="text-red-600 hover:text-white hover:bg-red-600 font-semibold text-sm px-4 py-2 rounded-lg transition-all duration-200 border border-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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

  const exportOptions = [
    { 
      type: 'users', 
      title: 'Export Users', 
      description: 'Download complete user database',
      icon: '👥',
      color: 'from-blue-500 to-cyan-500'
    },
    { 
      type: 'submissions', 
      title: 'Export Submissions', 
      description: 'Download all student submissions',
      icon: '📝',
      color: 'from-green-500 to-emerald-500'
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-blue-500 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Export Information</h3>
            <p className="text-gray-600 text-sm mt-1">Download system data in JSON or CSV format for backup or analysis purposes.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {exportOptions.map((item) => (
          <div key={item.type} className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-3xl shadow-lg`}>
                {item.icon}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{item.title}</h3>
                <p className="text-gray-600 text-sm mt-1">{item.description}</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => handleExport(item.type, 'json')}
                disabled={exporting}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                JSON
              </button>
              <button
                onClick={() => handleExport(item.type, 'csv')}
                disabled={exporting}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-xl hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                CSV
              </button>
            </div>
          </div>
        ))}
      </div>

      {exporting && (
        <div className="fixed bottom-8 right-8 bg-white rounded-xl shadow-2xl p-6 border border-gray-200 animate-slideUp">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="font-semibold text-gray-900">Exporting data...</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== AUDIT LOGS ====================
function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');

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

  const getActionColor = (action) => {
    if (action.includes('CREATE')) return 'bg-green-100 text-green-800 border-green-200';
    if (action.includes('UPDATE')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (action.includes('DELETE')) return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getActionIcon = (action) => {
    if (action.includes('CREATE')) return '➕';
    if (action.includes('UPDATE')) return '✏️';
    if (action.includes('DELETE')) return '🗑️';
    return '📌';
  };

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center gap-4">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="flex-1 px-4 py-3 bg-gray-50 text-gray-900 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="all">All Actions</option>
            <option value="create">Create Actions</option>
            <option value="update">Update Actions</option>
            <option value="delete">Delete Actions</option>
          </select>
          <button
            onClick={fetchLogs}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition font-semibold flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left font-bold text-gray-900 uppercase tracking-wider">Action</th>
                <th className="px-6 py-4 text-left font-bold text-gray-900 uppercase tracking-wider">Entity</th>
                <th className="px-6 py-4 text-left font-bold text-gray-900 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-left font-bold text-gray-900 uppercase tracking-wider">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="text-gray-500 font-medium">Loading audit logs...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-gray-500 font-medium text-lg">No audit logs found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.log_id} className="hover:bg-blue-50/50 transition-colors duration-150">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getActionIcon(log.action)}</span>
                        <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{log.entity_type}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {log.profile_picture ? (
                          <img 
                            src={`http://localhost:5000${log.profile_picture}`} 
                            alt={log.username || `User ${log.user_id}`}
                            className="w-8 h-8 rounded-full object-cover border border-blue-200"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white font-bold text-xs">
                            {log.username?.charAt(0).toUpperCase() || log.user_id}
                          </div>
                        )}
                        <span className="text-gray-700 text-sm font-medium">{log.username || `User #${log.user_id}`}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-xs">
                      {new Date(log.created_at).toLocaleString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
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
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
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
