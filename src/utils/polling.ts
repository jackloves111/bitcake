export interface AdaptivePollerOptions {
  intervalMs: number | (() => number)
  maxIntervalMs?: number
  shouldRun?: () => boolean
}

type PollingTask = () => Promise<boolean>

/** 合并并发调用；进行中的任务完成前，调用方共享同一个 Promise。 */
export class SingleFlightExecutor<TResult> {
  private inFlight: Promise<TResult> | null = null

  run(task: () => Promise<TResult>): Promise<TResult> {
    if (this.inFlight) return this.inFlight
    this.inFlight = Promise.resolve().then(task).finally(() => {
      this.inFlight = null
    })
    return this.inFlight
  }
}

/** Serializes tasks with different semantics without incorrectly merging them. */
export class SerialExecutor {
  private tail: Promise<void> = Promise.resolve()

  run<TResult>(task: () => Promise<TResult>): Promise<TResult> {
    const result = this.tail.then(task, task)
    this.tail = result.then(
      () => undefined,
      () => undefined
    )
    return result
  }
}

/**
 * 自适应退避的轮询调度器。
 * 采用递归调度，上一次完成后才安排下一次；停止后不会再次调度，
 * 快速停止再启动时也会合并尚未结束的旧任务。
 */
export class AdaptivePoller {
  private timer: number | undefined
  private active = false
  private generation = 0
  private consecutiveFailures = 0
  private readonly executor = new SingleFlightExecutor<boolean>()
  private readonly task: PollingTask
  private readonly options: AdaptivePollerOptions

  constructor(task: PollingTask, options: AdaptivePollerOptions) {
    this.task = task
    this.options = options
  }

  private getBaseInterval(): number {
    const val = typeof this.options.intervalMs === 'function'
      ? this.options.intervalMs()
      : this.options.intervalMs
    return Math.max(0, val)
  }

  restart(immediate = false) {
    this.stop()
    this.start(immediate)
  }

  start(immediate = true) {
    if (this.active) return
    if (this.getBaseInterval() <= 0) return
    this.active = true
    const generation = ++this.generation
    if (immediate) {
      void this.runScheduledTask(generation)
    } else {
      this.schedule(generation)
    }
  }

  stop() {
    this.active = false
    this.generation++
    this.consecutiveFailures = 0
    if (this.timer !== undefined) {
      window.clearTimeout(this.timer)
      this.timer = undefined
    }
  }

  private recordResult(succeeded: boolean) {
    this.consecutiveFailures = succeeded
      ? 0
      : Math.min(this.consecutiveFailures + 1, 30)
  }

  private getNextDelay() {
    const baseInterval = this.getBaseInterval()
    const maxInterval = this.options.maxIntervalMs ?? baseInterval
    return Math.min(
      baseInterval * 2 ** this.consecutiveFailures,
      maxInterval
    )
  }

  private schedule(generation: number) {
    if (!this.active || generation !== this.generation) return
    const delay = this.getNextDelay()
    if (delay <= 0) return
    this.timer = window.setTimeout(() => {
      this.timer = undefined
      void this.runScheduledTask(generation)
    }, delay)
  }

  private async runScheduledTask(generation: number) {
    try {
      const baseInterval = this.getBaseInterval()
      if (baseInterval > 0 && this.options.shouldRun?.() !== false) {
        const succeeded = await this.executor.run(this.task)
        this.recordResult(succeeded)
      }
    } catch {
      this.recordResult(false)
      // 轮询错误已计入退避状态，由业务任务决定是否记录或展示。
    } finally {
      this.schedule(generation)
    }
  }
}
