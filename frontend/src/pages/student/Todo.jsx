import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../../web_components/Header";
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import Sidebar from "./Sidebar";

function To_do() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchTodo = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/student/todo", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setActivities(res.data?.activities || []);
      } catch (err) {
        console.error(err);
        alert("Session expired. Please log in again.");
        localStorage.removeItem("token");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchTodo();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const goToClasswork = (activity) => {
    const subject = {
      subject_id: activity.subject_id,
      title: activity.subject_title || activity.title,
      description: "",
      class_code: activity.class_code || "",
      instructor_id: activity.instructor_id,
    };
    // pass the activity id so the subclass page can open the activity modal
    navigate('/student/subclass', { state: { classData: subject, initialTab: 'classwork', openActivityId: activity.activity_id || activity.id } });
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#eaf6ff] via-[#d6eefc] to-white">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col">
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onLogout={handleLogout}
        />

        <main className="flex-grow p-6 md:p-10 pt-28 md:pt-24 md:ml-24 relative overflow-hidden">
          {/* decorative subtle shapes */}
          <div className="hidden md:block absolute -top-12 -left-20 h-72 w-72 rounded-full bg-gradient-to-br from-[#e6faff] to-[#d6f0ff] opacity-60 blur-3xl pointer-events-none" />
          <div className="hidden lg:block absolute bottom-[-120px] right-[-80px] h-64 w-64 rounded-full bg-gradient-to-tr from-[#dbefff] to-white opacity-50 blur-3xl pointer-events-none" />

          <div className="w-full max-w-6xl mx-4 md:mx-0">
            <div className="mb-6">
              <h1 className="text-3xl font-semibold text-slate-800">To Do</h1>
              <p className="text-sm text-slate-500 mt-1">Your upcoming activities and assignments across your classes.</p>
            </div>

            {loading ? (
              <div className="p-8 bg-white/60 rounded-xl shadow-inner text-center">
                <p className="text-gray-600">Loading...</p>
              </div>
            ) : activities.length === 0 ? (
              <div className="p-8 bg-white/60 rounded-xl shadow-inner text-center">
                <p className="text-gray-600">No pending activities. You're all caught up!</p>
              </div>
            ) : (
              <div className="space-y-5">
                {activities.map((a) => {
                  const config = typeof a.config_json === 'string' ? (() => { try { return JSON.parse(a.config_json); } catch(e){ return {}; } })() : (a.config_json || {});
                  return (
                    <div
                      key={a.activity_id}
                      onClick={() => goToClasswork(a)}
                      className="relative bg-white/90 backdrop-blur-md rounded-2xl p-6 shadow-md hover:shadow-2xl transition-transform duration-200 transform hover:-translate-y-2 cursor-pointer flex justify-between items-start border border-transparent hover:border-blue-100"
                    >
                      {/* left accent */}
                      <div className="absolute left-0 top-3 bottom-3 w-1.5 rounded-l-2xl bg-gradient-to-b from-indigo-500 via-blue-400 to-cyan-300" />
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="px-3 py-1 rounded-md bg-gradient-to-r from-indigo-100 to-blue-50 text-indigo-700 text-sm font-semibold border border-indigo-50 shadow-sm">{a.subject_title}</div>
                          <div className="text-xs text-gray-400">• {new Date(a.created_at).toLocaleDateString()}</div>
                        </div>

                        <h3 className="text-xl sm:text-2xl font-extrabold text-slate-800 mt-3 tracking-tight">{a.title}</h3>
                        {config.instructions && <p className="text-sm text-gray-600 mt-3 line-clamp-2">{config.instructions}</p>}

                        <div className="mt-4 flex items-center gap-3 text-xs text-gray-500">
                          {config.due_date_time && (
                            <div className="inline-flex items-center gap-2 bg-gray-100/60 px-3 py-1 rounded-full">
                              <AccessTimeIcon className="w-4 h-4 text-gray-500" />
                              <span>Due: {new Date(config.due_date_time).toLocaleString([], { hour:'numeric', minute:'2-digit', month: 'short', day: 'numeric' })}</span>
                            </div>
                          )}
                          {config.points && (
                            <div className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold">{config.points} pts</div>
                          )}
                        </div>
                      </div>

                      <div className="pl-6 ml-6 border-l border-transparent flex items-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); goToClasswork(a); }}
                          className="px-4 py-2 bg-gradient-to-r from-[#3b82f6] to-[#2563eb] hover:from-[#2563eb] hover:to-[#1e40af] text-white rounded-full shadow-lg transform transition duration-200 hover:-translate-y-0.5 flex items-center gap-2"
                        >
                          <span className="hidden sm:inline">View</span>
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 12h14M13 5l7 7-7 7" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default To_do;
