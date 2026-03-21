<template>
  <div class="task-complete-page">
    <!-- 顶部栏 -->
    <div class="top-bar">
      <el-button type="primary" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        返回首页
      </el-button>
      <el-breadcrumb separator="/">
        <el-breadcrumb-item>学生端</el-breadcrumb-item>
        <el-breadcrumb-item>{{ taskTypeText }}</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <div class="task-container">
      <!-- 题目展示区 -->
      <div class="question-section">
        <el-card class="question-card">
          <template #header>
            <div class="card-header">
              <span class="header-title">题目内容</span>
              <div class="header-tags">
                <el-tag :type="getTaskTypeColor(taskType)">{{ taskTypeText }}</el-tag>
                <el-tag v-if="isWrongQuestion" type="danger">错题</el-tag>
                <el-tag type="warning" v-if="deadline">
                  <el-icon><Clock /></el-icon>
                  截止：{{ formatDate(deadline) }}
                </el-tag>
              </div>
            </div>
          </template>

          <div class="question-content">
            <h3 class="question-title">{{ questionTitle }}</h3>
            
            <!-- 文本内容 -->
            <div v-if="questionText" class="question-text" v-html="formatText(questionText)"></div>
            
            <!-- 图片内容 -->
            <div v-if="questionImages.length > 0" class="question-images">
              <el-image
                v-for="(img, index) in questionImages"
                :key="index"
                :src="img"
                :preview-src-list="questionImages"
                fit="contain"
                class="question-image"
              />
            </div>

            <!-- 题目信息 -->
            <div class="question-info">
              <div class="info-item">
                <span class="label">所属科目：</span>
                <span class="value">{{ subject }}</span>
              </div>
              <div class="info-item" v-if="teacher">
                <span class="label">发布教师：</span>
                <span class="value">{{ teacher }}</span>
              </div>
              <div class="info-item" v-if="score">
                <span class="label">分值：</span>
                <span class="value">{{ score }}分</span>
              </div>
            </div>
          </div>
        </el-card>

        <!-- AI问询按钮 -->
        <div class="ai-inquiry-section">
          <el-button type="primary" size="large" @click="goToAIChat">
            <el-icon><ChatDotRound /></el-icon>
            AI问询
          </el-button>
          <span class="inquiry-tip">遇到问题？点击向AI助教提问</span>
        </div>
      </div>

      <!-- 答题区 -->
      <div class="answer-section">
        <el-card class="answer-card">
          <template #header>
            <div class="card-header">
              <span class="header-title">我的答案</span>
              <div class="header-actions">
                <el-tag v-if="savedTime" type="success">
                  <el-icon><Check /></el-icon>
                  已保存草稿
                </el-tag>
              </div>
            </div>
          </template>

          <div class="answer-content">
            <el-input
              v-model="answerText"
              type="textarea"
              :rows="15"
              placeholder="请在此输入您的答案..."
              :disabled="isSubmitted"
            />

            <!-- 字数统计 -->
            <div class="answer-stats">
              <span>字数：{{ answerText.length }}</span>
              <span v-if="savedTime">上次保存：{{ formatTime(savedTime) }}</span>
            </div>

            <!-- 操作按钮 -->
            <div class="answer-actions">
              <el-button
                type="info"
                :loading="savingDraft"
                :disabled="isSubmitted || !answerText.trim()"
                @click="saveDraft"
              >
                <el-icon><Document /></el-icon>
                保存草稿
              </el-button>
              <el-button
                type="primary"
                :loading="submitting"
                :disabled="isSubmitted || !answerText.trim()"
                @click="confirmSubmit"
              >
                <el-icon><Check /></el-icon>
                提交答案
              </el-button>
            </div>

            <!-- 已提交提示 -->
            <el-alert
              v-if="isSubmitted"
              title="您已提交答案"
              type="success"
              :closable="false"
              show-icon
              class="submitted-alert"
            >
              <template #default>
                <div>提交时间：{{ formatDate(submitTime) }}</div>
                <div v-if="score">得分：{{ score }}分</div>
              </template>
            </el-alert>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';

const router = useRouter();
const route = useRoute();

// 任务信息
const taskId = ref(route.query.id);
const taskType = ref(route.query.type || '作业');
const isWrongQuestion = ref(route.query.isWrong === 'true');

// 题目信息
const questionTitle = ref('');
const questionText = ref('');
const questionImages = ref([]);
const subject = ref('');
const teacher = ref('');
const score = ref(0);
const deadline = ref('');

// 答案信息
const answerText = ref('');
const savedTime = ref(null);
const isSubmitted = ref(false);
const submitTime = ref(null);

// 加载状态
const savingDraft = ref(false);
const submitting = ref(false);

// 任务类型文本
const taskTypeText = computed(() => {
  const typeMap = {
    '讨论': '课堂讨论',
    '作业': '课后作业',
    '考试': '在线考试'
  };
  return typeMap[taskType.value] || taskType.value;
});

// 获取任务类型颜色
const getTaskTypeColor = (type) => {
  const colorMap = {
    '讨论': 'primary',
    '作业': 'success',
    '考试': 'danger'
  };
  return colorMap[type] || 'info';
};

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

// 格式化时间（相对时间）
const formatTime = (time) => {
  if (!time) return '';
  const date = new Date(time);
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  
  return formatDate(time);
};

// 格式化文本（支持简单的Markdown）
const formatText = (text) => {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
};

// 加载任务详情
const loadTaskDetail = async () => {
  try {
    // TODO: 调用API获取任务详情
    // 模拟数据
    questionTitle.value = '第三章课后习题 - 快速排序算法实现';
    questionText.value = `请完成以下任务：

1. 用你熟悉的编程语言实现快速排序算法
2. 分析该算法的时间复杂度和空间复杂度
3. 说明快速排序的优缺点

**要求：**
- 代码需要有详细注释
- 分析要有理论依据
- 字数不少于500字`;
    
    questionImages.value = [];
    subject.value = '数据结构与算法';
    teacher.value = '张老师';
    score.value = 100;
    deadline.value = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();

    // 加载草稿
    const draft = localStorage.getItem(`task_draft_${taskId.value}`);
    if (draft) {
      const draftData = JSON.parse(draft);
      answerText.value = draftData.content;
      savedTime.value = draftData.time;
    }
  } catch (error) {
    console.error('加载任务详情失败:', error);
    ElMessage.error('加载任务详情失败');
  }
};

// 保存草稿
const saveDraft = async () => {
  if (!answerText.value.trim()) {
    ElMessage.warning('答案内容不能为空');
    return;
  }

  savingDraft.value = true;

  try {
    // TODO: 调用API保存草稿
    // 本地存储草稿
    const draftData = {
      content: answerText.value,
      time: new Date().toISOString()
    };
    localStorage.setItem(`task_draft_${taskId.value}`, JSON.stringify(draftData));
    savedTime.value = draftData.time;

    ElMessage.success('草稿保存成功');
  } catch (error) {
    console.error('保存草稿失败:', error);
    ElMessage.error('保存草稿失败');
  } finally {
    savingDraft.value = false;
  }
};

// 确认提交
const confirmSubmit = async () => {
  try {
    await ElMessageBox.confirm(
      '提交后将无法修改，确定要提交答案吗？',
      '确认提交',
      {
        confirmButtonText: '确定提交',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );

    await submitAnswer();
  } catch {
    // 用户取消
  }
};

// 提交答案
const submitAnswer = async () => {
  submitting.value = true;

  try {
    // TODO: 调用API提交答案
    await new Promise(resolve => setTimeout(resolve, 1500));

    isSubmitted.value = true;
    submitTime.value = new Date().toISOString();

    // 清除草稿
    localStorage.removeItem(`task_draft_${taskId.value}`);

    ElMessage.success('提交成功');

    // 延迟跳转回首页
    setTimeout(() => {
      router.push({ name: 'StudentDashboard' });
    }, 2000);
  } catch (error) {
    console.error('提交答案失败:', error);
    ElMessage.error('提交答案失败');
  } finally {
    submitting.value = false;
  }
};

// 跳转到AI对话
const goToAIChat = () => {
  const question = `我在做${taskTypeText.value}：${questionTitle.value}\n\n题目内容：\n${questionText.value}\n\n请帮我分析一下这道题。`;
  
  router.push({
    name: 'AIChat',
    query: { question }
  });
};

// 返回首页
const goBack = () => {
  if (answerText.value.trim() && !isSubmitted.value && !savedTime.value) {
    ElMessageBox.confirm(
      '您有未保存的答案，确定要离开吗？',
      '提示',
      {
        confirmButtonText: '离开',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      router.push({ name: 'StudentDashboard' });
    }).catch(() => {});
  } else {
    router.push({ name: 'StudentDashboard' });
  }
};

// 页面加载
onMounted(() => {
  loadTaskDetail();
});
</script>

<style scoped lang="scss">
.task-complete-page {
  min-height: 100vh;
  background: #f5f5f5;
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
  }

  // 任务容器
  .task-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;

    // 题目展示区
    .question-section {
      .question-card {
        margin-bottom: 20px;

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;

          .header-title {
            font-size: 18px;
            font-weight: 600;
            color: #303133;
          }

          .header-tags {
            display: flex;
            gap: 10px;
          }
        }

        .question-content {
          .question-title {
            margin: 0 0 20px 0;
            font-size: 20px;
            font-weight: 600;
            color: #303133;
          }

          .question-text {
            font-size: 15px;
            line-height: 1.8;
            color: #606266;
            margin-bottom: 20px;
            white-space: pre-wrap;

            :deep(strong) {
              color: #303133;
              font-weight: 600;
            }

            :deep(em) {
              font-style: italic;
              color: #409eff;
            }
          }

          .question-images {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;

            .question-image {
              width: 100%;
              border-radius: 8px;
              cursor: pointer;
            }
          }

          .question-info {
            background: #f5f7fa;
            padding: 15px;
            border-radius: 8px;

            .info-item {
              margin-bottom: 10px;
              font-size: 14px;

              &:last-child {
                margin-bottom: 0;
              }

              .label {
                color: #909399;
                margin-right: 8px;
              }

              .value {
                color: #303133;
                font-weight: 500;
              }
            }
          }
        }
      }

      .ai-inquiry-section {
        display: flex;
        align-items: center;
        gap: 15px;
        padding: 20px;
        background: linear-gradient(135deg, #4F6EF7 0%, #60A5FA 100%);
        border-radius: 12px;
        color: white;

        .el-button {
          flex-shrink: 0;
        }

        .inquiry-tip {
          font-size: 14px;
          opacity: 0.9;
        }
      }
    }

    // 答题区
    .answer-section {
      .answer-card {
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;

          .header-title {
            font-size: 18px;
            font-weight: 600;
            color: #303133;
          }
        }

        .answer-content {
          :deep(.el-textarea__inner) {
            font-size: 15px;
            line-height: 1.8;
          }

          .answer-stats {
            display: flex;
            justify-content: space-between;
            margin-top: 10px;
            font-size: 13px;
            color: #909399;
          }

          .answer-actions {
            display: flex;
            gap: 15px;
            margin-top: 20px;
          }

          .submitted-alert {
            margin-top: 20px;
          }
        }
      }
    }
  }
}

// 响应式
@media (max-width: 1200px) {
  .task-container {
    grid-template-columns: 1fr !important;
  }
}
</style>
