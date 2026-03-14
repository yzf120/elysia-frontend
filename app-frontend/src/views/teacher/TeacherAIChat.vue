<template>
  <div class="teacher-ai-chat-page">
    <van-nav-bar title="AI对话" left-arrow @click-left="$router.back()">
      <template #right>
        <div style="display:flex;gap:12px;align-items:center">
          <van-icon name="bars" size="20" @click="showSidebar = true" />
          <van-icon name="plus" size="20" @click="createNewSession" />
        </div>
      </template>
    </van-nav-bar>

    <!-- 会话历史侧边栏 -->
    <van-popup
      v-model:show="showSidebar"
      position="left"
      :style="{ width: '80%', height: '100%' }"
    >
      <div class="sidebar-content">
        <div class="sidebar-header">
          <span>会话历史</span>
          <van-icon name="cross" size="18" @click="showSidebar = false" />
        </div>
        <van-button block round @click="createNewSession" class="new-session-btn">
          <van-icon name="plus" />新建会话
        </van-button>
        <van-search v-model="searchKeyword" placeholder="搜索会话..." shape="round" background="transparent" />
        <div class="session-list">
          <div
            v-for="s in filteredSessions"
            :key="s.id"
            class="session-item"
            :class="{ active: currentSessionId === s.id }"
            @click="loadSession(s.id)"
          >
            <div class="session-info">
              <div class="session-title">{{ s.title }}</div>
              <div class="session-time">{{ formatSessionTime(s.updateTime) }}</div>
            </div>
            <van-icon v-if="currentSessionId === s.id" name="success" size="16" color="#667eea" />
          </div>
          <van-empty v-if="filteredSessions.length === 0" description="暂无会话记录" image-size="80" />
        </div>
      </div>
    </van-popup>

    <div class="chat-layout">
      <!-- 消息区域 -->
      <div class="message-area" ref="messageAreaRef">
        <!-- 欢迎语 -->
        <div v-if="messages.length === 0" class="welcome-wrap">
          <div class="welcome-icon">🤖</div>
          <h3>{{ greeting }}，{{ teacherName }}老师</h3>
          <p>我是您的AI智能助教，有什么可以帮助您的吗？</p>
          <div class="quick-btns">
            <van-button size="small" type="primary" plain @click="quickAction('material')">AI教学资料生成</van-button>
            <van-button size="small" type="success" plain @click="quickAction('question')">AI出题</van-button>
          </div>
        </div>

        <!-- 消息列表 -->
        <div v-else class="message-list">
          <div
            v-for="(msg, i) in messages"
            :key="i"
            class="message-item"
            :class="msg.role"
          >
            <div class="msg-avatar">{{ msg.role === 'user' ? '👨‍🏫' : '🤖' }}</div>
      <div class="msg-bubble">
              <!-- AI 消息内容为空时显示 loading 动画 -->
              <div v-if="msg.role === 'assistant' && !msg.content" class="loading-dots">
                <span></span><span></span><span></span>
              </div>
              <div v-else class="msg-text">
                <span v-html="formatMessage(msg.displayContent || msg.content)"></span>
                <!-- 图片预览 -->
                <div v-if="msg.images && msg.images.length > 0" class="message-images">
                  <img
                    v-for="(imgUrl, imgIdx) in msg.images"
                    :key="imgIdx"
                    :src="imgUrl"
                    class="message-image-preview"
                    @click="previewImage(imgUrl)"
                  />
                </div>
              </div>
              <div class="msg-time">{{ formatTime(msg.time) }}</div>
            </div>
          </div>


        </div>
      </div>

      <!-- 输入区 -->
      <div class="input-area">
        <!-- 待发送图片预览 -->
        <div v-if="pendingImages.length > 0" class="pending-images">
          <div v-for="(img, idx) in pendingImages" :key="idx" class="pending-image-item">
            <img :src="img.dataUrl" class="pending-image-thumb" />
            <van-icon name="cross" size="14" class="pending-image-remove" @click="removePendingImage(idx)" />
          </div>
        </div>
        <div class="input-row">
          <van-field
            v-model="inputMessage"
            type="textarea"
            rows="2"
            autosize
            placeholder="输入您的问题..."
            class="input-field"
          />
          <div class="input-btns">
            <van-uploader :after-read="handleFileUpload" :max-count="5" accept="image/*">
              <van-button size="small" icon="photograph" class="upload-btn" />
            </van-uploader>
            <van-button
              type="primary"
              :loading="isLoading"
              :disabled="!inputMessage.trim()"
              @click="sendMessage"
              class="send-btn"
            >发送</van-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import { showToast } from 'vant'
import { teacherAPI } from '../../api/index.js'

const teacherName = ref(localStorage.getItem('userName') || '教师')
const messages = ref([])
const inputMessage = ref('')
const isLoading = ref(false)
const messageAreaRef = ref(null)

// 会话管理
const currentSessionId = ref(null)
const sessions = ref([])
const showSidebar = ref(false)
const searchKeyword = ref('')

// 过滤会话列表
const filteredSessions = computed(() => {
  if (!searchKeyword.value) return sessions.value
  return sessions.value.filter(s =>
    s.title.toLowerCase().includes(searchKeyword.value.toLowerCase())
  )
})

// 加载会话列表
const loadSessions = async () => {
  try {
    const res = await teacherAPI.getAISessions(1, 50)
    const list = res?.data?.sessions || []
    sessions.value = list.map(s => ({
      id: s.session_id,
      title: s.session_title || '未命名会话',
      updateTime: s.last_interact_time || s.create_time
    })).sort((a, b) => new Date(b.updateTime) - new Date(a.updateTime))
  } catch (e) {
    console.error('加载会话列表失败:', e)
  }
}

// 加载某个历史会话
const loadSession = async (sessionId) => {
  try {
    currentSessionId.value = sessionId
    showSidebar.value = false
    messages.value = []
    const res = await teacherAPI.getAISessionMessages(sessionId, 1, 200)
    const convList = res?.data?.conversations || []
    convList.sort((a, b) => (a.message_seq || 0) - (b.message_seq || 0))
    messages.value = convList.map(c => ({
      role: c.sender_type === 2 ? 'assistant' : 'user',
      content: c.message_content || '',
      displayContent: c.message_content || '',
      time: c.send_time || c.create_time
    }))
    await scrollToBottom()
  } catch (e) {
    showToast('加载会话失败')
    console.error('加载会话失败:', e)
  }
}

// 格式化时间
const formatSessionTime = (time) => {
  if (!time) return ''
  const d = new Date(time)
  const now = new Date()
  const diff = now - d
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return `${d.getMonth() + 1}/${d.getDate()}`
}

// 待发送的图片附件
const pendingImages = ref([]) // [{dataUrl: 'data:image/...;base64,...', name: 'xxx.png'}]

// 处理图片上传
const handleFileUpload = (file) => {
  const isImage = file.file.type.startsWith('image/')
  const isLt10M = file.file.size / 1024 / 1024 < 10
  if (!isImage) { showToast('目前仅支持上传图片！'); return }
  if (!isLt10M) { showToast('图片大小不能超过10MB！'); return }
  const reader = new FileReader()
  reader.onload = (e) => {
    pendingImages.value.push({ dataUrl: e.target.result, name: file.file.name })
    showToast(`图片「${file.file.name}」已添加`)
  }
  reader.readAsDataURL(file.file)
}

// 移除待发送图片
const removePendingImage = (index) => {
  pendingImages.value.splice(index, 1)
}

// 图片预览
const previewImage = (url) => {
  window.open(url, '_blank')
}

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return '上午好'
  if (h < 18) return '下午好'
  return '晚上好'
})

const formatTime = (time) => {
  if (!time) return ''
  const d = new Date(time)
  const now = new Date()
  const diff = now - d
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const formatMessage = (content) => {
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>')
}

const scrollToBottom = async () => {
  await nextTick()
  if (messageAreaRef.value) {
    messageAreaRef.value.scrollTop = messageAreaRef.value.scrollHeight
  }
}

const createNewSession = () => {
  messages.value = []
  inputMessage.value = ''
  currentSessionId.value = null
  showToast({ type: 'success', message: '已创建新会话' })
}

const quickAction = (type) => {
  inputMessage.value = type === 'material' ? '请帮我生成一份教学资料' : '请帮我生成一套测试题'
}

const sendMessage = async () => {
  if (!inputMessage.value.trim() || isLoading.value) return

  // 构建消息内容：文本 + 图片标记
  let messageContent = inputMessage.value
  const imageSnapshots = [...pendingImages.value]
  if (imageSnapshots.length > 0) {
    for (const img of imageSnapshots) {
      messageContent += `\n[IMAGE:${img.dataUrl}]`
    }
  }

  const userMsg = {
    role: 'user',
    content: messageContent,
    displayContent: inputMessage.value,
    images: imageSnapshots.map(img => img.dataUrl),
    time: new Date().toISOString()
  }
  messages.value.push(userMsg)
  inputMessage.value = ''
  pendingImages.value = []
  isLoading.value = true
  await scrollToBottom()

  // 构建消息历史（包含图片标记）
  const historyMessages = messages.value
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => ({ role: m.role, content: m.content }))

  // 预先添加空的 assistant 消息，用于流式填充
  const assistantMsgIdx = messages.value.length
  messages.value.push({ role: 'assistant', content: '', time: new Date().toISOString() })

  try {
    abortController = new AbortController()
    const response = await teacherAPI.aiChatStream({
      session_id: currentSessionId.value || '',
      question_type: 'general',
      messages: historyMessages,
      model_id: 'doubao-seed-1-6-lite-251015'
    }, abortController.signal)

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(errText || `HTTP ${response.status}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop()

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim()
          if (data === '[DONE]') { isLoading.value = false; break }
          try {
            const chunk = JSON.parse(data)
            if (chunk.content) {
              messages.value[assistantMsgIdx].content += chunk.content
              await nextTick()
              scrollToBottom()
            }
            if (chunk.is_end) isLoading.value = false
          } catch (e) { /* 忽略解析错误 */ }
        }
      }
    }
  } catch (error) {
    if (error?.name === 'AbortError') {
      // 用户主动终止
    } else {
      showToast({ type: 'fail', message: '发送失败，请重试' })
      if (messages.value[assistantMsgIdx]?.content === '') {
        messages.value.splice(assistantMsgIdx, 1)
      }
    }
  } finally {
    isLoading.value = false
    abortController = null
    // 发送完成后刷新会话列表，首轮对话后自动更新 currentSessionId
    setTimeout(async () => {
      try {
        const prevIds = new Set(sessions.value.map(s => s.id))
        const res = await teacherAPI.getAISessions(1, 50)
        const list = res?.data?.sessions || []
        sessions.value = list.map(s => ({
          id: s.session_id,
          title: s.session_title || '未命名会话',
          updateTime: s.last_interact_time || s.create_time
        })).sort((a, b) => new Date(b.updateTime) - new Date(a.updateTime))
        if (!currentSessionId.value) {
          const newSession = sessions.value.find(s => !prevIds.has(s.id))
          if (newSession) currentSessionId.value = newSession.id
        }
      } catch (e) { /* 静默处理 */ }
    }, 1500)
  }
}

onMounted(async () => {
  const info = localStorage.getItem('userInfo')
  if (info && info !== 'undefined') {
    try {
      const parsed = JSON.parse(info)
      teacherName.value = parsed.name || parsed.teacher_name || teacherName.value
    } catch {}
  }
  await loadSessions()
})
</script>

<style scoped>
.teacher-ai-chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
}

.chat-layout {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.message-area {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.welcome-wrap {
  text-align: center;
  padding: 60px 20px 20px;
}

.welcome-icon {
  font-size: 56px;
  margin-bottom: 16px;
}

.welcome-wrap h3 {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.welcome-wrap p {
  font-size: 14px;
  color: #666;
  margin-bottom: 20px;
}

.quick-btns {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-item {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.message-item.user {
  flex-direction: row-reverse;
}

.msg-avatar {
  font-size: 28px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.msg-bubble {
  max-width: 75%;
}

.msg-text {
  background: #fff;
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  word-break: break-word;
}

.message-item.user .msg-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.msg-time {
  font-size: 11px;
  color: #999;
  margin-top: 4px;
  padding: 0 4px;
}

.message-item.user .msg-time {
  text-align: right;
}

.loading-dots {
  display: flex;
  gap: 5px;
  padding: 10px 14px;
  background: #fff;
  border-radius: 12px;
}

.loading-dots span {
  width: 8px;
  height: 8px;
  background: #667eea;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}

.loading-dots span:nth-child(1) { animation-delay: -0.32s; }
.loading-dots span:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

.input-area {
  background: #fff;
  border-top: 1px solid #f0f0f0;
  padding: 8px 0 0;
}

.pending-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0 12px 8px;
}

.pending-image-item {
  position: relative;
  width: 56px;
  height: 56px;
}

.pending-image-thumb {
  width: 56px;
  height: 56px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid rgba(102, 126, 234, 0.3);
}

.pending-image-remove {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 18px;
  height: 18px;
  background: #f56c6c;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.input-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 0 12px 10px;
}

.input-field {
  flex: 1;
  background: #f5f5f5;
  border-radius: 10px;
}

.input-btns {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.upload-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: #f5f5f5;
  border: 1px solid #e8e8e8;
}

.send-btn {
  height: 40px;
  padding: 0 16px;
  border-radius: 10px;
}

/* 消息中的图片预览 */
.message-images {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.message-image-preview {
  max-width: 150px;
  max-height: 150px;
  border-radius: 8px;
  object-fit: cover;
  cursor: pointer;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

/* 侧边栏样式 */
.sidebar-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  border-bottom: 1px solid #f0f0f0;
}

.new-session-btn {
  margin: 12px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  font-weight: 500;
}

.session-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 12px 16px;
}

.session-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-radius: 10px;
  margin-bottom: 8px;
  background: #f8f9ff;
  border: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.2s;
}

.session-item.active {
  background: linear-gradient(135deg, #e8eeff 0%, #f0f4ff 100%);
  border-color: #667eea;
}

.session-info {
  flex: 1;
  min-width: 0;
}

.session-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 3px;
}

.session-time {
  font-size: 11px;
  color: #909399;
}
</style>
