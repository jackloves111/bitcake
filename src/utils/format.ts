const SIZES = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB'] as const

/**
 * 格式化字节大小
 * @param bytes 字节数
 * @returns 格式化后的字符串，如 "1.5 MB"
 */
export const formatBytes = (bytes: number): string => {
  if (!bytes || bytes <= 0 || !Number.isFinite(bytes)) return '0 B'

  let i = 0
  let value = bytes
  while (value >= 1024 && i < SIZES.length - 1) {
    value /= 1024
    i++
  }

  // 如果值 >= 1000 且未达到最大单位，升级到下一个单位（避免显示 1001 KB）
  if (value >= 1000 && i < SIZES.length - 1) {
    value /= 1024
    i++
  }

  return `${value.toFixed(1)} ${SIZES[i]}`
}

/**
 * 格式化速度（字节/秒）
 * @param bytesPerSecond 每秒字节数
 * @returns 格式化后的速度字符串，如 "1.5 MB/s"
 */
export const formatSpeed = (bytesPerSecond: number): string => {
  if (!bytesPerSecond || bytesPerSecond <= 0 || !Number.isFinite(bytesPerSecond)) return '0 B/s'
  return `${formatBytes(bytesPerSecond)}/s`
}
