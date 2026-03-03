<template>
  <div class="teacher-ai-chat-page">
    <van-nav-bar title="AI对话" left-arrow @click-left="$router.back()">
      <template #right>
        <van-icon name="plus" size="20" @click="createNewSession" />
      </template>
    </van-nav-bar>

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
              <div class="msg-text" v-html="formatMessage(msg.content)"></div>
              <div class="msg-time">{{ formatTime(msg.time) }}</div>
            </div>
          </div>

          <!-- 加载中 -->
          <div v-if="isLoading" class="message-item assistant">
            <div class="msg-avatar">🤖</div>
            <div class="msg-bubble">
              <div class="loading-dots">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 输入区 -->
      <div class="input-area">
        <van-field
          v-model="inputMessage"
          type="textarea"
          rows="2"
          autosize
          placeholder="输入您的问题..."
          class="input-field"
        />
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
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import { showToast } from 'vant'

const teacherName = ref(localStorage.getItem('userName') || '教师')
const messages = ref([])
const inputMessage = ref('')
const isLoading = ref(false)
const messageAreaRef = ref(null)

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
  showToast({ type: 'success', message: '已创建新会话' })
}

const quickAction = (type) => {
  inputMessage.value = type === 'material' ? '请帮我生成一份教学资料' : '请帮我生成一套测试题'
}

const sendMessage = async () => {
  if (!inputMessage.value.trim() || isLoading.value) return

  const userMsg = { role: 'user', content: inputMessage.value, time: new Date().toISOString() }
  messages.value.push(userMsg)
  const question = inputMessage.value
  inputMessage.value = ''
  isLoading.value = true
  await scrollToBottom()

  try {
    // TODO: 调用AI接口
    await new Promise(r => setTimeout(r, 1500))
    messages.value.push({
      role: 'assistant',
      content: `您好！关于"${question}"，我来为您解答...\n\n这是AI生成的回答内容，实际使用时将调用真实的AI接口。`,
      time: new Date().toISOString()
    })
    await scrollToBottom()
  } catch {
    showToast({ type: 'fail', message: '发送失败，请重试' })
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  const info = localStorage.getItem('userInfo')
  if (info && info !== 'undefined') {
    try {
      const parsed = JSON.parse(info)
      teacherName.value = parsed.name || parsed.teacher_name || teacherName.value
    } catch {}
  }
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
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 10px 12px;
  background: #fff;
  border-top: 1px solid #f0f0f0;
}

.input-field {
  flex: 1;
  background: #f5f5f5;
  border-radius: 10px;
}

.send-btn {
  flex-shrink: 0;
  height: 40px;
  padding: 0 16px;
  border-radius: 10px;
}
</style>
