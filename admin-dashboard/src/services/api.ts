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

/** If the image URL is relative, it is prefixed with the API base URL. */
export const resolveImageUrl = (imageUrl?: string | null): string | null => {
  if (!imageUrl) return null;
  return imageUrl.startsWith('http') ? imageUrl : `${API_BASE_URL}${imageUrl}`;
};

/** If an error occurs, it is thrown so that an error message can be displayed on the UI. */
export const fetchIncidents = async (): Promise<Incident[]> => {
  const response = await api.get('/api/v1/incidents/');
  return Array.isArray(response.data) ? response.data : response.data?.incidents || [];
};

export const updateIncidentStatus = async (id: number, status: string, severity: string) => {
  const response = await api.patch(`/api/v1/incidents/${id}/status`, { status, severity });
  return response.data;
};