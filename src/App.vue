<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="app-container">
    <RouterView v-slot="{ Component }">
      <KeepAlive :include="['LobbyPage', 'OrdersPage']">
        <component :is="Component" />
      </KeepAlive>
    </RouterView>
  </div>
</template>

<style scoped>
.app-container {
  max-width: 480px;
  min-height: 100vh;
  margin: 0 auto;
  background: #0f1923;
  position: relative;
}
</style>
