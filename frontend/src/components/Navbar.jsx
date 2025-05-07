import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => setMenuOpen((prev) => !prev);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-blue-600 text-white p-4">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link to="/" className="font-bold text-xl">LearnSphere</Link>

        <div className="flex items-center gap-4">
          {!user ? (
            <>
              <Link to="/login" className="hover:underline">Login</Link>
              <Link to="/register" className="hover:underline">Register</Link>
            </>
          ) : (
            <>
              {user.role === 'Student' && (
                <>
                  <Link to="/studentdashboard" className="hover:underline">All Courses</Link>
                  <Link to="/enrolled-courses" className="hover:underline">Enrolled Courses</Link>
                  {/* <Link to="/progress" className="hover:underline">Progress</Link> */}
                </>
              )}

              {user.role === 'Instructor' && (
                <>
                <Link to="/dashboard" className="hover:underline">Manage Courses</Link>
                <Link to="/statastics" className="hover:underline">Dashboard</Link>
                </>
              )}

              <div className="relative">
                <button
                  onClick={toggleMenu}
                  className="flex items-center gap-2 bg-blue-700 px-3 py-1 rounded hover:bg-blue-800"
                >
                  {user.name} ▼
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 bg-white text-black rounded shadow-lg w-40 z-50">
                    {/* <Link
                      to="/profile"
                      className="block px-4 py-2 hover:bg-gray-100"
                      onClick={() => setMenuOpen(false)}
                    >
                      Profile
                    </Link> */}
                    <button
                      onClick={() => {
                        handleLogout();
                        setMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;