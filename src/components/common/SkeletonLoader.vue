<script setup lang="ts">
defineProps<{
  type?: 'card' | 'list' | 'banner'
  count?: number
}>()
</script>

<template>
  <template v-if="type === 'banner'">
    <div class="skeleton-banner skeleton" style="height: 160px; border-radius: 12px; margin-bottom: 16px"></div>
  </template>
  <template v-else-if="type === 'list'">
    <div v-for="i in (count || 3)" :key="i" class="skeleton-list-item">
      <div class="skeleton skeleton-icon"></div>
      <div class="skeleton-list-content">
        <div class="skeleton skeleton-line" style="width: 60%"></div>
        <div class="skeleton skeleton-line" style="width: 40%; height: 12px"></div>
        <div class="skeleton skeleton-line" style="width: 30%; height: 12px"></div>
      </div>
    </div>
  </template>
  <template v-else>
    <div class="skeleton-card-grid">
      <div v-for="i in (count || 6)" :key="i" class="skeleton-card-item">
        <div class="skeleton skeleton-img"></div>
        <div class="skeleton skeleton-line" style="width: 80%; height: 12px; margin-top: 8px"></div>
        <div class="skeleton skeleton-line" style="width: 50%; height: 10px"></div>
      </div>
    </div>
  </template>
</template>

<style scoped>
.skeleton-list-item {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
}

.skeleton-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  flex-shrink: 0;
}

.skeleton-list-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.skeleton-line {
  height: 14px;
  border-radius: 4px;
}

.skeleton-card-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 0 16px;
}

.skeleton-card-item {
  background: #1a2332;
  border-radius: 12px;
  padding: 8px;
}

.skeleton-img {
  width: 100%;
  height: 80px;
  border-radius: 8px;
}
</style>
