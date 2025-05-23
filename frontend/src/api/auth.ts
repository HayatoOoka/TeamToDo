import { reactive, watch } from 'vue';
import axios from 'axios';
import router from '@/router'; 

const API_BASE_URL = 'http://localhost:3000/api'; 

interface User {
  id: number;
  email: string;
}

export const auth = reactive({
  token: localStorage.getItem('authToken') || null,
  user: null as User | null, // ユーザー情報も保持できるように
  isLoggedIn: false,
});

// tokenの変更を監視し、isLoggedInを更新する
watch(() => auth.token, (newToken) => {
  auth.isLoggedIn = !!newToken;
}, { immediate: true }); // 初期ロード時にも実行

// アプリケーション起動時に認証状態を初期化
export const initializeAuth = () => {
  const storedToken = localStorage.getItem('authToken');
  if (storedToken) {
    auth.token = storedToken;
  }
};

export const login = async (credentials: { email: string; password: string }) => {
  try {
    const response = await axios.post<{ token: string; user?: User }>(`${API_BASE_URL}/sessions`, credentials);
    const { token, user } = response.data; // バックエンドからトークンとユーザー情報が返されると仮定 (userはオプション)

    auth.token = token;
    // user情報がレスポンスに含まれる場合のみ設定
    if (user) {
      auth.user = user;
    } else {
      auth.user = null; // user情報がない場合はnullに設定
    }
    
    localStorage.setItem('authToken', token);

    router.push('/teams');
    return true;
  } catch (error) {
    console.error('ログインに失敗しました:', error);
    auth.token = null;
    auth.user = null;
    localStorage.removeItem('authToken');
    // エラーを再スローして、呼び出し元（Login.vue）でエラーメッセージを表示できるようにする
    throw error;
  }
};

export const logout = () => {
  auth.token = null;
  auth.user = null;
  localStorage.removeItem('authToken');
  router.push('/login');
};
