// 限速策略类型定义

export interface SpeedLimitStrategy {
  id: string // 策略唯一标识
  name: string // 策略名称
  description?: string // 策略描述
  downloadLimited: boolean // 是否限制下载速度
  downloadLimit: number // 下载限速值
  downloadUnit: 'KB' | 'MB' // 下载速度单位
  uploadLimited: boolean // 是否限制上传速度
  uploadLimit: number // 上传限速值
  uploadUnit: 'KB' | 'MB' // 上传速度单位
  trackers: string[] // 应用的tracker列表（空数组表示应用到全部）
  createdAt: number // 创建时间戳
  updatedAt: number // 更新时间戳
}

export interface SpeedLimitStrategyStore {
  strategies: SpeedLimitStrategy[]
  version: number // 数据版本，用于兼容性
  expiresAt: number // 过期时间戳
}
