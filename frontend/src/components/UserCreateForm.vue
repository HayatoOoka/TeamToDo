<template>
    <div>
      <h2>新しいユーザーを追加</h2>
      <form @submit.prevent="submitForm">
        <div>
          <label for="name">名前:</label>
          <input type="text" id="name" v-model="newUser.name" required>
        </div>
        <div>
          <label for="email">メールアドレス:</label>
          <input type="email" id="email" v-model="newUser.email" required>
        </div>
        <div>
          <label for="password">パスワード:</label>
          <input type="password" id="password" v-model="newUser.password" required minlength="6">
        </div>
        <button type="submit">作成</button>
        <div v-if="errorMessage" style="color: red;">{{ errorMessage }}</div>
      </form>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref } from 'vue';
  import { createUser, User } from '@/api/users';
  
  const newUser = ref<Omit<User, 'id' | 'created_at' | 'updated_at'>>({ name: '', email: '', password: '' });
  const errorMessage = ref<string | null>(null);
  
  const emit = defineEmits(['user-created']);
  
  const submitForm = async () => {
    try {
      const createdUser = await createUser(newUser.value as Omit<User, 'id' | 'created_at' | 'updated_at'>);
      emit('user-created', createdUser);
      newUser.value = { name: '', email: '', password: '' }; // フォームをリセット
      errorMessage.value = null;
    } catch (error: any) {
      errorMessage.value = 'ユーザーの作成に失敗しました。';
      if (error.response && error.response.data) {
        console.error('エラー詳細:', error.response.data);
      }
    }
  };
  </script>
  