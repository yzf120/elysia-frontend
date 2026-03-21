<template>
  <div class="code-review-page">
    <van-nav-bar
      title="AI代码审核"
      left-arrow
      @click-left="$router.back()"
    />

    <van-tabs v-model:active="activeTab" sticky>
      <!-- 待审核 -->
      <van-tab title="待审核" name="pending">
        <div class="tab-content">
          <van-loading v-if="pendingLoading" type="spinner" color="#4F6EF7" class="loading-center" />
          <van-empty v-else-if="pendingList.length === 0" description="暂无待审核作业" />
          <div v-else class="review-list">
            <div
              v-for="item in pendingList"
              :key="item.id"
              class="review-card"
              @click="openReview(item)"
            >
              <div class="review-header">
                <span class="task-title">{{ item.taskTitle }}</span>
                <van-tag type="warning">待审核</van-tag>
              </div>
              <div class="review-meta">
                <span>👤 {{ item.studentName }}</span>
                <span>🏫 {{ item.className }}</span>
              </div>
              <div class="review-meta">
                <span>📁 {{ item.fileName }}</span>
                <span>🕐 {{ formatDate(item.submitTime) }}</span>
              </div>
            </div>
          </div>
        </div>
      </van-tab>

      <!-- 已审核 -->
      <van-tab title="已审核" name="reviewed">
        <div class="tab-content">
          <van-loading v-if="reviewedLoading" type="spinner" color="#4F6EF7" class="loading-center" />
          <van-empty v-else-if="reviewedList.length === 0" description="暂无已审核记录" />
          <div v-else class="review-list">
            <div
              v-for="item in reviewedList"
              :key="item.id"
              class="review-card"
              @click="openReview(item)"
            >
              <div class="review-header">
                <span class="task-title">{{ item.taskTitle }}</span>
                <span :class="getScoreClass(item.score)" class="score-badge">{{ item.score }}分</span>
              </div>
              <div class="review-meta">
                <span>👤 {{ item.studentName }}</span>
                <span>🏫 {{ item.className }}</span>
              </div>
              <div class="review-meta">
                <span>🕐 {{ formatDate(item.reviewTime) }}</span>
              </div>
            </div>
          </div>
        </div>
      </van-tab>
    </van-tabs>

    <!-- 审核详情弹窗 -->
    <van-popup
      v-model:show="showReviewPopup"
      position="bottom"
      round
      :style="{ height: '85%' }"
    >
      <div class="review-popup">
        <div class="popup-header">
          <span class="popup-title">代码审核</span>
          <van-icon name="cross" @click="showReviewPopup = false" />
        </div>

        <div class="popup-body">
          <!-- 代码展示 -->
          <div class="code-block">
            <div class="block-title">学生代码</div>
            <pre class="code-pre">{{ currentCode }}</pre>
          </div>

          <!-- AI批改结果 -->
          <div v-if="aiResult.score > 0" class="ai-result-block">
            <div class="block-title">AI批改结果</div>
            <div class="score-row">
              <span class="score-label">预估分数：</span>
              <span class="score-value">{{ aiResult.score }}</span>
            </div>
            <div v-if="aiResult.errors.length" class="error-list">
              <div class="sub-title">错误点：</div>
              <div v-for="(e, i) in aiResult.errors" :key="i" class="error-item">• {{ e }}</div>
            </div>
            <div v-if="aiResult.suggestions.length" class="suggestion-list">
              <div class="sub-title">修改建议：</div>
              <div v-for="(s, i) in aiResult.suggestions" :key="i" class="suggestion-item">{{ i + 1 }}. {{ s }}</div>
            </div>
          </div>

          <!-- 手动调整 -->
          <div class="manual-block">
            <div class="block-title">手动调整</div>
            <van-cell-group inset>
              <van-field
                v-model="reviewForm.score"
                label="最终分数"
                type="number"
                placeholder="0-100"
              />
              <van-field
                v-model="reviewForm.comment"
                label="修改意见"
                type="textarea"
                rows="3"
                autosize
                placeholder="请输入修改意见"
              />
            </van-cell-group>
          </div>
        </div>

        <div class="popup-footer">
          <van-button type="primary" block round :loading="submittingReview" @click="submitReview">
            提交审核
          </van-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { showToast } from 'vant'

const activeTab = ref('pending')
const pendingList = ref([])
const reviewedList = ref([])
const pendingLoading = ref(false)
const reviewedLoading = ref(false)

const showReviewPopup = ref(false)
const currentCode = ref('')
const aiResult = ref({ score: 0, errors: [], suggestions: [] })
const reviewForm = ref({ score: 0, comment: '' })
const submittingReview = ref(false)
const currentItem = ref(null)

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const getScoreClass = (score) => {
  if (score >= 90) return 'score-excellent'
  if (score >= 80) return 'score-good'
  if (score >= 60) return 'score-pass'
  return 'score-fail'
}

const loadPendingList = async () => {
  pendingLoading.value = true
  try {
    // TODO: 调用API获取待审核列表
    pendingList.value = [
      { id: 1, className: 'Python编程班', studentName: '张三', taskTitle: '第三章课后习题', fileName: 'homework3.py', submitTime: new Date(Date.now() - 7200000).toISOString() },
      { id: 2, className: 'Python编程班', studentName: '李四', taskTitle: '第三章课后习题', fileName: 'homework3.py', submitTime: new Date(Date.now() - 18000000).toISOString() }
    ]
  } catch {
    showToast({ type: 'fail', message: '加载失败' })
  } finally {
    pendingLoading.value = false
  }
}

const loadReviewedList = async () => {
  reviewedLoading.value = true
  try {
    // TODO: 调用API获取已审核列表
    reviewedList.value = [
      { id: 3, className: 'Python编程班', studentName: '王五', taskTitle: '第二章课后习题', score: 92, reviewTime: new Date(Date.now() - 86400000).toISOString() }
    ]
  } catch {
    showToast({ type: 'fail', message: '加载失败' })
  } finally {
    reviewedLoading.value = false
  }
}

const openReview = async (item) => {
  currentItem.value = item
  showReviewPopup.value = true
  // 模拟加载代码和AI批改
  currentCode.value = `def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)\n\nfor i in range(10):\n    print(fibonacci(i))`
  aiResult.value = {
    score: item.score || 85,
    errors: ['缺少输入参数验证', '递归实现效率较低'],
    suggestions: ['建议添加参数类型检查', '可使用动态规划优化效率']
  }
  reviewForm.value = { score: aiResult.value.score, comment: aiResult.value.suggestions.join('\n') }
}

const submitReview = async () => {
  submittingReview.value = true
  try {
    // TODO: 调用API提交审核结果
    await new Promise(r => setTimeout(r, 800))
    showToast({ type: 'success', message: '审核提交成功' })
    showReviewPopup.value = false
    loadPendingList()
    loadReviewedList()
  } catch {
    showToast({ type: 'fail', message: '提交失败' })
  } finally {
    submittingReview.value = false
  }
}

onMounted(() => {
  loadPendingList()
  loadReviewedList()
})
</script>

<style scoped>
.code-review-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 24px;
}

.tab-content {
  padding: 12px 16px;
}

.loading-center {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}

.review-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.review-card {
  background: #fff;
  border-radius: 12px;
  padding: 14px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.task-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  flex: 1;
  margin-right: 8px;
}

.review-meta {
  display: flex;
  gap: 14px;
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.score-badge {
  font-size: 14px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 12px;
}

.score-excellent { color: #52c41a; }
.score-good { color: #1890ff; }
.score-pass { color: #faad14; }
.score-fail { color: #ff4d4f; }

/* 弹窗 */
.review-popup {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.popup-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.popup-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
}

.popup-footer {
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
}

.code-block, .ai-result-block, .manual-block {
  background: #fff;
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 12px;
}

.block-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
}

.code-pre {
  background: #1e1e1e;
  color: #d4d4d4;
  border-radius: 8px;
  padding: 12px;
  font-size: 12px;
  line-height: 1.6;
  overflow-x: auto;
  white-space: pre;
  margin: 0;
}

.score-row {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.score-label { font-size: 14px; color: #666; }
.score-value { font-size: 28px; font-weight: 700; color: #4F6EF7; margin-left: 8px; }

.sub-title { font-size: 13px; font-weight: 600; color: #555; margin-bottom: 6px; }
.error-item { font-size: 13px; color: #ff4d4f; margin-bottom: 4px; }
.suggestion-item { font-size: 13px; color: #555; margin-bottom: 4px; line-height: 1.6; }
</style>
