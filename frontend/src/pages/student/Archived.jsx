import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ArchiveIcon from "@mui/icons-material/Archive";
import Header from "../../web_components/Header";
import Sidebar from "../student/Sidebar";
import "./Archived.css";


function Archived() {
  const [message, setMessage] = useState("");
  const [archived, setArchived] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    axios
      .get("http://localhost:5000/api/student/archived", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setMessage(res.data.message || "");
        if (res.data.archived) setArchived(res.data.archived);
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

  return (
    <div className="student-archived-container">
      {/* Animated background blobs */}
      <div className="student-archived-bg-blob student-archived-blob-1"></div>
      <div className="student-archived-bg-blob student-archived-blob-2"></div>
      <div className="student-archived-bg-blob student-archived-blob-3"></div>

      <div className="dashboard-main-wrapper">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Header
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            onLogout={handleLogout}
          />

          <main className="student-archived-main">
          <div className="student-archived-header">
            <h1 className="flex items-center justify-center gap-3 mb-2">
              <ArchiveIcon sx={{ fontSize: "2.5rem" }} />
              My Archived Classes
            </h1>
            <p>Browse your archived courses and activities</p>
          </div>

          {archived && archived.length > 0 ? (
            <div className="student-archived-grid">
              {archived.map((sub) => (
                <div
                  key={sub.subject_id || sub.class_id || sub.id}
                  onClick={() => navigate('/student/subclass', { state: { classData: sub, initialTab: 'newsfeed' } })}
                  className="student-archived-card"
                >
                  <div className="student-archived-card-header">
                    <div>
                      <div className="student-archived-card-title">
                        {sub.title || "Untitled Class"}
                      </div>
                    </div>
                    <span className="student-archived-card-badge">
                      Archived
                    </span>
                  </div>

                  <div className="student-archived-card-body">
                    <p className="student-archived-card-description">
                      {sub.description || "No description available."}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="student-archived-empty-container">
              <div className="student-archived-empty-card">
                <div className="student-archived-empty-icon">📦</div>
                <h2 className="student-archived-empty-title">No Archived Classes</h2>
                <p className="student-archived-empty-text">
                  {message || "You haven't archived any classes yet."}
                </p>
              </div>
            </div>
          )}
        </main>
        </div>
      </div>
    </div>
  );
}

export default Archived;
