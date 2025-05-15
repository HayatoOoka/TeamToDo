<template>
  <div class="team-list-container">
    <h1>チーム一覧</h1>
    <router-link :to="{ name: 'TeamCreate' }" class="btn btn-primary create-team-button"> 新規チーム作成</router-link>
    <div v-if="loading" class="loading">読み込み中...</div>
    <div v-if="error" class="error-message">{{ error }}</div>
    <ul v-if="teams.length > 0 && !loading" class="teams">
      <li v-for="team in teams" :key="team.id" class="team-item">
        <h2>{{ team.name }}</h2>
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

<script lang="ts">
import { defineComponent } from 'vue';
import { getTeams, Team } from '@/api/teams'; 

export default defineComponent({
  name: 'TeamList',
  data() {
    return {
      teams: [] as Team[], 
      loading: true,
      error: null as string | null, 
    };
  },
  created() {
    this.fetchTeams();
  },
  methods: {
    async fetchTeams() {
      this.loading = true;
      this.error = null;
      try {
        this.teams = await getTeams();
      } catch (err: any) {
        console.error('チームデータの取得に失敗しました (TeamList.vue):', err);
        if (err && err.response && err.response.data && err.response.data.errors) {
          this.error = `チームデータの取得に失敗しました: ${err.response.data.errors.join(', ')}`;
        } else if (err && err.message) {
          this.error = `チームデータの取得に失敗しました: ${err.message}`;
        } else {
          this.error = 'チームデータの取得中に不明なエラーが発生しました。サーバーログを確認してください。';
        }
      } finally {
        this.loading = false;
      }
    },
    formatDate(dateString?: string): string {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('ja-JP') + ' ' + date.toLocaleTimeString('ja-JP');
    }
  },
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

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 20px;
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
  color: #007bff; 
}

.team-item p {
  margin: 4px 0;
  color: #555;
  font-size: 0.95em;
}
</style>