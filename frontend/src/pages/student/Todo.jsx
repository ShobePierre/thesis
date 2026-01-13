import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import Header from "../../web_components/Header";
import Sidebar from "./Sidebar";
import "./Todo.css";

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
    <div className="todo-container">
      {/* Animated background blobs */}
      <div className="todo-bg-blob todo-blob-1"></div>
      <div className="todo-bg-blob todo-blob-2"></div>
      <div className="todo-bg-blob todo-blob-3"></div>

      <div className="dashboard-main-wrapper">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Header
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            onLogout={handleLogout}
          />

          <main className="todo-main">
          <div className="todo-header">
            <h1 className="flex items-center justify-center gap-3 mb-2">
              <CheckCircleIcon sx={{ fontSize: "2.5rem" }} />
              To Do
            </h1>
            <p>Your upcoming activities and assignments across all classes</p>
          </div>

          {loading ? (
            <div className="todo-loading">
              <div className="todo-loading-spinner"></div>
              <p>Loading your tasks...</p>
            </div>
          ) : activities.length === 0 ? (
            <div className="todo-empty-container">
              <div className="todo-empty-card">
                <div className="todo-empty-icon">✅</div>
                <h2 className="todo-empty-title">All Caught Up!</h2>
                <p className="todo-empty-text">
                  No pending activities. You're doing great!
                </p>
              </div>
            </div>
          ) : (
            <div className="todo-list">
              {activities.map((a) => {
                const config = typeof a.config_json === 'string' ? (() => { try { return JSON.parse(a.config_json); } catch(e){ return {}; } })() : (a.config_json || {});
                return (
                  <div
                    key={a.activity_id}
                    onClick={() => goToClasswork(a)}
                    className="todo-card"
                  >
                    <div className="todo-card-header">
                      <div className="todo-card-content">
                        <div className="todo-card-subject">{a.subject_title}</div>
                        <div className="todo-card-title">
                          {a.title || a.activity_name || "Untitled Activity"}
                        </div>
                        {a.description && (
                          <div className="todo-card-description">
                            {a.description}
                          </div>
                        )}
                      </div>
                    </div>

                    {(a.due_date || a.open_date) && (
                      <div className="todo-card-meta">
                        {a.open_date && (
                          <div className="todo-card-meta-item">
                            <AccessTimeIcon sx={{ fontSize: "1rem" }} />
                            <span>Opens: {new Date(a.open_date).toLocaleDateString()}</span>
                          </div>
                        )}
                        {a.due_date && (
                          <div className="todo-card-meta-item">
                            <AccessTimeIcon sx={{ fontSize: "1rem" }} />
                            <span>Due: {new Date(a.due_date).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default To_do;
