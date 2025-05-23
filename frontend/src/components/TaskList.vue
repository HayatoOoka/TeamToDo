<template>
  <div class="task-list">
    <h2>タスク一覧</h2>
    <router-link :to="{ name: 'TaskCreate' }" class="btn btn-primary create-team-button">
        新規タスク作成
    </router-link>
    <div v-if="loading" class="loading">読み込み中...</div>
    <div v-if="error && !loading" class="error">{{ error }}</div>
    <ul v-if="!loading && !error && tasks.length > 0">
      <li v-for="task in tasks" :key="task.id" class="task-item">
        <div v-if="editingTaskId !== task.id" class="task-display">
          <div>
            <strong>{{ task.title }}</strong>
            <p v-if="task.body">内容: {{ task.body }}</p>
            <p>ステータス: {{ task.status }}</p>
            <p v-if="task.team_id">チームID: {{ task.team_id }}</p>
            <p v-if="task.assignee_id">担当者ID: {{ task.assignee_id }}</p>
            <p v-if="task.created_at">作成日時: {{ formatDate(task.created_at) }}</p>
          </div>
          <div class="task-actions">
            <button @click="startEdit(task)" class="edit-button">編集</button>
            <button @click="handleDeleteTask(task.id)" class="delete-button">削除</button>
          </div>
        </div>
        <div v-else class="task-edit-form">
          <h3>タスク編集</h3>
          <div class="form-group">
            <label :for="'title-' + task.id">タイトル:</label>
            <input :id="'title-' + task.id" type="text" v-model="editableTaskData.title">
          </div>
          <div class="form-group">
            <label :for="'body-' + task.id">内容:</label>
            <textarea :id="'body-' + task.id" v-model="editableTaskData.body"></textarea>
          </div>
          <div class="form-group">
            <label :for="'status-' + task.id">ステータス:</label>
            <input :id="'status-' + task.id" type="number" v-model.number="editableTaskData.status">
          </div>
          <div class="form-group">
            <label :for="'team_id-' + task.id">チームID:</label>
            <input :id="'team_id-' + task.id" type="number" v-model.number="editableTaskData.team_id">
          </div>
          <div class="form-group">
            <label :for="'assignee_id-' + task.id">担当者ID:</label>
            <input :id="'assignee_id-' + task.id" type="number" v-model.number="editableTaskData.assignee_id">
          </div>
          <div class="form-actions">
            <button @click="saveEdit(task.id)" class="save-button">保存</button>
            <button @click="cancelEdit" class="cancel-button">キャンセル</button>
          </div>
          <p v-if="editError" class="error edit-error-message">{{ editError }}</p>
        </div>
      </li>
    </ul>
    <p v-if="!loading && !error && tasks.length === 0">タスクはありません。</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { getTasks, deleteTask, updateTask} from '@/api/tasks';
import type { Task,UpdateTaskData } from '@/api/tasks';

const tasks = ref<Task[]>([]);
const loading = ref<boolean>(true);
const error = ref<string | null>(null);
const editError = ref<string | null>(null);

const editingTaskId = ref<number | null>(null);
const editableTaskData = reactive<UpdateTaskData>({
  title: '',
  body: '',
  status: 0,
  team_id: undefined,
  assignee_id: undefined,
});

const fetchTasks = async () => {
  loading.value = true;
  error.value = null;
  try {
    tasks.value = await getTasks();
  } catch (err) {
    console.error('タスクの取得に失敗しました:', err);
    error.value = 'タスクの取得に失敗しました。しばらくしてからもう一度お試しください。';
  } finally {
    loading.value = false;
  }
};

const startEdit = (task: Task) => {
  editingTaskId.value = task.id;
  editError.value = null;
  editableTaskData.title = task.title;
  editableTaskData.body = task.body || '';
  editableTaskData.status = task.status;
  editableTaskData.team_id = task.team_id || undefined;
  editableTaskData.assignee_id = task.assignee_id || undefined;
};

const cancelEdit = () => {
  editingTaskId.value = null;
  editError.value = null;
};

const saveEdit = async (id: number) => {
  if (editingTaskId.value === null) return;
  editError.value = null;

  if (!editableTaskData.title || editableTaskData.title.trim() === '') {
    editError.value = 'タイトルは必須です。';
    return;
  }

  const payload: UpdateTaskData = { ...editableTaskData };
  if (payload.team_id === null || String(payload.team_id).trim() === '') {
    payload.team_id = undefined;
  }
  if (payload.assignee_id === null || String(payload.assignee_id).trim() === '') {
    payload.assignee_id = undefined;
  }
  if (payload.status === null || String(payload.status).trim() === '') {
  } else {
      payload.status = Number(payload.status);
  }

  try {
    await updateTask(id, payload);
    editingTaskId.value = null;
    await fetchTasks();
    alert('タスクを更新しました。');
  } catch (err: any) {
    console.error('タスクの更新に失敗しました:', err);
    if (err.response && err.response.data && err.response.data.errors) {
        const errorMessages = Object.entries(err.response.data.errors)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
            .join('; ');
        editError.value = `更新失敗: ${errorMessages}`;
    } else if (err.response && err.response.data && typeof err.response.data === 'string') {
        editError.value = `更新失敗: ${err.response.data}`;
    }
    else {
        editError.value = 'タスクの更新に失敗しました。';
    }
  }
};

const handleDeleteTask = async (id: number) => {
  if (!confirm('本当にこのタスクを削除しますか？')) {
    return;
  }
  try {
    await deleteTask(id);
    await fetchTasks();
    alert('タスクを削除しました。');
  } catch (err) {
    console.error('タスクの削除に失敗しました:', err);
    alert('タスクの削除に失敗しました。');
  }
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString('ja-JP');
};

onMounted(() => {
  fetchTasks();
});

defineExpose({
  fetchTasks
});
</script>

<style scoped>
.task-list {
  max-width: 800px;
  margin: 20px auto;
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.loading, .error {
  text-align: center;
  padding: 20px;
  font-size: 1.2em;
}

.error {
  color: red;
}

ul {
  list-style-type: none;
  padding: 0;
}

.task-item {
  background-color: #f9f9f9;
  border: 1px solid #ddd;
  padding: 15px;
  margin-bottom: 10px;
  border-radius: 4px;
}

.task-display {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.task-display > div:first-child {
  flex-grow: 1;
}

.task-actions button {
  margin-left: 8px;
}

.task-item strong {
  font-size: 1.2em;
  color: #333;
  display: block;
  margin-bottom: 5px;
}

.task-item p {
  margin: 5px 0;
  color: #666;
  font-size: 0.9em;
}

.delete-button, .edit-button, .save-button, .cancel-button {
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  font-size: 0.9em;
}

.btn {
  display: inline-block;
  font-weight: 400;
  text-align: center;
  vertical-align: middle;
  cursor: pointer;
  user-select: none;
  border: 1px solid transparent;
  padding: 0.375rem 0.75rem;
  font-size: 1rem;
  line-height: 1.5;
  border-radius: 0.25rem;
  transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.btn-primary {
  color: #fff;
  background-color: #007bff;
  border-color: #007bff;
}

.btn-secondary {
  color: #fff;
  background-color: #6c757d;
  border-color: #6c757d;
}

.create-team-button {
  padding: 10px 15px;
  font-size: 0.95em;
  text-decoration: none;
  border-radius: 5px;
}

.delete-button {
  background-color: #ff4d4d;
}
.delete-button:hover {
  background-color: #cc0000;
}

.edit-button {
  background-color: #4CAF50;
}
.edit-button:hover {
  background-color: #45a049;
}

.save-button {
  background-color: #007bff;
}
.save-button:hover {
  background-color: #0056b3;
}

.cancel-button {
  background-color: #6c757d;
  margin-left: 8px;
}
.cancel-button:hover {
  background-color: #545b62;
}

.task-edit-form {
  padding: 10px;
  background-color: #fff;
  border: 1px dashed #ccc;
  border-radius: 4px;
}
.task-edit-form h3 {
    margin-top: 0;
    font-size: 1.1em;
    color: #555;
}
.form-group {
  margin-bottom: 10px;
}
.form-group label {
  display: block;
  margin-bottom: 3px;
  font-weight: bold;
  font-size: 0.9em;
}
.form-group input[type="text"],
.form-group input[type="number"],
.form-group textarea {
  width: calc(100% - 16px);
  padding: 6px 8px;
  border: 1px solid #ccc;
  border-radius: 3px;
  font-size: 0.9em;
  box-sizing: border-box;
}
.form-group textarea {
    resize: vertical;
    min-height: 60px;
}
.form-actions {
    margin-top: 15px;
    text-align: right;
}
.edit-error-message {
    font-size: 0.9em;
    margin-top: 10px;
}
</style>