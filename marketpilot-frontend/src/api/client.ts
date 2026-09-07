import axios from 'axios';

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

// Auto-attach Bearer token from localStorage
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('marketpilot_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const setAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('marketpilot_token', token);
  } else {
    localStorage.removeItem('marketpilot_token');
  }
};

export const getAuthToken = () => {
  return localStorage.getItem('marketpilot_token');
};
