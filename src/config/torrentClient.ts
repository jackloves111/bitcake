type TorrentBackend = 'transmission' | 'qbittorrent'

// 使用构建时注入的全局变量
export const torrentBackend: TorrentBackend = __TORRENT_BACKEND__
export const isTransmission = torrentBackend === 'transmission'
export const isQbittorrent = torrentBackend === 'qbittorrent'
export const torrentBackendName = isTransmission ? 'Transmission' : 'qBittorrent'
export const apiRequestTimeoutMs = 15_000

/**
 * 修改保存目录（同时移动文件）时的超时时间：`0` 表示不超时。
 *
 * Transmission 的 `torrent-set-location` 会在 session 线程里同步搬完
 * 所有文件才返回响应，耗时只取决于数据量和磁盘，无法预估。
 * 界面在这条请求上显示"移动中"动效并等待结果，因此不能中途超时。
 */
export const apiMoveRequestTimeoutMs = 0

const defaultBase = isTransmission ? '/transmission/rpc' : '/api/v2'
export const torrentApiBase = defaultBase
