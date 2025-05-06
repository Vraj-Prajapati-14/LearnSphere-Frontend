import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

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

  const updateUserToken = (token, userData) => {
    const updatedUser = { ...userData, token };
    setUser(updatedUser);
    Cookies.set('user', JSON.stringify(updatedUser), {
      expires: 7,
      secure: import.meta.env.PROD,
      sameSite: 'Strict',
    });
    Cookies.set('token', token, {
      expires: 7,
      secure: import.meta.env.PROD,
      sameSite: 'Strict',
    });
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
              subscribeTokenRefresh((err, token) => {
                if (err) return reject(err);
                originalRequest.headers['Authorization'] = `Bearer ${token}`;
                resolve(axiosAuth(originalRequest));
              });
            });
          }

          isRefreshing = true;
          try {
            const response = await axiosAuth.post('/auth/refresh-token', {}, {
              withCredentials: true,
            });
            const { user: refreshedUser, token } = response.data.data;
            updateUserToken(token, refreshedUser);
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            isRefreshing = false;
            onTokenRefreshed(null, token);
            return axiosAuth(originalRequest);
          } catch (refreshError) {
            isRefreshing = false;
            onTokenRefreshed(refreshError, null);
            logout();
            navigate('/login');
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
        const storedUserRaw = Cookies.get('user');
        let storedUser = null;
        if (storedUserRaw) {
          try {
            storedUser = JSON.parse(storedUserRaw);
          } catch (parseError) {
            Cookies.remove('user');
            Cookies.remove('token');
            Cookies.remove('refreshToken');
          }
        }

        if (storedUser) {
          try {
            const response = await axiosAuth.get('/auth/validate', {
              headers: { Authorization: `Bearer ${storedUser.token}` },
              withCredentials: true,
            });
            const { user: validatedUser, token } = response.data.data;
            const cleanUser = {
              id: validatedUser.id,
              email: validatedUser.email,
              role: validatedUser.role,
              name: validatedUser.name,
              token,
            };
            setUser(cleanUser);
            Cookies.set('user', JSON.stringify(cleanUser), {
              expires: 7,
              secure: import.meta.env.PROD,
              sameSite: 'Strict',
            });
            Cookies.set('token', token, {
              expires: 7,
              secure: import.meta.env.PROD,
              sameSite: 'Strict',
            });
          } catch (validateError) {
            if (validateError.response?.status === 401) {
              try {
                const response = await axiosAuth.post('/auth/refresh-token', {}, {
                  withCredentials: true,
                });
                const { user: refreshedUser, token } = response.data.data;
                const cleanUser = {
                  id: refreshedUser.id,
                  email: refreshedUser.email,
                  role: refreshedUser.role,
                  name: refreshedUser.name,
                  token,
                };
                setUser(cleanUser);
                Cookies.set('user', JSON.stringify(cleanUser), {
                  expires: 7,
                  secure: import.meta.env.PROD,
                  sameSite: 'Strict',
                });
                Cookies.set('token', token, {
                  expires: 7,
                  secure: import.meta.env.PROD,
                  sameSite: 'Strict',
                });
              } catch (refreshError) {
                logout();
                navigate('/login');
              }
            } else {
              logout();
              navigate('/login');
            }
          }
        }
      } catch (err) {
        logout();
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = (userData, token) => {
    const cleanUser = { ...userData, token };
    setUser(cleanUser);
    Cookies.set('user', JSON.stringify(cleanUser), {
      expires: 7,
      secure: import.meta.env.PROD,
      sameSite: 'Strict',
    });
    Cookies.set('token', token, {
      expires: 7,
      secure: import.meta.env.PROD,
      sameSite: 'Strict',
    });
  };

  const logout = async () => {
    try {
      await axiosAuth.post('/auth/logout', {}, { withCredentials: true });
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
    Cookies.remove('user');
    Cookies.remove('token');
    Cookies.remove('refreshToken');
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, axiosAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);