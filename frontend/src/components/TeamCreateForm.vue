<template>
  <div class="create-team-form-container">
    <h2>新しいチームを作成</h2>
    <form @submit.prevent="submitForm" class="form">
      <div class="form-group">
        <label for="team-name">チーム名:</label>
        <input
          type="text"
          id="team-name"
          v-model="newTeam.name"
          required
          class="form-control"
          placeholder="体験向上一課"
        />
      </div>
      <p v-if="ownerIdInfo" class="owner-info">{{ ownerIdInfo }}</p>

      <div class="form-actions">
        <button type="submit" class="btn btn-primary submit-btn" :disabled="isSubmitting">
          {{ isSubmitting ? '作成中...' : '作成' }}
        </button>
        <router-link :to="{ name: 'TeamList' }" class="btn btn-secondary cancel-btn">キャンセル</router-link>
      </div>

      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
      </div>
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { createTeam, Team, CreateTeamData } from '@/api/teams';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

interface JwtPayload {
  user_id?: number;
}

const newTeam = ref<CreateTeamData>({
  name: '',
  owner_id: undefined,
});

const errorMessage = ref<string | null>(null);
const successMessage = ref<string | null>(null);
const isSubmitting = ref<boolean>(false);
const ownerIdInfo = ref<string | null>(null);

const router = useRouter();

const emit = defineEmits<{
  (e: 'team-created', createdTeam: Team): void;
}>();

onMounted(() => {
  const token = localStorage.getItem('authToken');
  if (token) {
    try {
      const decodedToken = jwtDecode<JwtPayload>(token);
      const currentUserId = decodedToken.user_id;

      if (typeof currentUserId === 'number') {
        newTeam.value.owner_id = currentUserId;
        ownerIdInfo.value = `オーナーとして現在のログインユーザー (ID: ${currentUserId}) が設定されます。`;
        console.log('オーナーIDが自動設定されました:', currentUserId);
      } else {
        ownerIdInfo.value = 'オーナーIDをトークンから取得できませんでした。ログイン状態を確認してください。';
        console.warn('JWTペイロードに有効なuser_idが含まれていません。');
      }
    } catch (error) {
      ownerIdInfo.value = '認証トークンの解析に失敗しました。ログインし直してください。';
      console.error('JWTのデコードに失敗しました:', error);
      localStorage.removeItem('authToken');
      router.push('/login');
    }
  } else {
    ownerIdInfo.value = 'ログインしていません。オーナーIDは設定されません。';
    console.warn('認証トークンが見つかりません。');
    router.push('/login');
  }
});

const submitForm = async () => {
  if (isSubmitting.value) return;

  if (newTeam.value.owner_id === undefined) {
    errorMessage.value = 'オーナーIDが設定されていません。ログイン状態を確認してください。';
    return;
  }

  isSubmitting.value = true;
  errorMessage.value = null;
  successMessage.value = null;

  try {
    const payload: CreateTeamData = {
      name: newTeam.value.name,
      owner_id: newTeam.value.owner_id,
    };

    if (typeof payload.owner_id !== 'number') {
        errorMessage.value = 'オーナーIDが不正です。';
        isSubmitting.value = false;
        return;
    }

    const createdTeam = await createTeam(payload);

    successMessage.value = `チーム「${createdTeam.name}」が正常に作成されました。`;
    emit('team-created', createdTeam);
    newTeam.value = { name: '', owner_id: undefined };

  } catch (error: unknown) {
    console.error('チーム作成エラー:', error);
    if (axios.isAxiosError(error) && error.response && error.response.data) {
      const data = error.response.data as any;
      if (data.errors && typeof data.errors === 'object') {
        errorMessage.value = `作成失敗: ${Object.entries(data.errors)
          .map(([key, value]) => `${key} ${Array.isArray(value) ? value.join(', ') : value}`)
          .join('; ')}`;
      } else if (typeof data.message === 'string') {
        errorMessage.value = `作成失敗: ${data.message}`;
      } else if (typeof data === 'string') {
        errorMessage.value = `作成失敗: ${data}`;
      } else {
        errorMessage.value = 'チームの作成に失敗しました。サーバーエラーの可能性があります。';
      }
    } else if (error instanceof Error) {
        errorMessage.value = `チームの作成に失敗しました: ${error.message}`;
    }
    else {
      errorMessage.value = 'チームの作成中に予期せぬエラーが発生しました。';
    }
  } finally {
    isSubmitting.value = false;
  }
};

</script>

<style scoped>
.create-team-form-container {
  max-width: 500px;
  margin: 30px auto;
  padding: 25px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  font-family: 'Helvetica Neue', Arial, sans-serif;
}

h2 {
  text-align: center;
  color: #333;
  margin-bottom: 25px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #555;
}

.form-control {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  box-sizing: border-box;
  font-size: 1rem;
  transition: border-color 0.2s ease-in-out;
}

.form-control:focus {
  border-color: #007bff;
  outline: none;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.owner-info {
  font-size: 0.9em;
  color: #666;
  margin-bottom: 20px;
  padding: 8px;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 15px;
  font-size: 1rem;
  font-weight: 600;
  text-align: center;
  vertical-align: middle;
  cursor: pointer;
  user-select: none;
  border: 1px solid transparent;
  border-radius: 6px;
  text-decoration: none;
  transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.btn-primary {
  color: #fff;
  background-color: #1aca46;
  border-color: #1aca46;
}

.btn-primary:hover {
  background-color: #16a839;
  border-color: #16a839;
}

.btn-primary:disabled {
  background-color: #6c757d;
  border-color: #6c757d;
  cursor: not-allowed;
}

.btn-secondary {
  color: #fff;
  background-color: #6c757d;
  border-color: #6c757d;
}

.btn-secondary:hover {
  background-color: #5a6268;
  border-color: #545b62;
}

.form-actions {
  display: flex;
  gap: 15px;
  margin-top: 25px;
  margin-bottom: 20px;
}

.form-actions .submit-btn,
.form-actions .cancel-btn {
  flex-grow: 1;
  width: auto;
}

.error-message,
.success-message {
  margin-top: 20px;
  padding: 12px;
  border-radius: 6px;
  text-align: center;
  font-size: 0.95em;
}

.error-message {
  color: #721c24;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
}

.success-message {
  color: #155724;
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
}
</style>