<template>
  <div class="strategy-view">
    <div class="toolbar">
      <div class="actions-group">
        <el-button type="primary" :icon="Plus" @click="showCreateDialog">
          创建策略
        </el-button>
        <el-button :icon="Refresh" @click="loadStrategies">刷新</el-button>
        <el-button :icon="Download" @click="handleExport">导出策略</el-button>
        <el-button :icon="Upload" @click="showImportDialog = true">导入策略</el-button>
      </div>
    </div>

    <div class="table-container">
      <el-table
        v-loading="loading"
        :data="strategies"
        stripe
        border
        style="width: 100%"
      >
        <el-table-column prop="name" label="策略名称" min-width="150" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column label="下载限速" min-width="120">
          <template #default="{ row }">
            <span v-if="row.downloadLimited">
              {{ row.downloadLimit }} {{ row.downloadUnit }}/s
            </span>
            <span v-else class="text-muted">不限速</span>
          </template>
        </el-table-column>
        <el-table-column label="上传限速" min-width="120">
          <template #default="{ row }">
            <span v-if="row.uploadLimited">
              {{ row.uploadLimit }} {{ row.uploadUnit }}/s
            </span>
            <span v-else class="text-muted">不限速</span>
          </template>
        </el-table-column>
        <el-table-column label="应用范围" min-width="150">
          <template #default="{ row }">
            <span v-if="row.trackers.length === 0">全部种子</span>
            <el-tag v-else size="small">{{ row.trackers.length }} 个Tracker</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              :loading="applyingStrategy === row.id"
              @click="handleApply(row)"
            >
              应用
            </el-button>
            <el-button size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button
              type="danger"
              size="small"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="strategies.length === 0 && !loading" description="暂无策略，点击上方按钮创建" />
    </div>

    <!-- 创建/编辑策略对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '创建策略' : '编辑策略'"
      :width="dialogWidth"
      @close="handleDialogClose"
    >
      <el-form :model="form" :rules="formRules" ref="formRef" label-width="100px">
        <el-form-item label="策略名称" prop="name" required>
          <el-input v-model="form.name" placeholder="请输入策略名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="2"
            placeholder="可选，描述该策略的用途"
          />
        </el-form-item>
        <el-form-item label="下载限速">
          <div class="limit-row">
            <el-switch v-model="form.downloadLimited" class="limit-switch" />
            <el-input-number
              v-model="form.downloadLimit"
              :min="0"
              :max="1000000"
              :disabled="!form.downloadLimited"
              controls-position="right"
              class="limit-input"
            />
            <el-select
              v-model="form.downloadUnit"
              :disabled="!form.downloadLimited"
              class="limit-unit-select"
            >
              <el-option label="KB/s" value="KB" />
              <el-option label="MB/s" value="MB" />
            </el-select>
          </div>
        </el-form-item>
        <el-form-item label="上传限速">
          <div class="limit-row">
            <el-switch v-model="form.uploadLimited" class="limit-switch" />
            <el-input-number
              v-model="form.uploadLimit"
              :min="0"
              :max="1000000"
              :disabled="!form.uploadLimited"
              controls-position="right"
              class="limit-input"
            />
            <el-select
              v-model="form.uploadUnit"
              :disabled="!form.uploadLimited"
              class="limit-unit-select"
            >
              <el-option label="KB/s" value="KB" />
              <el-option label="MB/s" value="MB" />
            </el-select>
          </div>
        </el-form-item>
        <el-form-item label="应用范围">
          <el-select
            v-model="form.trackers"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="留空则应用于全部种子"
            style="width: 100%"
          >
            <el-option
              v-for="tracker in trackerOptions"
              :key="tracker.value"
              :label="tracker.label"
              :value="tracker.value"
            />
          </el-select>
          <div class="form-tip">
            选择要应用此策略的 Tracker，留空表示应用到所有种子
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSubmit">
          {{ dialogMode === 'create' ? '创建' : '保存' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 导入策略对话框 -->
    <el-dialog
      v-model="showImportDialog"
      title="导入策略"
      :width="dialogWidth"
    >
      <el-input
        v-model="importData"
        type="textarea"
        :rows="10"
        placeholder="粘贴策略JSON数据"
      />
      <template #footer>
        <el-button @click="showImportDialog = false">取消</el-button>
        <el-button type="primary" @click="handleImport">导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Plus, Refresh, Download, Upload } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import * as strategyService from '@/services/speedLimitStrategyService'
import type { SpeedLimitStrategy } from '@/types/speedLimitStrategy'
import * as api from '@/api/torrents'
import { getTrackerDisplayName } from '@/utils/torrent'
import { useMediaQuery } from '@/utils/useMediaQuery'

const isMobile = useMediaQuery('(max-width: 768px)')
const dialogWidth = computed(() => (isMobile.value ? '95%' : '600px'))

const loading = ref(false)
const strategies = ref<SpeedLimitStrategy[]>([])
const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const saving = ref(false)
const applyingStrategy = ref<string | null>(null)
const formRef = ref<FormInstance>()
const currentEditId = ref<string>('')
const showImportDialog = ref(false)
const importData = ref('')

interface StrategyForm {
  name: string
  description: string
  downloadLimited: boolean
  downloadLimit: number
  downloadUnit: 'KB' | 'MB'
  uploadLimited: boolean
  uploadLimit: number
  uploadUnit: 'KB' | 'MB'
  trackers: string[]
}

const form = ref<StrategyForm>({
  name: '',
  description: '',
  downloadLimited: false,
  downloadLimit: 0,
  downloadUnit: 'KB',
  uploadLimited: false,
  uploadLimit: 0,
  uploadUnit: 'KB',
  trackers: [],
})

const formRules: FormRules = {
  name: [
    { required: true, message: '请输入策略名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' },
  ],
}

const trackerOptions = ref<Array<{ label: string; value: string }>>([])

// 加载所有种子，提取tracker选项
const loadTrackerOptions = async () => {
  try {
    const result = await api.getTorrents()
    const trackerMap = new Map<string, string>()
    result.torrents.forEach((torrent) => {
      torrent.trackers?.forEach((tracker) => {
        const displayName = getTrackerDisplayName(tracker.announce)
        trackerMap.set(displayName, displayName)
      })
    })
    trackerOptions.value = Array.from(trackerMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([displayName]) => ({ label: displayName, value: displayName }))
  } catch (error: any) {
    console.error('加载 Tracker 选项失败:', error)
  }
}

const loadStrategies = () => {
  loading.value = true
  try {
    strategies.value = strategyService.getAllStrategies()
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  form.value = {
    name: '',
    description: '',
    downloadLimited: false,
    downloadLimit: 0,
    downloadUnit: 'KB',
    uploadLimited: false,
    uploadLimit: 0,
    uploadUnit: 'KB',
    trackers: [],
  }
  formRef.value?.clearValidate()
}

const showCreateDialog = () => {
  dialogMode.value = 'create'
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (strategy: SpeedLimitStrategy) => {
  dialogMode.value = 'edit'
  currentEditId.value = strategy.id
  form.value = {
    name: strategy.name,
    description: strategy.description || '',
    downloadLimited: strategy.downloadLimited,
    downloadLimit: strategy.downloadLimit,
    downloadUnit: strategy.downloadUnit,
    uploadLimited: strategy.uploadLimited,
    uploadLimit: strategy.uploadLimit,
    uploadUnit: strategy.uploadUnit,
    trackers: [...strategy.trackers],
  }
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    saving.value = true
    try {
      if (dialogMode.value === 'create') {
        strategyService.createStrategy(form.value)
        ElMessage.success('策略创建成功')
      } else {
        strategyService.updateStrategy(currentEditId.value, form.value)
        ElMessage.success('策略更新成功')
      }
      dialogVisible.value = false
      loadStrategies()
    } catch (error: any) {
      ElMessage.error(`操作失败: ${error.message}`)
    } finally {
      saving.value = false
    }
  })
}

const handleDelete = async (strategy: SpeedLimitStrategy) => {
  try {
    await ElMessageBox.confirm(
      `确定删除策略 "${strategy.name}" 吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    const success = strategyService.deleteStrategy(strategy.id)
    if (success) {
      ElMessage.success('删除成功')
      loadStrategies()
    } else {
      ElMessage.error('删除失败')
    }
  } catch (error) {
    // 用户取消
  }
}

const handleApply = async (strategy: SpeedLimitStrategy) => {
  applyingStrategy.value = strategy.id
  try {
    // 获取所有种子
    const result = await api.getTorrents()
    let targetTorrents = result.torrents

    // 如果指定了tracker，则筛选
    if (strategy.trackers.length > 0) {
      targetTorrents = targetTorrents.filter((torrent) =>
        torrent.trackers?.some((tracker) => {
          const displayName = getTrackerDisplayName(tracker.announce)
          return strategy.trackers.includes(displayName)
        })
      )
    }

    if (targetTorrents.length === 0) {
      ElMessage.warning('没有匹配的种子')
      return
    }

    // 构建限速参数
    const payload: Record<string, any> = {
      downloadLimited: strategy.downloadLimited,
      uploadLimited: strategy.uploadLimited,
    }

    if (strategy.downloadLimited) {
      const downloadLimit =
        strategy.downloadUnit === 'MB'
          ? strategy.downloadLimit * 1024
          : strategy.downloadLimit
      payload.downloadLimit = Math.max(0, Math.round(downloadLimit))
    }

    if (strategy.uploadLimited) {
      const uploadLimit =
        strategy.uploadUnit === 'MB'
          ? strategy.uploadLimit * 1024
          : strategy.uploadLimit
      payload.uploadLimit = Math.max(0, Math.round(uploadLimit))
    }

    // 应用限速
    const targetIds = targetTorrents.map((t) => t.id)
    await api.setTorrents(targetIds, payload)

    ElMessage.success(
      `策略 "${strategy.name}" 已应用到 ${targetIds.length} 个种子`
    )
  } catch (error: any) {
    ElMessage.error(`应用策略失败: ${error.message}`)
  } finally {
    applyingStrategy.value = null
  }
}

const handleExport = () => {
  try {
    const data = strategyService.exportStrategies()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `speed_limit_strategies_${dayjs().format('YYYYMMDD_HHmmss')}.json`
    link.click()
    URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (error: any) {
    ElMessage.error(`导出失败: ${error.message}`)
  }
}

const handleImport = () => {
  if (!importData.value.trim()) {
    ElMessage.warning('请粘贴策略数据')
    return
  }

  try {
    const success = strategyService.importStrategies(importData.value)
    if (success) {
      ElMessage.success('导入成功')
      showImportDialog.value = false
      importData.value = ''
      loadStrategies()
    } else {
      ElMessage.error('导入失败：数据格式无效')
    }
  } catch (error: any) {
    ElMessage.error(`导入失败: ${error.message}`)
  }
}

const handleDialogClose = () => {
  resetForm()
  currentEditId.value = ''
}

const formatDate = (timestamp: number): string => {
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss')
}

onMounted(() => {
  loadStrategies()
  loadTrackerOptions()
})
</script>

<style scoped>
.strategy-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.actions-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.table-container {
  flex: 1;
  overflow: auto;
  background: #fff;
  border-radius: 6px;
}

.limit-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.limit-switch {
  flex-shrink: 0;
  width: 50px;
}

.limit-input {
  width: 120px;
}

.limit-unit-select {
  width: 80px;
}

.form-tip {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}

.text-muted {
  color: #909399;
}

@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .actions-group {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  }
}
</style>
