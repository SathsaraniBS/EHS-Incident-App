import axios from 'axios';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export interface Incident {
  id: number;
  section: string;
  description: string;
  location: string;
  image_url: string | null;
  created_at?: string | null;
  status?: string;
  severity?: string;
}

export const fetchIncidents = async (): Promise<Incident[]> => {
  try {
    const response = await api.get('/api/v1/incidents/');
    return Array.isArray(response.data) ? response.data : (response.data?.incidents || []);
  } catch (error) {
    console.error('Error fetching incidents:', error);
    return [];
  }
};

export const updateIncidentStatus = async (id: number, status: string, severity: string) => {
  const response = await api.patch(`/api/v1/incidents/${id}/status`, { status, severity });
  return response.data;
};