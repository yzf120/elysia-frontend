<template>
  <div class="teacher-ai-chat-page">
    <!-- 顶部返回按钮 -->
    <div class="top-bar">
      <el-button type="primary" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        返回首页
      </el-button>
      <el-breadcrumb separator="/">
        <el-breadcrumb-item>教师端</el-breadcrumb-item>
        <el-breadcrumb-item>AI对话</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <div class="chat-container">
      <!-- 左侧会话管理栏 -->
      <div class="sidebar">
        <el-button type="primary" class="new-session-btn" @click="createNewSession">
          <el-icon><Plus /></el-icon>
          新会话
        </el-button>

        <div class="session-search">
          <el-input v-model="searchKeyword" placeholder="搜索会话..." clearable>
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>

        <div class="session-list">
          <div
            v-for="session in filteredSessions"
            :key="session.id"
            class="session-item"
            :class="{ active: currentSessionId === session.id }"
            @click="loadSession(session.id)"
          >
            <div class="session-title">{{ session.title }}</div>
            <div class="session-time">{{ formatTime(session.updateTime) }}</div>
          </div>
          <div v-if="filteredSessions.length === 0" class="empty-sessions">
            <el-empty description="暂无会话记录" :image-size="60" />
          </div>
        </div>
      </div>

      <!-- 中间对话区 -->
      <div class="chat-main">
        <!-- 顶部功能区 -->
        <div class="function-bar">
          <div class="function-item model-item">
            <span class="label">模型：</span>
            <el-select
              v-model="selectedModel"
              placeholder="选择模型"
              style="width: 210px"
              :loading="modelsLoading"
              popper-class="model-select-popper"
            >
              <el-option
                v-for="m in modelList"
                :key="m.model_id"
                :value="m.model_id"
                :label="m.model_name"
              >
                <div class="model-option-item">
                  <div class="model-option-header">
                    <span class="model-option-name">{{ m.model_name }}</span>
                    <span class="model-option-provider" :class="m.provider">{{ m.provider === 'doubao' ? '豆包' : '千问' }}</span>
                  </div>
                  <div class="model-option-desc">{{ m.description }}</div>
                </div>
              </el-option>
            </el-select>
            <transition name="fade">
              <span v-if="currentModelDesc" class="model-desc-badge">
                {{ currentModelDesc }}
              </span>
            </transition>
          </div>

          <div class="function-item" v-if="!isQwenModel">
            <span class="label">深度思考：</span>
            <el-switch v-model="enableDeepThink" />
          </div>
          <div class="function-item" v-else>
            <span class="label">深度思考：</span>
            <span class="qwen-auto-tip">模型自动决定是否开启思考模式</span>
          </div>
        </div>

        <!-- 对话展示区 -->
        <div class="message-area" ref="messageArea">
          <!-- 欢迎语 -->
          <div v-if="messages.length === 0" class="welcome-message">
            <div class="welcome-icon">
              <el-icon :size="60"><ChatDotRound /></el-icon>
            </div>
            <h2>{{ greeting }}，{{ teacherName }}老师</h2>
            <p>我是您的AI智能助教，有什么可以帮助您的吗？</p>
          </div>

          <!-- 消息列表 -->
          <div v-else class="message-list">
            <div v-for="(msg, index) in messages" :key="index" class="message-item" :class="msg.role">
              <div class="message-avatar">
                <el-avatar v-if="msg.role === 'user'" :size="40">
                  {{ teacherName.charAt(0) }}
                </el-avatar>
                <el-avatar v-else :size="40" style="background: linear-gradient(135deg, #4F6EF7 0%, #60A5FA 100%);">
                  <el-icon><ChatDotRound /></el-icon>
                </el-avatar>
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
                <div class="loading-dots">
                  <span></span><span></span><span></span>
                </div>
              </div>
              <!-- 正文内容 -->
              <div v-else class="message-text">
                <div v-html="formatMessage(msg.displayContent || msg.content)"></div>
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
                <div class="message-time">{{ formatTime(msg.time) }}</div>
              </div>
            </div>


          </div>
        </div>

        <!-- 底部输入区 -->
        <div class="input-area">
          <div class="input-wrapper">
            <el-input
              v-model="inputMessage"
              type="textarea"
              :rows="3"
              placeholder="输入您的问题..."
              @keydown="handleKeydown"
            />
            <div class="input-actions">
              <!-- 待发送图片预览 -->
              <div v-if="pendingImages.length > 0" class="pending-images">
                <div v-for="(img, idx) in pendingImages" :key="idx" class="pending-image-item">
                  <img :src="img.dataUrl" class="pending-image-thumb" />
                  <span class="pending-image-name">{{ img.name }}</span>
                  <el-icon class="pending-image-remove" @click="removePendingImage(idx)"><Close /></el-icon>
                </div>
              </div>
              <div class="action-left">
                <el-upload :show-file-list="false" :before-upload="handleFileUpload" accept="image/*" multiple>
                  <el-button type="text">
                    <el-icon><Paperclip /></el-icon>
                    上传图片
                  </el-button>
                </el-upload>
              </div>
              <div class="action-right">
                <el-button v-if="!isLoading" type="primary" :disabled="!inputMessage.trim()" @click="sendMessage">
                  <el-icon><Promotion /></el-icon>
                  发送
                </el-button>
                <el-button v-else type="danger" @click="stopMessage">
                  <el-icon><VideoPause /></el-icon>
                  停止
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧功能栏 -->
      <div class="right-panel">
        <div class="panel-title">
          <el-icon><Operation /></el-icon>
          <span>会话操作</span>
        </div>
        <div class="panel-actions">
          <el-button class="action-btn collect-btn" :class="{ 'is-favorited': isFavorited }" @click="collectSession">
            <el-icon><StarFilled v-if="isFavorited" /><Star v-else /></el-icon>
            <span>{{ isFavorited ? '已收藏' : '收藏会话' }}</span>
          </el-button>
          <el-button class="action-btn export-btn" @click="exportSession">
            <el-icon><Download /></el-icon>
            <span>导出会话</span>
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { VideoPause, Paperclip, Close, Star, StarFilled } from '@element-plus/icons-vue';
import { teacherAPI } from '@/services/index.js';
import { marked } from 'marked';

// 配置 marked
marked.setOptions({
  breaks: true,
  gfm: true
});

const router = useRouter();

const teacherName = ref(localStorage.getItem('userName') || '教师');
const searchKeyword = ref('');
const sessions = ref([]);
const currentSessionId = ref(null);
const selectedModel = ref('');
const enableDeepThink = ref(false);

// 模型列表（从后端动态加载）
const modelList = ref([])
const modelsLoading = ref(false)

const loadModels = async () => {
  modelsLoading.value = true
  try {
    const res = await teacherAPI.getAIModels()
    const models = res?.data?.models || []
    modelList.value = models
    if (models.length > 0 && !selectedModel.value) {
      selectedModel.value = models[0].model_id
    }
  } catch (e) {
    console.error('加载模型列表失败:', e)
    // 失败时使用默认模型
    modelList.value = [
      { model_id: 'doubao-seed-2-0-lite-260215', model_name: 'Doubao-Seed-2.0-lite', provider: 'doubao', description: '多模态模型，支持深度思考' },
      { model_id: 'qwen3-omni-flash', model_name: 'Qwen3-Omni-Flash', provider: 'qwen', description: '全模态模型，Thinker–Talker 架构' }
    ]
    if (!selectedModel.value) selectedModel.value = 'doubao-seed-2-0-lite-260215'
  } finally {
    modelsLoading.value = false
  }
}

// 当前选中模型的描述
const currentModelDesc = computed(() => {
  const m = modelList.value.find(m => m.model_id === selectedModel.value)
  return m?.description || ''
})

// 是否为千问模型
const isQwenModel = computed(() => {
  const m = modelList.value.find(m => m.model_id === selectedModel.value)
  return m?.provider === 'qwen'
})
const messages = ref([]);
const inputMessage = ref('');
const isLoading = ref(false);
const messageArea = ref(null);

// 待发送的图片附件（base64列表）
const pendingImages = ref([]); // [{dataUrl: 'data:image/...;base64,...', name: 'xxx.png'}]

// 处理图片上传（转base64后附加到消息）
const handleFileUpload = (file) => {
  const isImage = file.type.startsWith('image/');
  const isLt10M = file.size / 1024 / 1024 < 10;
  if (!isImage) {
    ElMessage.error('目前仅支持上传图片文件（JPG/PNG/GIF/WEBP等）！');
    return false;
  }
  if (!isLt10M) {
    ElMessage.error('图片大小不能超过10MB！');
    return false;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    pendingImages.value.push({ dataUrl: e.target.result, name: file.name });
    ElMessage.success(`图片「${file.name}」已添加，发送消息时将一并发送给AI`);
  };
  reader.readAsDataURL(file);
  return false;
};

// 移除待发送图片
const removePendingImage = (index) => {
  pendingImages.value.splice(index, 1);
};

// 图片预览
const previewImage = (url) => {
  window.open(url, '_blank');
};

// 中止控制器
let abortController = null;
// SSE 流 reader 引用
let streamReader = null;

// 停止当前对话
const stopMessage = () => {
  if (streamReader) {
    streamReader.cancel().catch(() => {});
    streamReader = null;
  }
  if (abortController) {
    abortController.abort();
    abortController = null;
  }
  isLoading.value = false;
};

const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 12) return '上午好';
  if (hour < 18) return '下午好';
  return '晚上好';
});

const filteredSessions = computed(() => {
  if (!searchKeyword.value) return sessions.value;
  return sessions.value.filter(s => s.title.toLowerCase().includes(searchKeyword.value.toLowerCase()));
});

const formatTime = (time) => {
  if (!time) return '';
  const date = new Date(time);
  const now = new Date();
  const diff = now - date;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const formatMessage = (content) => {
  if (!content) return '';
  return marked.parse(content);
};

const createNewSession = () => {
  currentSessionId.value = null;
  messages.value = [];
  inputMessage.value = '';
  ElMessage.success('已创建新会话');
};

const loadSession = async (sessionId) => {
  try {
    currentSessionId.value = sessionId
    messages.value = []
    // 检查收藏状态
    checkFavoriteStatus();
    const res = await teacherAPI.getAISessionMessages(sessionId, 1, 200)
    const convList = res?.data?.conversations || []
    convList.sort((a, b) => (a.message_seq || 0) - (b.message_seq || 0))
    messages.value = convList.map(c => ({
      role: c.sender_type === 2 ? 'assistant' : 'user',
      content: c.message_content || '',
      displayContent: c.message_content || '',
      time: c.send_time || c.create_time
    }))
    await nextTick()
    scrollToBottom()
  } catch (error) {
    console.error('加载会话失败:', error)
    ElMessage.error('加载会话失败')
  }
}

// 处理键盘事件，Ctrl+Enter 发送
const handleKeydown = (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault()
    sendMessage()
  }
}

const sendMessage = async () => {
  if (!inputMessage.value.trim() || isLoading.value) return;

  // 构建消息内容：文本 + 图片标记
  let messageContent = inputMessage.value;
  const imageSnapshots = [...pendingImages.value];
  if (imageSnapshots.length > 0) {
    for (const img of imageSnapshots) {
      messageContent += `\n[IMAGE:${img.dataUrl}]`;
    }
  }

  const userMessage = {
    role: 'user',
    content: messageContent,
    displayContent: inputMessage.value,
    images: imageSnapshots.map(img => img.dataUrl),
    time: new Date().toISOString()
  };
  messages.value.push(userMessage);
  const question = inputMessage.value;
  inputMessage.value = '';
  pendingImages.value = [];
  isLoading.value = true;

  await nextTick();
  scrollToBottom();

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
    abortController = new AbortController();
    const response = await teacherAPI.aiChatStream({
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
          ElMessage.error(errMsg || '您的AI对话功能已被禁止使用。')
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
        ElMessage.warning(errMsg || '您的消息被系统拦截，请规范用语。')
        messages.value[assistantMsgIdx].content = errMsg || '您的消息被系统拦截，请规范用语。'
        isLoading.value = false
        return
      }
      throw new Error(errMsg || 'AI对话请求失败')
    }

    // 读取 SSE 流
    const reader = response.body.getReader()
    streamReader = reader
    const decoder = new TextDecoder('utf-8')
    let buffer = ''
    // think标签状态机
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

    let streamDone = false
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
          if (data === '[DONE]') { streamDone = true; break }
          try {
            const chunk = JSON.parse(data)
            if (chunk.content) {
              processChunkContent(chunk.content)
              await nextTick()
              scrollToBottom()
            }
            if (chunk.is_end) streamDone = true
          } catch (e) { /* 忽略解析错误 */ }
        }
      }

      if (streamDone) {
        if (thinkBuf) {
          const msg = messages.value[assistantMsgIdx]
          if (inThink) msg.thinkContent += thinkBuf
          else msg.content += thinkBuf
          thinkBuf = ''
        }
        isLoading.value = false
        reader.cancel().catch(() => {})
        break
      }
    }
  } catch (error) {
    if (error?.name === 'AbortError') {
      // 用户主动终止
    } else {
      ElMessage.error('发送消息失败：' + (error?.message || error));
      if (messages.value[assistantMsgIdx]?.content === '' && !messages.value[assistantMsgIdx]?.thinkContent) {
        messages.value.splice(assistantMsgIdx, 1)
      }
    }
  } finally {
    isLoading.value = false;
    abortController = null;
    streamReader = null;
    // 发送完成后刷新会话列表
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
};

const exportSession = () => {
  if (messages.value.length === 0) {
    ElMessage.warning('当前会话为空，无法导出');
    return;
  }

  const title = `会话记录_${new Date().toISOString().split('T')[0]}`;
  let htmlContent = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>${title}</title></head><body>`;
  htmlContent += `<h1>${title}</h1>`;
  messages.value.forEach(msg => {
    const role = msg.role === 'user' ? '用户' : 'AI助教';
    htmlContent += `<h3>${role}</h3><p>${msg.content.replace(/\n/g, '<br>')}</p><hr>`;
  });
  htmlContent += '</body></html>';

  const blob = new Blob([htmlContent], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title}.doc`;
  link.click();
  URL.revokeObjectURL(url);

  ElMessage.success('导出成功');
};

const scrollToBottom = () => {
  if (messageArea.value) {
    messageArea.value.scrollTop = messageArea.value.scrollHeight;
  }
};

const goBack = () => {
  router.push({ name: 'TeacherDashboard' });
};

// 收藏状态
const isFavorited = ref(false);

// 检查收藏状态
const checkFavoriteStatus = async () => {
  if (!currentSessionId.value) {
    isFavorited.value = false;
    return;
  }
  try {
    const res = await teacherAPI.checkFavorite(currentSessionId.value);
    isFavorited.value = res?.data?.data?.is_favorited || false;
  } catch (e) {
    console.error('检查收藏状态失败:', e);
  }
};

// 收藏/取消收藏会话
const collectSession = async () => {
  if (messages.value.length === 0) {
    ElMessage.warning('当前会话为空，无法收藏');
    return;
  }
  if (!currentSessionId.value) {
    ElMessage.warning('请先发送一条消息创建会话');
    return;
  }
  try {
    if (isFavorited.value) {
      await teacherAPI.unfavoriteSession(currentSessionId.value);
      isFavorited.value = false;
      ElMessage.success('已取消收藏');
    } else {
      await teacherAPI.favoriteSession(currentSessionId.value);
      isFavorited.value = true;
      ElMessage.success('会话已收藏');
    }
  } catch (e) {
    console.error('收藏操作失败:', e);
    ElMessage.error('操作失败');
  }
};

onMounted(async () => {
  // 从 userInfo 中解析教师姓名
  const info = localStorage.getItem('userInfo')
  if (info && info !== 'undefined') {
    try {
      const parsed = JSON.parse(info)
      teacherName.value = parsed.name || parsed.teacher_name || teacherName.value
    } catch {}
  }

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
  loadModels()  // 加载模型列表
})
</script>

<style scoped lang="scss">
.teacher-ai-chat-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f0f4ff 0%, #fafbff 100%);
  padding: 20px;

  // 顶部栏
  .top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    background: white;
    padding: 15px 25px;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    }

    :deep(.el-button--primary) {
      background: linear-gradient(135deg, #4F6EF7 0%, #60A5FA 100%);
      border: none;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(79, 110, 247, 0.4);
      }
    }
  }

  // 聊天容器
  .chat-container {
    display: flex;
    gap: 20px;
    height: calc(100vh - 140px);

    // 左侧边栏
    .sidebar {
      width: 280px;
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
      display: flex;
      flex-direction: column;
      transition: all 0.3s ease;

      &:hover {
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
      }

      .new-session-btn {
        width: 100%;
        margin-bottom: 15px;
        height: 44px;
        font-size: 16px;
        font-weight: 600;
        background: linear-gradient(135deg, #4F6EF7 0%, #60A5FA 100%);
        border: none;
        transition: all 0.3s ease;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(79, 110, 247, 0.4);
        }

        &:active {
          transform: translateY(0);
        }
      }

      .session-search {
        margin-bottom: 15px;
      }

      .session-list {
        flex: 1;
        overflow-y: auto;

        .session-item {
          padding: 12px;
          border-radius: 8px;
          cursor: pointer;
          margin-bottom: 8px;
          transition: all 0.3s;
          border: 1px solid transparent;

          &:hover {
            background: #f5f7fa;
            transform: translateX(4px);
          }

          &.active {
            background: linear-gradient(135deg, #e8eeff 0%, #f0f4ff 100%);
            border-color: #4F6EF7;
            box-shadow: 0 2px 8px rgba(79, 110, 247, 0.2);
          }

          .session-title {
            font-size: 14px;
            font-weight: 500;
            color: #303133;
            margin-bottom: 5px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .session-time {
            font-size: 12px;
            color: #909399;
          }
        }
      }
    }

    // 中间主区域
    .chat-main {
      flex: 1;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
      display: flex;
      flex-direction: column;

      // 功能栏
      .function-bar {
        display: flex;
        align-items: center;
        gap: 20px;
        padding: 12px 25px;
        border-bottom: 1px solid #e4e7ed;
        background: linear-gradient(to right, #fafbff 0%, #f8f9ff 100%);
        flex-wrap: wrap;

        .function-item {
          display: flex;
          align-items: center;
          gap: 10px;

          &.model-item {
            flex: 1;
            min-width: 0;
            flex-wrap: wrap;
            gap: 8px;
          }

          .label {
            font-size: 14px;
            color: #606266;
            font-weight: 500;
            white-space: nowrap;
          }

          .qwen-auto-tip {
            font-size: 12px;
            color: #909399;
            font-style: italic;
          }

          .model-desc-badge {
            font-size: 12px;
            color: #4F6EF7;
            background: rgba(79, 110, 247, 0.08);
            border: 1px solid rgba(79, 110, 247, 0.2);
            border-radius: 20px;
            padding: 2px 10px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 260px;
          }

          :deep(.el-select) {
            .el-input__wrapper {
              border-radius: 8px;
              transition: all 0.3s ease;

              &:hover {
                box-shadow: 0 0 0 1px #4F6EF7;
              }
            }
          }

          :deep(.el-switch) {
            --el-switch-on-color: #4F6EF7;
          }
        }
      }

      // 消息区域
      .message-area {
        flex: 1;
        overflow-y: auto;
        padding: 25px;

        // 欢迎消息
        .welcome-message {
          text-align: center;
          padding: 80px 20px;

          .welcome-icon {
            display: inline-flex;
            width: 100px;
            height: 100px;
            border-radius: 50%;
            background: linear-gradient(135deg, #4F6EF7 0%, #60A5FA 100%);
            align-items: center;
            justify-content: center;
            color: white;
            margin-bottom: 24px;
            box-shadow: 0 8px 24px rgba(79, 110, 247, 0.3);
            animation: float 3s ease-in-out infinite;
          }

          h2 {
            margin: 0 0 15px 0;
            font-size: 28px;
            font-weight: 600;
            background: linear-gradient(135deg, #4F6EF7 0%, #60A5FA 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          p {
            margin: 0;
            font-size: 16px;
            color: #606266;
          }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        // 消息列表
        .message-list {
          .message-item {
            display: flex;
            gap: 15px;
            margin-bottom: 25px;

            &.user {
              flex-direction: row-reverse;

              .message-content {
                align-items: flex-end;

                .message-text {
                  background: linear-gradient(135deg, #4F6EF7 0%, #60A5FA 100%);
                  color: white;
                }
              }
            }

            .message-avatar {
              flex-shrink: 0;
            }

            .message-content {
              flex: 1;
              display: flex;
              flex-direction: column;
              gap: 8px;

              // 深度思考区块
              .think-block {
                max-width: 80%;
                margin-bottom: 8px;
                border: 1px solid rgba(79, 110, 247, 0.25);
                border-radius: 10px;
                overflow: hidden;
                background: rgba(79, 110, 247, 0.04);

                .think-header {
                  display: flex;
                  align-items: center;
                  gap: 6px;
                  padding: 8px 12px;
                  cursor: pointer;
                  user-select: none;
                  background: rgba(79, 110, 247, 0.08);
                  transition: background 0.2s;

                  &:hover { background: rgba(79, 110, 247, 0.14); }

                  .think-icon { font-size: 14px; }
                  .think-title { font-size: 13px; font-weight: 600; color: #4F6EF7; flex: 1; }
                  .think-toggle { font-size: 12px; color: #909399; }
                }

                .think-content {
                  padding: 10px 14px;
                  font-size: 13px;
                  line-height: 1.7;
                  color: #606266;
                  border-top: 1px dashed rgba(79, 110, 247, 0.2);
                  white-space: pre-wrap;
                  word-wrap: break-word;
                }
              }

              .message-text {
                background: #f5f7fa;
                padding: 12px 16px;
                border-radius: 12px;
                font-size: 15px;
                line-height: 1.6;
                max-width: 80%;
                word-wrap: break-word;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
                transition: all 0.3s ease;

                &:hover {
                  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                }

                :deep(code) {
                  background: rgba(0, 0, 0, 0.1);
                  padding: 2px 6px;
                  border-radius: 4px;
                  font-family: 'Courier New', monospace;
                }

                :deep(pre) {
                  background: #1e1e1e;
                  color: #d4d4d4;
                  padding: 14px 18px;
                  border-radius: 8px;
                  overflow-x: auto;
                  margin: 10px 0;
                  font-size: 13px;
                  line-height: 1.5;

                  code {
                    background: transparent;
                    padding: 0;
                    color: inherit;
                  }
                }

                :deep(table) {
                  border-collapse: collapse;
                  width: 100%;
                  margin: 10px 0;
                  font-size: 14px;

                  th, td {
                    border: 1px solid #dcdfe6;
                    padding: 8px 12px;
                    text-align: left;
                  }

                  th {
                    background: #f5f7fa;
                    font-weight: 600;
                    color: #303133;
                  }

                  tr:nth-child(even) {
                    background: #fafafa;
                  }
                }

                :deep(h1), :deep(h2), :deep(h3), :deep(h4) {
                  margin: 16px 0 8px;
                  font-weight: 600;
                  color: #303133;
                }

                :deep(h3) { font-size: 16px; }
                :deep(h4) { font-size: 15px; }

                :deep(ul), :deep(ol) {
                  padding-left: 20px;
                  margin: 8px 0;
                }

                :deep(li) {
                  margin: 4px 0;
                }

                :deep(hr) {
                  border: none;
                  border-top: 1px solid #e4e7ed;
                  margin: 12px 0;
                }

                :deep(blockquote) {
                  border-left: 4px solid #4F6EF7;
                  padding: 8px 16px;
                  margin: 10px 0;
                  background: rgba(79, 110, 247, 0.05);
                  color: #606266;
                }

                :deep(p) {
                  margin: 6px 0;
                }

                // 消息中的图片预览
                .message-images {
                  display: flex;
                  flex-wrap: wrap;
                  gap: 8px;
                  margin-top: 8px;

                  .message-image-preview {
                    max-width: 200px;
                    max-height: 200px;
                    border-radius: 8px;
                    cursor: pointer;
                    object-fit: cover;
                    border: 1px solid rgba(0, 0, 0, 0.1);
                    transition: all 0.2s ease;

                    &:hover {
                      transform: scale(1.02);
                      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    }
                  }
                }
              }

              .message-time {
                font-size: 12px;
                color: #909399;
              }

              .loading-dots {
                display: flex;
                gap: 5px;
                padding: 12px 16px;

                span {
                  width: 8px;
                  height: 8px;
                  background: #409eff;
                  border-radius: 50%;
                  animation: bounce 1.4s infinite ease-in-out both;

                  &:nth-child(1) {
                    animation-delay: -0.32s;
                  }

                  &:nth-child(2) {
                    animation-delay: -0.16s;
                  }
                }
              }
            }
          }
        }
      }

      // 输入区域
      .input-area {
        border-top: 1px solid #e4e7ed;
        padding: 20px 25px;
        background: linear-gradient(to top, #fafbff 0%, white 100%);

        .input-wrapper {
          :deep(.el-textarea__inner) {
            border-radius: 10px;
            font-size: 15px;
            border: 2px solid #e4e7ed;
            transition: all 0.3s ease;

            &:focus {
              border-color: #4F6EF7;
              box-shadow: 0 0 0 3px rgba(79, 110, 247, 0.1);
            }
          }

          // 待发送图片预览区
          .pending-images {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 10px;

            .pending-image-item {
              display: flex;
              align-items: center;
              gap: 6px;
              background: #f0f4ff;
              border: 1px solid rgba(79, 110, 247, 0.3);
              border-radius: 8px;
              padding: 4px 8px 4px 4px;

              .pending-image-thumb {
                width: 40px;
                height: 40px;
                object-fit: cover;
                border-radius: 6px;
              }

              .pending-image-name {
                font-size: 12px;
                color: #606266;
                max-width: 100px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              }

              .pending-image-remove {
                cursor: pointer;
                color: #909399;
                font-size: 14px;
                flex-shrink: 0;

                &:hover {
                  color: #f56c6c;
                }
              }
            }
          }

          .input-actions {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 12px;

            .action-left { display: flex; align-items: center; }
            .action-right { display: flex; align-items: center; }

            :deep(.el-button--primary) {
              background: linear-gradient(135deg, #4F6EF7 0%, #60A5FA 100%);
              border: none;
              height: 40px;
              padding: 0 24px;
              font-weight: 500;
              transition: all 0.3s ease;

              &:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(79, 110, 247, 0.4);
              }

              &:active {
                transform: translateY(0);
              }
            }

            :deep(.el-button--text) {
              color: #4F6EF7;
              transition: all 0.3s ease;

              &:hover {
                background: rgba(79, 110, 247, 0.1);
              }
            }
          }
        }
      }
    }

    // 右侧面板
    .right-panel {
      width: 220px;
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
      transition: all 0.3s ease;

      &:hover {
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
      }

      .panel-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 16px;
        font-weight: 600;
        color: #303133;
        margin-bottom: 20px;
        padding-bottom: 12px;
        border-bottom: 2px solid #f0f0f0;

        .el-icon {
          color: #4F6EF7;
        }
      }

      .panel-actions {
        display: flex;
        flex-direction: column;
        gap: 12px;

        .action-btn {
          width: 100%;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.3s ease;
          border: none;
          box-sizing: border-box;

          .el-icon {
            font-size: 18px;
            flex-shrink: 0;
          }

          span {
            flex-shrink: 0;
          }

          &:hover {
            transform: translateX(4px);
          }

          &:active {
            transform: translateX(2px);
          }

          // 收藏按钮 - 金色主题
          &.collect-btn {
            background: linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%);
            color: #d48806;

            &:hover {
              background: linear-gradient(135deg, #ffe7ba 0%, #ffd666 100%);
              box-shadow: 0 4px 12px rgba(255, 214, 102, 0.4);
            }

            &.is-favorited {
              background: linear-gradient(135deg, #ffd666 0%, #ffa940 100%);
              color: #873800;
            }
          }

          // 导出按钮 - 蓝色主题
          &.export-btn {
            background: linear-gradient(135deg, #f0f9ff 0%, #d1f0ff 100%);
            color: #0958d9;

            &:hover {
              background: linear-gradient(135deg, #d1f0ff 0%, #91d5ff 100%);
              box-shadow: 0 4px 12px rgba(145, 213, 255, 0.4);
            }
          }

          // 标题按钮 - 紫色主题
          &.title-btn {
            background: linear-gradient(135deg, #f0e6ff 0%, #d9c3ff 100%);
            color: #531dab;

            &:hover {
              background: linear-gradient(135deg, #d9c3ff 0%, #b37feb 100%);
              box-shadow: 0 4px 12px rgba(179, 127, 235, 0.4);
            }
          }
        }
      }
    }
  }
}

// 动画
@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

// fade 过渡
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

// 模型选项下拉样式（全局，popper在body下）
:global(.model-select-popper .el-select-dropdown__item) {
  height: auto !important;
  padding: 8px 12px !important;
}

:global(.model-option-item) {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 2px 0;
}

:global(.model-option-header) {
  display: flex;
  align-items: center;
  gap: 8px;
}

:global(.model-option-name) {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
}

:global(.model-option-provider) {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 10px;
  font-weight: 500;

  &.doubao {
    background: rgba(255, 107, 53, 0.1);
    color: #e05a2b;
  }

  &.qwen {
    background: rgba(79, 110, 247, 0.1);
    color: #4F6EF7;
  }
}

:global(.model-option-desc) {
  font-size: 11px;
  color: #909399;
  line-height: 1.4;
}

// 响应式
@media (max-width: 1200px) {
  .chat-container {
    .sidebar {
      width: 240px;
    }

    .right-panel {
      width: 200px;
    }
  }
}

@media (max-width: 768px) {
  .chat-container {
    flex-direction: column;

    .sidebar,
    .right-panel {
      width: 100%;
      height: auto;
    }
  }
}

// 滚动条美化
.message-area::-webkit-scrollbar {
  width: 6px;
}

.message-area::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #4F6EF7 0%, #60A5FA 100%);
  border-radius: 3px;
}

.message-area::-webkit-scrollbar-track {
  background: #f5f7fa;
  border-radius: 3px;
}

.session-list::-webkit-scrollbar {
  width: 6px;
}

.session-list::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #4F6EF7 0%, #60A5FA 100%);
  border-radius: 3px;
}

.session-list::-webkit-scrollbar-track {
  background: #f5f7fa;
  border-radius: 3px;
}
</style>
