// auth.ts
import { reactive, watch } from 'vue';
import axios from 'axios';
import router from '@/router'; 

const API_BASE_URL = 'http://localhost:3000/api'; 

interface User {
  id: number;
  email: string;
}

// 認証状態を保持するリアクティブオブジェクト
export const auth = reactive({
  token: localStorage.getItem('authToken') || null,
  user: null as User | null,
  isLoggedIn: false,
});

watch(() => auth.token, (newToken) => {
  auth.isLoggedIn = !!newToken;
}, { immediate: true }); 

export const initializeAuth = () => {
  const storedToken = localStorage.getItem('authToken');
  if (storedToken) {
    auth.token = storedToken;
  }
};

// ログイン処理
export const login = async (credentials: { email: string; password: string }) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/login`, credentials);
    const { token, user } = response.data; // バックエンドからトークンとユーザー情報が返されると仮定

    auth.token = token;
    auth.user = user;
    localStorage.setItem('authToken', token);

    router.push('/dashboard');
    return true;
  } catch (error) {
    console.error('ログインに失敗しました:', error);
    auth.token = null;
    auth.user = null;
    localStorage.removeItem('authToken');
    throw error;
  }
};

export const logout = () => {
  auth.token = null;
  auth.user = null;
  localStorage.removeItem('authToken');
  router.push('/login');
};
