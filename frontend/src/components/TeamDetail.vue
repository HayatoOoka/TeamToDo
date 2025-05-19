<template>
  <div class="team-detail-container">
    <div v-if="loading" class="loading">読み込み中...</div>
    <div v-if="pageError" class="error-message">{{ pageError }}</div>

    <div v-if="team && !loading" class="team-info">
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
            <input
              type="text"
              id="edit-team-name"
              v-model="editableTeamData.name"
              required
              class="form-control"
            />
          </div>
          <div class="form-group">
            <label for="edit-owner-id">オーナーID (任意):</label>
            <input
              type="number"
              id="edit-owner-id"
              v-model.number="editableTeamData.owner_id"
              class="form-control"
            />
          </div>
          <div class="edit-form-actions">
            <button type="submit" class="btn btn-primary" :disabled="isSubmittingUpdate">
              {{ isSubmittingUpdate ? '保存中...' : '保存する' }}
            </button>
            <button type="button" @click="cancelEditMode" class="btn btn-secondary">
              キャンセル
            </button>
          </div>
          <div v-if="updateSuccessMessage" class="success-message">{{ updateSuccessMessage }}</div>
          <div v-if="updateError" class="error-message">{{ updateError }}</div>
        </form>
      </div>

      <div class="actions-footer">
        <router-link :to="{ name: 'TeamList' }" class="btn btn-secondary">
          チーム一覧に戻る
        </router-link>
        <button v-if="!isEditMode" @click="enterEditMode" class="btn btn-primary">
          編集する
        </button>
        <button @click="confirmDelete" class="btn btn-danger" :disabled="isDeleting || isEditMode">
          {{ isDeleting ? '削除中...' : '削除する' }}
        </button>
      </div>
    </div>

    <div v-if="!team && !loading && !pageError" class="no-team-data">
      チームデータが見つかりません。
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { getTeam, deleteTeam, updateTeam, Team, UpdateTeamData } from '@/api/teams';

const props = defineProps({
  id: {
    type: [String, Number],
    required: true,
  },
});

const router = useRouter();

const team = ref<Team | null>(null);
const loading = ref<boolean>(true);
const pageError = ref<string | null>(null); 
const isDeleting = ref<boolean>(false);

const isEditMode = ref<boolean>(false);
const editableTeamData = ref<UpdateTeamData>({ name: '', owner_id: null }); 
const isSubmittingUpdate = ref<boolean>(false);
const updateError = ref<string | null>(null);
const updateSuccessMessage = ref<string | null>(null);

const fetchTeamDetails = async () => {
  loading.value = true;
  pageError.value = null;
  team.value = null;
  isEditMode.value = false; 

  try {
    const teamId = Number(props.id);
    if (isNaN(teamId)) {
      throw new Error('無効なチームIDです。');
    }
    team.value = await getTeam(teamId);
  } catch (err: any) {
    console.error(`チーム詳細(ID: ${props.id})の取得に失敗しました:`, err);
    if (err.response && err.response.data) {
        if (err.response.data.errors && typeof err.response.data.errors === 'object') {
           pageError.value = `チーム詳細の取得に失敗しました: ${Object.values(err.response.data.errors).flat().join(', ')}`;
        } else if (typeof err.response.data === 'string') {
           pageError.value = `チーム詳細の取得に失敗しました: ${err.response.data}`;
        } else {
          pageError.value = `チーム詳細の取得エラー (ステータス: ${err.response.status || '不明'})`;
        }
    } else if (err.message) {
      pageError.value = `チーム詳細の取得に失敗しました: ${err.message}`;
    } else {
      pageError.value = 'チーム詳細の取得中に不明なエラーが発生しました。';
    }
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
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
  if (!editableTeamData.value || isSubmittingUpdate.value) return;

  isSubmittingUpdate.value = true;
  updateError.value = null;
  updateSuccessMessage.value = null;

  try {
    const teamId = Number(props.id);
    const payload: UpdateTeamData = { ...editableTeamData.value };

    // owner_id が空文字列やNaNの場合、API仕様に応じて null や undefined に変換
    if (payload.owner_id === '' || (payload.owner_id !== undefined && payload.owner_id !== null && isNaN(Number(payload.owner_id)))) {
        payload.owner_id = null;
    } else if (payload.owner_id !== undefined && payload.owner_id !== null) {
        payload.owner_id = Number(payload.owner_id);
    } else {
        payload.owner_id = undefined; 
    }

    const updatedTeam = await updateTeam(teamId, payload);
    await fetchTeamDetails(); 
    isEditMode.value = false; 
    updateSuccessMessage.value = `チーム「${updatedTeam.name}」の情報が正常に更新されました。`;

    setTimeout(() => {
      updateSuccessMessage.value = null;
    }, 3000);

  } catch (error: any) {
    console.error(`チーム(ID: ${props.id})の更新に失敗しました:`, error);
    if (error.response && error.response.data) {
      if (error.response.data.errors && typeof error.response.data.errors === 'object') {
        const errorMessages = Object.entries(error.response.data.errors)
          .map(([key, value]) => `${key} ${Array.isArray(value) ? value.join(', ') : value}`)
          .join('; ');
        updateError.value = `更新失敗: ${errorMessages}`;
      } else if (typeof error.response.data === 'string') {
        updateError.value = `更新失敗: ${error.response.data}`;
      } else {
        updateError.value = `更新エラー (ステータス: ${error.response.status || '不明'})`;
      }
    } else {
      updateError.value = 'チーム情報の更新中に予期せぬエラーが発生しました。';
    }
  } finally {
    isSubmittingUpdate.value = false;
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
    } catch (err: any) {
      console.error(`チーム(ID: ${team.value?.id})の削除に失敗しました:`, err);
      if (err.response && err.response.data) {
        if (err.response.data.errors && typeof err.response.data.errors === 'object') {
           pageError.value = `チームの削除に失敗しました: ${Object.values(err.response.data.errors).flat().join(', ')}`;
        } else if (typeof err.response.data === 'string') {
           pageError.value = `チームの削除に失敗しました: ${err.response.data}`;
        } else {
          pageError.value = `チームの削除エラー (ステータス: ${err.response.status || '不明'})`;
        }
      } else if (err.message) {
        pageError.value = `チームの削除に失敗しました: ${err.message}`;
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
  if (newId !== oldId && newId !== undefined) {
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
</style>
