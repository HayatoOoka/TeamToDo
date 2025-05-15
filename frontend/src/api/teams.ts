import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api'; 

axios.defaults.withCredentials = true;

export interface Team {
  id: number;
  name: string;
  owner_id?: number | null;
  created_at?: string;      
  updated_at?: string;      
}


export const getTeams = async (): Promise<Team[]> => {
  const response = await axios.get<Team[]>(`${API_BASE_URL}/teams`);
  return response.data;
};


export const getTeam = async (id: number): Promise<Team> => {
  const response = await axios.get<Team>(`${API_BASE_URL}/teams/${id}`);
  return response.data;
};

export type CreateTeamData = Pick<Team, 'name'> & Partial<Pick<Team, 'owner_id'>>;

export const createTeam = async (teamData: CreateTeamData): Promise<Team> => {
  const response = await axios.post<Team>(`${API_BASE_URL}/teams`, { team: teamData });
  return response.data;
};

export type UpdateTeamData = Partial<Pick<Team, 'name' | 'owner_id'>>;

export const updateTeam = async (id: number, teamData: UpdateTeamData): Promise<Team> => {
  const response = await axios.put<Team>(`${API_BASE_URL}/teams/${id}`, { team: teamData });
  return response.data;
};

export const deleteTeam = async (id: number): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/teams/${id}`);
};