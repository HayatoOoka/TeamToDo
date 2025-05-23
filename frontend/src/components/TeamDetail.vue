<template>
  <div class="team-detail-container">
    <div v-if="loadingTeam && !team" class="loading">チーム情報 読み込み中...</div>
    <div v-if="pageError" class="error-message">{{ pageError }}</div>

    <div v-if="team && !loadingTeam" class="team-info">
      <div v-if="!isEditMode">
        <h1>{{ team.name }}</h1>
        <div class="details-grid">
          <div class="detail-item">
            <span class="detail-label">チームID:</span>
            <span class="detail-value">{{ team.id }}</span>
          </div>
          <div v-if="team.owner_id !== undefined && team.owner_id !== null" class="detail-item">
            <span class="detail-label">オーナーID:</span>
            <span class="detail-value">{{ team.owner_id }}</span>
          </div>
          <div v-if="team.created_at" class="detail-item">
            <span class="detail-label">作成日時:</span>
            <span class="detail-value">{{ formatDate(team.created_at) }}</span>
          </div>
          <div v-if="team.updated_at" class="detail-item">
            <span class="detail-label">最終更新日時:</span>
            <span class="detail-value">{{ formatDate(team.updated_at) }}</span>
          </div>
        </div>
      </div>
      <div v-else>
        <h2>チーム情報編集</h2>
        <form @submit.prevent="handleUpdateTeam" class="edit-form">
          <div class="form-group">
            <label for="edit-team-name">チーム名:</label>
            <input type="text" id="edit-team-name" v-model="editableTeamData.name" required class="form-control"/>
          </div>
          <div class="form-group">
            <label for="edit-owner-id">オーナーID (任意):</label>
            <input type="number" id="edit-owner-id" v-model.number="editableTeamData.owner_id" class="form-control"/>
          </div>
          <div class="edit-form-actions">
            <button type="submit" class="btn btn-primary" :disabled="isSubmittingUpdate">
              {{ isSubmittingUpdate ? '保存中...' : '保存する' }}
            </button>
            <button type="button" @click="cancelEditMode" class="btn btn-secondary">キャンセル</button>
          </div>
          <div v-if="updateSuccessMessage" class="success-message">{{ updateSuccessMessage }}</div>
          <div v-if="updateError" class="error-message">{{ updateError }}</div>
        </form>
      </div>

      <div v-if="!isEditMode" class="team-members-section">
        <h3>所属メンバー</h3>
        <div v-if="loadingMembers" class="loading">メンバー情報 読み込み中...</div>
        <div v-if="membersError" class="error-message">{{ membersError }}</div>
        <ul v-if="!loadingMembers && teamMembers.length > 0" class="members-list">
          <li v-for="memberItem in teamMembers" :key="memberItem.id" class="member-item">
            <span>ユーザーID: {{ memberItem.user_id }}</span>
            <span>役割: {{ formatRole(memberItem.role) }}</span>
            </li>
        </ul>
        <p v-if="!loadingMembers && teamMembers.length === 0 && !membersError">
          このチームにはまだメンバーがいません。
        </p>
      </div>
      <div v-if="!isEditMode" class="add-member-section">
        <h3>新しいメンバーを追加</h3>
        <form @submit.prevent="handleAddMember" class="add-member-form">
          <div class="form-group">
            <label for="add-member-user-id">ユーザーID:</label>
            <input type="number" id="add-member-user-id" v-model.number="newMember.user_id" required class="form-control" placeholder="追加するユーザーのID"/>
          </div>
          <div class="form-group">
            <label for="add-member-role">役割 (role):</label>
            <input type="number" id="add-member-role" v-model.number="newMember.role" required class="form-control" placeholder="0 (例: 一般), 1 (例: 管理者)"/>
            <small>例: 0=コアラー, 1=コア</small>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-success" :disabled="isAddingMember">
              {{ isAddingMember ? '追加中...' : 'メンバーを追加' }}
            </button>
          </div>
          <div v-if="addMemberSuccessMessage" class="success-message">{{ addMemberSuccessMessage }}</div>
          <div v-if="addMemberError" class="error-message">{{ addMemberError }}</div>
        </form>
      </div>

      <div class="actions-footer">
        <router-link :to="{ name: 'TeamList' }" class="btn btn-secondary">チーム一覧に戻る</router-link>
        <button v-if="!isEditMode" @click="enterEditMode" class="btn btn-primary">編集する</button>
        <button @click="confirmDelete" class="btn btn-danger" :disabled="isDeleting || isEditMode">
          {{ isDeleting ? '削除中...' : '削除する' }}
        </button>
      </div>
    </div>

    <div v-if="!team && !loadingTeam && !pageError" class="no-team-data">
      チームデータが見つかりません。
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import axios, { AxiosError } from 'axios'; 
import { getTeam, deleteTeam, updateTeam} from '@/api/teams';
import type { Team,UpdateTeamData } from '@/api/teams';
import { createMember, getMembersForTeam, Member, CreateMemberData } from '@/api/members';

interface ApiErrorDetail {
  [key: string]: string[] | string; 
}
interface ApiErrorResponse {
  message?: string;
  error?: string;
  errors?: ApiErrorDetail | string[]; // errors はオブジェクトまたは文字列配列の可能性
}

const props = defineProps({
  id: {
    type: [String, Number],
    required: true,
  },
});

const router = useRouter();

const team = ref<Team | null>(null);
const loadingTeam = ref<boolean>(true);
const pageError = ref<string | null>(null);
const isDeleting = ref<boolean>(false);

const isEditMode = ref<boolean>(false);
const editableTeamData = ref<UpdateTeamData>({ name: '', owner_id: null });
const isSubmittingUpdate = ref<boolean>(false);
const updateError = ref<string | null>(null);
const updateSuccessMessage = ref<string | null>(null);

const newMember = ref<Omit<CreateMemberData, 'team_id'>>({
  user_id: 0,
  role: 0,
});
const isAddingMember = ref<boolean>(false);
const addMemberError = ref<string | null>(null);
const addMemberSuccessMessage = ref<string | null>(null);

const teamMembers = ref<Member[]>([]);
const loadingMembers = ref<boolean>(false);
const membersError = ref<string | null>(null);

const fetchTeamMembers = async (teamId: number) => {
  loadingMembers.value = true;
  membersError.value = null;
  try {
    teamMembers.value = await getMembersForTeam(teamId);
  } catch (error: unknown) { 
    console.error(`チーム(ID: ${teamId})のメンバー一覧取得に失敗しました:`, error);
    // Axiosエラーかどうか、一般的なErrorオブジェクトかどうかで分岐
    if (axios.isAxiosError<ApiErrorResponse>(error) && error.response) {
        const data = error.response.data;
        if (data.message) membersError.value = data.message;
        else if (data.error) membersError.value = data.error;
        else membersError.value = 'メンバー一覧の取得に失敗しました (サーバーエラー)。';
    } else if (error instanceof Error) {
        membersError.value = `メンバー一覧の取得に失敗しました: ${error.message}`;
    } else {
        membersError.value = 'メンバー一覧の取得中に不明なエラーが発生しました。';
    }
  } finally {
    loadingMembers.value = false;
  }
};

const fetchTeamDetails = async () => {
  loadingTeam.value = true;
  pageError.value = null;
  team.value = null;
  isEditMode.value = false;
  teamMembers.value = [];

  try {
    const teamId = Number(props.id);
    if (isNaN(teamId)) {
      throw new Error('無効なチームIDです。');
    }
    team.value = await getTeam(teamId);
    if (team.value) {
      await fetchTeamMembers(team.value.id);
    }
  } catch (error: unknown) { 
    console.error(`チーム詳細(ID: ${props.id})の取得に失敗しました:`, error);
    if (axios.isAxiosError<ApiErrorResponse>(error) && error.response) {
        const data = error.response.data;
        if (data.errors && typeof data.errors === 'object' && !Array.isArray(data.errors)) {
           pageError.value = `チーム詳細の取得に失敗しました: ${Object.values(data.errors).flat().join(', ')}`;
        } else if (typeof data.message === 'string') {
           pageError.value = `チーム詳細の取得に失敗しました: ${data.message}`;
        } else if (typeof data.error === 'string') {
           pageError.value = `チーム詳細の取得に失敗しました: ${data.error}`;
        } else {
          pageError.value = `チーム詳細の取得エラー (ステータス: ${error.response.status || '不明'})`;
        }
    } else if (error instanceof Error) {
      pageError.value = `チーム詳細の取得に失敗しました: ${error.message}`;
    } else {
      pageError.value = 'チーム詳細の取得中に不明なエラーが発生しました。';
    }
  } finally {
    loadingTeam.value = false;
  }
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const formatRole = (roleValue: number): string => {
  switch (roleValue) {
    case 0: return 'コアラー';
    case 1: return 'コア';
    default: return `不明な役割 (${roleValue})`;
  }
};

const enterEditMode = () => {
  if (!team.value) return;
  editableTeamData.value = {
    name: team.value.name,
    owner_id: team.value.owner_id === undefined ? null : team.value.owner_id,
  };
  isEditMode.value = true;
  updateError.value = null;
  updateSuccessMessage.value = null;
};

const cancelEditMode = () => {
  isEditMode.value = false;
  updateError.value = null;
  updateSuccessMessage.value = null;
};

const handleUpdateTeam = async () => {
  if (!editableTeamData.value || isSubmittingUpdate.value || !team.value) return;
  isSubmittingUpdate.value = true;
  updateError.value = null;
  updateSuccessMessage.value = null;
  try {
    const teamId = team.value.id;
    const payload: UpdateTeamData = { ...editableTeamData.value };
    if (payload.owner_id === '' || (payload.owner_id !== undefined && payload.owner_id !== null && isNaN(Number(payload.owner_id)))) {
        payload.owner_id = null;
    } else if (payload.owner_id !== undefined && payload.owner_id !== null) {
        payload.owner_id = Number(payload.owner_id);
    } else {
        payload.owner_id = undefined;
    }
    const updatedTeam = await updateTeam(teamId, payload);
    team.value = updatedTeam;
    isEditMode.value = false;
    updateSuccessMessage.value = `チーム「${updatedTeam.name}」の情報が正常に更新されました。`;
    setTimeout(() => { updateSuccessMessage.value = null; }, 3000);
  } catch (error: unknown) {
    console.error(`チーム(ID: ${team.value?.id})の更新に失敗しました:`, error);
    if (axios.isAxiosError<ApiErrorResponse>(error) && error.response) {
      const data = error.response.data;
      if (data.errors && typeof data.errors === 'object' && !Array.isArray(data.errors)) {
        updateError.value = `更新失敗: ${Object.entries(data.errors)
          .map(([key, value]) => `${key} ${Array.isArray(value) ? value.join(', ') : value}`)
          .join('; ')}`;
      } else if (typeof data.message === 'string') {
        updateError.value = `更新失敗: ${data.message}`;
      } else if (typeof data.error === 'string') {
        updateError.value = `更新失敗: ${data.error}`;
      } else {
        updateError.value = `更新エラー (ステータス: ${error.response.status || '不明'})`;
      }
    } else if (error instanceof Error) {
        updateError.value = `チーム情報の更新中に予期せぬエラーが発生しました: ${error.message}`;
    } else {
      updateError.value = 'チーム情報の更新中に予期せぬエラーが発生しました。';
    }
  } finally {
    isSubmittingUpdate.value = false;
  }
};

const handleAddMember = async () => {
  if (!team.value || isAddingMember.value) return;

  if (!newMember.value.user_id || newMember.value.role === undefined || newMember.value.role < 0) {
    addMemberError.value = 'ユーザーIDと役割（0以上の整数）を入力してください。';
    return;
  }

  isAddingMember.value = true;
  addMemberError.value = null;
  addMemberSuccessMessage.value = null;

  try {
    const memberDataPayload: CreateMemberData = {
      user_id: Number(newMember.value.user_id),
      team_id: team.value.id,
      role: Number(newMember.value.role),
    };

    const createdMember = await createMember(memberDataPayload);
    addMemberSuccessMessage.value = `ユーザーID ${createdMember.user_id} がチーム「${team.value.name}」に役割 ${formatRole(createdMember.role)} で追加されました。`;
    newMember.value.user_id = 0;
    newMember.value.role = 0;

    await fetchTeamMembers(team.value.id);

    setTimeout(() => {
        addMemberSuccessMessage.value = null;
    }, 3000);

  } catch (error: unknown) { 
    console.error(`チーム(ID: ${team.value?.id})へのメンバー追加に失敗しました:`, error);
    if (axios.isAxiosError<ApiErrorResponse>(error) && error.response) {
      const data = error.response.data;
      if (data.errors && typeof data.errors === 'object' && !Array.isArray(data.errors)) {
        addMemberError.value = `メンバー追加失敗: ${Object.entries(data.errors)
          .map(([key, value]) => `${key} ${Array.isArray(value) ? value.join(', ') : value}`)
          .join('; ')}`;
      } else if (typeof data.message === 'string') {
        addMemberError.value = `メンバー追加失敗: ${data.message}`;
      } else if (typeof data.error === 'string') {
        addMemberError.value = `メンバー追加失敗: ${data.error}`;
      } else {
        addMemberError.value = `メンバー追加エラー (ステータス: ${error.response.status || '不明'})`;
      }
    } else if (error instanceof Error) {
        addMemberError.value = `メンバー追加失敗: ${error.message}`;
    } else {
      addMemberError.value = 'メンバー追加中に予期せぬエラーが発生しました。';
    }
  } finally {
    isAddingMember.value = false;
  }
};

const confirmDelete = async () => {
  if (!team.value) return;
  if (window.confirm(`チーム「${team.value.name}」(ID: ${team.value.id})を本当に削除しますか？`)) {
    isDeleting.value = true;
    pageError.value = null;
    try {
      await deleteTeam(team.value.id);
      router.push({ name: 'TeamList' });
    } catch (error: unknown) {
      console.error(`チーム(ID: ${team.value?.id})の削除に失敗しました:`, error);
      if (axios.isAxiosError<ApiErrorResponse>(error) && error.response) {
        const data = error.response.data;
        if (data.errors && typeof data.errors === 'object' && !Array.isArray(data.errors)) {
           pageError.value = `チームの削除に失敗しました: ${Object.values(data.errors).flat().join(', ')}`;
        } else if (typeof data.message === 'string') {
           pageError.value = `チームの削除に失敗しました: ${data.message}`;
        } else if (typeof data.error === 'string') {
           pageError.value = `チームの削除に失敗しました: ${data.error}`;
        } else {
          pageError.value = `チームの削除エラー (ステータス: ${error.response.status || '不明'})`;
        }
      } else if (error instanceof Error) {
        pageError.value = `チームの削除に失敗しました: ${error.message}`;
      } else {
        pageError.value = 'チームの削除中に不明なエラーが発生しました。';
      }
    } finally {
      isDeleting.value = false;
    }
  }
};

onMounted(async () => {
  await fetchTeamDetails();
});

watch(() => props.id, async (newId, oldId) => {
  if (newId !== undefined && String(newId) !== String(oldId)) {
    await fetchTeamDetails();
  }
});
</script>

<style scoped>
.team-detail-container {
  max-width: 700px;
  margin: 30px auto;
  padding: 30px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  font-family: 'Helvetica Neue', Arial, sans-serif;
}

.team-info h1 {
  font-size: 2em;
  color: #2c3e50;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 2px solid #007bff;
  text-align: center;
}
.edit-form h2 {
  text-align: center;
  color: #333;
  margin-bottom: 25px;
}

.details-grid {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 15px 20px;
  margin-bottom: 30px;
}
.detail-item {
  display: contents;
}

.detail-label {
  font-weight: 600;
  color: #555;
  text-align: right;
}

.detail-value {
  color: #333;
  background-color: #f9f9f9;
  padding: 5px 10px;
  border-radius: 4px;
}

.loading,
.no-team-data {
  text-align: center;
  padding: 40px;
  font-size: 1.2em;
  color: #777;
}

.error-message,
.success-message {
  text-align: center;
  padding: 12px;
  font-size: 0.95em;
  border-radius: 6px;
  margin-top: 15px;
  margin-bottom: 15px;
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

.edit-form {
  margin-top: 20px;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 6px;
  border: 1px solid #eee;
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
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
  font-size: 1rem;
}
.form-control:focus {
  border-color: #007bff;
  outline: none;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}
.edit-form-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
  justify-content: flex-end;
}
.edit-form-actions .btn {
  padding: 8px 15px;
}
.actions-footer {
  margin-top: 30px;
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: center;
  gap: 10px;
}
.btn {
  display: inline-block;
  font-weight: 400;
  text-align: center;
  vertical-align: middle;
  cursor: pointer;
  user-select: none;
  border: 1px solid transparent;
  padding: 0.5rem 1.25rem;
  font-size: 1rem;
  line-height: 1.5;
  border-radius: 0.25rem;
  text-decoration: none;
  transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
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

.btn-primary {
  color: #fff;
  background-color: #007bff;
  border-color: #007bff;
}
.btn-primary:hover {
  background-color: #0056b3;
  border-color: #0056b3;
}
.btn-primary:disabled {
  background-color: #6c757d;
  border-color: #6c757d;
  cursor: not-allowed;
}

.btn-danger {
  color: #fff;
  background-color: #dc3545;
  border-color: #dc3545;
}
.btn-danger:hover {
  background-color: #c82333;
  border-color: #bd2130;
}
.btn-danger:disabled {
  background-color: #e0848d;
  border-color: #e0848d;
  cursor: not-allowed;
}

.add-member-section {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}
.add-member-section h3 {
  font-size: 1.5em;
  color: #333;
  margin-bottom: 20px;
  text-align: center;
}
.add-member-form .form-group small {
    font-size: 0.8em;
    color: #6c757d;
    display: block;
    margin-top: 4px;
}
.add-member-form .form-actions {
    justify-content: center;
}
.btn-success {
    color: #fff;
    background-color: #28a745;
    border-color: #28a745;
}
.btn-success:hover {
    background-color: #218838;
    border-color: #1e7e34;
}
.btn-success:disabled {
    background-color: #6fab82;
    border-color: #6fab82;
}

.team-members-section {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.team-members-section h3 {
  font-size: 1.5em;
  color: #333;
  margin-bottom: 20px;
  text-align: center;
}

.members-list {
  list-style-type: none;
  padding: 0;
}

.member-item {
  background-color: #f9f9f9;
  border: 1px solid #e0e0e0;
  padding: 10px 15px;
  margin-bottom: 8px;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.member-item span {
  font-size: 0.95em;
}
</style>