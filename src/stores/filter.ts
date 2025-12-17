import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { TorrentStatus } from '@/types/torrent'

export type StatusFilter = 'all' | 'error' | 'queued' | 'active' | TorrentStatus

export const useFilterStore = defineStore('filter', () => {
  const statusFilter = ref<StatusFilter>('all')
  const trackerFilter = ref('')
  const categoryFilter = ref('')
  const downloadDirFilter = ref('')
  const errorTypeFilter = ref('')

  const setStatusFilter = (filter: StatusFilter) => {
    statusFilter.value = filter
  }

  const setTrackerFilter = (filter: string) => {
    trackerFilter.value = filter
  }

  const setCategoryFilter = (filter: string) => {
    categoryFilter.value = filter
  }

  const setDownloadDirFilter = (filter: string) => {
    downloadDirFilter.value = filter
  }

  const setErrorTypeFilter = (filter: string) => {
    errorTypeFilter.value = filter
  }

  const resetFilters = () => {
    statusFilter.value = 'all'
    trackerFilter.value = ''
    categoryFilter.value = ''
    downloadDirFilter.value = ''
    errorTypeFilter.value = ''
  }

  return {
    statusFilter,
    trackerFilter,
    categoryFilter,
    downloadDirFilter,
    errorTypeFilter,
    setStatusFilter,
    setTrackerFilter,
    setCategoryFilter,
    setDownloadDirFilter,
    setErrorTypeFilter,
    resetFilters,
  }
})
