import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import Header from "../../web_components/Header";
import Sidebar from "./Sidebar";

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

    // Attempt to fetch instructor settings message (backend may vary)
    axios
      .get("http://localhost:5000/api/instructor/setting", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setMessage(res.data.message || "Instructor settings"))
      .catch((err) => {
        // Not fatal — show a friendly placeholder message
        console.error("Instructor settings fetch error", err?.response?.data || err);
        setMessage("Instructor settings — configure your class and preferences here.");
      });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // Active tab/section
  const [active, setActive] = useState('profile');

  // Per-section local state (persisted to localStorage). Defaults are sensible so page is usable right away.
  const [profileSettings, setProfileSettings] = useState(() => {
    try { return JSON.parse(localStorage.getItem('instructor_profile')) || { name: 'Your name', email: '', avatar: '' }; }
    catch { return { name: 'Your name', email: '', avatar: '' }; }
  });

  // classDefaults removed (feature removed) — keep settings smaller (Profile remains)

  const onSaveAll = () => {
    localStorage.setItem('instructor_profile', JSON.stringify(profileSettings));
    // persist a profile image key so Sidebar (and other widgets) can read a stable key for the current name
    try {
      if (profileSettings?.avatar) {
        localStorage.setItem(`profileImage_${profileSettings.name || 'Instructor'}`, profileSettings.avatar);
      }
    } catch (e) {}
    // keep simple username/email keys in sync with profile so other parts of the UI can read them
    try { localStorage.setItem('username', profileSettings.name || 'Instructor'); } catch(e){}
    try { localStorage.setItem('email', profileSettings.email || ''); } catch(e){}
    // notify same-tab listeners (storage events don't fire in same tab) so Sidebar updates immediately
    try { window.dispatchEvent(new CustomEvent('instructor_profile_changed', { detail: profileSettings })); } catch(e) {}
    // class defaults removed — no longer persisted by Settings page
    // Attempt to persist the display name (username) to the backend as well
    try {
      const token = localStorage.getItem('token');
      if (token && profileSettings?.name) {
        axios.put('http://localhost:5000/api/user/me', { username: profileSettings.name }, { headers: { Authorization: `Bearer ${token}` } })
          .then((res) => {
            // server persisted username
            console.log('Saved username to server', res.data);
          })
          .catch((err) => {
            // don't block local save if server call fails — log to console for debugging
            console.warn('Failed to persist username to server', err?.response?.data || err?.message || err);
          });
      }
    } catch (e) { console.warn('Error while persisting username', e); }

    // Persist avatar (and username) to instructor settings endpoint so avatar is stored in SQL
    try {
      const token = localStorage.getItem('token');
      if (token) {
        // derive avatar_path (server-side path) if we have a server URL or a path
        let avatarPath = profileSettings?.avatar || null;
        if (avatarPath && avatarPath.startsWith('http')) {
          try { avatarPath = new URL(avatarPath).pathname; } catch (e) {}
        }

        const payload = {};
        if (profileSettings?.name) payload.username = profileSettings.name;
        if (avatarPath) payload.avatar_path = avatarPath;

        if (Object.keys(payload).length > 0) {
          axios.put('http://localhost:5000/api/instructor/setting', payload, { headers: { Authorization: `Bearer ${token}` } })
            .then((res) => {
              console.log('Instructor setting saved', res.data);
            })
            .catch((err) => {
              console.warn('Failed to save instructor setting', err?.response?.data || err?.message || err);
            });
        }
      }
    } catch (e) { console.warn('Error while persisting instructor setting', e); }

    // Small UI feedback could be added — for now keep it simple
    alert('Saved settings locally');
  };

  const onResetChanges = () => {
    // Reload from storage (or defaults)
    try { setProfileSettings(JSON.parse(localStorage.getItem('instructor_profile')) || { name: 'Your name', email: '', avatar: '' }); } catch { setProfileSettings({ name: 'Your name', email: '', avatar: '' }); }
    // class defaults removed — nothing to restore here
  };

  // Listen for profile changes from other parts of the app (e.g., Sidebar)
  useEffect(() => {
    const handler = (e) => {
      try {
        const p = e?.detail || JSON.parse(localStorage.getItem('instructor_profile') || '{}');
        if (!p) return;
        // Ensure we don't overwrite local edits unintentionally — only update if different
        setProfileSettings((cur) => {
          if (!cur) return p;
          if (cur.name === p.name && cur.email === p.email && cur.avatar === p.avatar && cur.bio === p.bio) return cur;
          return { ...cur, ...p };
        });
      } catch (err) {
        // ignore
      }
    };

    window.addEventListener('instructor_profile_changed', handler);
    return () => window.removeEventListener('instructor_profile_changed', handler);
  }, []);

  const restoreDefaults = () => {
    setProfileSettings({ name: '', email: '', avatar: '' });
    // class defaults removed — defaults unchanged
    // no notification prefs to restore
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-[#cfe3fa] via-[#e6f0ff] to-white">
      <Header
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onLogout={handleLogout}
      />

      <div className="flex flex-1">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-grow p-6 md:p-20">
          <h1 className="text-3xl font-bold text-gray-800 mb-10 text-center drop-shadow-sm">Settings</h1>

          {/* Single unified settings panel */}
          <div className="max-w-6xl mx-auto bg-white/80 backdrop-blur-sm border border-gray-200 rounded-3xl shadow-xl p-6 md:p-10 grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Left nav */}
            <nav className="col-span-1 flex md:flex-col gap-3 items-center md:items-start justify-center md:justify-start">
              <button onClick={() => setActive('profile')} className={`w-full text-left p-3 rounded-lg transition ${active === 'profile' ? 'bg-gradient-to-r from-blue-50 to-blue-100 ring-1 ring-blue-200' : 'hover:bg-gray-50'}`}>
                <div className="text-sm font-semibold text-gray-900">Profile</div>
                <div className="text-xs text-gray-500 mt-1">Name, bio, avatar</div>
              </button>

              {/* Class defaults removed — nav kept minimal */}

              {/* Notifications tab removed — kept profile only */}
            </nav>

            {/* Right content */}
            <div className="col-span-3 bg-white rounded-2xl p-6 md:p-8 shadow-inner border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-800">Settings</h2>
                  <p className="text-sm text-gray-500 mt-1">Manage your profile, class defaults, and notification preferences from one place.</p>
                </div>

                
              </div>

              <div className="mt-6">
                {active === 'profile' && (
                  <ProfileForm value={profileSettings} onChange={setProfileSettings} />
                )}

                {/* class defaults removed */}

                {/* Notifications content removed */}

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

/* --- Small form components used by the unified panel --- */
function ProfileForm({ value, onChange }) {
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
          <input id="avatar-file-input" type="file" accept="image/*" onChange={async (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;

            // show a local preview immediately
            try {
              const url = URL.createObjectURL(file);
              update({ avatar: url });
              try { localStorage.setItem(`profileImage_${value?.name || 'Instructor'}`, url); } catch (e) {}
              try { const p = JSON.parse(localStorage.getItem('instructor_profile') || '{}'); p.avatar = url; localStorage.setItem('instructor_profile', JSON.stringify(p)); window.dispatchEvent(new CustomEvent('instructor_profile_changed', { detail: p })); } catch (e) {}
            } catch (e) {
              console.error('Avatar preview failed', e);
            }

            // then upload to server
            try {
              const token = localStorage.getItem('token');
              if (!token) return;
              const form = new FormData();
              form.append('avatar', file);

              const resp = await axios.put('http://localhost:5000/api/instructor/setting', form, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
              });

              // server returns { avatar: { file_path } }
              const serverPath = resp?.data?.avatar?.file_path;
              if (serverPath) {
                const full = `${window.location.origin.replace(/:\d+$/, ':5000')}${serverPath}`;
                update({ avatar: full });
                try { const p = JSON.parse(localStorage.getItem('instructor_profile') || '{}'); p.avatar = full; localStorage.setItem('instructor_profile', JSON.stringify(p)); window.dispatchEvent(new CustomEvent('instructor_profile_changed', { detail: p })); } catch (e) {}
              }
            } catch (err) {
              console.warn('Avatar upload failed', err?.response?.data || err?.message || err);
            }
          }} className="hidden" />

          <label htmlFor="avatar-file-input" className="cursor-pointer text-sm px-4 py-3 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition transform translate-x-3 md:translate-x-0">Edit profile</label>
        </div>
      </div>

      <div className="col-span-2">
        <label className="block text-sm font-medium text-gray-700">Display name</label>
        <input
          value={value?.name || ''}
          onChange={(e) => {
            const newName = e.target.value;
            update({ name: newName });
            try { localStorage.setItem('username', newName || 'Instructor'); } catch (e) {}
            // also keep instructor_profile.name in sync for same-tab updates
            try {
              const p = JSON.parse(localStorage.getItem('instructor_profile') || '{}');
              p.name = newName;
              localStorage.setItem('instructor_profile', JSON.stringify(p));
              window.dispatchEvent(new CustomEvent('instructor_profile_changed', { detail: p }));
            } catch (e) {}
          }}
          className="mt-2 block w-full rounded-md border-gray-200 p-2 shadow-sm text-black"
        />

        <label className="block text-sm font-medium text-gray-700 mt-4">Contact email</label>
        <input value={value?.email || ''} readOnly aria-readonly="true" className="mt-2 block w-full rounded-md border-gray-200 p-2 shadow-sm text-black bg-gray-50 cursor-not-allowed" />

        {/* short bio removed per UI update request */}
      </div>
    </div>
  );
}

// class defaults removed - UI no longer includes ClassForm

// Notifications removed for instructors — handled elsewhere if needed

export default Setting;
