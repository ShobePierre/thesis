import LogoutIcon from "@mui/icons-material/Logout";
import virtulab from "../assets/Virtulab.svg";
import { useNavigate } from "react-router-dom";
function Header({ onToggleSidebar }) {
  const navigate = useNavigate();
  const userRoleId = localStorage.getItem('userRoleId');

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRoleId");
    navigate("/");
  };

  const handleSuperAdminClick = () => {
    navigate("/superadmin");
  };

  return (
    <header className="bg-[#4FA9E2] text-white h-16 flex justify-between items-center shadow-md fixed w-full top-0 left-0 z-50 px-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <img src={virtulab} alt="VirtuLab" className="w-8" />
          <h1 className="text-xl font-semibold">VirtuLab</h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {userRoleId === '1' && (
          <button
            onClick={handleSuperAdminClick}
            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-md text-sm font-medium transition-colors"
          >
            🛡️ Admin Panel
          </button>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1 hover:text-gray-200 cursor-pointer"
        >
          <LogoutIcon className="mr-2" /> Logout
        </button>
      </div>
    </header>
  );
}

export default Header;
