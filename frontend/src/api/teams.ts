// api/index.ts (または axios-setup.ts)
import axios from 'axios';
import { auth, logout } from './auth.ts'; // 新しいauthユーティリティをインポート
import router from '@/router'; // ルーターをインポート

const API_BASE_URL = 'http://localhost:3000/api';

// リクエストインターセプター: AuthorizationヘッダーにJWTトークンを追加
axios.interceptors.request.use(
  (config) => {
    const token = auth.token; // authユーティリティからトークンを取得
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    config.headers['Accept'] = 'application/json';
    if (config.method === 'post' || config.method === 'put' || config.method === 'patch') {
      config.headers['Content-Type'] = 'application/json';
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// レスポンスインターセプター: 401 Unauthorizedエラーを処理
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      logout(); // authユーティリティのlogout関数を呼び出す
      // router.push('/login'); // logout関数内でリダイレクトしているので不要
    }
    return Promise.reject(error);
  }
);

// 提供されたAPIサービスをエクスポート
export interface Member {
  id: number;
  name: string;
  // 他のメンバープロパティ
}

export interface Team {
  id: number;
  name: string;
  owner_id?: number | null;
  created_at?: string;
  updated_at?: string;
  members?: Member[];
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
