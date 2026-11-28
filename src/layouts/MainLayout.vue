<template>
  <div class="app-shell" :class="{ 'is-mobile': isMobile }">
    <!-- 顶部栏 -->
    <header class="app-header">
      <div class="app-header__inner">
        <div class="app-header__left">
          <button
            v-if="isMobile"
            class="icon-button app-header__menu"
            type="button"
            :aria-label="t('header.expandMenu')"
            @click="isMenuOpen = true"
          >
            <el-icon :size="18"><Menu /></el-icon>
          </button>
          <h1 class="app-header__title">{{ backendLabel }} {{ versionText }}</h1>
        </div>

        <div class="app-header__right">
          <el-dropdown trigger="click" @command="handleThemeChange">
            <button
              class="icon-button"
              type="button"
              :title="t('header.switchTheme')"
              :aria-label="t('header.switchTheme')"
            >
              <el-icon :size="18"><Brush /></el-icon>
            </button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="accent in accentOptions"
                  :key="accent.value"
                  :command="accent.value"
                  :disabled="currentTheme === accent.value"
                >
                  <span class="accent-option">
                    <span class="accent-dot" :style="{ background: accent.color }" />
                    {{ accent.label }}
                  </span>
                </el-dropdown-item>
                <el-dropdown-item divided command="__toggle_mode__">
                  <span class="accent-option">
                    <el-icon>
                      <component :is="currentMode === 'dark' ? Sunny : Moon" />
                    </el-icon>
                    {{ currentMode === 'dark' ? t('theme.light') : t('theme.dark') }}
                  </span>
                </el-dropdown-item>
                <!-- 毛玻璃：手动关闭透明效果（写入 data-bc-glass="solid"） -->
                <el-dropdown-item
                  v-if="currentTheme === 'glass'"
                  divided
                  command="__toggle_transparency__"
                >
                  <span class="accent-option">
                    <span
                      class="transparency-switch"
                      :class="{ 'is-on': reduceTransparency }"
                      aria-hidden="true"
                    >
                      <span class="transparency-switch__dot" />
                    </span>
                    {{ t('theme.reduceTransparency') }}
                  </span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <el-dropdown trigger="click" @command="localeStore.switchLocale">
            <button
              class="icon-button"
              type="button"
              :title="t('header.switchLanguage')"
              :aria-label="t('header.switchLanguage')"
            >
              <img src="/icons/earth.svg" class="icon-inline" alt="" />
            </button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="option in localeStore.localeOptions"
                  :key="option.value"
                  :command="option.value"
                  :disabled="localeStore.currentLocale === option.value"
                >
                  {{ option.label }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <button
            class="icon-button"
            type="button"
            :title="t('header.logout')"
            :aria-label="t('header.logout')"
            @click="handleLogout"
          >
            <el-icon :size="18"><SwitchButton /></el-icon>
          </button>
        </div>
      </div>
    </header>

    <!-- 主体：桌面侧栏 + 内容 -->
    <div class="app-body">
      <aside v-if="!isMobile" class="app-sidebar" aria-label="导航">
        <nav class="sidebar-nav">
          <p class="sidebar-nav__title">{{ t('nav.torrentList') }}</p>
          <button
            v-for="status in statusOptions"
            :key="status.value"
            class="nav-item"
            type="button"
            :class="{ 'is-active': activeMenuItem === `status:${status.value}` }"
            @click="handleMenuSelect(`status:${status.value}`)"
          >
            <span class="nav-item__label">{{ status.label }}</span>
            <span class="nav-item__badge">{{ getTorrentCount(status.value) }}</span>
          </button>

          <p class="sidebar-nav__title">{{ t('nav.navigationMenu') }}</p>
          <button
            v-for="item in navigationItems"
            :key="item.index"
            class="nav-item"
            type="button"
            :class="{ 'is-active': activeMenuItem === item.index }"
            @click="handleMenuSelect(item.index)"
          >
            <el-icon class="nav-item__icon"><component :is="item.icon" /></el-icon>
            <span class="nav-item__label">{{ item.label }}</span>
          </button>
        </nav>
        <SidebarStatus
          :metrics="statusMetrics"
          :version="frontendVersionLabel"
          :version-title="frontendVersionTitle"
        />
      </aside>

      <main class="app-main">
        <router-view v-slot="{ Component }">
          <Transition name="page-fade" mode="out-in">
            <component :is="Component" />
          </Transition>
        </router-view>
      </main>
    </div>

    <!-- 移动端底部导航 -->
    <nav v-if="isMobile" class="tabbar bc-safe-bottom" aria-label="主导航">
      <button
        v-for="tab in mobileTabs"
        :key="tab.key"
        class="tabbar__item"
        type="button"
        :class="{ 'is-active': tab.key === activeTabKey }"
        @click="handleTabSelect(tab)"
      >
        <el-icon :size="20"><component :is="tab.icon" /></el-icon>
        <span>{{ tab.shortLabel }}</span>
      </button>
    </nav>

    <!-- 移动端抽屉 -->
    <el-drawer
      v-model="isMenuOpen"
      direction="ltr"
      size="82%"
      :with-header="false"
      class="mobile-drawer"
    >
      <div class="drawer-inner">
        <div class="drawer-header">
          <div>
            <h3>{{ backendLabel }}</h3>
            <span class="drawer-version">{{ versionText || frontendVersionLabel }}</span>
          </div>
          <button
            class="icon-button"
            type="button"
            :aria-label="t('header.collapseMenu')"
            @click="isMenuOpen = false"
          >
            <el-icon :size="18"><Close /></el-icon>
          </button>
        </div>

        <div class="drawer-scroll">
          <p class="sidebar-nav__title">{{ t('nav.torrentList') }}</p>
          <button
            v-for="status in statusOptions"
            :key="status.value"
            class="nav-item"
            type="button"
            :class="{ 'is-active': activeMenuItem === `status:${status.value}` }"
            @click="handleMenuSelect(`status:${status.value}`)"
          >
            <span class="nav-item__label">{{ status.label }}</span>
            <span class="nav-item__badge">{{ getTorrentCount(status.value) }}</span>
          </button>

          <p class="sidebar-nav__title">{{ t('nav.navigationMenu') }}</p>
          <button
            v-for="item in navigationItems"
            :key="item.index"
            class="nav-item"
            type="button"
            :class="{ 'is-active': activeMenuItem === item.index }"
            @click="handleMenuSelect(item.index)"
          >
            <el-icon class="nav-item__icon"><component :is="item.icon" /></el-icon>
            <span class="nav-item__label">{{ item.label }}</span>
          </button>

        </div>

        <div class="drawer-footer">
          <SidebarStatus
            :metrics="statusMetrics"
            :version="frontendVersionLabel"
            :version-title="frontendVersionTitle"
          />
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onBeforeUnmount } from "vue";
import { useRouter, useRoute } from "vue-router";
import { storeToRefs } from "pinia";
import dayjs from "dayjs";
import { useI18n } from "vue-i18n";
import {
  Setting,
  TrendCharts,
  Menu,
  SwitchButton,
  Sunny,
  Moon,
  Connection,
  Timer,
  Brush,
  Close,
} from "@element-plus/icons-vue";
import { ElMessageBox } from "element-plus";
import { useSystemStatusStore } from "@/stores/systemStatus";
import { usePreferencesStore } from "@/stores/preferences";
import { useConnectionStore } from "@/stores/connection";
import { useFilterStore, type StatusFilter, statusToUrl } from "@/stores/filter";
import { useThemeStore, type ThemeType } from "@/stores/theme";
import { useLocaleStore } from "@/stores/locale";
import { useMediaQuery } from "@/utils/useMediaQuery";
import { formatBytes } from "@/utils/format";
import SidebarStatus, { type StatusMetric } from "./components/SidebarStatus.vue";
import { torrentBackendName, isTransmission } from "@/config/torrentClient";
import { TorrentStatusEnum } from "@/types/transmission";
import { buildTorrentStatusTextMap } from "@/utils/torrentStatus";
import { logout as apiLogout } from "@/api/torrents";

const { t } = useI18n();
const localeStore = useLocaleStore();

const router = useRouter();
const route = useRoute();
const systemStatusStore = useSystemStatusStore();
const preferencesStore = usePreferencesStore();
const connectionStore = useConnectionStore();
const filterStore = useFilterStore();
const themeStore = useThemeStore();
const { torrentCounts } = storeToRefs(systemStatusStore);
const { currentTheme, currentMode, reduceTransparency } = storeToRefs(themeStore);
const backendLabel = torrentBackendName;
const { sessionStats, freeSpaceBytes, sessionConfig, lastUpdated } =
  storeToRefs(systemStatusStore);
// 刷新间隔单位为毫秒，0 表示仅手动
const { refreshInterval } = storeToRefs(preferencesStore);
const { statusFilter } = storeToRefs(filterStore);
const isMobile = useMediaQuery("(max-width: 768px)");
const isMenuOpen = ref(false);
const activeMenuItem = ref("/");

const statusTextMap = computed(() => buildTorrentStatusTextMap(t));

const statusOptions = computed(() => [
  { label: t('status.all'), value: "all" as StatusFilter },
  {
    label: statusTextMap.value[TorrentStatusEnum.DOWNLOAD],
    value: TorrentStatusEnum.DOWNLOAD as StatusFilter,
  },
  {
    label: statusTextMap.value[TorrentStatusEnum.STOPPED],
    value: TorrentStatusEnum.STOPPED as StatusFilter,
  },
  { label: t('status.queued'), value: "queued" as StatusFilter },
  {
    label: statusTextMap.value[TorrentStatusEnum.CHECK],
    value: TorrentStatusEnum.CHECK as StatusFilter,
  },
  { label: t('status.seeding'), value: TorrentStatusEnum.SEED as StatusFilter },
  { label: t('status.active'), value: "active" as StatusFilter },
  { label: t('status.error'), value: "error" as StatusFilter },
]);

const getTorrentCount = (statusValue: StatusFilter): number | string => {
  // Direct mapping from status values to count keys
  const countKeyMap: Record<string, string> = {
    all: "all",
    [TorrentStatusEnum.DOWNLOAD]: "downloading",
    [TorrentStatusEnum.STOPPED]: "paused",
    [TorrentStatusEnum.CHECK]: "checking",
    [TorrentStatusEnum.SEED]: "seeding",
    queued: "queued",
    active: "active",
    error: "error",
  };

  // Special case for seeding - show seeding count with active count in parentheses
  if (statusValue === TorrentStatusEnum.SEED) {
    return `${torrentCounts.value["seeding"] || 0}`;
  }

  const countKey = countKeyMap[String(statusValue)];
  return countKey ? torrentCounts.value[countKey] || 0 : 0;
};

const navigationItems = computed(() => [
  { index: "/reseed", label: t('nav.reseed'), icon: Connection },
  { index: "/speed-strategy", label: t('nav.speedStrategy'), icon: Timer },
  { index: "/settings", label: t('nav.settings'), icon: Setting },
  { index: "/stats", label: t('nav.stats'), icon: TrendCharts },
]);

const accentOptions = computed(() => [
  { value: "green", label: t('theme.green'), color: "#2f9e63" },
  { value: "blue", label: t('theme.blue'), color: "#2f6fed" },
  { value: "pink", label: t('theme.pink'), color: "#e0518a" },
  // 毛玻璃色点用「实色 + 半透明」渐变示意，与简约蓝的实色点区分
  { value: "glass", label: t('theme.glass'), color: "linear-gradient(135deg, #0a84ff 0%, rgba(10, 132, 255, 0.3) 100%)" },
]);

// 移动端底部导航：种子入口默认打开抽屉（含状态筛选）
const mobileTabs = computed(() => [
  { key: "torrents", label: t('nav.torrentList'), shortLabel: t('nav.torrentList'), icon: Menu },
  { key: "/speed-strategy", label: t('nav.speedStrategy'), shortLabel: t('nav.speedStrategy'), icon: Timer },
  { key: "/stats", label: t('nav.stats'), shortLabel: t('nav.stats'), icon: TrendCharts },
  { key: "/reseed", label: t('nav.reseed'), shortLabel: t('nav.reseed'), icon: Connection },
  { key: "/settings", label: t('nav.settings'), shortLabel: t('nav.settings'), icon: Setting },
]);

const activeTabKey = computed(() => {
  if (route.path === "/") return "torrents";
  return mobileTabs.value.find((tab) => tab.key === route.path)?.key ?? "";
});

const handleTabSelect = (tab: { key: string }) => {
  if (tab.key === "torrents") {
    if (route.path !== "/") {
      router.push({ path: "/", query: route.query });
    } else {
      isMenuOpen.value = true;
    }
    return;
  }
  router.push(tab.key);
};

const uploadLimitKBps = computed(() => {
  const c = sessionConfig.value;
  if (!c) return null;
  if (c['alt-speed-enabled']) return c['alt-speed-up'] ?? null;
  if (isTransmission) {
    const enabled = !!c['speed-limit-up-enabled'];
    return enabled ? (c['speed-limit-up'] ?? null) : null;
  } else {
    const up = c['speed-limit-up'] ?? 0;
    return up > 0 ? up : null;
  }
});
const downloadLimitKBps = computed(() => {
  const c = sessionConfig.value;
  if (!c) return null;
  if (c['alt-speed-enabled']) return c['alt-speed-down'] ?? null;
  if (isTransmission) {
    const enabled = !!c['speed-limit-down-enabled'];
    return enabled ? (c['speed-limit-down'] ?? null) : null;
  } else {
    const down = c['speed-limit-down'] ?? 0;
    return down > 0 ? down : null;
  }
});
const formatBytesCompact = (bytes: number): string =>
  formatBytes(bytes).replace(/\.0(?=\s)/, "").replace(" ", "");

const formatSpeedCompact = (bytesPerSecond: number): string => {
  if (!bytesPerSecond) return "0B/s";
  return `${formatBytesCompact(bytesPerSecond)}/s`;
};
const formatLimitText = (kbps: number | null): string | null => {
  if (kbps == null || kbps === 0) return null;
  const bps = kbps * 1024;
  return `${formatBytesCompact(bps)}/s`;
};
// 侧栏「系统状态」：now 每 15 秒刷新一次，用于判断更新时间是否停摆（stale）与是否跨天。
// lastUpdated 只在刷新成功后写入，轮询停摆时若只看它本身会显示一个冻结的时间。
const now = ref(Date.now());
const NOW_TICK_MS = 15_000;
let nowTimer: ReturnType<typeof setInterval> | undefined;
// 停摆阈值：刷新间隔 × 4，下限 20 秒
const staleThresholdMs = computed(() => Math.max(refreshInterval.value * 4, 20_000));
const lastUpdatedMs = computed(() => {
  if (!lastUpdated.value) return null;
  const ms = dayjs(lastUpdated.value).valueOf();
  return Number.isNaN(ms) ? null : ms;
});
const isStale = computed(
  () => lastUpdatedMs.value !== null && now.value - lastUpdatedMs.value > staleThresholdMs.value
);

const speedMetric = (
  key: "download" | "upload",
  bytesPerSecond: number,
  limitKBps: number | null
): StatusMetric => {
  const label = key === "download" ? t("sidebar.download") : t("sidebar.upload");
  const speed = formatSpeedCompact(bytesPerSecond);
  const limit = formatLimitText(limitKBps);
  return {
    key,
    label,
    value: speed,
    cap: limit ?? undefined,
    title: limit
      ? t("sidebar.speedWithTitle", { label, speed, limit })
      : t("sidebar.speedValue", { label, speed }),
  };
};

const freeSpaceText = computed(() =>
  freeSpaceBytes.value !== null ? formatBytes(freeSpaceBytes.value) : t('common.unknown')
);
const versionText = computed(() => sessionConfig.value?.version || "");

const statusMetrics = computed<StatusMetric[]>(() => {
  const lastMs = lastUpdatedMs.value;
  const lastFull = lastMs === null ? "—" : dayjs(lastMs).format("YYYY-MM-DD HH:mm:ss");
  const lastIsStale = isStale.value;
  // 同日且未停摆 → HH:mm:ss；否则带日期的 MM-DD HH:mm（横线格式本身即「非实时」线索）
  const lastSameDay =
    !lastIsStale && lastMs !== null && dayjs(lastMs).isSame(dayjs(now.value), "day");
  return [
    speedMetric("download", sessionStats.value?.downloadSpeed || 0, downloadLimitKBps.value),
    speedMetric("upload", sessionStats.value?.uploadSpeed || 0, uploadLimitKBps.value),
    {
      key: "freeSpace",
      label: t("sidebar.freeSpace"),
      value: freeSpaceText.value,
      title: `${t("stats.diskFreeSpace")} ${freeSpaceText.value}`,
    },
    {
      key: "lastUpdate",
      label: t("sidebar.lastUpdate"),
      value:
        lastMs === null
          ? "—"
          : dayjs(lastMs).format(lastSameDay ? "HH:mm:ss" : "MM-DD HH:mm"),
      // 无数据时保留「更新」标签 +「—」；仅在有过更新且停摆/跨天（日期串自解释）时隐藏标签
      hideLabel: lastMs !== null && !lastSameDay,
      title: lastIsStale
        ? t("sidebar.updatedAtStale", { time: lastFull })
        : t("sidebar.updatedAt", { time: lastFull }),
    },
  ];
});
const frontendVersion = __APP_VERSION__ || "dev";
// 构建未注入版本号时显示 dev，不拼成 vdev
const frontendVersionLabel = frontendVersion === "dev" ? "dev" : `v${frontendVersion}`;
const frontendVersionTitle = computed(() =>
  t("sidebar.versionFull", { version: frontendVersion })
);

// 根据当前路由和过滤器状态计算当前活动的菜单项
const updateActiveMenuItem = () => {
  if (route.path === "/") {
    activeMenuItem.value = `status:${statusFilter.value}`;
  } else {
    activeMenuItem.value = route.path;
  }
};

watch([() => route.path, statusFilter], updateActiveMenuItem);

watch(isMobile, (mobile) => {
  if (!mobile) {
    isMenuOpen.value = false;
  }
});

const handleMenuSelect = (index: string) => {
  // 处理状态过滤
  if (index.startsWith("status:")) {
    const status = index.replace("status:", "") as StatusFilter;
    const urlParam = statusToUrl(status);
    // 使用 query params 更新 URL，状态会在 HomeView 中从 URL 恢复
    const query: Record<string, string> = {};
    if (urlParam !== 'all') {
      query.status = urlParam;
    }
    // 保留 tracker 过滤参数（如果有的话）
    if (filterStore.trackerFilter) {
      query.tracker = filterStore.trackerFilter;
    }
    router.push({ path: '/', query });
  }
  // 处理普通路由
  else {
    router.push(index);
  }

  if (isMobile.value) {
    isMenuOpen.value = false;
  }
};

onMounted(() => {
  systemStatusStore.start();
  updateActiveMenuItem();
  themeStore.loadTheme();
  nowTimer = setInterval(() => {
    now.value = Date.now();
  }, NOW_TICK_MS);
});

onBeforeUnmount(() => {
  systemStatusStore.stop();
  if (nowTimer) {
    clearInterval(nowTimer);
    nowTimer = undefined;
  }
});

const handleThemeChange = (theme: string) => {
  if (theme === "__toggle_mode__") {
    themeStore.toggleMode();
    return;
  }
  if (theme === "__toggle_transparency__") {
    themeStore.setReduceTransparency(!themeStore.reduceTransparency);
    return;
  }
  themeStore.setTheme(theme as ThemeType);
};

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm(t('header.logoutConfirm'), t('common.tip'), {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: "warning",
    });

    // 停止定时刷新
    systemStatusStore.stop();

    // 真正调用后端登出接口以清除 Session
    await apiLogout();

    // 清除连接状态
    connectionStore.setConnected(false);

    // 跳转到登录页
    router.push("/login");
  } catch (error) {
    // 用户取消
  }
};
</script>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  background: var(--bc-bg);
  color: var(--bc-text);
}

/* ---------------- 顶部栏 ---------------- */
.app-header {
  position: relative;
  z-index: 20;
  background: var(--bc-header-bg);
  color: var(--bc-header-text);
  border-bottom: 1px solid var(--bc-border);
  box-shadow: var(--bc-shadow-sm);
  flex: 0 0 auto;
}

.app-header__inner {
  display: flex;
  align-items: center;
  gap: var(--bc-space-3);
  padding: 10px 14px;
  min-height: 58px;
}

.app-header__left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1 1 auto;
}

.app-header__right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 0 0 auto;
}

.app-header__title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.2;
  color: var(--bc-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.icon-button {
  width: 34px;
  height: 34px;
  border-radius: var(--bc-radius-sm);
  border: 1px solid var(--bc-border);
  background: var(--bc-surface-muted);
  color: var(--bc-text-muted);
  display: inline-grid;
  place-items: center;
  cursor: pointer;
  transition: background var(--bc-duration) var(--bc-ease),
    border-color var(--bc-duration) var(--bc-ease),
    color var(--bc-duration) var(--bc-ease),
    transform var(--bc-duration) var(--bc-ease);
}

.icon-button:hover {
  background: var(--bc-surface-hover);
  border-color: var(--bc-border-strong);
  color: var(--bc-text);
}

.icon-button:active {
  transform: scale(0.94);
}

.icon-inline {
  width: 17px;
  height: 17px;
  display: inline-block;
  background-color: currentColor;
  mask: url("/icons/earth.svg") no-repeat center / contain;
  -webkit-mask: url("/icons/earth.svg") no-repeat center / contain;
}

.accent-option {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.accent-dot {
  width: 12px;
  height: 12px;
  /* deslop-ignore-next-line 19 */
  border-radius: 50%;
  display: inline-block;
}

/* 主题下拉里的「减弱透明效果」小开关（仅视觉示意，真实状态由 data-bc-glass 驱动） */
.transparency-switch {
  width: 28px;
  height: 16px;
  padding: 2px;
  border-radius: var(--bc-radius-pill);
  background: var(--bc-border-strong);
  display: inline-flex;
  align-items: center;
  transition: background var(--bc-duration) var(--bc-ease);
}

.transparency-switch__dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #fff;
  transition: transform var(--bc-duration) var(--bc-ease);
}

.transparency-switch.is-on {
  background: var(--bc-text-muted);
}

.transparency-switch.is-on .transparency-switch__dot {
  transform: translateX(12px);
}

/* ---------------- 主体 ---------------- */
.app-body {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
}

.app-sidebar {
  width: 232px;
  flex: 0 0 232px;
  border-right: 1px solid var(--bc-border);
  background: var(--bc-surface);
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.sidebar-nav {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 14px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sidebar-nav__title {
  margin: 14px 8px 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--bc-text-subtle-bar, var(--bc-text-muted));
}

.sidebar-nav__title:first-child {
  margin-top: 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 12px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--bc-text-muted);
  font-size: 14px;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: background var(--bc-duration) var(--bc-ease),
    color var(--bc-duration) var(--bc-ease);
}

.nav-item:hover {
  background: var(--bc-surface-hover);
  color: var(--bc-text);
}

.nav-item.is-active {
  background: var(--bc-accent-soft);
  color: var(--bc-accent-strong);
  font-weight: 600;
}

.nav-item__icon {
  font-size: 16px;
  flex: 0 0 auto;
}

.nav-item__label {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-item__badge {
  flex: 0 0 auto;
  min-width: 22px;
  padding: 1px 7px;
  border-radius: var(--bc-radius-pill);
  background: var(--bc-surface-muted);
  border: 1px solid var(--bc-border);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  text-align: center;
  color: var(--bc-text-muted);
}

.nav-item.is-active .nav-item__badge {
  background: var(--bc-accent);
  border-color: var(--bc-accent);
  color: #fff;
}

.app-main {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  overflow: auto;
  padding: 14px;
  /* 纵向 flex：让页面根元素可通过 flex:1 撑满视口（列表页表格填满剩余高度） */
  display: flex;
  flex-direction: column;
}

/* ---------------- 移动端底部导航 ---------------- */
.tabbar {
  position: sticky;
  bottom: 0;
  z-index: 30;
  flex: 0 0 auto;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  background: var(--bc-surface);
  border-top: 1px solid var(--bc-border);
  box-shadow: 0 -6px 20px rgba(16, 24, 40, 0.08);
}

.tabbar__item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 7px 2px 6px;
  border: none;
  background: transparent;
  color: var(--bc-text-subtle);
  font-size: 11px;
  font-family: inherit;
  cursor: pointer;
  min-height: 52px;
  transition: color var(--bc-duration) var(--bc-ease);
}

.tabbar__item.is-active {
  color: var(--bc-accent);
  font-weight: 600;
}

.tabbar__item.is-active::before {
  content: "";
  position: absolute;
  top: 0;
  width: 26px;
  height: 3px;
  border-radius: 0 0 3px 3px;
  background: var(--bc-accent);
  transform: translateY(-7px);
}

.tabbar__item span {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ---------------- 移动端抽屉 ---------------- */
.drawer-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bc-surface);
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid var(--bc-border);
}

.drawer-header h3 {
  font-size: 17px;
}

.drawer-version {
  font-size: 12px;
  color: var(--bc-text-subtle-bar, var(--bc-text-muted));
}

.drawer-header .icon-button {
  background: var(--bc-surface-muted);
  border-color: var(--bc-border);
  color: var(--bc-text);
}

.drawer-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 12px 10px 20px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* 版本与系统状态固定在抽屉底部 */
.drawer-footer {
  flex: 0 0 auto;
  padding: 0 4px calc(env(safe-area-inset-bottom, 0px) + 4px);
  background: var(--bc-surface);
}

/* ---------------- 过渡 ---------------- */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 160ms var(--bc-ease), transform 160ms var(--bc-ease);
}

.page-fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (min-width: 769px) {
  .app-header__inner {
    padding: 10px 20px;
  }

  .app-main {
    padding: 18px 22px;
  }
}
</style>
