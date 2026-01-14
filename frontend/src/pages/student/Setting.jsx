import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import Header from "../../web_components/Header";
import Sidebar from "./Sidebar";
const API_BASE_URL = "http://localhost:5000/api";
const FILE_BASE_URL = "http://localhost:5000";


function Setting() {
  const [message, setMessage] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    axios
      .get("http://localhost:5000/api/student/setting", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setMessage(res.data.message);
        
        // Populate profile settings from backend response
        if (res.data?.user) {
          const userData = res.data.user;
          const avatarUrl = userData.avatar 
            ? (userData.avatar.startsWith('http') ? userData.avatar : `${FILE_BASE_URL}${userData.avatar}`)
            : '';
          
          setProfileSettings({
            name: userData.username || 'Your name',
            email: userData.email || '',
            avatar: avatarUrl
          });
          
          // Update localStorage for consistency
          try {
            localStorage.setItem('username', userData.username || 'Student');
            localStorage.setItem('email', userData.email || '');
            localStorage.setItem('student_profile', JSON.stringify({
              name: userData.username || 'Your name',
              email: userData.email || '',
              avatar: avatarUrl
            }));
          } catch (e) {
            console.warn('Failed to update localStorage', e);
          }
        }
      })
      .catch((err) => {
        console.error(err);
        alert("Session expired. Please log in again.");
        localStorage.removeItem("token");
        navigate("/login");
      });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // Local profile state for student settings
  const [active, setActive] = useState("profile");

  const [profileSettings, setProfileSettings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("student_profile")) || { name: "Your name", email: "", avatar: "" };
    } catch {
      return { name: "Your name", email: "", avatar: "" };
    }
  });

  // keep the actual picked File object so we can upload it to the server on Save
  const [avatarFile, setAvatarFile] = useState(null);

  const [notificationPrefs, setNotificationPrefs] = useState(() => {
    try {
      return (
        JSON.parse(localStorage.getItem("student_notification_prefs")) || { submissions: true }
      );
    } catch {
      return { submissions: true };
    }
  });

  // Fetch messages when messages tab is active
  useEffect(() => {
    if (active === 'messages') {
      fetchMessages();
    }
  }, [active]);

  const fetchMessages = async () => {
    setLoadingMessages(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/user/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data.messages || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const markMessageAsRead = async (messageId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/user/messages/${messageId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(messages.map(m => 
        m.message_id === messageId ? { ...m, is_read: 1 } : m
      ));
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  };

  const deleteMessage = async (messageId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/user/messages/${messageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(messages.filter(m => m.message_id !== messageId));
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  const onSaveAll = async () => {
    localStorage.setItem("student_profile", JSON.stringify(profileSettings));
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Upload file if selected, otherwise mark avatar by path
      if (avatarFile instanceof File) {
        try {
          const fd = new FormData();
          fd.append('avatar', avatarFile);
          // include username so backend can update it together with the uploaded avatar
          try { fd.append('username', profileSettings.name || ''); } catch (e) {}
          const up = await axios.put(`${API_BASE_URL}/student/setting`, fd, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } });
          const av = up.data?.avatar || null;
          if (av && av.file_path) {
            const avatarUrl = av.file_path.startsWith('http') ? av.file_path : `${FILE_BASE_URL}${av.file_path}`;
            setProfileSettings((prev) => ({ ...(prev || {}), avatar: avatarUrl }));
            try { localStorage.setItem('student_profile', JSON.stringify({ ...(JSON.parse(localStorage.getItem('student_profile') || '{}')), avatar: avatarUrl })); } catch (e) {}
            // Persist profileImage for sidebar convenience
            try { const nameKey = profileSettings.name || localStorage.getItem('username') || 'Student'; localStorage.setItem(`profileImage_${nameKey}`, avatarUrl); } catch (e) {}
            // Dispatch an explicit event with fresh values so sidebars update immediately
            try { const payload = { name: profileSettings.name || localStorage.getItem('username') || 'Student', email: profileSettings.email || localStorage.getItem('email') || '', avatar: avatarUrl }; window.dispatchEvent(new CustomEvent('student_profile_changed', { detail: payload })); } catch (e) {}
          }
        } catch (err) {
          console.warn('Avatar upload failed', err?.response?.data || err?.message || err);
        } finally {
          setAvatarFile(null);
        }
      } else if (profileSettings?.avatar) {
        // Mark existing avatar as current by path
        let avatarPath = profileSettings.avatar;
        if (avatarPath.startsWith('http')) {
          try { avatarPath = new URL(avatarPath).pathname; } catch (e) {}
        }
        try {
          const resp = await axios.put(`${API_BASE_URL}/student/setting`, { avatar_path: avatarPath, username: profileSettings.name }, { headers: { Authorization: `Bearer ${token}` } });
          // If backend accepted and we have a valid avatar path, persist for sidebar and dispatch
          const avatarUrl = profileSettings.avatar && String(profileSettings.avatar).startsWith('http') ? profileSettings.avatar : `${FILE_BASE_URL}${avatarPath}`;
          try { const nameKey = profileSettings.name || localStorage.getItem('username') || 'Student'; localStorage.setItem(`profileImage_${nameKey}`, avatarUrl); } catch (e) {}
          try { window.dispatchEvent(new CustomEvent('student_profile_changed', { detail: { name: profileSettings.name || localStorage.getItem('username') || 'Student', email: profileSettings.email || localStorage.getItem('email') || '', avatar: avatarUrl } })); } catch (e) {}
        } catch (err) {
          console.warn('Failed to save avatar path', err?.response?.data || err?.message || err);
        }
      } else if (profileSettings?.name) {
        // Save username only
        try {
          await axios.put(`${API_BASE_URL}/student/setting`, { username: profileSettings.name }, { headers: { Authorization: `Bearer ${token}` } });
        } catch (err) {
          console.warn('Failed to save username', err?.response?.data || err?.message || err);
        }
      }
    } catch (e) { console.warn('Error while persisting profile', e); }
    try { localStorage.setItem('username', profileSettings.name || 'Student'); } catch(e) {}
    try { localStorage.setItem('email', profileSettings.email || ''); } catch(e) {}
    try { localStorage.setItem('student_notification_prefs', JSON.stringify(notificationPrefs)); } catch(e) {}
    // Dispatch a final, explicit profile_changed payload (use localStorage as authoritative)
    try {
      const finalName = profileSettings.name || localStorage.getItem('username') || 'Student';
      const finalEmail = profileSettings.email || localStorage.getItem('email') || '';
      const finalAvatar = profileSettings.avatar || localStorage.getItem(`profileImage_${finalName}`) || null;
      window.dispatchEvent(new CustomEvent('student_profile_changed', { detail: { name: finalName, email: finalEmail, avatar: finalAvatar } }));
    } catch(e) {}
    try { window.dispatchEvent(new CustomEvent('student_notification_prefs_changed', { detail: notificationPrefs })); } catch(e) {}
    alert('Saved settings locally');
  };

  const onResetChanges = () => {
    try { setProfileSettings(JSON.parse(localStorage.getItem('student_profile')) || { name: 'Your name', email: '', avatar: '' }); } catch { setProfileSettings({ name: 'Your name', email: '', avatar: '' }); }
    try { setNotificationPrefs(JSON.parse(localStorage.getItem('student_notification_prefs')) || { submissions: true }); } catch { setNotificationPrefs({ submissions: true }); }
  };

  const restoreDefaults = () => {
    setProfileSettings({ name: '', email: '', avatar: '' });
    setNotificationPrefs({ submissions: true });
  };

  useEffect(() => {
    const handler = (e) => {
      try {
        const p = e?.detail || JSON.parse(localStorage.getItem('student_profile') || '{}');
        if (!p) return;
        setProfileSettings((cur) => {
          if (!cur) return p;
          if (cur.name === p.name && cur.email === p.email && cur.avatar === p.avatar) return cur;
          return { ...cur, ...p };
        });
      } catch (err) {}
    };

    window.addEventListener('student_profile_changed', handler);
    return () => window.removeEventListener('student_profile_changed', handler);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-[#cfe3fa] via-[#e6f0ff] to-white">
      <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} onLogout={handleLogout} />

      <div className="flex flex-1 md:ml-72">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-grow p-6 md:p-20 relative w-full">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-left drop-shadow-sm">Settings</h1>

          <div className="w-full max-w-6xl mx-4 md:mx-0 bg-white/90 border border-gray-200 rounded-3xl shadow-xl p-4 md:p-8 grid grid-cols-1 md:grid-cols-4 gap-6">
            <nav className="col-span-1 flex md:flex-col gap-3 items-center md:items-start justify-center md:justify-start">
              <button onClick={() => setActive('profile')} className={`w-full text-left p-3 rounded-lg transition ${active === 'profile' ? 'bg-gradient-to-r from-blue-50 to-blue-100 ring-1 ring-blue-200' : 'hover:bg-gray-50'}`}>
                <div className="text-sm font-semibold text-gray-900">Profile</div>
                <div className="text-xs text-gray-500 mt-1">Name, bio, avatar</div>
              </button>

              <button onClick={() => setActive('notifications')} className={`w-full text-left p-3 rounded-lg transition ${active === 'notifications' ? 'bg-gradient-to-r from-indigo-50 to-indigo-100 ring-1 ring-indigo-200' : 'hover:bg-gray-50'}`}>
                <div className="text-sm font-semibold text-gray-900">Notifications</div>
                <div className="text-xs text-gray-500 mt-1">Alerts & preferences</div>
              </button>

              <button onClick={() => setActive('messages')} className={`w-full text-left p-3 rounded-lg transition ${active === 'messages' ? 'bg-gradient-to-r from-purple-50 to-purple-100 ring-1 ring-purple-200' : 'hover:bg-gray-50'}`}>
                <div className="text-sm font-semibold text-gray-900">Messages</div>
                <div className="text-xs text-gray-500 mt-1">Admin messages</div>
              </button>
            </nav>

            <div className="col-span-3 bg-white rounded-2xl p-4 md:p-6 shadow-inner border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-800">Settings</h2>
                  <p className="text-sm text-gray-500 mt-1">Manage your profile and notification preferences from one place.</p>
                </div>
            
              </div>

              <div className="mt-4">
                {active === 'profile' && (
                  <StudentProfileForm value={profileSettings} onChange={setProfileSettings} setAvatarFile={setAvatarFile} />
                )}

                {active === 'notifications' && (
                  <StudentNotificationsForm value={notificationPrefs} onChange={setNotificationPrefs} />
                )}

                {active === 'messages' && (
                  <StudentMessagesTab messages={messages} loading={loadingMessages} onMarkAsRead={markMessageAsRead} onDelete={deleteMessage} />
                )}

                <div className="mt-6 flex items-center justify-end gap-3">

                  <button onClick={onSaveAll} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg text-sm">Save changes</button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Setting;

function StudentProfileForm({ value, onChange, setAvatarFile }) {
  const update = (patch) => onChange({ ...value, ...patch });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
      <div className="col-span-1 flex flex-col items-center gap-3">
        <div className="w-28 h-28 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center border border-gray-200">
          {value?.avatar ? (
            <img src={value.avatar} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-black/60">No avatar</span>
          )}
        </div>

        <div className="mt-4 w-full flex justify-center">
          <input id="student-avatar-file-input" type="file" accept="image/*" onChange={(e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            // Store the File object in parent state for upload on Save
            if (setAvatarFile) setAvatarFile(file);
            try {
              const url = URL.createObjectURL(file);
              update({ avatar: url });
              // Do not persist blob: object URLs to localStorage (they won't survive reloads).
              // Dispatch a profile change event so sidebars can show a preview immediately.
              try {
                const existing = JSON.parse(localStorage.getItem('student_profile') || '{}');
                const payload = { ...(existing || {}), name: value?.name || existing?.name || 'Student', email: existing?.email || '', avatar: url };
                window.dispatchEvent(new CustomEvent('student_profile_changed', { detail: payload }));
              } catch (e) {}
            } catch (e) {
              console.error('Avatar preview failed', e);
            }
          }} className="hidden" />

          <label htmlFor="student-avatar-file-input" className="cursor-pointer text-sm px-4 py-3 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition">Edit profile</label>
        </div>
      </div>

      <div className="col-span-2">
        <label className="block text-sm font-medium text-gray-700">Display name</label>
        <input value={value?.name || ''} onChange={(e) => update({ name: e.target.value })} className="mt-2 block w-full rounded-md border-gray-200 p-2 shadow-sm text-black" />

        <label className="block text-sm font-medium text-gray-700 mt-4">Contact email</label>
        <input value={value?.email || ''} readOnly aria-readonly="true" className="mt-2 block w-full rounded-md border-gray-200 p-2 shadow-sm text-black bg-gray-50 cursor-not-allowed" />
      </div>
    </div>
  );
}

function StudentNotificationsForm({ value, onChange }) {
  const update = (patch) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-100">
        <div>
          <div className="text-sm font-semibold text-gray-800">Assignment submissions</div>
          <div className="text-xs text-gray-500 mt-1">Receive alerts when instructors grade your work</div>
        </div>
        {/* visually-hidden checkbox with styled switch */}
        <label className="inline-flex items-center cursor-pointer" aria-hidden="false">
          <input
            type="checkbox"
            role="switch"
            aria-label="Receive assignment submission alerts"
            checked={!!value?.submissions}
            onChange={(e) => update({ submissions: e.target.checked })}
            className="sr-only peer"
            aria-checked={!!value?.submissions}
          />

          {/* visual switch (controlled by the hidden checkbox 'peer') */}
          {/* Off: white/no color track with thumb on the right. On (checked): blue track and thumb moves to left. */}
          <div aria-hidden="true" className="w-12 h-7 bg-white rounded-full border border-gray-300 peer-checked:bg-blue-600 peer-checked:border-blue-600 peer-focus:ring-2 peer-focus:ring-blue-300 relative transition-colors flex items-center p-0.5">
            <span className="bg-white w-5 h-5 rounded-full shadow transform transition-transform translate-x-5 peer-checked:translate-x-0" />
          </div>
        </label>
      </div>

      {/* Announcements notification removed per UI requirement */}

      {/* System alerts removed per request */}
    </div>
  );
}
function StudentMessagesTab({ messages, loading, onMarkAsRead, onDelete }) {
  const [expandedMessage, setExpandedMessage] = useState(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-500 font-medium">Loading messages...</span>
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <p className="text-gray-500 font-medium text-lg">No messages</p>
        <p className="text-gray-400 text-sm">You don't have any messages from administrators yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map((msg) => (
        <div
          key={msg.message_id}
          className={`border rounded-lg overflow-hidden transition ${
            msg.is_read
              ? 'bg-gray-50 border-gray-200'
              : 'bg-blue-50 border-blue-300 shadow-sm'
          }`}
        >
          <button
            onClick={() => {
              setExpandedMessage(expandedMessage === msg.message_id ? null : msg.message_id);
              if (!msg.is_read) {
                onMarkAsRead(msg.message_id);
              }
            }}
            className="w-full p-4 text-left hover:bg-gray-100 transition"
          >
            <div className="flex items-start justify-between">
              <div className="flex-grow">
                <div className="flex items-center gap-2">
                  <h3 className={`font-semibold ${msg.is_read ? 'text-gray-700' : 'text-blue-900'}`}>
                    {msg.title}
                  </h3>
                  {!msg.is_read && (
                    <span className="inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  From: <span className="font-medium">{msg.admin_username}</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(msg.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <svg
                className={`w-5 h-5 text-gray-400 transition transform ${
                  expandedMessage === msg.message_id ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </button>

          {expandedMessage === msg.message_id && (
            <div className="border-t border-gray-200 bg-white px-4 py-4">
              <div className="prose prose-sm max-w-none mb-4 text-gray-700 whitespace-pre-wrap">
                {msg.content}
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => onDelete(msg.message_id)}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition font-medium text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}