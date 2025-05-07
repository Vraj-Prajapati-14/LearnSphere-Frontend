import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const axiosAuth = axios.create({
    baseURL: API_URL,
    withCredentials: true,
  });

  let isRefreshing = false;
  let refreshSubscribers = [];

  const subscribeTokenRefresh = (cb) => {
    refreshSubscribers.push(cb);
  };

  const onTokenRefreshed = (err, newToken) => {
    refreshSubscribers.forEach((cb) => cb(err, newToken));
    refreshSubscribers = [];
  };

  useEffect(() => {
    const interceptor = axiosAuth.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          !originalRequest.url.includes('/auth/refresh-token')
        ) {
          originalRequest._retry = true;

          if (isRefreshing) {
            return new Promise((resolve, reject) => {
              subscribeTokenRefresh((err) => {
                if (err) return reject(err);
                resolve(axiosAuth(originalRequest));
              });
            });
          }

          isRefreshing = true;
          try {
            console.log('Attempting to refresh token...');
            const response = await axiosAuth.post('/auth/refresh-token', {});
            const { user: refreshedUser } = response.data.data;
            console.log('Token refreshed successfully');
            setUser(refreshedUser);
            isRefreshing = false;
            onTokenRefreshed(null);
            return axiosAuth(originalRequest);
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError.response?.data || refreshError.message);
            isRefreshing = false;
            onTokenRefreshed(refreshError);
            setUser(null);
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axiosAuth.interceptors.response.eject(interceptor);
    };
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = Cookies.get('user');
        if (!storedUser) {
          console.log('No user cookie found');
          setLoading(false);
          return;
        }

        let userData;
        try {
          userData = JSON.parse(storedUser);
        } catch (parseError) {
          console.error('Failed to parse user cookie:', parseError);
          Cookies.remove('user');
          Cookies.remove('token');
          Cookies.remove('refreshToken');
          setLoading(false);
          return;
        }

        console.log('Validating user:', userData);
        try {
          const response = await axiosAuth.get('/auth/validate');
          const { user: validatedUser } = response.data.data;
          console.log('User validated successfully:', validatedUser);
          setUser(validatedUser);
        } catch (validateError) {
          console.error('User validation failed:', validateError.response?.data || validateError.message);
          setUser(null);
          Cookies.remove('user');
          Cookies.remove('token');
          Cookies.remove('refreshToken');
        }
      } catch (err) {
        console.error('Initialize auth error:', err);
        setUser(null);
        Cookies.remove('user');
        Cookies.remove('token');
        Cookies.remove('refreshToken');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = (userData) => {
    console.log('Logging in user:', userData);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await axiosAuth.post('/auth/logout', {});
      console.log('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error.response?.data || error.message);
    }
    setUser(null);
    Cookies.remove('user');
    Cookies.remove('token');
    Cookies.remove('refreshToken');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, axiosAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};