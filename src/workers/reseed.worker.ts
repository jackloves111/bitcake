import type { Torrent, TorrentStatus } from '@/types/torrent'
import { isTorrentError, getTorrentErrorMessage } from '@/utils/torrentStatus'
import type { ErrorMappingLike } from '@/utils/errorMapping'

export interface ReseedTracker {
  announce: string
  displayName: string
  statusText: string
  lastAnnounceSucceeded: boolean
  errorDetail?: string
}

export interface ReseedTorrentItem {
  id: number
  trackerName: string
  status: TorrentStatus
  percentDone: number
  uploadRatio: number
  uploadedEver: number
  rateUpload: number
  category?: string
  downloadDir: string
  errorString?: string
  errorType?: string
  seeders: number
  seedersText: string
  leechers: number
  leechersText: string
}

export interface ReseedData {
  fileName: string
  hashString: string
  totalSize: number
  trackerCount: number
  trackers: ReseedTracker[]
  totalUploadRatio: number
  totalUploaded: number
  totalDownloaded: number
  totalSeeds: number
  totalSeedsText: string
  totalLeechers: number
  totalLeechersText: string
  torrents: ReseedTorrentItem[]
}

export interface ReseedWorkerInput {
  requestId: number
  torrents: Torrent[]
  errorMappings: ErrorMappingLike[]
  texts: {
    trackerNormal: string
    trackerAbnormal: string
    unknownTracker: string
    otherError: string
  }
  trackerSites: Array<{ keyword: string; displayName: string }>
}

export interface ReseedWorkerOutput {
  requestId: number
  reseedData: ReseedData[]
}

const trackerHostCache = new Map<string, string>()

const getTrackerHost = (announce: string): string => {
  const cached = trackerHostCache.get(announce)
  if (cached !== undefined) return cached
  let host = announce
  try {
    const url = new URL(announce)
    host = url.host || announce
  } catch {
    host = announce
  }
  trackerHostCache.set(announce, host)
  return host
}

const getTrackerPeerCount = (
  torrent: Torrent,
  key: 'seederCount' | 'leecherCount'
): number => {
  let count = 0
  for (const stat of torrent.trackerStats ?? []) {
    const value = stat[key]
    if (typeof value === 'number' && value > 0) {
      count = Math.max(count, value)
    }
  }
  return count
}

const formatPeerStatText = (total: number, connected: number): string => {
  const connectedText = connected ?? 0
  if (total > 0) {
    return `${total} (${connectedText})`
  }
  return `${connectedText}`
}

const matchErrorType = (
  errorString: string | undefined,
  mappings: ErrorMappingLike[],
  defaultType: string
): string => {
  if (!errorString) return defaultType
  const lower = errorString.toLowerCase()
  for (const m of mappings) {
    if (m.keywords.some((k) => lower.includes(k.toLowerCase()))) {
      return m.type
    }
  }
  return defaultType
}

/**
 * 辅种数据核心分析与聚合计算（可在 Web Worker 或主线程回退执行）
 */
export function computeReseedData(payload: ReseedWorkerInput): ReseedData[] {
  const { torrents, errorMappings, texts, trackerSites } = payload
  const siteCache = new Map<string, string>()

  const getDisplayName = (announce: string): string => {
    const cached = siteCache.get(announce)
    if (cached !== undefined) return cached
    const host = getTrackerHost(announce)
    const hostLower = host.toLowerCase()
    const fullLower = announce.toLowerCase()
    for (const site of trackerSites) {
      if (hostLower.includes(site.keyword) || fullLower.includes(site.keyword)) {
        siteCache.set(announce, site.displayName)
        return site.displayName
      }
    }
    siteCache.set(announce, host)
    return host
  }

  // 1. 按照文件名+文件大小分组（辅种判定规则）
  const groupedByNameAndSize = new Map<string, Torrent[]>()
  for (const torrent of torrents) {
    const key = `${torrent.name}|${torrent.totalSize}`
    let group = groupedByNameAndSize.get(key)
    if (!group) {
      group = []
      groupedByNameAndSize.set(key, group)
    }
    group.push(torrent)
  }

  const result: ReseedData[] = []

  // 2. 遍历聚合各个辅种组
  for (const [, group] of groupedByNameAndSize) {
    const firstTorrent = group[0]
    if (!firstTorrent) continue

    const trackerMap = new Map<string, ReseedTracker>()
    let totalUploaded = 0
    let totalDownloaded = 0
    let totalSeeds = 0
    let totalConnectedSeeds = 0
    let totalLeechers = 0
    let totalConnectedLeechers = 0

    for (const t of group) {
      // 累加做种/下载统计
      totalUploaded += t.uploadedEver || 0
      totalDownloaded += t.downloadedEver || 0
      totalSeeds += getTrackerPeerCount(t, 'seederCount')
      totalConnectedSeeds += t.peersSendingToUs || 0
      totalLeechers += getTrackerPeerCount(t, 'leecherCount')
      totalConnectedLeechers += t.peersGettingFromUs || 0

      // 提取 tracker 状态
      if (t.trackerStats && t.trackerStats.length > 0) {
        const tracker = t.trackerStats[0]
        if (tracker && tracker.announce && !trackerMap.has(tracker.announce)) {
          const hasError = isTorrentError(t)
          const errorDetail = getTorrentErrorMessage(t)
          trackerMap.set(tracker.announce, {
            announce: tracker.announce,
            displayName: getDisplayName(tracker.announce),
            statusText: hasError ? texts.trackerAbnormal : texts.trackerNormal,
            lastAnnounceSucceeded: !hasError,
            errorDetail,
          })
        }
      }
    }

    const totalUploadRatio = totalDownloaded > 0 ? totalUploaded / totalDownloaded : 0
    const totalSeedsText = formatPeerStatText(totalSeeds, totalConnectedSeeds)
    const totalLeechersText = formatPeerStatText(totalLeechers, totalConnectedLeechers)

    const torrentItems: ReseedTorrentItem[] = []
    for (const t of group) {
      const errorMessage = getTorrentErrorMessage(t)
      const seeders = getTrackerPeerCount(t, 'seederCount')
      const connectedSeeders = t.peersSendingToUs || 0
      const leechers = getTrackerPeerCount(t, 'leecherCount')
      const connectedLeechers = t.peersGettingFromUs || 0

      const trackerAnnounce = t.trackerStats?.[0]?.announce
      const trackerName = trackerAnnounce ? getDisplayName(trackerAnnounce) : texts.unknownTracker

      torrentItems.push({
        id: t.id,
        trackerName,
        status: t.status,
        percentDone: t.percentDone,
        uploadRatio: t.uploadRatio,
        uploadedEver: t.uploadedEver || 0,
        rateUpload: t.rateUpload,
        category: t.category,
        downloadDir: t.downloadDir,
        errorString: errorMessage,
        errorType: errorMessage ? matchErrorType(errorMessage, errorMappings, texts.otherError) : undefined,
        seeders,
        seedersText: formatPeerStatText(seeders, connectedSeeders),
        leechers,
        leechersText: formatPeerStatText(leechers, connectedLeechers),
      })
    }

    result.push({
      fileName: firstTorrent.name,
      hashString: firstTorrent.hashString,
      totalSize: firstTorrent.totalSize,
      trackerCount: group.length,
      trackers: Array.from(trackerMap.values()),
      totalUploadRatio,
      totalUploaded,
      totalDownloaded,
      totalSeeds,
      totalSeedsText,
      totalLeechers,
      totalLeechersText,
      torrents: torrentItems,
    })
  }

  return result
}

// 监听 Worker 消息
if (typeof self !== 'undefined' && typeof self.postMessage === 'function') {
  self.onmessage = (e: MessageEvent<ReseedWorkerInput>) => {
    try {
      const reseedData = computeReseedData(e.data)
      const response: ReseedWorkerOutput = {
        requestId: e.data.requestId,
        reseedData,
      }
      self.postMessage(response)
    } catch (error) {
      console.error('Error in Reseed Web Worker:', error)
    }
  }
}
