import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { torrentBackend } from '@/config/torrentClient'

/**
 * 后台移动保存目录。
 *
 * 照着 qBittorrent 的用法做：WebUI 只负责"投递指令"，完成与否
 * 以后端上报的种子状态为准（qB 用 state=moving / save_path，
 * Transmission 用 downloadDir / error）。界面从不等待搬移请求返回。
 *
 * Transmission 的 `torrent-set-location`（move=true）会在 session 线程里
 * 同步搬完文件才回响应，所以它必然超时；超时只代表"前端不再等"，
 * 服务端仍在继续，因此这里的超时不算失败。
 */
export interface TorrentMoveRecord {
  /** 本地唯一键，用于持久化与去重 */
  key: string
  torrentIds: number[]
  targetPath: string
  moveFiles: boolean
  startedAt: number
}

export type TorrentMoveOutcome = 'done' | 'failed' | 'gone' | 'pending'

export interface TorrentMoveEvent {
  record: TorrentMoveRecord
  completed: number
  failed: number
  /** 超过等待上限仍未确认结果 */
  stale: boolean
}

const STORAGE_KEY = 'bitcake_torrent_moves'

/** 超过该时长仍无法确认结果时给出提示并清理标记，避免状态永久残留 */
export const MOVE_STALE_MS = 2 * 60 * 60 * 1000

let recordSeq = 0

interface PersistedPayload {
  backend: string
  records: TorrentMoveRecord[]
}

const readPersisted = (): TorrentMoveRecord[] => {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as PersistedPayload
    if (!parsed || parsed.backend !== torrentBackend || !Array.isArray(parsed.records)) {
      return []
    }
    const now = Date.now()
    return parsed.records.filter(
      (record) =>
        record &&
        typeof record.key === 'string' &&
        Array.isArray(record.torrentIds) &&
        record.torrentIds.length > 0 &&
        typeof record.targetPath === 'string' &&
        now - (record.startedAt || 0) < MOVE_STALE_MS * 4
    )
  } catch {
    return []
  }
}

export const useTorrentMovesStore = defineStore('torrentMoves', () => {
  const records = ref<TorrentMoveRecord[]>(readPersisted())

  const persist = () => {
    if (typeof window === 'undefined') return
    try {
      const payload: PersistedPayload = {
        backend: torrentBackend,
        records: records.value,
      }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } catch {
      // 隐私模式等场景忽略持久化失败
    }
  }

  /** 正在移动的种子 id 集合（渲染时按 id 查询） */
  const movingTorrentIds = computed(() => {
    const ids = new Set<number>()
    records.value.forEach((record) => {
      record.torrentIds.forEach((id) => ids.add(id))
    })
    return ids
  })

  const activeCount = computed(() => records.value.length)

  const isMoving = (torrentId: number) => movingTorrentIds.value.has(torrentId)

  const begin = (
    torrentIds: number[],
    targetPath: string,
    moveFiles: boolean
  ): TorrentMoveRecord => {
    const record: TorrentMoveRecord = {
      key: `${Date.now()}-${++recordSeq}`,
      torrentIds: [...torrentIds],
      targetPath,
      moveFiles,
      startedAt: Date.now(),
    }
    records.value = [...records.value, record]
    persist()
    return record
  }

  const drop = (key: string) => {
    if (!records.value.some((record) => record.key === key)) return
    records.value = records.value.filter((record) => record.key !== key)
    persist()
  }

  /** 记录是否仍处于"未确认结果"状态（对账可能先一步结算） */
  const has = (key: string) => records.value.some((record) => record.key === key)

  /** 按记录重新投递（页面刷新后服务端可能仍在移动，不做任何重发） */
  /**
   * 用后端状态对账。
   * @param resolve 由调用方判断某个种子的结果（已完成/失败/已删除/仍在进行）
   * @returns 已经得出结论的记录，用于提示用户
   */
  const reconcile = (
    resolve: (torrentId: number, record: TorrentMoveRecord) => TorrentMoveOutcome
  ): TorrentMoveEvent[] => {
    if (!records.value.length) return []

    const events: TorrentMoveEvent[] = []
    const now = Date.now()
    const remaining: TorrentMoveRecord[] = []

    records.value.forEach((record) => {
      let completed = 0
      let failed = 0
      let pending = 0
      record.torrentIds.forEach((id) => {
        const outcome = resolve(id, record)
        if (outcome === 'done') completed += 1
        else if (outcome === 'failed') failed += 1
        else if (outcome === 'pending') pending += 1
      })

      const stale = now - record.startedAt > MOVE_STALE_MS
      if (pending > 0 && !stale) {
        remaining.push(record)
        return
      }
      events.push({ record, completed, failed, stale: stale && pending > 0 })
    })

    if (remaining.length !== records.value.length) {
      records.value = remaining
      persist()
    }
    return events
  }

  return {
    records,
    activeCount,
    movingTorrentIds,
    isMoving,
    begin,
    drop,
    has,
    reconcile,
  }
})
