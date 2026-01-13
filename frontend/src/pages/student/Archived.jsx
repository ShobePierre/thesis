import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../../web_components/Header";
import Sidebar from "../student/Sidebar"; 
import MenuIcon from "@mui/icons-material/Menu";


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
    <div className="flex bg-gradient-to-b from-[#e6f4ff] to-[#dfeeff] min-h-screen">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col">
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onLogout={handleLogout}
        />

        <main className="flex-grow p-8 transition-all duration-300 md:ml-24 pt-20 md:pt-28">
          {message && archived.length === 0 && (
            <p className="text-gray-700 text-lg">{message}</p>
          )}

          {archived && archived.length > 0 ? (
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-black">My Archived Classes</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {archived.map((sub) => {
                  const classTitle = sub.title || "Untitled Class";
                  const initials = (classTitle.slice(0, 2) || "").toUpperCase();

                  const colors = [
                    "linear-gradient(135deg, #E6F3FF 0%, #a5cbebff 100%)",
                    "linear-gradient(135deg, #67aff3ff 0%, #FFF1D6 100%)",
                    "linear-gradient(135deg, #EAF8FF 0%, #157dd3ff 100%)",
                    "linear-gradient(135deg, #F6EEFF 0%, #F0E8FF 100%)",
                    "linear-gradient(135deg, #E8FFF7 0%, #E6FFF0 100%)",
                    "linear-gradient(135deg, #FFF6F9 0%, #FFF2F0 100%)",
                  ];
                  const classId = sub.subject_id || sub.class_id || sub.id || Math.random();
                  const colorIndex = Array.from(classId.toString()).reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
                  const gradientColor = colors[colorIndex];

                  return (
                    <div
                      key={sub.subject_id || sub.class_id || sub.id}
                      onClick={() => navigate('/student/subclass', { state: { classData: sub, initialTab: 'newsfeed' } })}
                      className="relative bg-white border border-gray-200 rounded-2xl shadow-sm p-6 flex flex-col hover:shadow-xl hover:-translate-y-1 transition-transform duration-200 cursor-pointer hover:border-blue-100"
                    >
                      <span className="absolute top-4 right-4 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-md">Archived</span>

                      <div className="flex items-center gap-4 mb-4">
                        <div
                          style={{ background: gradientColor }}
                          className="h-16 w-16 rounded-xl flex items-center justify-center shadow-md flex-shrink-0"
                        >
                          <span className="text-2xl font-bold text-blue-700">{initials}</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{classTitle}</h3>
                          <p className="text-sm text-gray-500 mt-1">{sub.description ? sub.description.slice(0, 80) : 'No description available.'}</p>
                        </div>
                      </div>

                      <div className="mt-3 text-sm text-gray-600 line-clamp-3">{sub.description || "No description available."}</div>

                      {sub.instructor_name && (
                        <p className="text-xs text-gray-500 mt-4">Instructor: <span className="font-medium">{sub.instructor_name}</span></p>
                      )}

                      <button
                        data-menu-ignore
                        onClick={(e) => e.stopPropagation()}
                        className="absolute bottom-4 right-4 p-2 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 shadow"
                        title="Options"
                      >
                        <MenuIcon fontSize="small" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}

export default Archived;
