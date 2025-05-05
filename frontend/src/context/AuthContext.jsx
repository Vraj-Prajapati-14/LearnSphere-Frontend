// In AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL;

  // Axios instance with base config
  const axiosAuth = axios.create({
    baseURL: API_URL,
    withCredentials: true,
  });

  // Store ongoing refresh promise
  let isRefreshing = false;
  let refreshSubscribers = [];

  const subscribeTokenRefresh = (cb) => {
    refreshSubscribers.push(cb);
  };

  const onTokenRefreshed = (err, newToken) => {
    refreshSubscribers.forEach((cb) => cb(err, newToken));
    refreshSubscribers = [];
  };

  // Attach refresh-token logic to interceptor
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
            // Queue the request until refresh completes
            return new Promise((resolve, reject) => {
              subscribeTokenRefresh((err, token) => {
                if (err) return reject(err);
                resolve(axiosAuth(originalRequest));
              });
            });
          }

          isRefreshing = true;

          try {
            console.log('🔄 Interceptor: refreshing token...');
            const response = await axiosAuth.post('/auth/refresh-token');
            console.log('🔄 Refresh successful:', response.data);
            isRefreshing = false;
            onTokenRefreshed(null, response.data);
            return axiosAuth(originalRequest);
          } catch (refreshError) {
            console.error('🔴 Interceptor refresh failed:', {
              status: refreshError.response?.status,
              data: refreshError.response?.data,
              message: refreshError.message,
            });
            isRefreshing = false;
            onTokenRefreshed(refreshError, null);
            if (refreshError.response?.status === 403 || refreshError.response?.status === 401) {
              console.log('Invalid or expired refresh token, logging out');
              logout();
              window.location.href = '/login';
            }
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

  // Initial auth check
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = Cookies.get('user');
        if (storedUser) {
          const response = await axiosAuth.get('/auth/validate');
          const { user: validatedUser } = response.data.data;
          const cleanUser = {
            id: validatedUser.id,
            email: validatedUser.email,
            role: validatedUser.role,
            name: validatedUser.name,
          };
          setUser(cleanUser);
          Cookies.set('user', JSON.stringify(cleanUser), {
            expires: 7,
            secure: import.meta.env.PROD,
            sameSite: 'Strict',
          });
        }
      } catch (err) {
        console.error('❌ Validation failed:', err);
        logout();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = (userData) => {
    const { id, email, role, name } = userData;
    const cleanUser = { id, email, role, name };
    setUser(cleanUser);
    Cookies.set('user', JSON.stringify(cleanUser), {
      expires: 7,
      secure: import.meta.env.PROD,
      sameSite: 'Strict',
    });
  };

  const logout = () => {
    setUser(null);
    Cookies.remove('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, axiosAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);