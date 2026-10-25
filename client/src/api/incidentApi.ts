import axios from 'axios';

// The two IP addresses are defined here.
const IP_PRIMARY = 'http://192.168.8.124:8000';   // Home Wi-Fi
const IP_SECONDARY = 'http://10.249.102.134:8000'; // Mobile Hotspot

export let API_BASE_URL = IP_PRIMARY;

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 4000, // 4 Seconds Timeout
});

// The function to auto-detect the working IP address
export const getWorkingBaseUrl = async (): Promise<string> => {
  try {
    await axios.get(`${IP_PRIMARY}/`, { timeout: 2500 });
    API_BASE_URL = IP_PRIMARY;
    api.defaults.baseURL = IP_PRIMARY;
    return IP_PRIMARY;
  } catch (error) {
    try {
      await axios.get(`${IP_SECONDARY}/`, { timeout: 2500 });
      API_BASE_URL = IP_SECONDARY;
      api.defaults.baseURL = IP_SECONDARY;
      return IP_SECONDARY;
    } catch (err) {
      console.warn("Both IPs failed to respond. Falling back to primary.");
      return IP_PRIMARY;
    }
  }
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