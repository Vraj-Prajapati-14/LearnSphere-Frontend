import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const initializeAuth = async () => {
      const storedUser = Cookies.get('user');
      const storedToken = Cookies.get('token');

      if (storedUser && storedToken) {
        try {
          const userData = JSON.parse(storedUser);
          await axios.get(`${API_URL}/auth/validate`, {
            headers: { Authorization: `Bearer ${storedToken}` },
          });
          setUser({ ...userData, token: storedToken });
        } catch (error) {
          console.error('Token validation failed:', error.response?.data || error.message);
          Cookies.remove('user');
          Cookies.remove('token');
          setUser(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, [API_URL]);

  const login = (userData) => {
    const { id, email, role, name, token } = userData; // Destructure to match backend response
    setUser({ id, email, role, name, token });
    Cookies.set('user', JSON.stringify({ id, email, role, name }), { expires: 7 });
    Cookies.set('token', token, { expires: 7 });
  };

  const logout = () => {
    setUser(null);
    Cookies.remove('user');
    Cookies.remove('token');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);