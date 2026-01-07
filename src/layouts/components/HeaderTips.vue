<template>
  <div
    v-if="tipsStore.tips.length > 0"
    class="header-tips"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
    @click="handleClick"
    role="status"
    aria-live="polite"
    aria-label="轮播提示信息"
  >
    <transition name="fade-slide" mode="out-in">
      <div :key="currentIndex" class="tip-content">
        <span class="tip-icon">💡</span>
        <span class="tip-text">{{ currentTip }}</span>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useTipsStore } from "@/stores/tips";

// State
const tipsStore = useTipsStore();
const currentIndex = ref(0);
let intervalId: ReturnType<typeof setInterval> | null = null;

// Computed
const currentTip = computed(() => {
  if (tipsStore.tips.length === 0) return "";
  return tipsStore.tips[currentIndex.value]?.content || "";
});

// Methods
const nextTip = () => {
  currentIndex.value = (currentIndex.value + 1) % tipsStore.tips.length;
};

const startCarousel = () => {
  if (tipsStore.tips.length <= 1) return;
  intervalId = setInterval(nextTip, 5000);
};

const stopCarousel = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
};

const onMouseEnter = () => {
  stopCarousel();
};

const onMouseLeave = () => {
  startCarousel();
};

const handleClick = () => {
  nextTip();
  stopCarousel();
  startCarousel(); // 重新启动计时器
};

// Lifecycle
onMounted(() => {
  startCarousel();
});

onUnmounted(() => {
  stopCarousel();
});
</script>

<style scoped>
.header-tips {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 0;
  max-width: 400px;
  height: 36px;
  padding: 0 12px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.15);
  cursor: pointer;
  transition: background 0.3s ease;
  overflow: hidden;
}

.header-tips:hover {
  background: rgba(255, 255, 255, 0.25);
}

.tip-content {
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  color: rgba(255, 255, 255, 0.95);
  font-size: 13px;
  font-weight: 500;
}

.tip-icon {
  flex-shrink: 0;
  font-size: 14px;
}

.tip-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Transition 动画 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.4s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* 响应式 */
@media (max-width: 1024px) {
  .header-tips {
    max-width: 300px;
    font-size: 12px;
  }
}

@media (max-width: 768px) {
  .header-tips {
    display: none; /* 移动设备隐藏 */
  }
}
</style>
