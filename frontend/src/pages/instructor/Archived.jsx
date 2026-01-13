import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import DeleteIcon from "@mui/icons-material/Delete";
import ArchiveIcon from "@mui/icons-material/Archive";
import Header from "../../web_components/Header";
import Sidebar from "./Sidebar";
import "./Archived.css";

function Archived_Instructor() {
  const [archived, setArchived] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchArchivedSubjects = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/instructor/archived",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setArchived(response.data?.archived || []);
      } catch (err) {
        console.error("❌ Error fetching archived subjects:", err);
        if (err.response?.status === 401) {
          alert("Session expired. Please log in again.");
          localStorage.removeItem("token");
          navigate("/login");
        } else {
          alert(err.response?.data?.message || "Failed to load archived subjects.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchArchivedSubjects();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleRestore = async (subjectId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Session expired. Please log in again.");
      navigate("/login");
      return;
    }

    try {
      await axios.put(
        `http://localhost:5000/api/instructor/restore/${subjectId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setArchived((prev) => prev.filter((s) => s.subject_id !== subjectId));
      alert("✅ Subject restored successfully!");
    } catch (err) {
      console.error("Error restoring subject:", err);
      alert(err.response?.data?.message || "Failed to restore subject.");
    }
  };

  return (
    <div className="archived-container">
      {/* Animated background blobs */}
      <div className="archived-bg-blob archived-blob-1"></div>
      <div className="archived-bg-blob archived-blob-2"></div>
      <div className="archived-bg-blob archived-blob-3"></div>

      <div className="dashboard-main-wrapper">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Header
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            onLogout={handleLogout}
          />

          <main className="archived-main">
          <div className="archived-header">
            <h1 className="flex items-center justify-center gap-3 mb-2">
              <ArchiveIcon sx={{ fontSize: "2.5rem" }} />
              Archived Classes
            </h1>
            <p>Restore or permanently delete archived classes</p>
          </div>

          {loading ? (
            <div className="archived-loading">
              <div className="archived-loading-spinner"></div>
              <p>Loading archived classes...</p>
            </div>
          ) : archived.length === 0 ? (
            <div className="archived-empty-container">
              <div className="archived-empty-card">
                <div className="archived-empty-icon">📦</div>
                <h2 className="archived-empty-title">No Archived Classes</h2>
                <p className="archived-empty-text">
                  You haven't archived any classes yet. Archive classes when you're done with them.
                </p>
              </div>
            </div>
          ) : (
            <div className="archived-grid">
              {archived.map((subj) => (
                <div key={subj.subject_id} className="archived-card">
                  <div className="archived-card-header">
                    <div className="archived-card-title">
                      {subj.title || "Untitled Class"}
                    </div>
                    <span className="archived-card-badge">
                      Archived
                    </span>
                  </div>

                  <div className="archived-card-body">
                    <p className="archived-card-description">
                      {subj.description || "No description available."}
                    </p>

                    {subj.class_code && (
                      <div className="archived-card-code">
                        <div className="archived-card-code-label">Class Code</div>
                        <div className="archived-card-code-value">{subj.class_code}</div>
                      </div>
                    )}

                    <div className="archived-button-group">
                      <button
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          handleRestore(subj.subject_id); 
                        }}
                        className="archived-btn archived-btn-restore"
                        title="Restore this class to active classes"
                      >
                        <RestartAltIcon sx={{ fontSize: "1.1rem" }} />
                        Restore
                      </button>

                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!window.confirm('Delete this archived class permanently? This cannot be undone.')) return;
                          const token = localStorage.getItem('token');
                          if (!token) {
                            alert('Session expired. Please log in again.');
                            navigate('/login');
                            return;
                          }
                          try {
                            await axios.delete(`http://localhost:5000/api/subject/${subj.subject_id}`, {
                              headers: { Authorization: `Bearer ${token}` }
                            });
                            setArchived((prev) => prev.filter((s) => s.subject_id !== subj.subject_id));
                            alert('Class deleted');
                          } catch (err) {
                            console.error('Error deleting subject:', err);
                            alert(err.response?.data?.message || 'Failed to delete class.');
                          }
                        }}
                        className="archived-btn archived-btn-delete"
                        title="Delete this class permanently"
                      >
                        <DeleteIcon sx={{ fontSize: "1.1rem" }} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default Archived_Instructor;
