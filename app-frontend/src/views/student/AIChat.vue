<template>
  <div class="ai-chat-page">
    <!-- 顶部导航栏 - 渐变背景 -->
    <van-nav-bar
      title="AI智能助教"
      left-arrow
      @click-left="goBack"
      fixed
      placeholder
      class="custom-navbar"
    >
      <template #right>
        <div class="navbar-right">
          <van-icon name="bars" size="22" @click="showSidebar = true" class="menu-icon" />
        </div>
      </template>
    </van-nav-bar>

    <!-- 左侧会话管理侧滑栏 - 优化设计 -->
    <van-popup
      v-model:show="showSidebar"
      position="left"
      :style="{ width: '85%', height: '100%' }"
      :overlay-style="{ background: 'rgba(0, 0, 0, 0.5)' }"
    >
      <div class="sidebar-content">
        <!-- 侧边栏头部 -->
        <div class="sidebar-header">
          <h3>会话历史</h3>
          <van-icon name="cross" size="20" @click="showSidebar = false" class="close-icon" />
        </div>

        <!-- 新建会话按钮 - 渐变设计 -->
        <van-button 
          block 
          round 
          @click="createNewSession" 
          class="new-session-btn"
        >
          <van-icon name="plus" />
          <span>新建会话</span>
        </van-button>

        <!-- 搜索框 -->
        <van-search
          v-model="searchKeyword"
          placeholder="搜索会话..."
          shape="round"
          background="transparent"
          class="session-search"
        />

        <!-- 会话列表 -->
        <div class="session-list">
          <div
            v-for="session in filteredSessions"
            :key="session.id"
            class="session-item"
            :class="{ active: currentSessionId === session.id }"
            @click="loadSession(session.id)"
          >
            <div class="session-icon">
              <van-icon name="chat-o" size="20" />
            </div>
            <div class="session-info">
              <div class="session-title">{{ session.title }}</div>
              <div class="session-time">
                <van-icon name="clock-o" size="12" />
                {{ formatTime(session.updateTime) }}
              </div>
            </div>
            <van-icon 
              v-if="currentSessionId === session.id" 
              name="success" 
              size="18" 
              color="#4F6EF7" 
            />
          </div>
          <van-empty 
            v-if="filteredSessions.length === 0" 
            description="暂无会话记录"
            image-size="100"
          />
        </div>
      </div>
    </van-popup>

    <!-- 主对话区 -->
    <div class="chat-main">
      <!-- 顶部功能区 - 优化设计 -->
      <van-collapse v-model="activeCollapse" accordion class="model-settings">
        <van-collapse-item name="1" class="settings-item">
          <template #title>
            <div class="settings-title">
              <van-icon name="setting-o" size="18" />
              <span>模型设置</span>
            </div>
          </template>
          <van-cell-group inset class="settings-group">
            <van-cell title="AI模型" class="setting-cell">
              <template #icon>
                <van-icon name="fire" color="#4F6EF7" size="18" />
              </template>
              <template #right-icon>
                <van-dropdown-menu>
                  <van-dropdown-item v-model="selectedModel" :options="modelOptions" />
                </van-dropdown-menu>
              </template>
            </van-cell>
            <!-- 当前模型描述 -->
            <van-cell v-if="currentModelDesc" class="model-desc-cell">
              <template #title>
                <div class="model-desc-row">
                  <van-icon name="info-o" size="14" color="#4F6EF7" />
                  <span class="model-desc-text">{{ currentModelDesc }}</span>
                </div>
              </template>
            </van-cell>
            <van-cell title="深度思考" class="setting-cell" v-if="!isQwenModel">
              <template #icon>
                <van-icon name="bulb-o" color="#e6a23c" size="18" />
              </template>
              <template #value>
                <span class="setting-desc">更详细的分析</span>
              </template>
              <template #right-icon>
                <van-switch v-model="enableDeepThink" size="22" active-color="#e6a23c" />
              </template>
            </van-cell>
            <van-cell title="深度思考" class="setting-cell" v-else>
              <template #icon>
                <van-icon name="bulb-o" color="#e6a23c" size="18" />
              </template>
              <template #value>
                <span class="setting-desc qwen-auto-tip">模型自动决定是否开启思考模式</span>
              </template>
            </van-cell>
          </van-cell-group>
        </van-collapse-item>
      </van-collapse>

      <!-- 消息展示区 -->
      <div class="message-area" ref="messageArea">
        <!-- 欢迎语 - 优化设计 -->
        <div v-if="messages.length === 0" class="welcome-message">
          <div class="welcome-icon">
            <van-icon name="chat-o" size="70" />
          </div>
          <h2 class="welcome-title">{{ greeting }}，{{ studentName }}</h2>
          <p class="welcome-subtitle">我是您的AI智能助教</p>
          <div class="welcome-tips">
            <div class="tip-item">
              <van-icon name="bulb-o" size="16" />
              <span>解答学习疑问</span>
            </div>
            <div class="tip-item">
              <van-icon name="edit" size="16" />
              <span>辅导作业习题</span>
            </div>
            <div class="tip-item">
              <van-icon name="chart-trending-o" size="16" />
              <span>分析知识要点</span>
            </div>
          </div>
        </div>

        <!-- 消息列表 - 优化设计 -->
        <div v-else class="message-list">
          <div
            v-for="(msg, index) in messages"
            :key="index"
            class="message-item"
            :class="msg.role"
          >
            <div class="message-avatar">
              <van-image
                v-if="msg.role === 'user'"
                round
                width="40"
                height="40"
                :src="userAvatar"
                class="avatar-image"
              >
                <template #default>
                  <div class="avatar-placeholder user-avatar">{{ studentName.charAt(0) }}</div>
                </template>
              </van-image>
              <div v-else class="ai-avatar">
                <van-icon name="chat-o" size="24" />
              </div>
            </div>
            <div class="message-content">
              <!-- 深度思考内容区块 -->
              <div v-if="msg.thinkContent" class="think-block">
                <div class="think-header" @click="msg.thinkExpanded = !msg.thinkExpanded">
                  <span class="think-icon">🧠</span>
                  <span class="think-title">思考过程</span>
                  <span class="think-toggle">{{ msg.thinkExpanded ? '收起' : '展开' }}</span>
                </div>
                <div v-show="msg.thinkExpanded" class="think-content" v-html="formatMessage(msg.thinkContent)"></div>
              </div>
              <!-- AI 消息内容为空时显示 loading 动画 -->
              <div v-if="msg.role === 'assistant' && !msg.content && !msg.thinkContent" class="message-text">
                <div class="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
              <div v-else class="message-text">
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
              <div class="message-time">
                <van-icon name="clock-o" size="10" />
                {{ formatTime(msg.time) }}
              </div>
            </div>
          </div>


        </div>
      </div>

      <!-- 底部输入区 - 优化设计 -->
      <div class="input-area">
        <div class="input-container">
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
              rows="1"
              autosize
              placeholder="输入您的问题，AI助教随时为您解答..."
              :disabled="isLoading"
              class="message-input"
            />
            <div class="input-actions">
              <van-uploader :after-read="handleFileUpload" :max-count="5" accept="image/*" class="upload-btn">
                <div class="action-icon">
                  <van-icon name="photograph" size="22" />
                </div>
              </van-uploader>
              <van-button
                round
                :loading="isLoading"
                :disabled="!inputMessage.trim()"
                @click="sendMessage"
                class="send-btn"
                :class="{ active: inputMessage.trim() }"
              >
                <van-icon name="guide-o" size="18" v-if="!isLoading" />
                <span v-if="!isLoading">发送</span>
              </van-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧悬浮功能按钮 - 优化设计 -->
    <div class="floating-menu" @click="showActionSheet = true">
      <van-icon name="apps-o" size="24" />
    </div>

    <!-- 操作菜单 -->
    <van-action-sheet
      v-model:show="showActionSheet"
      :actions="actions"
      @select="onActionSelect"
    />


  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast } from 'vant'
import { studentAPI } from '../../api/index.js'
import { marked } from 'marked'

// 配置 marked
marked.setOptions({
  breaks: true,
  gfm: true
})

const router = useRouter()
const route = useRoute()

// 图片预览
const previewImage = (url) => {
  window.open(url, '_blank')
}

// 学生信息
const studentName = ref(localStorage.getItem('userName') || '同学')
const userAvatar = ref('')

// 侧边栏
const showSidebar = ref(false)
const searchKeyword = ref('')
const sessions = ref([])
const currentSessionId = ref(null)

// 功能折叠
const activeCollapse = ref('')

// 模型配置
const selectedModel = ref('')
const modelOptions = ref([])
const modelsLoading = ref(false)
const enableDeepThink = ref(false)

// 加载模型列表
const loadModels = async () => {
  modelsLoading.value = true
  try {
    const res = await studentAPI.getAIModels()
    const models = res?.data?.models || []
    modelOptions.value = models.map(m => ({ text: m.model_name, value: m.model_id, description: m.description }))
    if (models.length > 0 && !selectedModel.value) {
      selectedModel.value = models[0].model_id
    }
  } catch (e) {
    console.error('加载模型列表失败:', e)
    modelOptions.value = [
      { text: 'Doubao-Seed-2.0-lite', value: 'doubao-seed-2-0-lite-260215' },
      { text: 'Qwen3-Omni-Flash', value: 'qwen3-omni-flash' }
    ]
    if (!selectedModel.value) selectedModel.value = 'doubao-seed-2-0-lite-260215'
  } finally {
    modelsLoading.value = false
  }
}

// 当前选中模型的描述
const currentModelDesc = computed(() => {
  const m = modelOptions.value.find(m => m.value === selectedModel.value)
  return m?.description || ''
})

// 是否为千问模型
const isQwenModel = computed(() => selectedModel.value.includes('qwen'))

// 消息相关
const messages = ref([])
const inputMessage = ref('')
const isLoading = ref(false)
const messageArea = ref(null)

// 中止控制器（用于终止流式请求）
let abortController = null

// 停止当前对话
const stopMessage = () => {
  if (abortController) {
    abortController.abort()
    abortController = null
  }
  isLoading.value = false
}

// 待发送的图片附件
const pendingImages = ref([]) // [{dataUrl: 'data:image/...;base64,...', name: 'xxx.png'}]

// 操作菜单
const showActionSheet = ref(false)
const actions = [
  { name: isFavorited.value ? '取消收藏' : '收藏会话', icon: isFavorited.value ? 'star' : 'star-o' },
  { name: '导出会话', icon: 'down' }
]



// 根据时间生成问候语
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return '凌晨好'
  if (hour < 12) return '上午好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

// 过滤会话列表
const filteredSessions = computed(() => {
  if (!searchKeyword.value) return sessions.value
  return sessions.value.filter(s =>
    s.title.toLowerCase().includes(searchKeyword.value.toLowerCase())
  )
})

// 格式化时间
const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now - date

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`

  return `${date.getMonth() + 1}-${date.getDate()}`
}

// 格式化消息内容（支持完整Markdown渲染）
const formatMessage = (content) => {
  if (!content) return ''
  return marked.parse(content)
}

// 创建新会话
const createNewSession = () => {
  currentSessionId.value = null
  messages.value = []
  inputMessage.value = ''
  showSidebar.value = false
  showToast('已创建新会话')
}

// 加载会话
const loadSession = async (sessionId) => {
  try {
    currentSessionId.value = sessionId
    showSidebar.value = false
    messages.value = []
    // 检查收藏状态
    checkFavoriteStatus()
    const res = await studentAPI.getAISessionMessages(sessionId, 1, 200)
    const convList = res?.data?.conversations || []
    convList.sort((a, b) => (a.message_seq || 0) - (b.message_seq || 0))
    messages.value = convList.map(c => ({
      role: c.sender_type === 2 ? 'assistant' : 'user',
      content: c.message_content || '',
      displayContent: c.message_content || '',
      thinkContent: '',
      thinkExpanded: false,
      time: c.send_time || c.create_time
    }))
    await nextTick()
    scrollToBottom()
  } catch (error) {
    console.error('加载会话失败:', error)
    showToast('加载会话失败')
  }
}

// 发送消息（SSE流式）
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

  const userMessage = {
    role: 'user',
    content: messageContent,
    displayContent: inputMessage.value,
    images: imageSnapshots.map(img => img.dataUrl),
    time: new Date().toISOString()
  }

  messages.value.push(userMessage)
  inputMessage.value = ''
  pendingImages.value = []
  isLoading.value = true

  await nextTick()
  scrollToBottom()

  // 构建消息历史（包含图片标记）
  const historyMessages = messages.value
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => ({ role: m.role, content: m.content }))

  // 预先添加空的 assistant 消息
  const assistantMsgIdx = messages.value.length
  messages.value.push({
    role: 'assistant',
    content: '',
    thinkContent: '',
    thinkExpanded: true,
    time: new Date().toISOString()
  })

  try {
    abortController = new AbortController()
    const response = await studentAPI.aiChatStream({
      session_id: currentSessionId.value || '',
      question_type: 'general',
      messages: historyMessages,
      model_id: selectedModel.value || 'doubao-seed-2-0-lite-260215',
      enable_thinking: enableDeepThink.value
    }, abortController.signal)

    if (!response.ok) {
      const respContentType = response.headers.get('Content-Type') || ''
      if (respContentType.includes('application/json')) {
        const errResp = await response.json()
        const errCode = errResp?.error?.code
        const errMsg = errResp?.error?.message
        if (errCode === 4031) {
          showToast(errMsg || '您的AI对话功能已被禁止使用。')
          messages.value[assistantMsgIdx].content = errMsg || '您的AI对话功能已被禁止使用。'
          isLoading.value = false
          return
        }
        throw new Error(errMsg || `HTTP ${response.status}`)
      }
      const errText = await response.text()
      throw new Error(errText || `HTTP ${response.status}`)
    }

    // 检查是否为内容审核拦截的 JSON 响应（非SSE流）
    const contentType = response.headers.get('Content-Type') || ''
    if (contentType.includes('application/json')) {
      const jsonResp = await response.json()
      const errCode = jsonResp?.error?.code
      const errMsg = jsonResp?.error?.message
      if (errCode === 4031 || errCode === 4032) {
        showToast(errMsg || '您的消息被系统拦截，请规范用语。')
        messages.value[assistantMsgIdx].content = errMsg || '您的消息被系统拦截，请规范用语。'
        isLoading.value = false
        return
      }
      throw new Error(errMsg || 'AI对话请求失败')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''
    let thinkBuf = ''
    let inThink = false

    const processChunkContent = (raw) => {
      thinkBuf += raw
      const msg = messages.value[assistantMsgIdx]
      while (thinkBuf.length > 0) {
        if (inThink) {
          const endIdx = thinkBuf.indexOf('</think>')
          if (endIdx !== -1) {
            msg.thinkContent += thinkBuf.slice(0, endIdx)
            thinkBuf = thinkBuf.slice(endIdx + 8)
            inThink = false
          } else {
            const safe = thinkBuf.length > 7 ? thinkBuf.slice(0, thinkBuf.length - 7) : ''
            if (safe) { msg.thinkContent += safe; thinkBuf = thinkBuf.slice(safe.length) }
            break
          }
        } else {
          const startIdx = thinkBuf.indexOf('<think>')
          if (startIdx !== -1) {
            msg.content += thinkBuf.slice(0, startIdx)
            thinkBuf = thinkBuf.slice(startIdx + 7)
            inThink = true
          } else {
            const safe = thinkBuf.length > 6 ? thinkBuf.slice(0, thinkBuf.length - 6) : ''
            if (safe) { msg.content += safe; thinkBuf = thinkBuf.slice(safe.length) }
            break
          }
        }
      }
    }

    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        if (thinkBuf) {
          const msg = messages.value[assistantMsgIdx]
          if (inThink) msg.thinkContent += thinkBuf
          else msg.content += thinkBuf
          thinkBuf = ''
        }
        break
      }

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
              processChunkContent(chunk.content)
              await nextTick()
              scrollToBottom()
            }
            if (chunk.is_end) isLoading.value = false
          } catch (e) { /* 忽略 */ }
        }
      }
    }
  } catch (error) {
    console.error('发送消息失败:', error)
    if (error?.name === 'AbortError') {
      // 用户主动终止，不提示错误
    } else {
      showToast('发送消息失败')
      if (messages.value[assistantMsgIdx]?.content === '' && !messages.value[assistantMsgIdx]?.thinkContent) {
        messages.value.splice(assistantMsgIdx, 1)
      }
    }
  } finally {
    isLoading.value = false
    abortController = null
    // 发送完成后刷新会话列表，首轮对话后自动更新 currentSessionId
    setTimeout(async () => {
      const prevIds = new Set(sessions.value.map(s => s.id))
      await loadSessions()
      if (!currentSessionId.value) {
        const newSession = sessions.value.find(s => !prevIds.has(s.id))
        if (newSession) currentSessionId.value = newSession.id
      }
    }, 1500)
  }
}

// 处理文件上传（图片转base64后附加到消息）
const handleFileUpload = (file) => {
  const isImage = file.file.type.startsWith('image/')
  const isLt10M = file.file.size / 1024 / 1024 < 10
  if (!isImage) {
    showToast('目前仅支持上传图片文件！')
    return
  }
  if (!isLt10M) {
    showToast('图片大小不能超过10MB！')
    return
  }
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

// 操作菜单选择
const onActionSelect = (action) => {
  showActionSheet.value = false
  
  if (action.name === '收藏会话' || action.name === '取消收藏') {
    collectSession()
  } else if (action.name === '导出会话') {
    exportSession()
  }
}

const isFavorited = ref(false)

// 检查收藏状态
const checkFavoriteStatus = async () => {
  if (!currentSessionId.value) {
    isFavorited.value = false
    return
  }
  try {
    const res = await studentAPI.checkFavorite(currentSessionId.value)
    isFavorited.value = res?.data?.data?.is_favorited || false
  } catch (e) {
    console.error('检查收藏状态失败:', e)
  }
}

// 收藏/取消收藏会话
const collectSession = async () => {
  if (messages.value.length === 0) {
    showToast('当前会话为空，无法收藏')
    return
  }
  if (!currentSessionId.value) {
    showToast('请先发送一条消息创建会话')
    return
  }
  try {
    if (isFavorited.value) {
      await studentAPI.unfavoriteSession(currentSessionId.value)
      isFavorited.value = false
      showToast('已取消收藏')
    } else {
      await studentAPI.favoriteSession(currentSessionId.value)
      isFavorited.value = true
      showToast('会话已收藏')
    }
  } catch (e) {
    console.error('收藏操作失败:', e)
    showToast('操作失败')
  }
}

// 导出会话为 doc 文件
const exportSession = () => {
  if (messages.value.length === 0) {
    showToast('当前会话为空，无法导出')
    return
  }

  const title = `会话记录_${new Date().toISOString().split('T')[0]}`
  let htmlContent = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>${title}</title></head><body>`
  htmlContent += `<h1>${title}</h1>`
  messages.value.forEach(msg => {
    const role = msg.role === 'user' ? '用户' : 'AI助教'
    htmlContent += `<h3>${role}</h3><p>${msg.content.replace(/\n/g, '<br>')}</p><hr>`
  })
  htmlContent += '</body></html>'

  const blob = new Blob([htmlContent], { type: 'application/msword;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${title}.doc`
  link.click()
  URL.revokeObjectURL(url)

  showToast('导出成功')
}

// 滚动到底部
const scrollToBottom = () => {
  if (messageArea.value) {
    messageArea.value.scrollTop = messageArea.value.scrollHeight
  }
}

// 返回首页
const goBack = () => {
  router.back()
}

// 加载历史会话列表
const loadSessions = async () => {
  try {
    const res = await studentAPI.getAISessions(1, 50)
    const list = res?.data?.sessions || []
    sessions.value = list.map(s => ({
      id: s.session_id,
      title: s.session_title || '未命名会话',
      updateTime: s.last_interact_time || s.create_time
    })).sort((a, b) => new Date(b.updateTime) - new Date(a.updateTime))
  } catch (error) {
    console.error('加载会话列表失败:', error)
  }
}

// 监听路由参数，如果携带题目信息则自动填充
watch(() => route.query.question, (question) => {
  if (question) {
    inputMessage.value = question
  }
}, { immediate: true })

// 页面加载
onMounted(() => {
  loadSessions()
  loadModels()  // 加载模型列表
})
</script>

<style scoped>
/* ==================== 全局样式 ==================== */
.ai-chat-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #f4f8fd 0%, #fafcff 100%);
  position: relative;
}

/* ==================== 顶部导航栏 ==================== */
.custom-navbar {
  background: linear-gradient(135deg, #4F6EF7 0%, #7CB8FF 100%);
}

:deep(.custom-navbar .van-nav-bar__title) {
  color: white;
  font-weight: 600;
  font-size: 17px;
}

:deep(.custom-navbar .van-icon) {
  color: white;
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.menu-icon {
  padding: 6px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  cursor: pointer;
}

.menu-icon:active {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(0.95);
}

/* ==================== 侧边栏样式 ==================== */
.sidebar-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #ffffff 0%, #f8f9ff 100%);
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 16px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  background: linear-gradient(135deg, #4F6EF7 0%, #7CB8FF 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.close-icon {
  padding: 6px;
  border-radius: 50%;
  background: #f5f5f5;
  cursor: pointer;
  transition: all 0.3s ease;
}

.close-icon:active {
  background: #e8e8e8;
  transform: scale(0.9);
}

.new-session-btn {
  margin: 16px;
  background: linear-gradient(135deg, #4F6EF7 0%, #7CB8FF 100%);
  border: none;
  color: white;
  font-weight: 500;
  height: 44px;
  box-shadow: 0 4px 12px rgba(79, 110, 247, 0.24);
  transition: all 0.3s ease;
}

.new-session-btn:active {
  transform: translateY(2px);
  box-shadow: 0 2px 8px rgba(79, 110, 247, 0.3);
}

.new-session-btn span {
  margin-left: 6px;
}

.session-search {
  padding: 0 16px 12px;
}

:deep(.session-search .van-search__content) {
  background: #f5f7fa;
  border: 1px solid #e8eaed;
}

.session-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px 16px;
  -webkit-overflow-scrolling: touch;
}

.session-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border-radius: 12px;
  margin-bottom: 10px;
  background: white;
  border: 1px solid #f0f0f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
  cursor: pointer;
}

.session-item:active {
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.session-item.active {
  background: linear-gradient(135deg, #edf4ff 0%, #f6faff 100%);
  border: 1px solid #4F6EF7;
  box-shadow: 0 4px 12px rgba(79, 110, 247, 0.12);
}

.session-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #4F6EF7 0%, #7CB8FF 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.session-item.active .session-icon {
  background: linear-gradient(135deg, #7CB8FF 0%, #4F6EF7 100%);
}

.session-info {
  flex: 1;
  min-width: 0;
}

.session-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.session-time {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #909399;
}

/* ==================== 主对话区 ==================== */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ==================== 模型设置 ==================== */
.model-settings {
  background: white;
  border-bottom: 1px solid #f0f0f0;
}

:deep(.model-settings .van-collapse-item__content) {
  padding: 12px 0;
}

.settings-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 500;
  color: #303133;
}

.settings-group {
  margin: 0 12px;
  border-radius: 12px;
  overflow: hidden;
}

.setting-cell {
  padding: 14px 16px;
}

:deep(.setting-cell .van-cell__title) {
  font-weight: 500;
  color: #303133;
}

.setting-desc {
  font-size: 12px;
  color: #909399;
  margin-right: 8px;
}

.qwen-auto-tip {
  font-style: italic;
  margin-right: 0;
}

.model-desc-cell {
  background: rgba(79, 110, 247, 0.04) !important;
  border-top: 1px dashed rgba(79, 110, 247, 0.2);
}

.model-desc-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.model-desc-text {
  font-size: 12px;
  color: #4F6EF7;
  line-height: 1.5;
}

:deep(.setting-cell .van-icon) {
  margin-right: 10px;
}

/* ==================== 消息区域 ==================== */
.message-area {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  -webkit-overflow-scrolling: touch;
}

/* ==================== 欢迎消息 ==================== */
.welcome-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.welcome-icon {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4F6EF7 0%, #7CB8FF 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-bottom: 24px;
  box-shadow: 0 8px 24px rgba(79, 110, 247, 0.24);
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.welcome-title {
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 600;
  background: linear-gradient(135deg, #4F6EF7 0%, #7CB8FF 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.welcome-subtitle {
  margin: 0 0 24px;
  font-size: 15px;
  color: #606266;
}

.welcome-tips {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 280px;
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  font-size: 14px;
  color: #606266;
  transition: all 0.3s ease;
}

.tip-item:active {
  transform: scale(0.98);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.tip-item .van-icon {
  color: #4F6EF7;
}

/* 深度思考区块 */
.think-block {
  max-width: 75%;
  margin-bottom: 8px;
  border: 1px solid rgba(79, 110, 247, 0.25);
  border-radius: 12px;
  overflow: hidden;
  background: rgba(79, 110, 247, 0.04);
}

.think-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  cursor: pointer;
  background: rgba(79, 110, 247, 0.08);
  user-select: none;
}

.think-header:active {
  background: rgba(79, 110, 247, 0.14);
}

.think-icon { font-size: 14px; }
.think-title { font-size: 13px; font-weight: 600; color: #4F6EF7; flex: 1; }
.think-toggle { font-size: 12px; color: #909399; }

.think-content {
  padding: 10px 14px;
  font-size: 13px;
  line-height: 1.7;
  color: #606266;
  border-top: 1px dashed rgba(79, 110, 247, 0.2);
  white-space: pre-wrap;
  word-wrap: break-word;
}

/* ==================== 消息列表 ==================== */
.message-list {
  padding-bottom: 20px;
}

.message-item {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  animation: messageSlideIn 0.3s ease;
}

@keyframes messageSlideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-item.user {
  flex-direction: row-reverse;
}

.message-avatar {
  flex-shrink: 0;
}

.avatar-image {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.avatar-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
  color: white;
}

.user-avatar {
  background: linear-gradient(135deg, #4F6EF7 0%, #7CB8FF 100%);
  box-shadow: 0 4px 12px rgba(79, 110, 247, 0.24);
}

.ai-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8eaed 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4F6EF7;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.ai-avatar.loading {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.message-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-width: 75%;
}

.message-item.user .message-content {
  align-items: flex-end;
}

.message-text {
  padding: 12px 16px;
  border-radius: 16px;
  font-size: 15px;
  line-height: 1.6;
  word-wrap: break-word;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.message-item.assistant .message-text {
  background: white;
  color: #303133;
  border-bottom-left-radius: 4px;
}

.message-item.user .message-text {
  background: linear-gradient(135deg, #4F6EF7 0%, #7CB8FF 100%);
  color: white;
  border-bottom-right-radius: 4px;
}

.message-text:active {
  transform: scale(0.98);
}

.message-text :deep(strong) {
  font-weight: 600;
}

.message-text :deep(code) {
  background: rgba(0, 0, 0, 0.08);
  padding: 2px 8px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
}

.message-item.user .message-text :deep(code) {
  background: rgba(255, 255, 255, 0.2);
}

.message-text :deep(pre) {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 12px 14px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 8px 0;
  font-size: 12px;
  line-height: 1.5;
}

.message-text :deep(pre code) {
  background: transparent;
  padding: 0;
  color: inherit;
}

.message-text :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 8px 0;
  font-size: 13px;
}

.message-text :deep(table th),
.message-text :deep(table td) {
  border: 1px solid #dcdfe6;
  padding: 6px 10px;
  text-align: left;
}

.message-text :deep(table th) {
  background: #f5f7fa;
  font-weight: 600;
}

.message-text :deep(table tr:nth-child(even)) {
  background: #fafafa;
}

.message-text :deep(h1),
.message-text :deep(h2),
.message-text :deep(h3),
.message-text :deep(h4) {
  margin: 12px 0 6px;
  font-weight: 600;
  color: #303133;
}

.message-text :deep(h3) { font-size: 15px; }
.message-text :deep(h4) { font-size: 14px; }

.message-text :deep(ul),
.message-text :deep(ol) {
  padding-left: 18px;
  margin: 6px 0;
}

.message-text :deep(li) {
  margin: 3px 0;
}

.message-text :deep(hr) {
  border: none;
  border-top: 1px solid #e4e7ed;
  margin: 10px 0;
}

.message-text :deep(blockquote) {
  border-left: 3px solid #4F6EF7;
  padding: 6px 12px;
  margin: 8px 0;
  background: rgba(79, 110, 247, 0.05);
  color: #606266;
}

.message-text :deep(p) {
  margin: 4px 0;
}

.message-time {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #909399;
  padding: 0 4px;
}

/* 加载中动画 */
.loading-message .message-content {
  padding: 12px 16px;
  background: white;
  border-radius: 16px;
  border-bottom-left-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.typing-indicator {
  display: flex;
  gap: 6px;
  padding: 4px 0;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #4F6EF7;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.7;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
}

/* 待发送图片预览 */
.pending-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 12px 0;
}

.pending-image-item {
  position: relative;
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: visible;
}

.pending-image-thumb {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid rgba(79, 110, 247, 0.3);
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
  z-index: 1;
}

/* 消息中的图片预览 */
.message-images {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.message-image-preview {
  max-width: 160px;
  max-height: 160px;
  border-radius: 8px;
  object-fit: cover;
  cursor: pointer;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

/* 输入行布局 */
.input-row {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  padding: 0 12px 12px;
}
  background: white;
  border-top: 1px solid #f0f0f0;
  padding: 12px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.05);
}

.input-container {
  display: flex;
  align-items: flex-end;
  gap: 10px;
}

.message-input {
  flex: 1;
  background: #f5f7fa;
  border-radius: 20px;
  border: 1px solid #e8eaed;
  transition: all 0.3s ease;
}

.message-input:focus-within {
  background: white;
  border-color: #4F6EF7;
  box-shadow: 0 0 0 3px rgba(79, 110, 247, 0.1);
}

:deep(.message-input .van-field__control) {
  font-size: 15px;
  line-height: 1.6;
  padding: 10px 16px;
  max-height: 100px;
}

:deep(.message-input .van-field__control::placeholder) {
  color: #c0c4cc;
}

.input-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.upload-btn {
  display: flex;
  align-items: center;
}

.action-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #606266;
  transition: all 0.3s ease;
  cursor: pointer;
}

.action-icon:active {
  background: #e8eaed;
  transform: scale(0.95);
}

.send-btn {
  height: 40px;
  padding: 0 20px;
  background: #e8eaed;
  border: none;
  color: #909399;
  font-weight: 500;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 4px;
}

.send-btn.active {
  background: linear-gradient(135deg, #4F6EF7 0%, #7CB8FF 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(79, 110, 247, 0.24);
}

.send-btn.active:active {
  transform: scale(0.95);
  box-shadow: 0 2px 8px rgba(79, 110, 247, 0.3);
}

.send-btn:disabled {
  opacity: 0.6;
}

/* ==================== 悬浮功能按钮 ==================== */
.floating-menu {
  position: fixed;
  right: 20px;
  bottom: calc(100px + env(safe-area-inset-bottom));
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4F6EF7 0%, #7CB8FF 100%);
  box-shadow: 0 6px 20px rgba(79, 110, 247, 0.28);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 999;
  animation: floatButton 3s ease-in-out infinite;
}

@keyframes floatButton {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.floating-menu:active {
  transform: scale(0.9);
  box-shadow: 0 4px 16px rgba(79, 110, 247, 0.4);
}

/* ==================== 操作菜单优化 ==================== */
:deep(.van-action-sheet__item) {
  padding: 16px;
  font-size: 15px;
}

:deep(.van-action-sheet__item:active) {
  background: #f5f7fa;
}

/* ==================== 对话框优化 ==================== */
:deep(.van-dialog__header) {
  font-weight: 600;
  color: #303133;
}

:deep(.van-dialog__confirm) {
  color: #4F6EF7;
}

/* ==================== 响应式优化 ==================== */
@media (max-width: 375px) {
  .welcome-icon {
    width: 80px;
    height: 80px;
  }
  
  .welcome-title {
    font-size: 20px;
  }
  
  .message-text {
    font-size: 14px;
  }
}

/* ==================== 滚动条美化 ==================== */
.message-area::-webkit-scrollbar {
  width: 4px;
}

.message-area::-webkit-scrollbar-thumb {
  background: rgba(79, 110, 247, 0.3);
  border-radius: 2px;
}

.message-area::-webkit-scrollbar-track {
  background: transparent;
}

.session-list::-webkit-scrollbar {
  width: 4px;
}

.session-list::-webkit-scrollbar-thumb {
  background: rgba(79, 110, 247, 0.3);
  border-radius: 2px;
}

.session-list::-webkit-scrollbar-track {
  background: transparent;
}
</style>