import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../../web_components/Header";
import HomeIcon from "@mui/icons-material/Home";
// settings icon removed from dashboard (kept in Sidebar component)
import MenuIcon from "@mui/icons-material/Menu";
import NotificationsIcon from "@mui/icons-material/Notifications";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import DoneAllIcon from "@mui/icons-material/DoneAll";

import Sidebar from './Sidebar';

// Utility functions for localStorage persistence
const NOTIFICATIONS_STORAGE_KEY = 'student_notifications';
const DELETED_NOTIFICATIONS_KEY = 'deleted_notifications';
const AVATAR_CACHE_KEY = 'avatar_cache';
const AVATAR_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

const saveNotificationsToStorage = (notifs) => {
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifs));
  } catch (e) {
    console.error('Failed to save notifications to localStorage:', e);
  }
};

const loadNotificationsFromStorage = () => {
  try {
    const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Failed to load notifications from localStorage:', e);
    return [];
  }
};

const saveDeletedNotificationsToStorage = (deletedIds) => {
  try {
    localStorage.setItem(DELETED_NOTIFICATIONS_KEY, JSON.stringify(deletedIds));
  } catch (e) {
    console.error('Failed to save deleted notifications to localStorage:', e);
  }
};

const loadDeletedNotificationsFromStorage = () => {
  try {
    const stored = localStorage.getItem(DELETED_NOTIFICATIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Failed to load deleted notifications from localStorage:', e);
    return [];
  }
};

const filterOutDeletedNotifications = (notifs, deletedIds) => {
  return notifs.filter((n) => !deletedIds.includes(n.id));
};

const saveAvatarToCache = (userId, avatarUrl) => {
  try {
    const cache = JSON.parse(localStorage.getItem(AVATAR_CACHE_KEY) || '{}');
    cache[userId] = { url: avatarUrl, timestamp: Date.now() };
    localStorage.setItem(AVATAR_CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.error('Failed to save avatar to cache:', e);
  }
};

const getAvatarFromCache = (userId) => {
  try {
    const cache = JSON.parse(localStorage.getItem(AVATAR_CACHE_KEY) || '{}');
    const cached = cache[userId];
    if (cached && Date.now() - cached.timestamp < AVATAR_CACHE_TTL) {
      return cached.url;
    }
    // Clear expired cache entry
    delete cache[userId];
    localStorage.setItem(AVATAR_CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.error('Failed to retrieve avatar from cache:', e);
  }
  return null;
};

const clearExpiredAvatarCache = () => {
  try {
    const cache = JSON.parse(localStorage.getItem(AVATAR_CACHE_KEY) || '{}');
    const now = Date.now();
    Object.keys(cache).forEach((key) => {
      if (now - cache[key].timestamp > AVATAR_CACHE_TTL) {
        delete cache[key];
      }
    });
    localStorage.setItem(AVATAR_CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.error('Failed to clear expired avatar cache:', e);
  }
};

function StudentDashboard() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [showJoinModal, setShowJoinModal] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const [menuOpenFor, setMenuOpenFor] = useState(null);
  // Sidebar now manages profile (username/avatar) so dashboard doesn't duplicate that state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [showNotificationsButton, setShowNotificationsButton] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [deletedNotificationIds, setDeletedNotificationIds] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationPage, setNotificationPage] = useState(0);
  const NOTIFICATIONS_PER_PAGE = 10;
  // dashboard no longer needs its own file input ref — Sidebar handles profile uploads


  useEffect(() => {
    if (!menuOpenFor) return;
    const handleDocClick = (e) => {
      if (!e.target.closest('[data-menu-ignore]')) {
        setMenuOpenFor(null);
      }
    };
    document.addEventListener('mousedown', handleDocClick);
    return () => document.removeEventListener('mousedown', handleDocClick);
  }, [menuOpenFor]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchActiveClasses = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/student/active-classes",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setClasses(response.data?.activeClasses || []);
      } catch (err) {
        console.error("❌ Error fetching active classes:", err);
        if (err.response?.status === 401) {
          alert("Session expired. Please log in again.");
          localStorage.removeItem("token");
          navigate("/login");
        } else {
          alert(err.response?.data?.message || "Failed to load classes.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchActiveClasses();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleJoinClass = async () => {
    if (!joinCode.trim()) {
      alert("Please enter a class code.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5000/api/student/join-class",
        { classCode: joinCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const subject = response.data?.subject;
      if (subject) {
        // Navigate to student subclass view with the subject data
        setShowJoinModal(false);
        setJoinCode("");
        navigate('/student/subclass', { state: { classData: subject } });
        return;
      }

      alert(response.data?.message || "Successfully joined the class!");
      setShowJoinModal(false);
      setJoinCode("");
    } catch (err) {
      console.error("❌ Error joining class:", err);
      alert(err.response?.data?.message || "Failed to join class.");
    }
  };

  const toggleMenu = (id) => {
    setMenuOpenFor((prev) => (prev === id ? null : id));
  };

  const handleUnenroll = async (cls) => {
    const id = cls.subject_id || cls.class_id || cls.id;
    const confirmLeave = window.confirm('Are you sure you want to unenroll from this class?');
    if (!confirmLeave) return;

    try {
      const token = localStorage.getItem('token');
      // Try to call backend leave endpoint (may not exist yet)
      await axios.post(
        'http://localhost:5000/api/student/leave-class',
        { subjectId: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Remove from local state
      setClasses((prev) => prev.filter((c) => (c.subject_id || c.class_id || c.id) !== id));
      setMenuOpenFor(null);
      alert('You have been unenrolled from the class.');
    } catch (err) {
      console.error('❌ Error unenrolling from class:', err);
      // If backend doesn't exist or fails, still remove locally as fallback
      if (!err.response) {
        setClasses((prev) => prev.filter((c) => (c.subject_id || c.class_id || c.id) !== id));
        setMenuOpenFor(null);
        alert('Local unenroll applied (server call failed).');
      } else {
        alert(err.response?.data?.message || 'Failed to unenroll.');
      }
    }
  };

  useEffect(() => {
    if (showJoinModal && inputRef.current) {
      // small timeout to ensure modal is in DOM
      setTimeout(() => inputRef.current.focus(), 50);
    }
  }, [showJoinModal]);

  useEffect(() => {
    // Load notifications and deleted IDs from localStorage on mount
    const storedNotifs = loadNotificationsFromStorage();
    const deletedIds = loadDeletedNotificationsFromStorage();
    setDeletedNotificationIds(deletedIds);

    // Clear expired avatar cache
    clearExpiredAvatarCache();

    // Fetch server-side notifications for the logged-in user - run once on mount only
    let mounted = true;
    const fetchNotifications = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await axios.get('http://localhost:5000/api/user/me/notifications', { headers: { Authorization: `Bearer ${token}` } });
        if (!mounted) return;
        const serverNotifs = (res.data && res.data.notifications) ? res.data.notifications : [];

        // Map server shape to frontend notification shape and preserve raw payload
        const mapped = serverNotifs.map((n) => ({
          id: n.id,
          type: n.type || 'system',
          title: n.title || '',
          message: n.message || '',
          time: n.time || n.created_at,
          read: !!n.is_read,
          raw: n,
          // normalize a creator id if present on the server payload (common keys)
          creatorId: n.instructor_id || n.creator_id || n.actor_id || null,
          creatorName: n.instructor_name || n.creator_name || n.actor_name || '',
          creatorUsername: n.instructor_username || n.username || '',
        }));

        // Filter out deleted notifications
        const filteredMapped = filterOutDeletedNotifications(mapped, deletedIds);

        // Fetch avatars for instructor-originated notifications (announcements, activities, and grade feedback)
        const creatorIds = Array.from(new Set(filteredMapped
          .filter(m => m.type === 'announcement' || m.type === 'activity' || m.type === 'feedback')
          .map(m => m.creatorId)
          .filter(Boolean)));

        const avatarById = {};
        if (creatorIds.length > 0) {
          try {
            const avatarPromises = creatorIds.map(id => {
              // Check cache first
              const cachedUrl = getAvatarFromCache(id);
              if (cachedUrl) {
                return Promise.resolve({ url: cachedUrl });
              }
              // Fetch from server if not cached
              return fetch(`http://localhost:5000/api/user/${id}/avatar`, { headers: { Authorization: `Bearer ${token}` } })
                .then(r => r.ok ? r.json().catch(() => null) : null)
                .catch(() => null);
            });
            const avatarResults = await Promise.all(avatarPromises);
            avatarResults.forEach((r, i) => {
              if (r) {
                const path = r.url || (r.avatar && r.avatar.file_path);
                if (path) {
                  const fullUrl = path.startsWith('http') ? path : `http://localhost:5000${path}`;
                  avatarById[creatorIds[i]] = fullUrl;
                  saveAvatarToCache(creatorIds[i], fullUrl);
                }
              }
            });
          } catch (err) {
            console.error('Failed to fetch avatars for server notifications', err);
          }
        }

        const withAvatars = filteredMapped.map(m => ({ ...m, avatarUrl: m.creatorId ? avatarById[m.creatorId] || null : null }));

        // Set server notifications (replace existing, don't append)
        setNotifications(withAvatars);
        saveNotificationsToStorage(withAvatars);
      } catch (err) {
        // ignore errors and leave existing notifications as-is
      }
    };

    fetchNotifications();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    // Open an SSE connection for real-time updates for the student's classes
    const token = localStorage.getItem('token');
    if (!token) return;
    if (!classes || classes.length === 0) return;

    const subjectIds = classes.map(c => c.subject_id || c.class_id || c.id).filter(Boolean).join(',');
    if (!subjectIds) return;

    const esUrl = `http://localhost:5000/api/events?token=${encodeURIComponent(token)}&subjects=${encodeURIComponent(subjectIds)}`;
    const es = new EventSource(esUrl);

    const handleRealtime = (e) => {
      try {
        const payload = JSON.parse(e.data);
        // payload: { action: 'created'|'updated'|'deleted', type: 'announcement'|'activity', announcement|activity }
        if (!payload || !payload.type) return;

        if (payload.action === 'created' || payload.action === 'updated') {
          if (payload.type === 'announcement' && payload.announcement) {
            const ann = payload.announcement;
            const notif = {
              id: `ann-${ann.announcement_id}`,
              type: 'announcement',
              title: ann.instructor_name ? `${ann.instructor_name} posted` : 'New announcement',
              message: (ann.content || '').slice(0, 200),
              time: ann.created_at || new Date().toISOString(),
              read: false,
              subjectId: ann.subject_id,
              creatorId: ann.instructor_id,
              creatorName: ann.instructor_name || 'Instructor',
              raw: ann,
            };
            
            // Don't add if user previously deleted this notification
            if (!deletedNotificationIds.includes(notif.id)) {
              setNotifications((prev) => {
                const existing = prev.find(p => p.id === notif.id);
                const updated = existing
                  ? [notif, ...prev.filter(p => p.id !== notif.id)]
                  : [notif, ...prev];
                saveNotificationsToStorage(updated);
                return updated;
              });
            }
          }

          if (payload.type === 'activity' && payload.activity) {
            const act = payload.activity;
            const notif = {
              id: `act-${act.activity_id}`,
              type: 'activity',
              title: act.title || 'New classwork',
              message: (act.description || '').slice(0, 200),
              time: act.created_at || new Date().toISOString(),
              read: false,
              subjectId: act.subject_id,
              creatorId: act.instructor_id,
              creatorName: act.instructor_name || 'Instructor',
              raw: act,
            };
            
            // Don't add if user previously deleted this notification
            if (!deletedNotificationIds.includes(notif.id)) {
              setNotifications((prev) => {
                const existing = prev.find(p => p.id === notif.id);
                const updated = existing
                  ? [notif, ...prev.filter(p => p.id !== notif.id)]
                  : [notif, ...prev];
                saveNotificationsToStorage(updated);
                return updated;
              });
            }
          }

          // handle instructor grading feedback pushed in real-time
          if (payload.type === 'feedback' && payload.feedback) {
            const fb = payload.feedback;
            const notif = {
              id: `fb-${fb.notification_id || `s${fb.submission_id}`}`,
              type: 'feedback',
              title: fb.instructor_username ? `${fb.instructor_username} graded` : 'New grade',
              message: fb.message || (fb.grade !== null ? `Grade: ${fb.grade}` : 'Your submission was graded'),
              time: fb.created_at || new Date().toISOString(),
              read: false,
              subjectId: fb.subject_id || null,
              activityId: fb.activity_id || null,
              creatorId: fb.instructor_id || null,
              creatorName: fb.instructor_username || '',
              raw: fb,
            };
            
            // Don't add if user previously deleted this notification
            if (!deletedNotificationIds.includes(notif.id)) {
              setNotifications((prev) => {
                const existing = prev.find(p => p.id === notif.id);
                const updated = existing
                  ? [notif, ...prev.filter(p => p.id !== notif.id)]
                  : [notif, ...prev];
                saveNotificationsToStorage(updated);
                return updated;
              });
            }
          }
        }

        if (payload.action === 'deleted') {
          if (payload.type === 'announcement' && payload.announcementId) {
            setNotifications((prev) => {
              const updated = prev.filter(p => p.id !== `ann-${payload.announcementId}`);
              saveNotificationsToStorage(updated);
              return updated;
            });
          }
          if (payload.type === 'activity' && payload.activityId) {
            setNotifications((prev) => {
              const updated = prev.filter(p => p.id !== `act-${payload.activityId}`);
              saveNotificationsToStorage(updated);
              return updated;
            });
          }
        }
      } catch (err) {
        // ignore malformed events
      }
    };

    es.addEventListener('notification', handleRealtime);
    es.onerror = () => {
      // silently close and let browser attempt reconnects
      es.close();
    };

    return () => {
      try { es.removeEventListener('notification', handleRealtime); } catch (e) {}
      try { es.close(); } catch (e) {}
    };
  }, [classes, deletedNotificationIds]);

  // show/hide the notification button based on saved student prefs (same-tab events fired from settings)
  useEffect(() => {
    const readPrefs = () => {
      try {
        const raw = localStorage.getItem('student_notification_prefs');
        if (!raw) return setShowNotificationsButton(true); // default to true
        const prefs = JSON.parse(raw);
        // if submissions key is present and truthy -> show, otherwise hide
        setShowNotificationsButton(!!prefs?.submissions);
      } catch (e) {
        setShowNotificationsButton(true);
      }
    };

    readPrefs();

    const handler = (e) => {
      try {
        const p = e?.detail || JSON.parse(localStorage.getItem('student_notification_prefs') || '{}');
        setShowNotificationsButton(!!p?.submissions);
      } catch (err) {
        // ignore
      }
    };

    window.addEventListener('student_notification_prefs_changed', handler);
    return () => window.removeEventListener('student_notification_prefs_changed', handler);
  }, []);

  useEffect(() => {
    // when notifications change, update unread count
    const count = notifications.filter((n) => !n.read).length;
    setUnreadCount(count);
  }, [notifications]);

  // NOTE: Server notifications from /user/me/notifications should already include
  // announcements, activities, and feedback. This useEffect is disabled to prevent
  // duplicate fetching. All notifications come from the SSE connection or server endpoint.

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      saveNotificationsToStorage(updated);
      return updated;
    });
  };

  const handleDeleteNotification = (notificationId) => {
    setNotifications((prev) => {
      const updated = prev.filter((n) => n.id !== notificationId);
      saveNotificationsToStorage(updated);
      return updated;
    });
    
    // Track deleted notification IDs
    setDeletedNotificationIds((prev) => {
      const updated = [...prev, notificationId];
      saveDeletedNotificationsToStorage(updated);
      return updated;
    });
  };

  const handleClearAllNotifications = () => {
    const confirm = window.confirm('Are you sure you want to delete all notifications?');
    if (confirm) {
      const allDeletedIds = notifications.map((n) => n.id);
      
      setNotifications([]);
      saveNotificationsToStorage([]);
      
      setDeletedNotificationIds((prev) => {
        const updated = [...new Set([...prev, ...allDeletedIds])];
        saveDeletedNotificationsToStorage(updated);
        return updated;
      });
    }
  };

  const unreadNotifications = notifications.filter((n) => !n.read);
  const readNotifications = notifications.filter((n) => n.read);

  // Pagination for unread notifications
  const unreadPaginated = unreadNotifications.slice(
    notificationPage * NOTIFICATIONS_PER_PAGE,
    (notificationPage + 1) * NOTIFICATIONS_PER_PAGE
  );
  const unreadHasMore = unreadNotifications.length > (notificationPage + 1) * NOTIFICATIONS_PER_PAGE;
  const readHasMore = readNotifications.length > NOTIFICATIONS_PER_PAGE;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#E0EAFC] to-[#CFDEF3] transition-all duration-500 mt-10">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* footer now inside Sidebar component */}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onLogout={handleLogout}
        />

        <main className="flex-grow p-6 md:p-10 pt-28 md:pt-31 relative md:ml-0">
          {/* Join Class + Notifications Buttons */}
          <div className="absolute top-28 right-10 z-50 flex items-center gap-3">
            {showNotificationsButton && (
              <div className="relative">
                <button
                  onClick={() => {
                    setIsNotifOpen(true);
                  }}
                  className="flex items-center justify-center w-12 h-12 rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-md transition-all"
                  title="Notifications"
                >
                  <NotificationsIcon />
                </button>

                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-semibold leading-none text-white bg-red-500 rounded-full">{unreadCount}</span>
                )}
              </div>
            )}

            <button
              onClick={() => setShowJoinModal(true)}
              className="flex items-center gap-2 border border-gray-400 text-gray-800 hover:bg-gray-100 px-4 py-2 rounded-full font-medium transition-all bg-white shadow-md"
            >
              <span className="text-lg">＋</span> Join Class
            </button>
          </div>


          {/* Welcome Message */}
          <h1 className="text-3xl font-bold text-gray-800 mb-10 text-left drop-shadow-sm">
            Welcome, Student!
          </h1>

          {/* My Classes Section */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              My Classes
            </h2>

            {loading ? (
              <p className="text-center text-gray-600">Loading classes...</p>
            ) : classes.length === 0 ? (
              <div className="bg-white/70 backdrop-blur-md p-8 rounded-2xl shadow-sm flex justify-center items-center">
                <p className="text-gray-600 text-lg font-medium">
                  No active classes.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {classes.map((cls, index) => {
                  const classTitle = cls.title || "Untitled Class";
                  const initials = classTitle.slice(0, 2).charAt(0).toUpperCase() + classTitle.slice(1, 2).toLowerCase();

                  // Matching gradient palette with instructor dashboard - assigned by class ID hash
                  const colors = [
                    "linear-gradient(135deg, #E6F3FF 0%, #DCEFFF 100%)",
                    "linear-gradient(135deg, #FFF7ED 0%, #FFF1D6 100%)",
                    "linear-gradient(135deg, #EAF8FF 0%, #E6FFF4 100%)",
                    "linear-gradient(135deg, #F6EEFF 0%, #F0E8FF 100%)",
                    "linear-gradient(135deg, #E8FFF7 0%, #E6FFF0 100%)",
                    "linear-gradient(135deg, #FFF6F9 0%, #FFF2F0 100%)",
                  ];
                  // Use class ID to consistently assign color (same class = same color)
                  const classId = cls.subject_id || cls.class_id || cls.id;
                  const colorIndex = Array.from(classId.toString()).reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
                  const gradientColor = colors[colorIndex];

                  return (
                    <div
                      key={cls.subject_id || cls.class_id || cls.id}
                      onClick={() => navigate('/student/subclass', { state: { classData: cls } })}
                      className="relative bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-md p-6 flex flex-col hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                    >
                      <span className="absolute top-4 right-4 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-md">
                        Active
                      </span>

                      {/* Gradient Box with Initials */}
                      <div className="flex justify-center mb-4">
                        <div
                          style={{
                            background: gradientColor,
                          }}
                          className="h-16 w-16 rounded-xl flex items-center justify-center shadow-md"
                        >
                          <span className="text-2xl font-bold text-blue-700">
                            {initials}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-center text-center mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {classTitle}
                        </h3>
                      </div>

                      <p className="text-sm text-gray-600 mb-4 line-clamp-2 text-center">
                        {cls.description || "No description available."}
                      </p>

                      {cls.instructor_name && (
                        <p className="text-xs text-gray-500">
                          Instructor: <span className="font-medium">{cls.instructor_name}</span>
                        </p>
                      )}
                      {/* Burger menu (lower-right) */}
                      <button
                        data-menu-ignore
                        onClick={(e) => {
                          e.stopPropagation();
                          const id = cls.subject_id || cls.class_id || cls.id;
                          toggleMenu(id);
                        }}
                        className="absolute bottom-4 right-4 p-2 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 shadow"
                        title="Options"
                      >
                        <MenuIcon fontSize="small" />
                      </button>

                      {menuOpenFor === (cls.subject_id || cls.class_id || cls.id) && (
                        <div
                          data-menu-ignore
                          onClick={(e) => e.stopPropagation()}
                          className="absolute bottom-14 right-4 bg-white border border-gray-200 rounded-md shadow-md z-50"
                        >
                          <button
                            onClick={() => handleUnenroll(cls)}
                            className="block px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                          >
                            Unenroll
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Join Class Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
          <div className="bg-white rounded-2xl shadow-lg p-8 w-[90%] max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 text-center">
              Join a Class
            </h2>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Enter class code"
              className="w-full border border-gray-300 rounded-lg p-3 mb-4 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
              ref={inputRef}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowJoinModal(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleJoinClass}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all"
              >
                Join
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Slide-over */}
      {isNotifOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsNotifOpen(false)} />

          <aside className="relative ml-auto w-full max-w-3xl bg-white h-full shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-2xl font-extrabold text-gray-900">Notifications</h3>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <>
                    {unreadNotifications.length > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="flex items-center gap-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-all"
                        title="Mark all as read"
                      >
                        <DoneAllIcon fontSize="small" />
                        <span>Mark all read</span>
                      </button>
                    )}
                    <button
                      onClick={handleClearAllNotifications}
                      className="flex items-center gap-1 px-3 py-2 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-all"
                      title="Clear all notifications"
                    >
                      <DeleteIcon fontSize="small" />
                    </button>
                  </>
                )}
                <button onClick={() => setIsNotifOpen(false)} className="p-2 rounded-full text-gray-600 hover:bg-gray-100">
                  <CloseIcon />
                </button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto h-[calc(100%-80px)]">
              {notifications.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <p className="text-lg">No notifications yet</p>
                </div>
              ) : (
                <>
                  {unreadNotifications.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Today ({unreadNotifications.length})</h4>
                      <div className="space-y-4">
                        {unreadPaginated.map(n => (
                          <div key={n.id} onClick={() => {
                            // mark as read on first click and increment clickedCount
                            setNotifications((prev) => {
                              const updated = prev.map((p) => p.id === n.id ? { ...p, clickedCount: (p.clickedCount || 0) + 1, read: true } : p);
                              saveNotificationsToStorage(updated);
                              return updated;
                            });
                            const cls = classes.find(c => (c.subject_id || c.class_id || c.id) === n.subjectId);
                            if (cls) {
                              setIsNotifOpen(false);
                              navigate('/student/subclass', { state: { classData: cls, initialTab: n.type === 'announcement' ? 'newsfeed' : n.type === 'feedback' ? 'classwork' : 'classwork' } });
                            }
                          }} className="flex items-start gap-4 p-4 bg-white rounded-md shadow-sm border border-gray-100 cursor-pointer hover:bg-blue-50 transition-colors group relative">
                            <div className="h-12 w-12 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0">
                              {n.avatarUrl ? (
                                <img src={n.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                              ) : (
                                <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-700 font-semibold">{(n.creatorName||'G').charAt(0).toUpperCase()}</div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start gap-2">
                                <div className="flex-1">
                                  {n.type === 'feedback' ? (
                                    <div className="flex items-center gap-3">
                                      <span className="text-sm font-semibold text-gray-800">{n.creatorName}</span>
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">Grade</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-3">
                                      <span className="text-sm font-semibold text-gray-800">{n.creatorName}</span>
                                      <span className="text-sm text-gray-700">{n.type === 'announcement' ? 'Post an announcement in' : 'Post activity in'}</span>
                                      {n.type === 'announcement' ? (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">Newsfeed</span>
                                      ) : (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Classwork</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div className="text-xs text-gray-400 whitespace-nowrap ml-2">{new Date(n.time).toLocaleString()}</div>
                              </div>
                              <div className="text-sm text-gray-600 mt-2">{n.message}</div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteNotification(n.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-100 text-red-600"
                              title="Delete notification"
                            >
                              <DeleteIcon fontSize="small" />
                            </button>
                          </div>
                        ))}
                      </div>
                      {unreadHasMore && (
                        <button
                          onClick={() => setNotificationPage(prev => prev + 1)}
                          className="mt-4 w-full py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          Load more unread notifications
                        </button>
                      )}
                      {unreadNotifications.length > NOTIFICATIONS_PER_PAGE && (
                        <button
                          onClick={() => setNotificationPage(0)}
                          className="mt-2 w-full py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-all"
                        >
                          Show all unread
                        </button>
                      )}
                    </div>
                  )}

                  {readNotifications.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Earlier ({readNotifications.length})</h4>
                      <div className="space-y-4">
                        {readNotifications.slice(0, NOTIFICATIONS_PER_PAGE).map(n => (
                          <div key={n.id} onClick={() => {
                            // increment clicked count for read notifications as well
                            setNotifications((prev) => {
                              const updated = prev.map((p) => p.id === n.id ? { ...p, clickedCount: (p.clickedCount || 0) + 1 } : p);
                              saveNotificationsToStorage(updated);
                              return updated;
                            });
                            const cls = classes.find(c => (c.subject_id || c.class_id || c.id) === n.subjectId);
                            if (cls) {
                              setIsNotifOpen(false);
                              navigate('/student/subclass', { state: { classData: cls, initialTab: n.type === 'announcement' ? 'newsfeed' : n.type === 'feedback' ? 'classwork' : 'classwork' } });
                            }
                          }} className="flex items-start gap-4 p-4 bg-gray-50 rounded-md border border-gray-100 cursor-pointer hover:bg-blue-50 transition-colors group relative">
                            <div className="h-12 w-12 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0">
                              {n.avatarUrl ? (
                                <img src={n.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                              ) : (
                                <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-semibold">{(n.creatorName||'G').charAt(0).toUpperCase()}</div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start gap-2">
                                <div className="flex-1">
                                  {n.type === 'feedback' ? (
                                    <div className="flex items-center gap-3">
                                      <span className="text-sm font-semibold text-gray-800">{n.creatorName}</span>
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">Grade</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-3">
                                      <span className="text-sm font-semibold text-gray-800">{n.creatorName}</span>
                                      <span className="text-sm text-gray-700">{n.type === 'announcement' ? 'Post an announcement in' : 'Post activity in'}</span>
                                      {n.type === 'announcement' ? (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">Newsfeed</span>
                                      ) : (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Classwork</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div className="text-xs text-gray-400 whitespace-nowrap ml-2">{new Date(n.time).toLocaleString()}</div>
                              </div>
                              <div className="text-sm text-gray-600 mt-2">{n.message}</div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteNotification(n.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-100 text-red-600"
                              title="Delete notification"
                            >
                              <DeleteIcon fontSize="small" />
                            </button>
                          </div>
                        ))}
                      </div>
                      {readHasMore && (
                        <button
                          onClick={() => { /* Implement read notifications pagination if needed */ }}
                          className="mt-4 w-full py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          Load more older notifications
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* Avatar upload is now handled by Sidebar component */}
    </div>
  );
}

export default StudentDashboard;
