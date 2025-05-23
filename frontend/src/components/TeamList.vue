<template>
  <div class="team-list-container">
    <div class="header-controls">
      <h1>チーム一覧</h1>
      <router-link :to="{ name: 'TeamCreate' }" class="btn btn-primary create-team-button">
        新規チーム作成
      </router-link>
    </div>
    <div v-if="loading" class="loading">読み込み中...</div>
    <div v-if="error" class="error-message">{{ error }}</div>
    <ul v-if="teams.length > 0 && !loading" class="teams">
      <li v-for="team in teams" :key="team.id" class="team-item">
        <h2>
          <router-link :to="{ name: 'TeamDetail', params: { id: team.id } }">
            {{ team.name }}
          </router-link>
        </h2>
        <p v-if="team.owner_id !== undefined && team.owner_id !== null">
          オーナーID: {{ team.owner_id }}
        </p>
        <p v-if="team.created_at">
          作成日時: {{ formatDate(team.created_at) }}
        </p>
      </li>
    </ul>
    <div v-if="teams.length === 0 && !loading && !error" class="no-teams">
      チームが見つかりません。
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getTeams} from '@/api/teams';
import type { Team } from '@/api/teams';

const teams = ref<Team[]>([]);
const loading = ref<boolean>(true);
const error = ref<string | null>(null);

const fetchTeams = async () => {
  loading.value = true;
  error.value = null;
  try {
    teams.value = await getTeams();
  } catch (err: any) {
    console.error('チームデータの取得に失敗しました (TeamList.vue):', err);
    if (err && err.response && err.response.data && err.response.data.errors) {
      error.value = `チームデータの取得に失敗しました: ${err.response.data.errors.join(', ')}`;
    } else if (err && err.message) {
      error.value = `チームデータの取得に失敗しました: ${err.message}`;
    } else {
      error.value = 'チームデータの取得中に不明なエラーが発生しました。サーバーログを確認してください。';
    }
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('ja-JP') + ' ' + date.toLocaleTimeString('ja-JP');
};

onMounted(() => {
  fetchTeams();
});
</script>

<style scoped>
.team-list-container {
  max-width: 800px;
  margin: 20px auto;
  padding: 20px;
  font-family: 'Helvetica Neue', Arial, sans-serif;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.header-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

h1 {
  color: #333;
  margin: 0;
}

.create-team-button {
  padding: 10px 15px;
  font-size: 0.95em;
  text-decoration: none;
  border-radius: 5px;
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

.btn-primary:hover {
  color: #fff;
  background-color: #0056b3;
  border-color: #0056b3;
}


.loading,
.no-teams {
  text-align: center;
  padding: 30px;
  font-size: 1.1em;
  color: #666;
}

.error-message {
  text-align: center;
  padding: 20px;
  font-size: 1.1em;
  color: #d9534f;
  background-color: #f2dede;
  border: 1px solid #ebccd1;
  border-radius: 4px;
  margin-bottom: 20px;
}

.teams {
  list-style-type: none;
  padding: 0;
}

.team-item {
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 6px;
  margin-bottom: 15px;
  padding: 20px;
  transition: box-shadow 0.3s ease-in-out;
}

.team-item:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.team-item h2 {
  margin-top: 0;
  margin-bottom: 8px;
}

.team-item h2 a {
  color: #007bff;
  text-decoration: none;
  font-weight: bold;
}
.team-item h2 a:hover {
  text-decoration: underline;
}

.team-item p {
  margin: 4px 0;
  color: #555;
  font-size: 0.95em;
}
</style>