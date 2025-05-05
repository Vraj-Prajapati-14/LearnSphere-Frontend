import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
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
    console.log('Updating user state:', updatedUser);
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
            console.log('🔄 Interceptor: refreshing token...');
            const response = await axiosAuth.post('/auth/refresh-token');
            console.log('🔄 Refresh response:', response.data);
            const { user: refreshedUser, token } = response.data.data;
            updateUserToken(token, refreshedUser);
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            isRefreshing = false;
            onTokenRefreshed(null, token);
            return axiosAuth(originalRequest);
          } catch (refreshError) {
            console.error('🔴 Interceptor refresh failed:', {
              status: refreshError.response?.status,
              data: refreshError.response?.data,
              message: refreshError.message,
            });
            isRefreshing = false;
            onTokenRefreshed(refreshError, null);
            logout();
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
        console.log('Raw user cookie:', storedUserRaw);
        let storedUser = null;
        if (storedUserRaw) {
          try {
            storedUser = JSON.parse(storedUserRaw);
            console.log('Parsed user cookie:', storedUser);
          } catch (parseError) {
            console.error('❌ Failed to parse user cookie:', parseError);
            Cookies.remove('user');
            Cookies.remove('token');
          }
        }

        if (storedUser) {
          try {
            const response = await axiosAuth.get('/auth/validate');
            console.log('🔍 Validate response:', response.data);
            const { user: validatedUser, token } = response.data.data;
            const cleanUser = {
              id: validatedUser.id,
              email: validatedUser.email,
              role: validatedUser.role,
              name: validatedUser.name,
              token,
            };
            console.log('Setting user from validate:', cleanUser);
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
            console.error('❌ Validation failed:', validateError);
            if (validateError.response?.status === 401) {
              console.log('🔄 Attempting token refresh...');
              try {
                const response = await axiosAuth.post('/auth/refresh-token');
                console.log('🔄 Refresh response:', response.data);
                const { user: refreshedUser, token } = response.data.data;
                const cleanUser = {
                  id: refreshedUser.id,
                  email: refreshedUser.email,
                  role: refreshedUser.role,
                  name: refreshedUser.name,
                  token,
                };
                console.log('Setting user from refresh:', cleanUser);
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
                console.error('❌ Refresh failed:', refreshError);
                logout();
              }
            } else {
              logout();
            }
          }
        }
      } catch (err) {
        console.error('❌ Initialization error:', err);
        logout();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = (userData, token) => {
    const cleanUser = { ...userData, token };
    console.log('Logging in user:', cleanUser);
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

  const logout = () => {
    console.log('Logging out, clearing user state and cookies');
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

export const useAuth = () => useContext(AuthContext);