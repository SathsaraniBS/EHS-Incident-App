// import axios from 'axios';



// export let API_BASE_URL = IP_PRIMARY;

// export const api = axios.create({
//   baseURL: API_BASE_URL,
//   timeout: 4000, // 4 Seconds Timeout
// });

// // The function to auto-detect the working IP address
// export const getWorkingBaseUrl = async (): Promise<string> => {
//   try {
//     await axios.get(`${IP_PRIMARY}/`, { timeout: 2500 });
//     API_BASE_URL = IP_PRIMARY;
//     api.defaults.baseURL = IP_PRIMARY;
//     return IP_PRIMARY;
//   } catch (error) {
//     try {
//       await axios.get(`${IP_SECONDARY}/`, { timeout: 2500 });
//       API_BASE_URL = IP_SECONDARY;
//       api.defaults.baseURL = IP_SECONDARY;
//       return IP_SECONDARY;
//     } catch (err) {
//       console.warn("Both IPs failed to respond. Falling back to primary.");
//       return IP_PRIMARY;
//     }
//   }
// };

// export const checkServerHealth = async () => {
//   await getWorkingBaseUrl();
//   const res = await api.get('/');
//   return res.data;
// };

// export const getIncidents = async () => {
//   await getWorkingBaseUrl();
//   const res = await api.get('/api/v1/incidents/');
//   return res.data;
// };

// export const submitIncident = async (formData: FormData) => {
//   await getWorkingBaseUrl();
//   const res = await api.post('/api/v1/incidents/', formData, {
//     headers: { 'Content-Type': 'multipart/form-data' },
//   });
//   return res;
// };

import axios from 'axios';
import { getToken, saveToken, clearToken } from '../auth/tokenStore';

// client/.env:  EXPO_PUBLIC_API_URLS=http://192.168.x.x:8000,http://10.x.x.x:8000
const BASE_URLS = (process.env.EXPO_PUBLIC_API_URLS ?? '')
  .split(',')
  .map((u) => u.trim())
  .filter(Boolean);

if (BASE_URLS.length === 0) {
  console.warn('EXPO_PUBLIC_API_URLS is not set in client/.env');
}

export let API_BASE_URL = BASE_URLS[0] ?? '';
let resolved: string | null = null;

export const api = axios.create({ baseURL: API_BASE_URL, timeout: 8000 });

// Find a reachable server once, then reuse it (no probing on every request)
export const getWorkingBaseUrl = async (): Promise<string> => {
  if (resolved) return resolved;
  for (const url of BASE_URLS) {
    try {
      await axios.get(`${url}/`, { timeout: 2500 });
      resolved = url;
      API_BASE_URL = url;
      api.defaults.baseURL = url;
      return url;
    } catch {
      /* try next */
    }
  }
  return API_BASE_URL;
};

// Attach the token to every request
api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 401 → clear token and send the user back to the login screen
let onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (fn: () => void) => {
  onUnauthorized = fn;
};

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    if (!error.response) resolved = null; // network changed (Wi-Fi ↔ hotspot): re-probe next time
    if (error.response?.status === 401) {
      await clearToken();
      onUnauthorized?.();
    }
    return Promise.reject(error);
  }
);

export const login = async (email: string, password: string) => {
  await getWorkingBaseUrl();
  // CHECK: endpoint, request body and response field match your auth.py
  const res = await api.post('/api/v1/auth/login', { email, password });
  const token: string | undefined = res.data?.access_token;
  if (!token) throw new Error('No token returned by server');
  await saveToken(token);
};

export const checkServerHealth = async () => {
  await getWorkingBaseUrl();
  const res = await api.get('/');
  return res.data;
};

export const getIncidents = async () => {
  await getWorkingBaseUrl();
  const res = await api.get('/api/v1/incidents/');
  return res.data;
};

export const submitIncident = async (formData: FormData) => {
  await getWorkingBaseUrl();
  const res = await api.post('/api/v1/incidents/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res;
};