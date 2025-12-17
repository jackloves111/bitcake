import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface TipItem {
  id: string
  content: string
}

export const useTipsStore = defineStore('tips', () => {
  // 默认 tips 数据
  const defaultTips: TipItem[] = [
    { id: '1', content: '有bug或需求请提issues' },
    { id: '2', content: '右上角可以切换应用主题！' },
    { id: '3', content: '双击种子可以查看详细信息。' },
    { id: '4', content: '兼容移动端（理论上...）' },
    { id: '5', content: '左侧菜单支持按状态过滤种子。' },
    { id: '6', content: '已支持批量添加操作' },
    { id: '7', content: '优先适配transmission，其次qbittorrent' },
    { id: '8', content: '推送频率很高，建议至少每周一更' },
    { id: '9', content: 'tracker对应站点信息不全，添加请填issues' },
  ]

  const tips = ref<TipItem[]>([...defaultTips])

  // 添加新版本提示到第一条
  const addVersionUpdateTip = (latestVersion: string, currentVersion: string) => {
    const versionTip: TipItem = {
      id: 'version-update',
      content: `🎉 发现新版本 v${latestVersion}（当前 v${currentVersion}），请及时更新！`
    }

    // 移除旧的版本提示（如果存在）
    tips.value = tips.value.filter(tip => tip.id !== 'version-update')

    // 插入到第一条
    tips.value.unshift(versionTip)
  }

  // 重置 tips
  const resetTips = () => {
    tips.value = [...defaultTips]
  }

  return {
    tips,
    addVersionUpdateTip,
    resetTips,
  }
})
