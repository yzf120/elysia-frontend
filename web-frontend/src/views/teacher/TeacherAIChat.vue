<template>
  <div class="teacher-page teacher-ai-chat-page">
    <!-- 顶部导航栏 -->
    <div class="teacher-top-nav">
      <div class="nav-left">
        <el-button type="primary" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回首页
        </el-button>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item>教师端</el-breadcrumb-item>
          <el-breadcrumb-item>AI对话</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
    </div>

    <div class="chat-container">
      <!-- 左侧会话管理栏 -->
      <div class="sidebar">
        <el-button type="primary" class="new-session-btn teacher-btn-primary" @click="createNewSession">
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
          <div class="function-item">
            <span class="label">模型选择：</span>
            <el-select v-model="selectedModel" placeholder="选择模型" style="width: 150px">
              <el-option label="DeepSeek" value="deepseek" />
              <el-option label="豆包" value="doubao" />
              <el-option label="通义千问" value="qwen" />
            </el-select>
          </div>
          <div class="function-item">
            <span class="label">联网搜索：</span>
            <el-switch v-model="enableWebSearch" />
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
            <!-- 快捷入口 -->
            <div class="quick-actions">
              <el-button type="primary" @click="quickAction('material')">
                <el-icon><Document /></el-icon>
                AI教学资料生成
              </el-button>
              <el-button type="success" @click="quickAction('question')">
                <el-icon><Edit /></el-icon>
                AI出题
              </el-button>
            </div>
          </div>

          <!-- 消息列表 -->
          <div v-else class="message-list">
            <div v-for="(msg, index) in messages" :key="index" class="message-item" :class="msg.role">
              <div class="message-avatar">
                <el-avatar v-if="msg.role === 'user'" :size="40">
                  {{ teacherName.charAt(0) }}
                </el-avatar>
                <el-avatar v-else :size="40" style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);">
                  <el-icon><ChatDotRound /></el-icon>
                </el-avatar>
              </div>
              <div class="message-content">
              <div class="message-text">
                <!-- AI 消息内容为空时显示 loading 动画 -->
                <div v-if="msg.role === 'assistant' && !msg.content" class="loading-dots">
                  <span></span><span></span><span></span>
                </div>
                <div v-else>
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
                <el-button v-if="!isLoading" type="primary" :disabled="!inputMessage.trim()" @click="sendMessage" class="teacher-btn-primary">
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
          <el-button class="action-btn" @click="exportSession">
            <el-icon><Download /></el-icon>
            <span>导出会话</span>
          </el-button>
          <el-button class="action-btn" @click="generateTitle">
            <el-icon><Edit /></el-icon>
            <span>生成标题</span>
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
import { VideoPause, Paperclip, Close } from '@element-plus/icons-vue';
import { teacherAPI } from '@/services/index.js';

const router = useRouter();

const teacherName = ref(localStorage.getItem('userName') || '教师');
const searchKeyword = ref('');
const sessions = ref([]);
const currentSessionId = ref(null);
const selectedModel = ref('deepseek');
const enableWebSearch = ref(false);
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

// 停止当前对话
const stopMessage = () => {
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
  return content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
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
  messages.value.push({ role: 'assistant', content: '', time: new Date().toISOString() })

  try {
    abortController = new AbortController();
    const response = await teacherAPI.aiChatStream({
      session_id: currentSessionId.value || '',
      question_type: 'general',
      messages: historyMessages,
      model_id: selectedModel.value || 'doubao-seed-1-6-lite-251015'
    }, abortController.signal)

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(errText || `HTTP ${response.status}`)
    }

    // 读取 SSE 流
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
      ElMessage.error('发送消息失败：' + (error?.message || error));
      if (messages.value[assistantMsgIdx]?.content === '') {
        messages.value.splice(assistantMsgIdx, 1)
      }
    }
  } finally {
    isLoading.value = false;
    abortController = null;
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

const quickAction = (type) => {
  if (type === 'material') {
    inputMessage.value = '请帮我生成一份教学资料';
  } else if (type === 'question') {
    inputMessage.value = '请帮我生成一套测试题';
  }
};

const exportSession = () => {
  if (messages.value.length === 0) {
    ElMessage.warning('当前会话为空，无法导出');
    return;
  }
  ElMessage.success('导出成功');
};

const generateTitle = () => {
  if (messages.value.length === 0) {
    ElMessage.warning('当前会话为空，无法生成标题');
    return;
  }
  ElMessage.success('标题已更新');
};

const scrollToBottom = () => {
  if (messageArea.value) {
    messageArea.value.scrollTop = messageArea.value.scrollHeight;
  }
};

const goBack = () => {
  router.push({ name: 'TeacherDashboard' });
};

onMounted(async () => {
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
})
</script>

<style scoped lang="scss">
@import '@/styles/teacher.css';

.teacher-ai-chat-page {
  .chat-container {
    display: flex;
    gap: 20px;
    height: calc(100vh - 140px);

    .sidebar {
      width: 280px;
      background: var(--teacher-card-bg);
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(30, 58, 138, 0.08);
      display: flex;
      flex-direction: column;

      .new-session-btn {
        width: 100%;
        margin-bottom: 15px;
        height: 44px;
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
            background: var(--teacher-bg);
          }

          &.active {
            background: rgba(30, 58, 138, 0.1);
            border-color: var(--teacher-primary);
          }

          .session-title {
            font-size: 14px;
            font-weight: 500;
            color: var(--teacher-text-primary);
            margin-bottom: 5px;
          }

          .session-time {
            font-size: 12px;
            color: var(--teacher-text-secondary);
          }
        }
      }
    }

    .chat-main {
      flex: 1;
      background: var(--teacher-card-bg);
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(30, 58, 138, 0.08);
      display: flex;
      flex-direction: column;

      .function-bar {
        display: flex;
        gap: 25px;
        padding: 15px 25px;
        border-bottom: 1px solid var(--teacher-border);
        background: var(--teacher-bg);

        .function-item {
          display: flex;
          align-items: center;
          gap: 10px;

          .label {
            font-size: 14px;
            color: var(--teacher-text-primary);
            font-weight: 500;
          }
        }
      }

      .message-area {
        flex: 1;
        overflow-y: auto;
        padding: 25px;

        .welcome-message {
          text-align: center;
          padding: 80px 20px;

          .welcome-icon {
            display: inline-flex;
            width: 100px;
            height: 100px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--teacher-primary) 0%, var(--teacher-primary-light) 100%);
            align-items: center;
            justify-content: center;
            color: white;
            margin-bottom: 24px;
            box-shadow: 0 8px 24px rgba(30, 58, 138, 0.3);
          }

          h2 {
            margin: 0 0 15px 0;
            font-size: 28px;
            font-weight: 600;
            color: var(--teacher-text-primary);
          }

          p {
            margin: 0 0 24px 0;
            font-size: 16px;
            color: var(--teacher-text-secondary);
          }

          .quick-actions {
            display: flex;
            gap: 12px;
            justify-content: center;
          }
        }

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
                  background: linear-gradient(135deg, var(--teacher-primary) 0%, var(--teacher-primary-light) 100%);
                  color: white;
                }
              }
            }

            .message-content {
              flex: 1;
              display: flex;
              flex-direction: column;
              gap: 8px;

              .message-text {
                background: var(--teacher-bg);
                padding: 12px 16px;
                border-radius: 12px;
                font-size: 15px;
                line-height: 1.6;
                max-width: 80%;

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
                    &:hover { transform: scale(1.02); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
                  }
                }
              }

              .message-time {
                font-size: 12px;
                color: var(--teacher-text-secondary);
              }

              .loading-dots {
                display: flex;
                gap: 5px;
                padding: 12px 16px;

                span {
                  width: 8px;
                  height: 8px;
                  background: var(--teacher-primary);
                  border-radius: 50%;
                  animation: bounce 1.4s infinite ease-in-out both;

                  &:nth-child(1) { animation-delay: -0.32s; }
                  &:nth-child(2) { animation-delay: -0.16s; }
                }
              }
            }
          }
        }
      }

      .input-area {
        border-top: 1px solid var(--teacher-border);
        padding: 20px 25px;
        background: var(--teacher-bg);

        .input-wrapper {
          :deep(.el-textarea__inner) {
            border-radius: 10px;
            font-size: 15px;
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
              background: rgba(30, 58, 138, 0.06);
              border: 1px solid rgba(30, 58, 138, 0.2);
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
                &:hover { color: #f56c6c; }
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
          }
        }
      }
    }

    .right-panel {
      width: 220px;
      background: var(--teacher-card-bg);
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(30, 58, 138, 0.08);

      .panel-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 16px;
        font-weight: 600;
        color: var(--teacher-text-primary);
        margin-bottom: 20px;
        padding-bottom: 12px;
        border-bottom: 2px solid var(--teacher-border);
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
        }
      }
    }
  }
}

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}
</style>
