<template>
  <div class="ai-chat-page">
    <!-- 顶部返回按钮 -->
    <div class="top-bar">
      <el-button type="primary" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        返回首页
      </el-button>
      <el-breadcrumb separator="/">
        <el-breadcrumb-item>学生端</el-breadcrumb-item>
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
          <el-input
            v-model="searchKeyword"
            placeholder="搜索会话..."
            :prefix-icon="Search"
            clearable
          />
        </div>

        <el-tabs v-model="sessionTab" class="session-tabs">
          <el-tab-pane label="历史会话" name="history">
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
          </el-tab-pane>
        </el-tabs>
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
              <el-option label="Gemini 3" value="gemini3" />
            </el-select>
          </div>
          <div class="function-item">
            <span class="label">联网搜索：</span>
            <el-switch v-model="enableWebSearch" />
          </div>
          <div class="function-item">
            <span class="label">深度思考：</span>
            <el-switch v-model="enableDeepThink" />
          </div>
        </div>

        <!-- 对话展示区 -->
        <div class="message-area" ref="messageArea">
          <!-- 欢迎语 -->
          <div v-if="messages.length === 0" class="welcome-message">
            <div class="welcome-icon">
              <el-icon :size="60"><ChatDotRound /></el-icon>
            </div>
            <h2>{{ greeting }}，{{ studentName }}</h2>
            <p>我是您的AI智能助教，有什么可以帮助您的吗？</p>
          </div>

          <!-- 消息列表 -->
          <div v-else class="message-list">
            <div
              v-for="(msg, index) in messages"
              :key="index"
              class="message-item"
              :class="msg.role"
            >
              <div class="message-avatar">
                <el-avatar v-if="msg.role === 'user'" :size="40">
                  {{ studentName.charAt(0) }}
                </el-avatar>
                <el-avatar v-else :size="40" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
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
                <el-avatar :size="40" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
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
              <el-upload
                :show-file-list="false"
                :before-upload="handleFileUpload"
                accept="image/*,.pdf,.doc,.docx"
              >
                <el-button type="text">
                  <el-icon><Paperclip /></el-icon>
                  上传文件（支持图片/PDF/Word，OCR识别）
                </el-button>
              </el-upload>
              <el-button
                type="primary"
                :loading="isLoading"
                :disabled="!inputMessage.trim()"
                @click="sendMessage"
              >
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
          <el-button class="action-btn collect-btn" @click="collectSession">
            <el-icon><Star /></el-icon>
            <span>收藏会话</span>
          </el-button>
          <el-button class="action-btn export-btn" @click="showExportDialog">
            <el-icon><Download /></el-icon>
            <span>导出会话</span>
          </el-button>
          <el-button class="action-btn title-btn" @click="generateTitle">
            <el-icon><Edit /></el-icon>
            <span>生成标题</span>
          </el-button>
        </div>
      </div>
    </div>

    <!-- 导出会话对话框 -->
    <el-dialog v-model="exportDialogVisible" title="导出会话" width="400px">
      <el-radio-group v-model="exportFormat">
        <el-radio label="markdown">Markdown格式</el-radio>
        <el-radio label="text">文本格式</el-radio>
      </el-radio-group>
      <template #footer>
        <el-button @click="exportDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="exportSession">确定导出</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Search } from '@element-plus/icons-vue';

const router = useRouter();
const route = useRoute();

// 学生信息
const studentName = ref(localStorage.getItem('userName') || '同学');

// 会话相关
const sessionTab = ref('history');
const searchKeyword = ref('');
const sessions = ref([]);
const currentSessionId = ref(null);

// 模型配置
const selectedModel = ref('deepseek');
const enableWebSearch = ref(false);
const enableDeepThink = ref(false);

// 消息相关
const messages = ref([]);
const inputMessage = ref('');
const isLoading = ref(false);
const messageArea = ref(null);

// 导出对话框
const exportDialogVisible = ref(false);
const exportFormat = ref('markdown');

// 根据时间生成问候语
const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 6) return '凌晨好';
  if (hour < 12) return '上午好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  return '晚上好';
});

// 过滤会话列表
const filteredSessions = computed(() => {
  if (!searchKeyword.value) return sessions.value;
  return sessions.value.filter(s =>
    s.title.toLowerCase().includes(searchKeyword.value.toLowerCase())
  );
});

// 格式化时间
const formatTime = (time) => {
  if (!time) return '';
  const date = new Date(time);
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// 格式化消息内容（支持Markdown）
const formatMessage = (content) => {
  // 简单的Markdown转换
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');
};

// 创建新会话
const createNewSession = () => {
  currentSessionId.value = null;
  messages.value = [];
  inputMessage.value = '';
  ElMessage.success('已创建新会话');
};

// 加载会话
const loadSession = async (sessionId) => {
  try {
    currentSessionId.value = sessionId;
    // TODO: 调用API加载会话内容
    // 模拟数据
    messages.value = [
      {
        role: 'user',
        content: '请解释一下快速排序算法的原理',
        time: new Date(Date.now() - 3600000).toISOString()
      },
      {
        role: 'assistant',
        content: '快速排序是一种**分治算法**，其基本思想是：\n1. 选择一个基准元素\n2. 将数组分为两部分，小于基准的在左边，大于基准的在右边\n3. 递归地对左右两部分进行排序\n\n时间复杂度：平均O(n log n)，最坏O(n²)',
        time: new Date(Date.now() - 3500000).toISOString()
      }
    ];
    await nextTick();
    scrollToBottom();
  } catch (error) {
    console.error('加载会话失败:', error);
    ElMessage.error('加载会话失败');
  }
};

// 发送消息
const sendMessage = async () => {
  if (!inputMessage.value.trim() || isLoading.value) return;

  const userMessage = {
    role: 'user',
    content: inputMessage.value,
    time: new Date().toISOString()
  };

  messages.value.push(userMessage);
  const question = inputMessage.value;
  inputMessage.value = '';
  isLoading.value = true;

  await nextTick();
  scrollToBottom();

  try {
    // TODO: 调用AI API
    // 模拟AI回复
    await new Promise(resolve => setTimeout(resolve, 2000));

    const aiMessage = {
      role: 'assistant',
      content: `这是对"${question}"的回答。我理解您的问题，让我为您详细解答...`,
      time: new Date().toISOString()
    };

    messages.value.push(aiMessage);
    await nextTick();
    scrollToBottom();
  } catch (error) {
    console.error('发送消息失败:', error);
    ElMessage.error('发送消息失败');
  } finally {
    isLoading.value = false;
  }
};

// 处理文件上传
const handleFileUpload = (file) => {
  const isValidType = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type);
  const isLt10M = file.size / 1024 / 1024 < 10;

  if (!isValidType) {
    ElMessage.error('只支持上传图片、PDF或Word文档！');
    return false;
  }
  if (!isLt10M) {
    ElMessage.error('文件大小不能超过10MB！');
    return false;
  }

  // TODO: 上传文件并OCR识别
  ElMessage.success('文件上传成功，正在识别...');
  return false; // 阻止自动上传
};

// 收藏会话
const collectSession = () => {
  if (messages.value.length === 0) {
    ElMessage.warning('当前会话为空，无法收藏');
    return;
  }
  // TODO: 调用API收藏会话
  ElMessage.success('会话已收藏');
};

// 显示导出对话框
const showExportDialog = () => {
  if (messages.value.length === 0) {
    ElMessage.warning('当前会话为空，无法导出');
    return;
  }
  exportDialogVisible.value = true;
};

// 导出会话
const exportSession = () => {
  let content = '';
  const title = `会话记录_${new Date().toISOString().split('T')[0]}`;

  if (exportFormat.value === 'markdown') {
    content = `# ${title}\n\n`;
    messages.value.forEach(msg => {
      content += `## ${msg.role === 'user' ? '用户' : 'AI助教'}\n\n${msg.content}\n\n---\n\n`;
    });
  } else {
    content = `${title}\n\n`;
    messages.value.forEach(msg => {
      content += `【${msg.role === 'user' ? '用户' : 'AI助教'}】\n${msg.content}\n\n`;
    });
  }

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title}.${exportFormat.value === 'markdown' ? 'md' : 'txt'}`;
  link.click();
  URL.revokeObjectURL(url);

  exportDialogVisible.value = false;
  ElMessage.success('导出成功');
};

// 生成标题
const generateTitle = async () => {
  if (messages.value.length === 0) {
    ElMessage.warning('当前会话为空，无法生成标题');
    return;
  }

  try {
    // TODO: 调用AI API生成标题
    const title = await ElMessage.prompt('请输入会话标题', '生成标题', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputValue: '新会话'
    });

    if (title.value) {
      ElMessage.success('标题已更新');
    }
  } catch {
    // 用户取消
  }
};

// 滚动到底部
const scrollToBottom = () => {
  if (messageArea.value) {
    messageArea.value.scrollTop = messageArea.value.scrollHeight;
  }
};

// 返回首页
const goBack = () => {
  router.push({ name: 'StudentDashboard' });
};

// 加载历史会话列表
const loadSessions = async () => {
  try {
    // TODO: 调用API获取会话列表
    // 模拟数据
    sessions.value = [
      {
        id: 1,
        title: '快速排序算法讨论',
        updateTime: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 2,
        title: '数据结构课后习题',
        updateTime: new Date(Date.now() - 86400000).toISOString()
      }
    ];
  } catch (error) {
    console.error('加载会话列表失败:', error);
  }
};

// 监听路由参数，如果携带题目信息则自动填充
watch(() => route.query.question, (question) => {
  if (question) {
    inputMessage.value = question;
    nextTick(() => {
      // 聚焦输入框
      const textarea = document.querySelector('.input-area textarea');
      if (textarea) textarea.focus();
    });
  }
}, { immediate: true });

// 页面加载
onMounted(() => {
  loadSessions();
});
</script>

<style scoped lang="scss">
.ai-chat-page {
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
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
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
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        transition: all 0.3s ease;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        &:active {
          transform: translateY(0);
        }
      }

      .session-search {
        margin-bottom: 15px;
      }

      .session-tabs {
        flex: 1;
        overflow: hidden;
        display: flex;
        flex-direction: column;

        :deep(.el-tabs__content) {
          flex: 1;
          overflow: auto;
        }

        .session-list {
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
              border-color: #667eea;
              box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
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

          .empty-sessions {
            padding: 40px 0;
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
        gap: 25px;
        padding: 15px 25px;
        border-bottom: 1px solid #e4e7ed;
        background: linear-gradient(to right, #fafbff 0%, #f8f9ff 100%);

        .function-item {
          display: flex;
          align-items: center;
          gap: 10px;

          .label {
            font-size: 14px;
            color: #606266;
            font-weight: 500;
            white-space: nowrap;
          }

          :deep(.el-select) {
            .el-input__wrapper {
              border-radius: 8px;
              transition: all 0.3s ease;

              &:hover {
                box-shadow: 0 0 0 1px #667eea;
              }
            }
          }

          :deep(.el-switch) {
            --el-switch-on-color: #667eea;
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
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            align-items: center;
            justify-content: center;
            color: white;
            margin-bottom: 24px;
            box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
            animation: float 3s ease-in-out infinite;
          }

          h2 {
            margin: 0 0 15px 0;
            font-size: 28px;
            font-weight: 600;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
              border-color: #667eea;
              box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
            }
          }

          .input-actions {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 12px;

            :deep(.el-button--primary) {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border: none;
              height: 40px;
              padding: 0 24px;
              font-weight: 500;
              transition: all 0.3s ease;

              &:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
              }

              &:active {
                transform: translateY(0);
              }
            }

            :deep(.el-button--text) {
              color: #667eea;
              transition: all 0.3s ease;

              &:hover {
                background: rgba(102, 126, 234, 0.1);
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
          color: #667eea;
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
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
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
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
  border-radius: 3px;
}

.session-list::-webkit-scrollbar-track {
  background: #f5f7fa;
  border-radius: 3px;
}
</style>
