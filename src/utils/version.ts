import axios from 'axios'
import packageJson from '../../package.json'

const GITHUB_REPO = 'wenfer/bitcake'
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`

// 当前版本号
export const currentVersion = packageJson.version

export interface GitHubRelease {
  tag_name: string
  name: string
  html_url: string
  published_at: string
  body: string
}

// 比较版本号（语义化版本）
// 返回值：1 表示 v1 > v2, -1 表示 v1 < v2, 0 表示相等
export const compareVersions = (v1: string, v2: string): number => {
  // 移除 v 前缀
  const cleanV1 = v1.replace(/^v/, '')
  const cleanV2 = v2.replace(/^v/, '')

  const parts1 = cleanV1.split('.').map(Number)
  const parts2 = cleanV2.split('.').map(Number)

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const num1 = parts1[i] || 0
    const num2 = parts2[i] || 0

    if (num1 > num2) return 1
    if (num1 < num2) return -1
  }

  return 0
}

// 从 GitHub 获取最新版本信息
export const fetchLatestRelease = async (): Promise<GitHubRelease | null> => {
  try {
    const response = await axios.get<GitHubRelease>(GITHUB_API_URL, {
      timeout: 10000, // 10秒超时
    })
    return response.data
  } catch (error) {
    console.warn('获取最新版本失败:', error)
    return null
  }
}

// 检查是否有新版本
export const checkForUpdate = async (): Promise<{
  hasUpdate: boolean
  latestVersion?: string
  currentVersion: string
  releaseUrl?: string
}> => {
  const release = await fetchLatestRelease()

  if (!release) {
    return {
      hasUpdate: false,
      currentVersion,
    }
  }

  const latestVersion = release.tag_name.replace(/^v/, '')
  const hasUpdate = compareVersions(latestVersion, currentVersion) > 0

  return {
    hasUpdate,
    latestVersion,
    currentVersion,
    releaseUrl: release.html_url,
  }
}
