import HomeIcon from "@mui/icons-material/Home";
import SettingsIcon from "@mui/icons-material/Settings";
import ArchiveIcon from "@mui/icons-material/Archive";
import AssignmentIcon from "@mui/icons-material/Assignment";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useRef, useEffect } from "react";

function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState(localStorage.getItem("username") || "Instructor");
  // editable name/avatar removed — sidebar is display-only now
  const [email, setEmail] = useState(localStorage.getItem("email") || "");
  const initials = username
    .split(" ")
    .map((n) => n.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  // removed file input ref (no inline avatar editing in the sidebar)
  const storageKey = `profileImage_${username}`;
  const sanitizeImage = (val) => {
    try {
      if (!val) return null;
      const s = String(val);
      // blob: URLs are session-local and won't survive reloads — ignore them
      if (s.startsWith('blob:')) return null;
      return s;
    } catch (e) {
      return null;
    }
  };

  const [profileImage, setProfileImage] = useState(() => sanitizeImage(localStorage.getItem(storageKey)) || null);

  // Listen for profile changes performed elsewhere in-page (Setting.jsx) and update name/email
  useEffect(() => {
    const handler = (evt) => {
      try {
        const payload = evt?.detail || null;
        if (!payload) return;
        const newName = payload.name || localStorage.getItem('username') || 'Instructor';
        const newEmail = payload.email || localStorage.getItem('email') || '';
        setUsername(newName);
        setEmail(newEmail);
        const newKey = `profileImage_${newName}`;
        const payloadAvatar = payload.avatar;
        if (payloadAvatar && !String(payloadAvatar).startsWith('blob:')) {
          setProfileImage(sanitizeImage(payloadAvatar) || sanitizeImage(localStorage.getItem(newKey)) || null);
        } else if (payloadAvatar && String(payloadAvatar).startsWith('blob:')) {
          try { setProfileImage(payloadAvatar); } catch (e) { setProfileImage(sanitizeImage(localStorage.getItem(newKey)) || null); }
        } else {
          setProfileImage(sanitizeImage(localStorage.getItem(newKey)) || null);
        }
      } catch (err) {
        // ignore
      }
    };

    // Listen for both instructor and student profile updates
    window.addEventListener('instructor_profile_changed', handler);
    window.addEventListener('student_profile_changed', handler);
    return () => {
      window.removeEventListener('instructor_profile_changed', handler);
      window.removeEventListener('student_profile_changed', handler);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // On mount, if no profile image in localStorage, try fetching from server for current user
  useEffect(() => {
    const tryLoad = async () => {
      if (profileImage) return;
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const resp = await fetch('http://localhost:5000/api/user/me/avatar', { headers: { Authorization: `Bearer ${token}` } });
        if (!resp.ok) return;
        const data = await resp.json();
        const url = data.avatar?.file_path || null;
        if (url) {
          const abs = url.startsWith('http') ? url : `http://localhost:5000${url}`;
          try { localStorage.setItem(storageKey, abs); } catch {}
            setProfileImage(sanitizeImage(abs));
        }
      } catch (err) {
        // silent
      }
    };
    tryLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const links = [
    { name: "Home", 
      icon: <HomeIcon fontSize="large" />, 
      path: "/instructor/dashboard" },
    {
      name: "Archived",
      icon: <ArchiveIcon fontSize="large" />,
      path: "/instructor/archived",
    },
    {
      name: "Settings",
      icon: <SettingsIcon fontSize="large" />,
      // navigate to instructor settings route (was incorrectly '/setting')
      path: "/instructor/setting",
    },
  ];

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          className="md:hidden fixed inset-0 z-40 transition-opacity duration-300 backdrop-blur-sm"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          }}
        ></div>
      )}

      <aside
        className={`bg-[#F6F8FA] border-r shadow-lg transition-all duration-300 ease-in-out ${
          isOpen
            ? "fixed top-0 left-0 z-50 w-72 h-screen"
            : "hidden md:flex md:sticky md:top-16 md:h-[calc(100vh-4rem)] md:w-72 md:flex-col"
        }`}
        style={{
          // ensure the aside sits above background layers when sticky
          zIndex: isOpen ? 9999 : undefined,
        }}
      >
        {/* Header Section */}
        <div className="px-4 py-6 text-center border-b">
          <div className="flex items-center justify-center gap-2">
            <h2 className="text-2xl font-bold text-[#19A5EA]">{username}</h2>
          </div>
          <p className="text-sm text-gray-500 mt-1">Instructor</p>

          <div className="mt-3 flex flex-col items-center justify-center -ml-1">
            <button
              onClick={() => setIsProfileOpen(true)}
              className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center font-semibold hover:bg-gradient-to-br hover:from-blue-300 hover:to-blue-500 transition-all cursor-pointer"
            >
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="profile"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    try { localStorage.removeItem(storageKey); } catch (er) {}
                    // hide broken image and allow initials to show
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                initials
              )}
            </button>
            {email && <p className="text-sm font-semibold text-black mt-3">{email}</p>}
          </div>
        </div>

        {/* Menu Items */}
        <div className="flex flex-col p-4 space-y-4 flex-1">
          {links.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <button
                key={link.name}
                onClick={() => {
                  navigate(link.path);
                  onClose?.();
                }}
                className={`
                  flex items-center gap-4 p-3 rounded-lg transition-all duration-200
                  ${
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-blue-100 hover:text-blue-600"
                  }
                `}
              >
                <div
                  className={isActive ? "text-blue-600" : "text-gray-700"}
                >
                  {link.icon}
                </div>
                <span className="text-lg font-medium">{link.name}</span>
              </button>
            );
          })}
        </div>

        {/* Footer Section */}
        <div className="px-4 py-6 text-center border-t">
          <p className="text-xs text-gray-500">© 2025 VirtuLab</p>
        </div>
      </aside>

      {isProfileOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setIsProfileOpen(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-sm mx-4 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end">
              <button
                onClick={() => setIsProfileOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
                aria-label="Close profile modal"
              >
                &times;
              </button>
            </div>

            <div className="flex flex-col items-center gap-4 pt-2">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center text-2xl font-bold">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      try { localStorage.removeItem(storageKey); } catch (er) {}
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  initials
                )}
              </div>
              {email && <p className="text-sm font-semibold text-black mt-3">{email}</p>}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsProfileOpen(false)}
                    className="mt-2 px-4 py-2 rounded-lg bg-gray-100 text-sm font-medium hover:bg-gray-200 transition"
                  >
                    Close
                  </button>
                </div>
            </div>
          </div>
        </div>
      )}
      {/* Hidden file input for profile image selection */}
      {/* Avatar change removed — sidebar is display-only */}
    </>
  );
}

export default Sidebar;
