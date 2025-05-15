<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
import ApiTest from './components/ApiTest.vue'

export default {
  name: 'App',
  components: {
    ApiTest
  }
}
</script>