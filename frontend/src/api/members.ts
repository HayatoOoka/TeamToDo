import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

export interface Member {
  id: number;
  user_id: number;
  team_id: number;
  role: number;
  created_at?: string;
  updated_at?: string;
}

export type CreateMemberData = {
  user_id: number;
  team_id: number;
  role: number;
};

export const createMember = async (memberData: CreateMemberData): Promise<Member> => {
  const response = await axios.post<Member>(`${API_BASE_URL}/members`, { member: memberData });
  return response.data;
};

export const getMembersForTeam = async (teamId: number): Promise<Member[]> => {
  const response = await axios.get<Member[]>(`${API_BASE_URL}/members`, {
    params: { team_id: teamId }
  });
  return response.data;
};