import axios from 'axios';
import { isSessionExpired, clearAuthSession, saveAuthSession, recordUserActivity, SESSION_KEYS } from '../utils/session';

const getFallbackApiUrl = () => {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://marketpilot-r22y.onrender.com/api/v1';
  }
  return 'http://127.0.0.1:8000/api/v1';
};

export const API_BASE_URL = ((import.meta as any).env?.VITE_API_URL as string) || getFallbackApiUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auto-attach Bearer token & check session expiration before request
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem(SESSION_KEYS.TOKEN);

    if (token) {
      // If session is expired, abort request and log out cleanly
      if (isSessionExpired()) {
        clearAuthSession();
        const currentPath = window.location.pathname;
        if (!currentPath.includes('/login') && !currentPath.includes('/signup') && currentPath !== '/') {
          window.location.href = '/login?reason=expired';
        }
        return Promise.reject(new Error('Session has expired. Please log in again.'));
      }

      // Session is healthy, record user interaction activity
      recordUserActivity();

      if (config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  }
  return config;
});

// Global 401 Response Interceptor: immediately logs out if server rejects token
apiClient.interceptors.response.use(
  (response) => {
    recordUserActivity();
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        clearAuthSession();
        const currentPath = window.location.pathname;
        if (!currentPath.includes('/login') && !currentPath.includes('/signup') && currentPath !== '/') {
          window.location.href = '/login?reason=expired';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const setAuthToken = (token: string | null) => {
  if (token) {
    saveAuthSession(token);
  } else {
    clearAuthSession();
  }
};

export const getAuthToken = () => {
  if (isSessionExpired()) {
    clearAuthSession(false);
    return null;
  }
  return localStorage.getItem(SESSION_KEYS.TOKEN);
};

