import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import axios from "axios";
import virtulab from "../../assets/Virtulab.svg";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ✅ Check if user already logged in (prevent going back to login)
  const token = localStorage.getItem("token");
  const userRoleId = localStorage.getItem("userRoleId");

  if (token && userRoleId) {
    if (userRoleId === "1") {
      return <Navigate to="/superadmin" replace />;
    } else if (userRoleId === "3") {
      return <Navigate to="/student/StudentDashboard" replace />;
    } else if (userRoleId === "2") {
      return <Navigate to="/instructor/dashboard" replace />;
    } else {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // handle input change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { email, password } = formData;
    if (!email || !password) {
      setError("All fields are required.");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });

      const { token, user } = response.data;

      // ✅ Save user session to localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("userId", user.id);
      localStorage.setItem("userRoleId", user.role_id);
      localStorage.setItem("username", user.username);
      localStorage.setItem("email", user.email);

      // 🎯 Redirect based on role (replace history so back won't return)
      if (user.role_id === 1) {
        navigate("/superadmin", { replace: true });
      } else if (user.role_id === 3) {
        navigate("/student/dashboard", { replace: true });
      } else if (user.role_id === 2) {
        navigate("/instructor/dashboard", { replace: true });
      } else {
        navigate("/unauthorized", { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Animated background elements */}
      <div className="login-bg-blob blob-1" />
      <div className="login-bg-blob blob-2" />
      <div className="login-bg-blob blob-3" />

      {/* Header */}
      <header className="login-header">
        <div className="header-content">
          <img src={virtulab} alt="VirtuLab" className="header-logo" />
          <div>
            <h1 className="header-title">VirtuLab</h1>
            <p className="header-subtitle">Virtual Laboratory Platform</p>
          </div>
        </div>
      </header>

      <div className="login-main">
        <div className="login-card">
          {/* Card Header */}
          <div className="login-card-header">
            <h2>Welcome Back</h2>
            <p>Sign in to your account to continue</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="login-form">
            {/* Email Field */}
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="form-input"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 1C6.48 1 2 5.48 2 11v10c0 .55.45 1 1 1h2v-4h14v4h2c.55 0 1-.45 1-1V11c0-5.52-4.48-10-10-10zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm6 15.5c0 .83-.67 1.5-1.5 1.5h-9c-.83 0-1.5-.67-1.5-1.5V12h12v7.5z" />
                </svg>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="form-input"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.41a3 3 0 10-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="error-message">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6m0 4v.01" stroke="white" strokeWidth="2" fill="none" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className={`login-button ${loading ? 'loading' : ''}`}
            >
              {loading ? (
                <>
                  <span className="button-spinner" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="form-divider">
              <span>New to VirtuLab?</span>
            </div>

            {/* Register Link */}
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="register-button"
            >
              Create an Account
            </button>
          </form>

          {/* Footer */}
          <div className="login-card-footer">
            <p>By signing in, you agree to our terms and conditions</p>
          </div>
        </div>


        {/* Side Illustration */}
        <div className="login-illustration">
          <div className="illustration-content">
            <h3>Welcome to VirtuLab</h3>
            <p>Your gateway to immersive virtual laboratory experiences</p>
            <ul className="feature-list">
              <li>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
                <span>Interactive Learning</span>
              </li>
              <li>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
                <span>Real-time Collaboration</span>
              </li>
              <li>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
                <span>Advanced Simulations</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
