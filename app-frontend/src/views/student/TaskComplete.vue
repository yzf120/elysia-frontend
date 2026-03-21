<template>
  <div class="task-complete-page">
    <!-- 顶部导航栏 -->
    <van-nav-bar
      :title="taskTitle"
      left-arrow
      @click-left="goBack"
      fixed
      placeholder
    />

    <!-- 任务信息提示栏 -->
    <div class="task-info-bar">
      <van-tag :type="getTaskTypeColor(taskType)" size="large">{{ taskType }}</van-tag>
      <span class="deadline-info" :class="{ urgent: isUrgent }">
        <van-icon name="clock-o" />
        {{ deadlineText }}
      </span>
    </div>

    <!-- Tab切换 - 移动端适配 -->
    <van-tabs v-model:active="activeTab" sticky offset-top="46px">
      <!-- 题目展示Tab -->
      <van-tab title="题目展示" name="question">
        <div class="question-content">
          <div class="question-header">
            <h3>{{ taskData.title }}</h3>
            <div class="question-meta">
              <span><van-icon name="notes-o" /> {{ taskData.subject }}</span>
              <span><van-icon name="user-o" /> {{ taskData.teacher }}</span>
            </div>
          </div>

          <div class="question-body">
            <div class="question-text" v-html="formatContent(taskData.content)"></div>
            
            <!-- 图片展示 - 支持手势缩放 -->
            <div v-if="taskData.images && taskData.images.length > 0" class="question-images">
              <van-image
                v-for="(img, index) in taskData.images"
                :key="index"
                :src="img"
                fit="contain"
                @click="previewImage(index)"
              />
            </div>

            <!-- 附件列表 -->
            <div v-if="taskData.attachments && taskData.attachments.length > 0" class="attachments">
              <h4>附件</h4>
              <van-cell
                v-for="(file, index) in taskData.attachments"
                :key="index"
                :title="file.name"
                :label="`大小: ${formatFileSize(file.size)}`"
                is-link
                @click="downloadFile(file)"
              >
                <template #icon>
                  <van-icon name="description" size="20" />
                </template>
              </van-cell>
            </div>
          </div>
        </div>
      </van-tab>

      <!-- 答题区Tab -->
      <van-tab title="答题区" name="answer">
        <div class="answer-content">
          <!-- 答题提示 -->
          <div class="answer-tips">
            <van-notice-bar
              left-icon="info-o"
              :text="getAnswerTips()"
            />
          </div>

          <!-- 答题输入框 - 移动端适配 -->
          <van-field
            v-model="answerText"
            type="textarea"
            rows="10"
            autosize
            placeholder="请在此输入您的答案..."
            :disabled="isSubmitted"
            show-word-limit
            :maxlength="5000"
          />

          <!-- 图片上传 -->
          <div class="answer-upload">
            <h4>上传图片（可选）</h4>
            <van-uploader
              v-model="answerImages"
              multiple
              :max-count="9"
              :after-read="handleImageUpload"
              :disabled="isSubmitted"
            />
          </div>

          <!-- 操作按钮 - 移动端适配 -->
          <div class="answer-actions">
            <van-button
              type="default"
              size="large"
              round
              :disabled="isSubmitted"
              @click="saveDraft"
            >
              <van-icon name="bookmark-o" />
              保存草稿
            </van-button>
            <van-button
              type="primary"
              size="large"
              round
              :disabled="isSubmitted || !answerText.trim()"
              :loading="submitting"
              @click="submitAnswer"
            >
              <van-icon name="success" />
              提交答案
            </van-button>
          </div>

          <!-- 已提交提示 -->
          <div v-if="isSubmitted" class="submitted-notice">
            <van-empty
              image="success"
              description="您已提交答案"
            >
              <van-button type="primary" round @click="viewSubmission">查看提交记录</van-button>
            </van-empty>
          </div>
        </div>
      </van-tab>
    </van-tabs>

    <!-- AI问询悬浮按钮 -->
    <van-floating-bubble
      v-if="!isSubmitted"
      axis="xy"
      icon="chat-o"
      @click="askAI"
      :style="{ background: 'linear-gradient(135deg, #4F6EF7 0%, #7CB8FF 100%)' }"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast, showConfirmDialog, showImagePreview } from 'vant'

const router = useRouter()
const route = useRoute()

// 当前Tab
const activeTab = ref('question')

// 任务数据
const taskData = ref({
  id: null,
  title: '',
  type: '',
  subject: '',
  teacher: '',
  content: '',
  deadline: '',
  images: [],
  attachments: []
})

// 答题数据
const answerText = ref('')
const answerImages = ref([])
const isSubmitted = ref(false)
const submitting = ref(false)

// 任务类型和标题
const taskType = computed(() => taskData.value.type || '作业')
const taskTitle = computed(() => taskData.value.title || '任务详情')

// 截止时间文本
const deadlineText = computed(() => {
  if (!taskData.value.deadline) return ''
  const deadline = new Date(taskData.value.deadline)
  const now = new Date()
  const diff = deadline - now

  if (diff < 0) return '已截止'
  if (diff < 24 * 60 * 60 * 1000) return '今天截止'
  if (diff < 48 * 60 * 60 * 1000) return '明天截止'
  return `${Math.floor(diff / (24 * 60 * 60 * 1000))}天后截止`
})

// 是否紧急
const isUrgent = computed(() => {
  if (!taskData.value.deadline) return false
  const deadline = new Date(taskData.value.deadline)
  const now = new Date()
  const diff = deadline - now
  return diff > 0 && diff < 24 * 60 * 60 * 1000
})

// 获取任务类型颜色
const getTaskTypeColor = (type) => {
  const colorMap = {
    '讨论': 'primary',
    '作业': 'success',
    '考试': 'danger'
  }
  return colorMap[type] || 'default'
}

// 格式化内容（支持简单的Markdown）
const formatContent = (content) => {
  if (!content) return ''
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>')
}

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

// 获取答题提示
const getAnswerTips = () => {
  const tips = {
    '讨论': '请认真思考并发表您的观点，可以引用相关资料支持您的论述。',
    '作业': '请按照题目要求完成作业，注意格式规范和答题完整性。',
    '考试': '请独立完成考试，注意时间限制，提交后不可修改。'
  }
  return tips[taskType.value] || '请认真完成任务。'
}

// 预览图片
const previewImage = (index) => {
  showImagePreview({
    images: taskData.value.images,
    startPosition: index,
    closeable: true
  })
}

// 下载文件
const downloadFile = (file) => {
  showToast('开始下载...')
  // TODO: 实现文件下载
  window.open(file.url, '_blank')
}

// 处理图片上传
const handleImageUpload = (file) => {
  showToast('图片上传中...')
  // TODO: 上传图片到服务器
  console.log('上传图片:', file)
}

// 保存草稿
const saveDraft = async () => {
  if (!answerText.value.trim()) {
    showToast('请先输入答案内容')
    return
  }

  try {
    // TODO: 调用API保存草稿
    await new Promise(resolve => setTimeout(resolve, 500))
    showToast('草稿已保存')
  } catch (error) {
    console.error('保存草稿失败:', error)
    showToast('保存失败')
  }
}

// 提交答案
const submitAnswer = async () => {
  if (!answerText.value.trim()) {
    showToast('请先输入答案内容')
    return
  }

  try {
    await showConfirmDialog({
      title: '确认提交',
      message: taskType.value === '考试' 
        ? '考试提交后不可修改，确定要提交吗？' 
        : '确定要提交答案吗？'
    })

    submitting.value = true

    // TODO: 调用API提交答案
    await new Promise(resolve => setTimeout(resolve, 1000))

    isSubmitted.value = true
    showToast({
      type: 'success',
      message: '提交成功'
    })

    // 延迟跳转回首页
    setTimeout(() => {
      router.push('/student/dashboard')
    }, 1500)
  } catch {
    // 用户取消
  } finally {
    submitting.value = false
  }
}

// 查看提交记录
const viewSubmission = () => {
  showToast('查看提交记录')
  // TODO: 跳转到提交记录页面
}

// AI问询
const askAI = () => {
  const question = `请帮我分析这道题目：\n\n${taskData.value.title}\n\n${taskData.value.content}`
  router.push({
    path: '/student/ai-chat',
    query: { question }
  })
}

// 返回
const goBack = () => {
  if (answerText.value.trim() && !isSubmitted.value) {
    showConfirmDialog({
      title: '提示',
      message: '您有未保存的答案，确定要离开吗？'
    }).then(() => {
      router.back()
    }).catch(() => {
      // 取消
    })
  } else {
    router.back()
  }
}

// 加载任务数据
const loadTaskData = async () => {
  try {
    const taskId = route.query.id
    const type = route.query.type

    // TODO: 调用API获取任务详情
    await new Promise(resolve => setTimeout(resolve, 500))

    // 模拟数据
    taskData.value = {
      id: taskId,
      title: '第三章课后习题',
      type: type || '作业',
      subject: '数据结构',
      teacher: '张老师',
      content: '请完成以下题目：\n\n1. 请解释快速排序算法的基本原理。\n2. 分析快速排序的时间复杂度和空间复杂度。\n3. 实现快速排序算法（使用任意编程语言）。',
      deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      images: [],
      attachments: [
        {
          name: '参考资料.pdf',
          size: 1024 * 1024 * 2.5,
          url: 'https://example.com/file.pdf'
        }
      ]
    }

    // 加载草稿
    loadDraft()
  } catch (error) {
    console.error('加载任务数据失败:', error)
    showToast('加载失败')
  }
}

// 加载草稿
const loadDraft = async () => {
  try {
    // TODO: 调用API加载草稿
    // answerText.value = draft.content
    // answerImages.value = draft.images
  } catch (error) {
    console.error('加载草稿失败:', error)
  }
}

// 页面加载
onMounted(() => {
  loadTaskData()
})
</script>

<style scoped>
.task-complete-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 20px;
}

/* 任务信息提示栏 */
.task-info-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #ebedf0;
}

.deadline-info {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #606266;
}

.deadline-info.urgent {
  color: #f56c6c;
  font-weight: 600;
}

/* 题目内容区 */
.question-content {
  padding: 16px;
}

.question-header {
  background: white;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.question-header h3 {
  margin: 0 0 12px 0;
  font-size: 17px;
  font-weight: 600;
  color: #303133;
}

.question-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #909399;
}

.question-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.question-body {
  background: white;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.question-text {
  font-size: 15px;
  line-height: 1.8;
  color: #303133;
  margin-bottom: 16px;
}

.question-text :deep(strong) {
  font-weight: 600;
  color: #409eff;
}

/* 图片展示 */
.question-images {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 8px;
  margin-bottom: 16px;
}

.question-images :deep(.van-image) {
  border-radius: 8px;
  overflow: hidden;
}

/* 附件列表 */
.attachments {
  margin-top: 16px;
}

.attachments h4 {
  margin: 0 0 12px 0;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

/* 答题区 */
.answer-content {
  padding: 16px;
}

.answer-tips {
  margin-bottom: 16px;
}

.answer-upload {
  background: white;
  padding: 16px;
  border-radius: 12px;
  margin: 16px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.answer-upload h4 {
  margin: 0 0 12px 0;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

/* 操作按钮 */
.answer-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.answer-actions .van-button {
  flex: 1;
}

/* 已提交提示 */
.submitted-notice {
  margin-top: 40px;
}

/* 悬浮按钮位置调整 */
:deep(.van-floating-bubble) {
  right: 20px;
  bottom: calc(80px + env(safe-area-inset-bottom));
}

/* 移动端输入框优化 */
:deep(.van-field__control) {
  font-size: 15px;
  line-height: 1.6;
}
</style>