<template>
  <div class="admin-layout">
    <AdminSidebar :active-menu="activeMenu" />

    <div class="admin-main">
      <el-header class="admin-header" height="60px">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/admin/dashboard' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item>意图记录与统计</el-breadcrumb-item>
        </el-breadcrumb>
        <div class="header-actions">
          <el-button @click="$router.push('/admin/dashboard')">
            <el-icon><Back /></el-icon>
            返回首页
          </el-button>
          <el-button type="primary" @click="$router.push('/admin/profile')">
            <el-icon><User /></el-icon>
            我的
          </el-button>
        </div>
      </el-header>

      <div class="admin-content">
        <div class="page-container fade-in">
          <el-tabs v-model="activeTab" type="border-card" class="custom-tabs">
            <!-- 意图记录 Tab -->
            <el-tab-pane label="意图记录" name="records">
              <div class="page-header">
                <h3 class="page-title">用户意图记录</h3>
                <p class="page-subtitle">查看用户每次请求的意图识别结果、原始请求和改写后的标准化请求</p>
              </div>

              <div class="table-toolbar">
                <div class="toolbar-left">
                  <el-input v-model="searchUserId" placeholder="搜索用户ID" clearable prefix-icon="Search" style="width: 180px;" @clear="loadRecords" @keyup.enter="loadRecords" />
                  <el-select v-model="searchIntentLevel1" placeholder="一级意图" clearable style="width: 140px;" @change="loadRecords">
                    <el-option label="解题相关" value="解题相关" />
                    <el-option label="知识答疑" value="知识答疑" />
                    <el-option label="操作交互控制" value="操作交互控制" />
                    <el-option label="无关兜底" value="无关兜底" />
                  </el-select>
                  <el-select v-model="searchIntentCode" placeholder="意图编码" clearable style="width: 200px;" @change="loadRecords">
                    <el-option v-for="dict in intentDicts" :key="dict.intent_code" :label="`${dict.intent_level2} (${dict.intent_code})`" :value="dict.intent_code" />
                  </el-select>
                </div>
                <div class="toolbar-right">
                  <el-button @click="loadRecords">
                    <el-icon><Refresh /></el-icon>
                    刷新
                  </el-button>
                </div>
              </div>

              <el-table :data="recordList" v-loading="recordLoading" style="width: 100%" class="clean-table">
                <el-table-column prop="id" label="ID" width="70" />
                <el-table-column prop="user_id" label="用户ID" width="100" show-overflow-tooltip />
                <el-table-column prop="question_id" label="题目ID" width="80" />
                <el-table-column prop="original_request" label="原始请求" min-width="200" show-overflow-tooltip />
                <el-table-column prop="intent_code" label="意图编码" width="160">
                  <template #default="{ row }">
                    <span class="code-badge">{{ row.intent_code }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="intent_level1" label="一级意图" width="110">
                  <template #default="{ row }">
                    <el-tag :type="getLevel1TagType(row.intent_level1)" size="small" effect="light" round>{{ row.intent_level1 }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="rewritten_request" label="改写后请求" min-width="200" show-overflow-tooltip />
                <el-table-column prop="intent_confidence" label="置信度" width="80">
                  <template #default="{ row }">
                    <span class="confidence-value" :class="{ high: row.intent_confidence >= 90, medium: row.intent_confidence >= 70 && row.intent_confidence < 90, low: row.intent_confidence < 70 }">
                      {{ row.intent_confidence }}%
                    </span>
                  </template>
                </el-table-column>
                <el-table-column prop="response_time_ms" label="耗时" width="80">
                  <template #default="{ row }">
                    <span style="color: var(--text-secondary); font-size: 13px;">{{ row.response_time_ms || '-' }}ms</span>
                  </template>
                </el-table-column>
                <el-table-column prop="recognize_status" label="状态" width="70">
                  <template #default="{ row }">
                    <el-tag :type="row.recognize_status === 1 ? 'success' : row.recognize_status === 2 ? 'warning' : 'danger'" size="small" effect="light" round>
                      {{ row.recognize_status === 1 ? '成功' : row.recognize_status === 2 ? '降级' : '失败' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="create_time" label="时间" width="160" />
              </el-table>

              <div class="table-footer">
                <span class="table-total">共 {{ recordTotal }} 条</span>
                <el-pagination v-model:current-page="recordPage" :page-size="recordPageSize" :total="recordTotal" layout="prev, pager, next" @current-change="loadRecords" small />
              </div>
            </el-tab-pane>

            <!-- 意图统计 Tab -->
            <el-tab-pane label="意图统计" name="stats">
              <div class="page-header">
                <h3 class="page-title">意图调用统计</h3>
                <p class="page-subtitle">各意图编码的调用频次统计，帮助了解用户意图分布</p>
              </div>

              <div class="intent-stats-grid" v-loading="statsLoading">
                <div class="intent-stat-card" v-for="(count, code) in intentStats" :key="code">
                  <div class="intent-stat-header">
                    <span class="intent-stat-icon">🎯</span>
                    <span class="intent-stat-code">{{ code }}</span>
                  </div>
                  <div class="intent-stat-divider"></div>
                  <div class="intent-stat-body">
                    <span class="intent-stat-count">{{ count }}</span>
                    <span class="intent-stat-unit">次调用</span>
                  </div>
                </div>
                <div v-if="Object.keys(intentStats).length === 0" class="empty-stats">
                  <div style="font-size: 40px; margin-bottom: 12px;">📊</div>
                  <div>暂无统计数据</div>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AdminSidebar from '@/components/admin/AdminSidebar.vue'
import { ElMessage } from 'element-plus'
import { adminAPI } from '@/services'

const router = useRouter()
const activeMenu = computed(() => router.currentRoute.value.path)
const activeTab = ref('records')

// 意图字典（用于过滤下拉）
const intentDicts = ref([])

// 记录列表
const recordList = ref([])
const recordLoading = ref(false)
const recordPage = ref(1)
const recordPageSize = ref(20)
const recordTotal = ref(0)
const searchUserId = ref('')
const searchIntentLevel1 = ref('')
const searchIntentCode = ref('')

// 统计
const intentStats = ref({})
const statsLoading = ref(false)

const getLevel1TagType = (level1) => {
  const map = { '解题相关': 'primary', '知识答疑': 'success', '操作交互控制': 'warning', '无关兜底': 'info' }
  return map[level1] || 'info'
}

const loadIntentDicts = async () => {
  try {
    const res = await adminAPI.listIntentDicts({ page: 1, page_size: 100, is_valid: 1 })
    intentDicts.value = res.data?.list || []
  } catch (error) {
    console.error('加载意图字典失败:', error)
  }
}

const loadRecords = async () => {
  recordLoading.value = true
  try {
    const params = { page: recordPage.value, page_size: recordPageSize.value }
    if (searchUserId.value) params.user_id = searchUserId.value
    if (searchIntentLevel1.value) params.intent_level1 = searchIntentLevel1.value
    if (searchIntentCode.value) params.intent_code = searchIntentCode.value
    const res = await adminAPI.listIntentRecords(params)
    recordList.value = res.data?.list || []
    recordTotal.value = res.data?.total || 0
  } catch (error) {
    ElMessage.error('加载意图记录失败: ' + error)
  } finally {
    recordLoading.value = false
  }
}

const loadStats = async () => {
  statsLoading.value = true
  try {
    const res = await adminAPI.getIntentStats()
    intentStats.value = res.data?.intent_count || {}
  } catch (error) {
    ElMessage.error('加载统计数据失败: ' + error)
  } finally {
    statsLoading.value = false
  }
}

onMounted(() => {
  loadIntentDicts()
  loadRecords()
  loadStats()
})
</script>

<style scoped>
@import '@/styles/admin.css';

.custom-tabs :deep(.el-tabs__header) {
  background: #FAFBFC;
  border-radius: 8px 8px 0 0;
}

.custom-tabs :deep(.el-tabs__item.is-active) {
  font-weight: 600;
}

.code-badge {
  display: inline-block;
  background: #EEF3FF;
  color: #4F6EF7;
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-family: 'SF Mono', 'Monaco', 'Menlo', monospace;
  font-weight: 500;
}

.confidence-value {
  font-weight: 600;
  font-size: 13px;
}
.confidence-value.high { color: #22C55E; }
.confidence-value.medium { color: #F59E0B; }
.confidence-value.low { color: #EF4444; }

.clean-table {
  --el-table-border: none;
}

.table-footer {
  margin-top: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-total {
  font-size: 13px;
  color: var(--text-secondary);
}

/* 统计卡片网格 */
intent-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.intent-stat-card {
  background: var(--bg-white);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid var(--border-light);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
}

.intent-stat-card:hover {
  box-shadow: 0 10px 24px rgba(79, 110, 247, 0.12);
  border-color: rgba(79, 110, 247, 0.18);
  transform: translateY(-2px);
}

.intent-stat-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.intent-stat-icon {
  font-size: 22px;
}

.intent-stat-code {
  font-size: 13px;
  color: var(--text-secondary);
  font-family: 'SF Mono', 'Monaco', 'Menlo', monospace;
}

.intent-stat-divider {
  height: 1px;
  background: var(--border-lighter);
  margin: 14px 0;
}

.intent-stat-body {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.intent-stat-count {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}

.intent-stat-unit {
  font-size: 13px;
  color: var(--text-secondary);
}

.empty-stats {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);
  font-size: 15px;
}
</style>