// src/api/members.ts (または既存のAPIファイルに追記)
import axios from 'axios';

// APIのベースURL (環境変数などから取得するのが望ましい)
const API_BASE_URL = 'http://localhost:3000/api'; // 他の関数と共通化されているはず

// Memberインターフェース (既存のものを想定、必要なら調整)
export interface Member {
  id: number; // Memberレコード自体のID
  user_id: number;
  team_id: number;
  role: number;
  created_at?: string;
  updated_at?: string;
  // APIがユーザー情報も一緒に返すなら、以下のようなネストされた型を追加
  // user?: { id: number; name?: string; email?: string; };
}

// CreateMemberData型 (既存のものを想定)
export type CreateMemberData = {
  user_id: number;
  team_id: number;
  role: number;
};

// createMember関数 (既存のものを想定)
export const createMember = async (memberData: CreateMemberData): Promise<Member> => {
  const response = await axios.post<Member>(`${API_BASE_URL}/members`, { member: memberData });
  return response.data;
};

/**
 * 指定されたチームIDに所属するメンバーの一覧を取得します。
 * @param teamId - メンバー一覧を取得するチームのID
 * @returns メンバーの配列
 */
export const getMembersForTeam = async (teamId: number): Promise<Member[]> => {
  // Rails側の Api::MembersController#index が params[:team_id] でフィルタリングすることを想定
  const response = await axios.get<Member[]>(`${API_BASE_URL}/members`, {
    params: { team_id: teamId }
  });
  return response.data;
};

// --- もし既存の teams.ts に追記する場合は、axios や API_BASE_URL の定義は共有できます ---