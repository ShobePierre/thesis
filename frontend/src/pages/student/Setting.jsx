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
        // Load server avatar into profileSettings
        if (res.data?.user?.avatar) {
          const fullUrl = res.data.user.avatar.startsWith('http') ? res.data.user.avatar : `${FILE_BASE_URL}${res.data.user.avatar}`;
          setProfileSettings((prev) => ({ ...prev, avatar: fullUrl }));
          try { localStorage.setItem('student_profile', JSON.stringify({ ...prev, avatar: fullUrl })); } catch (e) {}
        }
        // Also load username and email if not already set
        if (res.data?.user?.username) {
          setProfileSettings((prev) => ({
            ...prev,
            name: res.data.user.username,
            email: res.data.user.email || prev.email,
            avatar: res.data.user.avatar ? (res.data.user.avatar.startsWith('http') ? res.data.user.avatar : `${FILE_BASE_URL}${res.data.user.avatar}`) : prev.avatar
          }));
          try { const prof = { ...JSON.parse(localStorage.getItem('student_profile') || '{}'), name: res.data.user.username, email: res.data.user.email || '' }; localStorage.setItem('student_profile', JSON.stringify(prof)); } catch (e) {}
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

      <div className="flex flex-1">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-grow p-6 md:p-20 md:ml-24 relative">
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
