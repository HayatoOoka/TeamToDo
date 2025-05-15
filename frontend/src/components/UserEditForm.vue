<template>
    <div v-if="user">
      <h2>ユーザー情報の編集</h2>
      <form @submit.prevent="submitForm">
        <div>
          <label for="name">名前:</label>
          <input type="text" id="name" v-model="user.name" required>
        </div>
        <div>
          <label for="email">メールアドレス:</label>
          <input type="email" id="email" v-model="user.email" required>
        </div>
        <div>
          <label for="password">新しいパスワード (変更する場合のみ):</label>
          <input type="password" id="password" v-model="user.password" minlength="6">
        </div>
        <button type="submit">更新</button>
        <div v-if="errorMessage" style="color: red;">{{ errorMessage }}</div>
      </form>
      <button @click="goBack">戻る</button>
    </div>
    <div v-else>
      <p>ユーザー情報をロード中...</p>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import { useRouter, useRoute } from 'vue-router';
  import { getUser, updateUser, User } from '@/api/users';
  
  const route = useRoute();
  const router = useRouter();
  const userId = ref<number>(Number(route.params.id));
  const user = ref<User | null>(null);
  const errorMessage = ref<string | null>(null);
  
  onMounted(async () => {
    await fetchUser();
  });
  
  const fetchUser = async () => {
    try {
      const fetchedUser = await getUser(userId.value);
      user.value = { ...fetchedUser, password: '' }; // パスワードは初期表示しない
    } catch (error) {
      console.error('ユーザー情報の取得に失敗しました:', error);
      errorMessage.value = 'ユーザー情報の取得に失敗しました。';
    }
  };
  
  const submitForm = async () => {
    if (user.value) {
      try {
        const updatedUser = await updateUser(userId.value, { name: user.value.name, email: user.value.email, password: user.value.password });
        console.log('ユーザー情報を更新しました:', updatedUser);
        router.push({ name: 'UserList' }); // 一覧に戻るなどの処理
      } catch (error: any) {
        errorMessage.value = 'ユーザー情報の更新に失敗しました。';
        if (error.response && error.response.data) {
          console.error('エラー詳細:', error.response.data);
        }
      }
    }
  };
  
  const goBack = () => {
    router.go(-1);
  };
  </script>
  