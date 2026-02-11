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
                <div class="message-text" v-html="formatMessage(msg.content)"></div>
                <div class="message-time">{{ formatTime(msg.time) }}</div>
              </div>
            </div>

            <!-- 加载中提示 -->
            <div v-if="isLoading" class="message-item assistant">
              <div class="message-avatar">
                <el-avatar :size="40" style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);">
                  <el-icon><ChatDotRound /></el-icon>
                </el-avatar>
              </div>
              <div class="message-content">
                <div class="loading-dots">
                  <span></span><span></span><span></span>
                </div>
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
              @keydown.enter.ctrl="sendMessage"
            />
            <div class="input-actions">
              <el-button type="primary" :loading="isLoading" :disabled="!inputMessage.trim()" @click="sendMessage" class="teacher-btn-primary">
                <el-icon><Promotion /></el-icon>
                发送 (Ctrl+Enter)
              </el-button>
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
  currentSessionId.value = sessionId;
  messages.value = [
    { role: 'user', content: '请帮我生成一份Python基础知识的教学资料', time: new Date(Date.now() - 3600000).toISOString() },
    { role: 'assistant', content: '好的，我为您生成了Python基础知识的教学资料...', time: new Date(Date.now() - 3500000).toISOString() }
  ];
  await nextTick();
  scrollToBottom();
};

const sendMessage = async () => {
  if (!inputMessage.value.trim() || isLoading.value) return;

  const userMessage = { role: 'user', content: inputMessage.value, time: new Date().toISOString() };
  messages.value.push(userMessage);
  const question = inputMessage.value;
  inputMessage.value = '';
  isLoading.value = true;

  await nextTick();
  scrollToBottom();

  try {
    await new Promise(resolve => setTimeout(resolve, 2000));
    const aiMessage = { role: 'assistant', content: `这是对"${question}"的回答...`, time: new Date().toISOString() };
    messages.value.push(aiMessage);
    await nextTick();
    scrollToBottom();
  } catch (error) {
    ElMessage.error('发送消息失败');
  } finally {
    isLoading.value = false;
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

onMounted(() => {
  sessions.value = [
    { id: 1, title: 'Python教学资料生成', updateTime: new Date(Date.now() - 3600000).toISOString() },
    { id: 2, title: '数据结构出题讨论', updateTime: new Date(Date.now() - 86400000).toISOString() }
  ];
});
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

          .input-actions {
            display: flex;
            justify-content: flex-end;
            margin-top: 12px;
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
