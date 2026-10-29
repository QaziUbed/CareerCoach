import axios from 'axios';
import { supabase } from './authService';
import useAuthStore from '../store/useAuthStore';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

api.interceptors.request.use(
  async (config) => {
    // Get session from our Zustand store (works for both real and mock users)
    const session = useAuthStore.getState().session;
    
    // Fallback to Supabase if store doesn't have it (belt and suspenders)
    let token = session?.access_token;
    if (!token) {
      const { data } = await supabase.auth.getSession();
      token = data?.session?.access_token;
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Prevent infinite loop by checking a custom _retry flag
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // If we're using a mock dev user, don't try to refresh with Supabase
        const isMockUser = useAuthStore.getState().user?.id === 'dev-user-123';
        if (isMockUser) {
           throw new Error('Mock user token expired (this shouldn\'t happen)');
        }

        const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !session) {
          throw new Error('Session refresh failed');
        }
        
        // Update the store with the new session globally using Zustand's setState
        useAuthStore.setState({ session });
        
        originalRequest.headers.Authorization = `Bearer ${session.access_token}`;
        return api(originalRequest);
      } catch (refreshErr) {
        return Promise.reject(refreshErr);
      }
    }
    
    const axiosError = error.response?.data;
    let errorMessage = 'An error occurred';
    
    // Check for FastAPI detail (can be a string or a list of objects)
    if (axiosError?.detail) {
      if (Array.isArray(axiosError.detail)) {
        errorMessage = axiosError.detail.map((d: any) => `${d.loc.join('.')}: ${d.msg}`).join(', ');
      } else {
        errorMessage = axiosError.detail;
      }
    } else if (axiosError?.message) {
      errorMessage = axiosError.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    console.error('API Error:', errorMessage, 'Status:', error.response?.status);
    return Promise.reject(new Error(errorMessage));
  }
);

export const get = <T>(url: string, params?: any): Promise<T> => {
  return api.get(url, { params }).then((res) => res.data);
};

export const post = <T>(url: string, body?: any): Promise<T> => {
  return api.post(url, body).then((res) => res.data);
};

export const postForm = <T>(url: string, formData: FormData): Promise<T> => {
  return api.post(url, formData, {
    headers: { 
      'Content-Type': 'multipart/form-data',
    },
    // Ensure axios doesn't try to stringify FormData
    transformRequest: (data) => data,
  }).then((res) => res.data);
};

export const patch = <T>(url: string, body?: any): Promise<T> => {
  return api.patch(url, body).then((res) => res.data);
};

export const del = <T>(url: string): Promise<T> => {
  return api.delete(url).then((res) => res.data);
};

export default api;
