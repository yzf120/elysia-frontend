<template>
  <div class="wrong-book-page">
    <!-- 顶部导航栏 -->
    <van-nav-bar
      title="错题本"
      left-arrow
      @click-left="goBack"
      fixed
      placeholder
    >
      <template #right>
        <van-button
          type="primary"
          size="small"
          round
          @click="shareToClass"
          :disabled="selectedQuestions.length === 0"
        >
          分享至班级
        </van-button>
      </template>
    </van-nav-bar>

    <!-- Tab切换 -->
    <van-tabs v-model:active="activeTab" sticky offset-top="46px">
      <!-- 错题列表Tab -->
      <van-tab title="错题列表" name="list">
        <!-- 筛选栏 -->
        <div class="filter-bar">
          <van-dropdown-menu>
            <van-dropdown-item v-model="filterSubject" :options="subjectOptions" />
            <van-dropdown-item v-model="filterChapter" :options="chapterOptions" />
          </van-dropdown-menu>
        </div>

        <!-- 下拉刷新 -->
        <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
          <div v-if="wrongQuestions.length === 0" class="empty-state">
            <van-empty description="暂无错题记录" />
          </div>

          <!-- 错题列表 - 支持上拉加载 -->
          <van-list
            v-else
            v-model:loading="loading"
            :finished="finished"
            finished-text="没有更多了"
            @load="loadWrongQuestions"
          >
            <van-checkbox-group v-model="selectedQuestions">
              <div
                v-for="question in wrongQuestions"
                :key="question.id"
                class="question-card"
              >
                <div class="card-header">
                  <van-checkbox :name="question.id" />
                  <div class="question-info">
                    <van-tag :type="getSubjectColor(question.subject)" size="medium">
                      {{ question.subject }}
                    </van-tag>
                    <span class="chapter-tag">{{ question.chapter }}</span>
                  </div>
                </div>

                <div class="card-body" @click="viewQuestion(question)">
                  <h4>{{ question.title }}</h4>
                  <div class="question-preview" v-html="formatContent(question.content)"></div>
                  
                  <div class="question-meta">
                    <span>
                      <van-icon name="clock-o" />
                      {{ formatDate(question.wrongTime) }}
                    </span>
                    <span>
                      <van-icon name="replay" />
                      错误{{ question.wrongCount }}次
                    </span>
                  </div>
                </div>

                <div class="card-actions">
                  <van-button
                    size="small"
                    plain
                    type="primary"
                    @click="viewQuestion(question)"
                  >
                    查看详情
                  </van-button>
                  <van-button
                    size="small"
                    plain
                    type="danger"
                    @click="removeQuestion(question.id)"
                  >
                    移除
                  </van-button>
                </div>
              </div>
            </van-checkbox-group>
          </van-list>
        </van-pull-refresh>
      </van-tab>

      <!-- AI分析Tab -->
      <van-tab title="AI分析" name="analysis">
        <div class="analysis-content">
          <!-- 生成分析按钮 -->
          <div v-if="!analysisResult" class="generate-analysis">
            <van-empty description="点击下方按钮，AI将为您分析错题本">
              <van-icon name="chart-trending-o" size="80" color="#d3d3d3" />
            </van-empty>
            <van-button
              type="primary"
              size="large"
              round
              block
              :loading="analyzing"
              @click="generateAnalysis"
            >
              <van-icon name="fire-o" />
              生成AI分析
            </van-button>
          </div>

          <!-- 分析结果展示 -->
          <div v-else class="analysis-result">
            <!-- 总体统计 -->
            <div class="stats-card">
              <h3>错题统计</h3>
              <div class="stats-grid">
                <div class="stat-item">
                  <div class="stat-value">{{ analysisResult.totalCount }}</div>
                  <div class="stat-label">总错题数</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">{{ analysisResult.subjectCount }}</div>
                  <div class="stat-label">涉及科目</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">{{ analysisResult.avgWrongCount }}</div>
                  <div class="stat-label">平均错误次数</div>
                </div>
              </div>
            </div>

            <!-- 薄弱知识点 -->
            <div class="weak-points-card">
              <h3>薄弱知识点</h3>
              <van-cell-group inset>
                <van-cell
                  v-for="(point, index) in analysisResult.weakPoints"
                  :key="index"
                  :title="point.name"
                  :label="`错误${point.count}次`"
                >
                  <template #right-icon>
                    <van-tag type="danger">{{ point.percentage }}%</van-tag>
                  </template>
                </van-cell>
              </van-cell-group>
            </div>

            <!-- AI建议 -->
            <div class="suggestions-card">
              <h3>AI学习建议</h3>
              <div class="suggestion-content" v-html="formatContent(analysisResult.suggestions)"></div>
            </div>

            <!-- 操作按钮 -->
            <div class="analysis-actions">
              <van-button
                type="primary"
                size="large"
                round
                block
                @click="downloadAnalysis"
              >
                <van-icon name="down" />
                下载分析报告
              </van-button>
              <van-button
                type="default"
                size="large"
                round
                block
                @click="regenerateAnalysis"
              >
                <van-icon name="replay" />
                重新生成
              </van-button>
            </div>
          </div>
        </div>
      </van-tab>
    </van-tabs>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'

const router = useRouter()

// 当前Tab
const activeTab = ref('list')

// 筛选条件
const filterSubject = ref('all')
const filterChapter = ref('all')

const subjectOptions = [
  { text: '全部科目', value: 'all' },
  { text: '数据结构', value: '数据结构' },
  { text: '算法设计', value: '算法设计' },
  { text: '操作系统', value: '操作系统' }
]

const chapterOptions = [
  { text: '全部章节', value: 'all' },
  { text: '第一章', value: '第一章' },
  { text: '第二章', value: '第二章' },
  { text: '第三章', value: '第三章' }
]

// 错题列表数据
const wrongQuestions = ref([])
const selectedQuestions = ref([])
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)
const page = ref(1)

// AI分析数据
const analysisResult = ref(null)
const analyzing = ref(false)

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`

  return `${date.getMonth() + 1}-${date.getDate()}`
}

// 获取科目颜色
const getSubjectColor = (subject) => {
  const colorMap = {
    '数据结构': 'primary',
    '算法设计': 'success',
    '操作系统': 'warning'
  }
  return colorMap[subject] || 'default'
}

// 格式化内容
const formatContent = (content) => {
  if (!content) return ''
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>')
    .substring(0, 100) + (content.length > 100 ? '...' : '')
}

// 下拉刷新
const onRefresh = async () => {
  page.value = 1
  finished.value = false
  await loadWrongQuestions()
  refreshing.value = false
  showToast('刷新成功')
}

// 加载错题列表
const loadWrongQuestions = async () => {
  if (finished.value) return

  loading.value = true

  try {
    // TODO: 调用API获取错题列表
    await new Promise(resolve => setTimeout(resolve, 500))

    const mockData = [
      {
        id: 1,
        subject: '数据结构',
        chapter: '第三章',
        title: '快速排序算法实现',
        content: '请实现快速排序算法，并分析其时间复杂度。要求：1. 使用递归实现 2. 优化基准元素选择',
        wrongTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        wrongCount: 2
      },
      {
        id: 2,
        subject: '算法设计',
        chapter: '第二章',
        title: '动态规划问题',
        content: '使用动态规划解决背包问题，给定n个物品和一个容量为W的背包...',
        wrongTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        wrongCount: 3
      },
      {
        id: 3,
        subject: '操作系统',
        chapter: '第四章',
        title: '进程调度算法',
        content: '比较先来先服务(FCFS)、短作业优先(SJF)和时间片轮转(RR)三种调度算法的优缺点...',
        wrongTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        wrongCount: 1
      }
    ]

    if (page.value === 1) {
      wrongQuestions.value = mockData
    } else {
      wrongQuestions.value = [...wrongQuestions.value, ...mockData]
    }

    // 模拟没有更多数据
    if (page.value >= 1) {
      finished.value = true
    } else {
      page.value++
    }
  } catch (error) {
    console.error('加载错题列表失败:', error)
    showToast('加载失败')
  } finally {
    loading.value = false
  }
}

// 查看题目详情
const viewQuestion = (question) => {
  router.push({
    path: '/student/task-complete',
    query: { id: question.id, type: '错题', from: 'wrong-book' }
  })
}

// 移除错题
const removeQuestion = async (id) => {
  try {
    await showConfirmDialog({
      title: '确认移除',
      message: '确定要从错题本中移除这道题吗？'
    })

    // TODO: 调用API移除错题
    wrongQuestions.value = wrongQuestions.value.filter(q => q.id !== id)
    showToast('已移除')
  } catch {
    // 用户取消
  }
}

// 分享至班级
const shareToClass = async () => {
  if (selectedQuestions.value.length === 0) {
    showToast('请先选择要分享的错题')
    return
  }

  try {
    await showConfirmDialog({
      title: '分享至班级',
      message: `确定要分享选中的${selectedQuestions.value.length}道错题到班级吗？`
    })

    // TODO: 调用API分享错题
    await new Promise(resolve => setTimeout(resolve, 500))

    showToast('分享成功')
    selectedQuestions.value = []
  } catch {
    // 用户取消
  }
}

// 生成AI分析
const generateAnalysis = async () => {
  if (wrongQuestions.value.length === 0) {
    showToast('错题本为空，无法生成分析')
    return
  }

  analyzing.value = true

  try {
    // TODO: 调用AI API生成分析
    await new Promise(resolve => setTimeout(resolve, 2000))

    analysisResult.value = {
      totalCount: wrongQuestions.value.length,
      subjectCount: 3,
      avgWrongCount: 2,
      weakPoints: [
        { name: '快速排序算法', count: 5, percentage: 35 },
        { name: '动态规划', count: 4, percentage: 28 },
        { name: '进程调度', count: 3, percentage: 21 }
      ],
      suggestions: `根据您的错题分析，建议您：\n\n1. **加强算法基础**：快速排序和动态规划是您的薄弱环节，建议系统复习相关知识点。\n\n2. **多做练习**：通过大量练习巩固算法思想，特别是递归和分治的应用。\n\n3. **理解原理**：不要死记硬背，要理解算法的核心思想和适用场景。\n\n4. **总结归纳**：建立知识体系，将相似的算法进行对比学习。`
    }

    showToast('分析生成成功')
  } catch (error) {
    console.error('生成分析失败:', error)
    showToast('生成失败')
  } finally {
    analyzing.value = false
  }
}

// 重新生成分析
const regenerateAnalysis = async () => {
  analysisResult.value = null
  await generateAnalysis()
}

// 下载分析报告
const downloadAnalysis = () => {
  if (!analysisResult.value) return

  let content = '# 错题本分析报告\n\n'
  content += `## 总体统计\n\n`
  content += `- 总错题数：${analysisResult.value.totalCount}\n`
  content += `- 涉及科目：${analysisResult.value.subjectCount}\n`
  content += `- 平均错误次数：${analysisResult.value.avgWrongCount}\n\n`
  content += `## 薄弱知识点\n\n`
  analysisResult.value.weakPoints.forEach((point, index) => {
    content += `${index + 1}. ${point.name}（错误${point.count}次，占比${point.percentage}%）\n`
  })
  content += `\n## AI学习建议\n\n${analysisResult.value.suggestions}\n`

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `错题分析报告_${new Date().toISOString().split('T')[0]}.md`
  link.click()
  URL.revokeObjectURL(url)

  showToast('下载成功')
}

// 返回
const goBack = () => {
  router.back()
}

// 页面加载
onMounted(() => {
  loadWrongQuestions()
})
</script>

<style scoped>
.wrong-book-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 20px;
}

/* 筛选栏 */
.filter-bar {
  background: white;
  border-bottom: 1px solid #ebedf0;
}

/* 空状态 */
.empty-state {
  padding: 60px 20px;
  text-align: center;
}

/* 错题卡片 */
.question-card {
  background: white;
  margin: 12px;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.question-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.chapter-tag {
  font-size: 12px;
  color: #909399;
}

.card-body {
  margin-bottom: 12px;
  /* 触摸反馈 */
  active-opacity: 0.7;
}

.card-body h4 {
  margin: 0 0 8px 0;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.question-preview {
  font-size: 13px;
  line-height: 1.6;
  color: #606266;
  margin-bottom: 12px;
}

.question-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #909399;
}

.question-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.card-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

/* AI分析内容 */
.analysis-content {
  padding: 16px;
}

.generate-analysis {
  text-align: center;
  padding: 40px 20px;
}

.generate-analysis .van-button {
  margin-top: 20px;
}

/* 分析结果 */
.analysis-result {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stats-card,
.weak-points-card,
.suggestions-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.stats-card h3,
.weak-points-card h3,
.suggestions-card h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #409eff;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.suggestion-content {
  font-size: 14px;
  line-height: 1.8;
  color: #606266;
}

.suggestion-content :deep(strong) {
  font-weight: 600;
  color: #303133;
}

.analysis-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
}
</style>
