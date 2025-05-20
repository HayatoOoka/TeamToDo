<template>
  <div class="task-create-form">
    <h2>タスク新規作成</h2>
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="title">タイトル<span class="required">*</span>:</label>
        <input type="text" id="title" v-model="taskData.title" required />
      </div>
      <div class="form-group">
        <label for="body">内容:</label>
        <textarea id="body" v-model="taskData.body" rows="4"></textarea>
      </div>
      <div class="form-group">
        <label for="status">ステータス:</label>
        <input type="number" id="status" v-model.number="taskData.status" />
        <small v-if="statusError" class="error-message">{{ statusError }}</small>
      </div>
      <div class="form-group">
        <label for="team_id">チームID:</label>
        <input type="number" id="team_id" v-model.number="taskData.team_id" />
        <small v-if="teamIdError" class="error-message">{{ teamIdError }}</small>
      </div>
      <div class="form-group">
        <label for="assignee_id">担当者ID:</label>
        <input type="number" id="assignee_id" v-model.number="taskData.assignee_id" />
        <small v-if="assigneeIdError" class="error-message">{{ assigneeIdError }}</small>
      </div>

      <div class="form-actions-footer">
        <button type="submit" :disabled="isSubmitting || !isFormValid" class="submit-button">
          {{ isSubmitting ? '作成中...' : '作成' }}
        </button>
        <router-link :to="{ name: 'TaskList' }" class="btn btn-secondary back-button">
            チーム一覧に戻る
        </router-link>
      </div>

      <p v-if="error" class="error-message">{{ error }}</p>
      <p v-if="successMessage" class="success-message">{{ successMessage }}</p>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { createTask, CreateTaskData } from '@/api/tasks';

const emit = defineEmits(['taskCreated']);

const taskData = ref<CreateTaskData>({
  title: '',
  body: '',
  status: undefined,
  team_id: undefined,
  assignee_id: undefined,
});

const isSubmitting = ref<boolean>(false);
const error = ref<string | null>(null);
const successMessage = ref<string | null>(null);
const statusError = ref<string | null>(null);
const teamIdError = ref<string | null>(null);
const assigneeIdError = ref<string | null>(null);

const isValidPositiveIntegerOrEmpty = (value: number | undefined | null | string): boolean => {
  if (value === undefined || value === null || String(value).trim() === '') {
    return true;
  }
  const num = Number(value);
  return Number.isInteger(num) && num > 0;
};

const isValidStatusOrEmpty = (value: number | undefined | null | string): boolean => {
  if (value === undefined || value === null || String(value).trim() === '') {
    return true;
  }
  const num = Number(value);
  return Number.isInteger(num) && num >= 0;
};

const isTitleValid = computed(() => taskData.value.title.trim() !== '');
const isStatusValid = computed(() => isValidStatusOrEmpty(taskData.value.status));
const isTeamIdValid = computed(() => isValidPositiveIntegerOrEmpty(taskData.value.team_id));
const isAssigneeIdValid = computed(() => isValidPositiveIntegerOrEmpty(taskData.value.assignee_id));

const isFormValid = computed(() =>
  isTitleValid.value &&
  isStatusValid.value &&
  isTeamIdValid.value &&
  isAssigneeIdValid.value
);

watch(() => taskData.value.status, (newVal) => {
  if (newVal !== undefined && newVal !== null && String(newVal).trim() !== '') {
    if (!isValidStatusOrEmpty(newVal)) {
      statusError.value = 'ステータスは0以上の整数で入力してください。';
    } else {
      statusError.value = null;
    }
  } else {
    statusError.value = null;
  }
});

watch(() => taskData.value.team_id, (newVal) => {
  if (newVal !== undefined && newVal !== null && String(newVal).trim() !== '') {
    if (!isValidPositiveIntegerOrEmpty(newVal)) {
      teamIdError.value = 'チームIDは正の整数で入力してください。';
    } else {
      teamIdError.value = null;
    }
  } else {
    teamIdError.value = null;
  }
});

watch(() => taskData.value.assignee_id, (newVal) => {
  if (newVal !== undefined && newVal !== null && String(newVal).trim() !== '') {
    if (!isValidPositiveIntegerOrEmpty(newVal)) {
      assigneeIdError.value = '担当者IDは正の整数で入力してください。';
    } else {
      assigneeIdError.value = null;
    }
  } else {
    assigneeIdError.value = null;
  }
});

const handleSubmit = async () => {
  if (!isFormValid.value) {
    error.value = "入力内容を確認してください。";
    return;
  }

  isSubmitting.value = true;
  error.value = null;
  successMessage.value = null;

  try {
    const payload: CreateTaskData = {
      title: taskData.value.title,
    };

    if (taskData.value.body && taskData.value.body.trim() !== '') {
      payload.body = taskData.value.body.trim();
    }

    if (taskData.value.status !== undefined && String(taskData.value.status).trim() !== '') {
        const statusNum = Number(taskData.value.status);
        if (Number.isInteger(statusNum) && statusNum >= 0) {
            payload.status = statusNum;
        }
    } else if (taskData.value.status === 0) {
        payload.status = 0;
    }

    if (taskData.value.team_id !== undefined && String(taskData.value.team_id).trim() !== '') {
      const teamIdNum = Number(taskData.value.team_id);
      if (Number.isInteger(teamIdNum) && teamIdNum > 0) {
        payload.team_id = teamIdNum;
      }
    }

    if (taskData.value.assignee_id !== undefined && String(taskData.value.assignee_id).trim() !== '') {
      const assigneeIdNum = Number(taskData.value.assignee_id);
      if (Number.isInteger(assigneeIdNum) && assigneeIdNum > 0) {
        payload.assignee_id = assigneeIdNum;
      }
    }

    await createTask(payload);
    successMessage.value = 'タスクが正常に作成されました！';
    taskData.value.title = '';
    taskData.value.body = '';
    taskData.value.status = undefined;
    taskData.value.team_id = undefined;
    taskData.value.assignee_id = undefined;
    statusError.value = null;
    teamIdError.value = null;
    assigneeIdError.value = null;

    emit('taskCreated');

  } catch (err) {
    console.error('タスクの作成に失敗しました:', err);
    error.value = 'タスクの作成に失敗しました。入力内容を確認するか、時間をおいて再度お試しください。';
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.task-create-form {
  max-width: 500px;
  margin: 20px auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}
.form-group label .required {
  color: red;
  margin-left: 4px;
}

.form-group input[type="text"],
.form-group input[type="number"],
.form-group textarea {
  width: calc(100% - 22px); 
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1em;
  box-sizing: border-box;
}

.form-group textarea {
  resize: vertical;
}

.form-group small.error-message {
  color: red;
  font-size: 0.8em;
  display: block;
  margin-top: 4px;
}

.form-actions-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
}

.submit-button {
  background-color: #4CAF50; 
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1em;
  transition: background-color 0.3s ease;
}

.submit-button:disabled {
  background-color: #aaa;
  cursor: not-allowed;
}

.submit-button:not(:disabled):hover {
  background-color: #45a049;
}

.back-button {
  padding: 10px 15px;
  text-decoration: none;
  border-radius: 4px;
  font-size: 1em;
  transition: background-color 0.3s ease;
}

.btn.btn-secondary.back-button { 
  background-color: #6c757d; 
  color: white;
  border: 1px solid #6c757d;
}

.btn.btn-secondary.back-button:hover {
  background-color: #5a6268;
  border-color: #545b62;
}


.error-message {
  color: red;
  margin-top: 10px;
}

.success-message {
  color: green;
  margin-top: 10px;
}
</style>