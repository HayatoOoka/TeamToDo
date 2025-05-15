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
      <div class="form-group">
        <label for="owner-id">オーナーID (任意):</label>
        <input
          type="number"
          id="owner-id"
          v-model.number="newTeam.owner_id"
          class="form-control"
          placeholder="1"
        />
        </div>

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
import { ref } from 'vue';
import { createTeam, Team, CreateTeamData } from '@/api/teams'; 

const newTeam = ref<CreateTeamData>({
  name: '',
  owner_id: undefined,
});

const errorMessage = ref<string | null>(null);
const successMessage = ref<string | null>(null);
const isSubmitting = ref<boolean>(false);

const emit = defineEmits<{
  (e: 'team-created', createdTeam: Team): void;
}>();

const submitForm = async () => {
  if (isSubmitting.value) return;

  isSubmitting.value = true;
  errorMessage.value = null;
  successMessage.value = null;

  try {
    const payload: CreateTeamData = {
      name: newTeam.value.name,
    };

    const ownerIdInput = newTeam.value.owner_id;
    if (ownerIdInput !== undefined && ownerIdInput !== null && !isNaN(Number(ownerIdInput))) {
      payload.owner_id = Number(ownerIdInput);
    } else {
      payload.owner_id = undefined;
    }

    const createdTeam = await createTeam(payload);

    successMessage.value = `チーム「${createdTeam.name}」が正常に作成されました。`;
    emit('team-created', createdTeam);
    newTeam.value = { name: '', owner_id: undefined };
  } catch (error: any) {
    errorMessage.value = 'チームの作成に失敗しました。';
    if (error.response && error.response.data) {
      if (error.response.data.errors && typeof error.response.data.errors === 'object') {
        const errorMessages = Object.entries(error.response.data.errors)
          .map(([key, value]) => `${key} ${Array.isArray(value) ? value.join(', ') : value}`)
          .join('; ');
        errorMessage.value = `作成失敗: ${errorMessages}`;
      } else if (typeof error.response.data === 'string') {
        errorMessage.value = `作成失敗: ${error.response.data}`;
      }
      console.error('エラー詳細:', error.response.data);
    } else {
      console.error('予期せぬエラー:', error);
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
  border-color: #5ddd07;
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