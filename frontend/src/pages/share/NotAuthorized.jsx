import HomeIcon from "@mui/icons-material/Home";
import LockIcon from "@mui/icons-material/Lock";
import { useNavigate } from "react-router-dom";
import "./NotAuthorized.css";

export default function NotAuthorized() {
  const navigate = useNavigate();

  return (
    <div className="not-authorized-container">
      {/* Animated background blobs */}
      <div className="not-auth-blob blob-1"></div>
      <div className="not-auth-blob blob-2"></div>
      <div className="not-auth-blob blob-3"></div>

      {/* Main content */}
      <div className="not-auth-card">
        <div className="not-auth-icon">
          <LockIcon className="w-16 h-16 text-red-500" />
        </div>

        <h1 className="not-auth-code">403</h1>
        <h2 className="not-auth-title">Access Denied</h2>
        
        <p className="not-auth-message">
          You do not have permission to access this resource. If you believe this is a mistake, please contact your administrator.
        </p>

        <div className="not-auth-buttons">
          <button
            onClick={() => navigate("/")}
            className="not-auth-btn not-auth-btn-primary"
          >
            <HomeIcon className="w-5 h-5" />
            Go to Home
          </button>
          <button
            onClick={() => navigate(-1)}
            className="not-auth-btn not-auth-btn-secondary"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
