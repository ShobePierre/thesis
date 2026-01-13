import HomeIcon from "@mui/icons-material/Home";
import SettingsIcon from "@mui/icons-material/Settings";
import ArchiveIcon from "@mui/icons-material/Archive";
import AssignmentIcon from "@mui/icons-material/Assignment";
import ClassIcon from "@mui/icons-material/Class";
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from "react-router-dom";

function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Mirrored behaviour from StudentDashboard for a consistent sidebar
  const [username, setUsername] = useState(() => localStorage.getItem("username") || "Student");
  const [email, setEmail] = useState(() => localStorage.getItem("email") || "");
  const initials = username
    .split(" ")
    .map((n) => n.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const storageKey = `profileImage_${username}`;
  const sanitizeImage = (val) => {
    try {
      if (!val) return null;
      const s = String(val);
      if (s.startsWith('blob:')) return null;
      return s;
    } catch (e) { return null; }
  };

  const [profileImage, setProfileImage] = useState(() => sanitizeImage(localStorage.getItem(storageKey)) || null);

  // Listen for profile changes performed elsewhere in-page (Setting.jsx) and update name/email/avatar
  useEffect(() => {
    const handler = (evt) => {
      try {
        const payload = evt?.detail || null;
        if (!payload) return;
        const newName = payload.name || localStorage.getItem('username') || 'Student';
        const newEmail = payload.email || localStorage.getItem('email') || '';
        setUsername(newName);
        setEmail(newEmail);
        const newKey = `profileImage_${newName}`;
        // If payload includes avatar preview (object URL), use it for immediate preview
        const payloadAvatar = payload.avatar;
        if (payloadAvatar && !String(payloadAvatar).startsWith('blob:')) {
          setProfileImage(sanitizeImage(payloadAvatar) || sanitizeImage(localStorage.getItem(newKey)) || null);
        } else if (payloadAvatar && String(payloadAvatar).startsWith('blob:')) {
          // blob preview present in payload — show it temporarily (don't persist)
          try { setProfileImage(payloadAvatar); } catch (e) { setProfileImage(sanitizeImage(localStorage.getItem(newKey)) || null); }
        } else {
          setProfileImage(sanitizeImage(localStorage.getItem(newKey)) || null);
        }
      } catch (err) {
        // ignore
      }
    };

    window.addEventListener('student_profile_changed', handler);
    return () => window.removeEventListener('student_profile_changed', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Profile editing removed — username/avatar are display-only

  // On mount (or when username changes), try to fetch a server-side avatar
  useEffect(() => {
    let mounted = true;
    const token = localStorage.getItem('token');
    // If we already have an http(s) url in localStorage, prefer it
    const current = localStorage.getItem(storageKey);
    if (!token) return;
    if (current && typeof current === 'string' && current.startsWith('http')) return;
    (async () => {
      try {
        const r = await fetch('http://localhost:5000/api/user/me/avatar', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!r.ok) return;
        const d = await r.json();
        const fp = d?.avatar?.file_path;
        if (!fp) return;
        const abs = fp.startsWith('http') ? fp : `http://localhost:5000${fp}`;
        if (mounted) {
          try { localStorage.setItem(storageKey, abs); } catch {}
          setProfileImage(abs);
        }
      } catch (err) {
        // ignore failures
      }
    })();
    return () => { mounted = false; };
  }, [username]);

  const links = [
    { name: "Home", 
      icon: <HomeIcon fontSize="large" />, 
      path: "/student/StudentDashboard" },

    // 'My Classes' removed per UI request

    { name: "To Do", 
      icon: <AssignmentIcon fontSize="large" />, 
      path: "/student/todo" },

    { name: "Archived", 
      icon: <ArchiveIcon fontSize="large" />, 
      path: "/student/archived" },

    { name: "Settings", 
      icon: <SettingsIcon fontSize="large" />, 
      path: "/student/setting" },
  ];

  return (
    <>
      {/* ✅ Overlay (blur background when open) */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 backdrop-blur-sm transition-opacity duration-300"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        ></div>
      )}

      {/* ✅ Sidebar container */}
      <aside
        className={`${
          isOpen
            ? "fixed top-0 left-0 z-50 w-72 h-screen bg-white border-r-2 border-gray-200 shadow-lg"
            : "hidden md:flex md:sticky md:top-16 md:h-[calc(100vh-4rem)] md:w-72 md:flex-col bg-white border-r-2 border-gray-200 shadow-lg"
        } transform ${isOpen ? 'translate-x-0' : ''} transition-transform duration-300 ease-in-out z-50`}
      >
          {/* Header: match dashboard (avatar, name, email) */}
          <div className="px-4 py-6 text-center border-b">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2">
                <h2 className="text-3xl font-bold text-[#19A5EA] tracking-wide">{username}</h2>
              </div>

              <p className="text-sm text-gray-500">Student</p>

              <div className="mt-3 flex flex-col items-center justify-center -ml-1">
                <div
                  className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center font-semibold hover:shadow-lg hover:scale-110 transition-all cursor-pointer"
                >
                  {profileImage ? (
                      <img
                        src={profileImage}
                        alt="profile"
                        className="w-full h-full object-cover"
                        onError={(e) => { try { localStorage.removeItem(storageKey); } catch (er) {}; e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <span className="text-lg">{initials}</span>
                    )}
                </div>
                {email && <p className="text-sm font-semibold text-black mt-3">{email}</p>}
              </div>
            </div>
          </div>

        {/* Navigation Links */}
        <div className="flex flex-col p-4 space-y-3">
          {links.map((link) => {
            const active = location.pathname && location.pathname.startsWith(link.path);
            return (
              <button
                key={link.name}
                onClick={() => navigate(link.path)}
                className={`flex items-center gap-4 text-gray-700 p-3 rounded-xl text-lg font-medium transition-all duration-200 ${active ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200' : 'hover:text-blue-600 hover:bg-blue-50'}`}
              >
                {link.icon}
                <span>{link.name}</span>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="absolute bottom-6 left-0 w-full text-center text-gray-400 text-sm">
          © 2025 VirtuLab
        </div>
        {/* Profile modal - opens when avatar clicked */}
        {/* Profile editing removed — avatar is display-only in the sidebar */}

        {/* Hidden file input for avatar selection */}
        {/* Profile editing removed — file input and upload handlers removed */}

        {/* Try to fetch server-side avatar for current user if available */}
      </aside>
    </>
  );
}

export default Sidebar;
