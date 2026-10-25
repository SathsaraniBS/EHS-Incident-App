export interface Incident {
  id: number;
  section: string;
  description: string;
  location: string;
  image_url: string | null;
  created_at: string;
  status?: string;
  severity?: string;
}