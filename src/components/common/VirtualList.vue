<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'

const props = withDefaults(defineProps<{
  items: any[]
  itemHeight: number
  buffer?: number
  gap?: number
}>(), {
  buffer: 5,
  gap: 0,
})

const emit = defineEmits<{
  (e: 'loadMore'): void
  (e: 'click', item: any, index: number): void
}>()

const containerRef = ref<HTMLElement | null>(null)
const scrollTop = ref(0)
const containerHeight = ref(0)

const totalHeight = computed(() => props.items.length * (props.itemHeight + props.gap))

const visibleCount = computed(() => {
  if (!containerHeight.value) return 0
  return Math.ceil(containerHeight.value / (props.itemHeight + props.gap)) + props.buffer
})

const startIndex = computed(() => {
  const idx = Math.floor(scrollTop.value / (props.itemHeight + props.gap))
  return Math.max(0, idx - props.buffer)
})

const endIndex = computed(() => {
  return Math.min(props.items.length, startIndex.value + visibleCount.value)
})

const visibleItems = computed(() => {
  return props.items.slice(startIndex.value, endIndex.value).map((item, i) => ({
    item,
    index: startIndex.value + i,
    top: (startIndex.value + i) * (props.itemHeight + props.gap),
  }))
})

function handleScroll() {
  if (!containerRef.value) return
  scrollTop.value = containerRef.value.scrollTop
  if (scrollTop.value + containerHeight.value >= totalHeight.value * 0.85) {
    emit('loadMore')
  }
}

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  if (containerRef.value) {
    containerHeight.value = containerRef.value.clientHeight
    resizeObserver = new ResizeObserver(entries => {
      containerHeight.value = entries[0].contentRect.height
    })
    resizeObserver.observe(containerRef.value)
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})

watch(() => props.items.length, () => {
  if (scrollTop.value > totalHeight.value) {
    containerRef.value?.scrollTo({ top: 0 })
    scrollTop.value = 0
  }
})
</script>

<template>
  <div
    ref="containerRef"
    class="virtual-list"
    @scroll.passive="handleScroll"
  >
    <div class="virtual-list-inner" :style="{ height: totalHeight + 'px' }">
      <div
        v-for="{ item, index, top } in visibleItems"
        :key="index"
        class="virtual-list-item"
        :style="{ transform: `translateY(${top}px)` }"
        @click="emit('click', item, index)"
      >
        <slot :item="item" :index="index" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.virtual-list {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
}

.virtual-list-inner {
  position: relative;
  width: 100%;
}

.virtual-list-item {
  position: absolute;
  left: 0;
  right: 0;
}
</style>
