<template>
  <div class="student-dashboard">
    <!-- 顶部导航栏 -->
    <div class="top-nav">
      <div class="nav-left">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item>学生端</el-breadcrumb-item>
          <el-breadcrumb-item>首页</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <div class="nav-right">
        <el-button type="primary" link @click="goToProfile">
          <el-icon><User /></el-icon>
          我的
        </el-button>
      </div>
    </div>

    <!-- 欢迎语 -->
    <div class="welcome-section">
      <h2>{{ greeting }}，{{ studentName }}</h2>
      <p class="welcome-subtitle">今天也要加油学习哦！</p>
    </div>

    <!-- 主内容区 - Tab切换 -->
    <div class="main-content">
      <el-tabs v-model="activeTab" class="content-tabs">
        <!-- 待办事项Tab -->
        <el-tab-pane label="待办事项" name="todo">
          <div v-if="todoList.length === 0" class="empty-state">
            <el-empty description="暂无待办事项">
              <el-icon :size="80" color="#d3d3d3"><DocumentChecked /></el-icon>
            </el-empty>
          </div>
          <div v-else class="todo-list">
            <el-card 
              v-for="item in todoList" 
              :key="item.id" 
              class="todo-item"
              shadow="hover"
            >
              <div class="todo-header">
                <el-tag :type="getTaskTypeColor(item.type)">{{ item.type }}</el-tag>
                <span class="todo-title">{{ item.title }}</span>
              </div>
              <div class="todo-info">
                <span class="subject">
                  <el-icon><Reading /></el-icon>
                  {{ item.subject }}
                </span>
                <span class="deadline" :class="{ 'urgent': isUrgent(item.deadline) }">
                  <el-icon><Clock /></el-icon>
                  截止时间：{{ formatDate(item.deadline) }}
                </span>
              </div>
              <div class="todo-actions">
                <el-button type="primary" size="small" @click="goToTask(item)">
                  去完成
                </el-button>
              </div>
            </el-card>
          </div>
          <!-- 分页 -->
          <el-pagination
            v-if="todoList.length > 0"
            class="pagination"
            v-model:current-page="todoPage"
            :page-size="10"
            layout="prev, pager, next"
            :total="todoTotal"
            @current-change="loadTodoList"
          />
        </el-tab-pane>

        <!-- 班级公告Tab -->
        <el-tab-pane label="班级公告" name="class">
          <div v-if="classAnnouncements.length === 0" class="empty-state">
            <el-empty description="暂无班级公告">
              <el-icon :size="80" color="#d3d3d3"><Bell /></el-icon>
            </el-empty>
          </div>
          <div v-else class="announcement-list">
            <el-card 
              v-for="item in classAnnouncements" 
              :key="item.id" 
              class="announcement-item"
              shadow="hover"
            >
              <div class="announcement-header">
                <h3>{{ item.title }}</h3>
                <el-tag type="success" size="small">{{ item.className || '班级' }}</el-tag>
              </div>
              <div class="announcement-meta">
                <span>
                  <el-icon><User /></el-icon>
                  {{ item.teacher }}
                </span>
                <span>
                  <el-icon><Clock /></el-icon>
                  {{ formatDate(item.publishTime) }}
                </span>
              </div>
              <div class="announcement-content">
                {{ item.content }}
              </div>
            </el-card>
          </div>
          <!-- 分页 -->
          <el-pagination
            v-if="classAnnouncements.length > 0"
            class="pagination"
            v-model:current-page="classPage"
            :page-size="10"
            layout="prev, pager, next"
            :total="classTotal"
            @current-change="loadClassAnnouncements"
          />
        </el-tab-pane>

        <!-- 系统公告Tab -->
        <el-tab-pane label="系统公告" name="system">
          <div v-if="systemAnnouncements.length === 0" class="empty-state">
            <el-empty description="暂无系统公告">
              <el-icon :size="80" color="#d3d3d3"><Bell /></el-icon>
            </el-empty>
          </div>
          <div v-else class="announcement-list">
            <el-card 
              v-for="item in systemAnnouncements" 
              :key="item.id" 
              class="announcement-item"
              shadow="hover"
            >
              <div class="announcement-header">
                <h3>{{ item.title }}</h3>
                <el-tag type="warning" size="small">系统</el-tag>
              </div>
              <div class="announcement-meta">
                <span>
                  <el-icon><User /></el-icon>
                  管理员
                </span>
                <span>
                  <el-icon><Clock /></el-icon>
                  {{ formatDate(item.publishTime) }}
                </span>
              </div>
              <div class="announcement-content">
                {{ item.content }}
              </div>
            </el-card>
          </div>
          <!-- 分页 -->
          <el-pagination
            v-if="systemAnnouncements.length > 0"
            class="pagination"
            v-model:current-page="systemPage"
            :page-size="10"
            layout="prev, pager, next"
            :total="systemTotal"
            @current-change="loadSystemAnnouncements"
          />
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 快捷入口区 -->
    <div class="quick-access">
      <h3 class="section-title">快捷入口</h3>
      <div class="access-cards">
        <div class="access-card" @click="goToAIChat">
          <div class="card-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
            <el-icon :size="32"><ChatDotRound /></el-icon>
          </div>
          <div class="card-title">AI对话</div>
          <div class="card-desc">智能助教随时解答</div>
        </div>

        <div class="access-card" @click="goToCourse">
          <div class="card-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
            <el-icon :size="32"><Reading /></el-icon>
          </div>
          <div class="card-title">课程学习</div>
          <div class="card-desc">查看课程章节内容</div>
        </div>

        <div class="access-card" @click="goToWrongBook">
          <div class="card-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
            <el-icon :size="32"><DocumentCopy /></el-icon>
          </div>
          <div class="card-title">错题本</div>
          <div class="card-desc">查看收藏的错题</div>
        </div>

        <div class="access-card" @click="goToCollection">
          <div class="card-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
            <el-icon :size="32"><Star /></el-icon>
          </div>
          <div class="card-title">我的收藏</div>
          <div class="card-desc">管理收藏的会话</div>
        </div>

        <div class="access-card" @click="openJoinClassDialog">
          <div class="card-icon" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
            <el-icon :size="32"><CirclePlus /></el-icon>
          </div>
          <div class="card-title">加入班级</div>
          <div class="card-desc">输入验证码加入班级</div>
        </div>
      </div>
    </div>

    <!-- 加入班级对话框 -->
    <el-dialog
      v-model="joinClassVisible"
      title="加入班级"
      width="480px"
      :close-on-click-modal="false"
    >
      <!-- 输入验证码步骤 -->
      <div v-if="joinStep === 'input'">
        <el-form :model="joinForm" label-width="100px">
          <el-form-item label="班级验证码">
            <el-input
              v-model="joinForm.classCode"
              placeholder="请输入6位班级验证码"
              maxlength="6"
              clearable
              @keyup.enter="queryClassByCode"
            />
          </el-form-item>
        </el-form>
      </div>

      <!-- 班级信息展示步骤 -->
      <div v-else-if="joinStep === 'confirm'">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="班级名称">{{ classInfo.class_name }}</el-descriptions-item>
          <el-descriptions-item label="科目">{{ classInfo.subject }}</el-descriptions-item>
          <el-descriptions-item label="教师">{{ classInfo.teacher_name }}</el-descriptions-item>
          <el-descriptions-item label="学期">{{ classInfo.semester }}</el-descriptions-item>
          <el-descriptions-item label="班级人数">{{ classInfo.current_students }} / {{ classInfo.max_students }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <template #footer>
        <div v-if="joinStep === 'input'">
          <el-button @click="joinClassVisible = false">取消</el-button>
          <el-button type="primary" :loading="queryLoading" @click="queryClassByCode">查询班级</el-button>
        </div>
        <div v-else-if="joinStep === 'confirm'">
          <el-button @click="joinStep = 'input'">重新输入</el-button>
          <el-button type="primary" :loading="joinLoading" @click="confirmJoinClass">确认加入</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { studentAPI } from '@/services/index';
import { User, Clock, Reading, Bell, DocumentChecked, ChatDotRound, DocumentCopy, Star, CirclePlus } from '@element-plus/icons-vue';

const router = useRouter();

// 学生信息
const studentName = ref(localStorage.getItem('userName') || '同学');

// 当前激活的Tab
const activeTab = ref('todo');

// 待办事项数据
const todoList = ref([]);
const todoPage = ref(1);
const todoTotal = ref(0);

// 班级公告数据
const classAnnouncements = ref([]);
const classPage = ref(1);
const classTotal = ref(0);

// 系统公告数据
const systemAnnouncements = ref([]);
const systemPage = ref(1);
const systemTotal = ref(0);

// 根据时间生成问候语
const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 6) return '凌晨好';
  if (hour < 12) return '上午好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  return '晚上好';
});

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

// 判断是否紧急（距离截止时间小于24小时）
const isUrgent = (deadline) => {
  if (!deadline) return false;
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diff = deadlineDate - now;
  return diff > 0 && diff < 24 * 60 * 60 * 1000;
};

// 获取任务类型颜色
const getTaskTypeColor = (type) => {
  const colorMap = {
    '讨论': 'primary',
    '作业': 'success',
    '考试': 'danger'
  };
  return colorMap[type] || 'info';
};

// 加载待办事项列表
const loadTodoList = async () => {
  try {
    // TODO: 调用API获取待办事项
    // 模拟数据
    todoList.value = [
      {
        id: 1,
        type: '作业',
        title: '第三章课后习题',
        subject: '数据结构',
        deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 2,
        type: '讨论',
        title: '算法复杂度分析讨论',
        subject: '算法设计',
        deadline: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 3,
        type: '考试',
        title: '期中考试',
        subject: '操作系统',
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    todoTotal.value = todoList.value.length;
  } catch (error) {
    console.error('加载待办事项失败:', error);
    ElMessage.error('加载待办事项失败');
  }
};

// 加载班级公告（查询该学生所在全部班级的公告，按时间倒序）
const loadClassAnnouncements = async () => {
  try {
    const studentId = localStorage.getItem('userId') || localStorage.getItem('studentId');
    if (!studentId) return;

    // 1. 获取学生所在的全部班级
    const classRes = await studentAPI.getStudentClasses(studentId);
    const classes = classRes?.data?.classes || classRes?.classes || [];
    if (classes.length === 0) {
      classAnnouncements.value = [];
      classTotal.value = 0;
      return;
    }

    // 2. 并发查询每个班级的公告
    const results = await Promise.allSettled(
      classes.map(cls => studentAPI.getAnnouncements(cls.class_id))
    );

    // 3. 合并所有公告，附加班级名称，按发布时间倒序排列
    const allAnnouncements = [];
    results.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        const announcements = result.value?.data?.announcements || result.value?.announcements || [];
        announcements.forEach(item => {
          allAnnouncements.push({
            id: item.announcement_id || item.id,
            title: item.title,
            teacher: item.teacher_name || item.teacher || '',
            publishTime: item.created_at || item.publish_time || item.publishTime,
            content: item.content,
            className: classes[idx]?.class_name || ''
          });
        });
      }
    });

    // 按发布时间倒序
    allAnnouncements.sort((a, b) => new Date(b.publishTime) - new Date(a.publishTime));

    classAnnouncements.value = allAnnouncements;
    classTotal.value = allAnnouncements.length;
  } catch (error) {
    console.error('加载班级公告失败:', error);
    ElMessage.error('加载班级公告失败');
  }
};

// 加载系统公告
const loadSystemAnnouncements = async () => {
  try {
    // TODO: 调用API获取系统公告
    // 模拟数据
    systemAnnouncements.value = [
      {
        id: 1,
        title: '系统维护通知',
        publishTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        content: '系统将于本周六凌晨2:00-4:00进行维护升级，期间可能无法访问，请提前做好安排。'
      }
    ];
    systemTotal.value = systemAnnouncements.value.length;
  } catch (error) {
    console.error('加载系统公告失败:', error);
    ElMessage.error('加载系统公告失败');
  }
};

// 跳转到任务完成页面
const goToTask = (task) => {
  router.push({
    name: 'TaskComplete',
    query: { id: task.id, type: task.type }
  });
};

// 跳转到个人信息中心
const goToProfile = () => {
  router.push({ name: 'StudentProfile' });
};

// 跳转到AI对话
const goToAIChat = () => {
  router.push({ name: 'AIChat' });
};

// 跳转到课程学习
const goToCourse = () => {
  router.push({ name: 'CourseStudy' });
};

// 跳转到错题本
const goToWrongBook = () => {
  router.push({ name: 'WrongBook' });
};

// 跳转到我的收藏
const goToCollection = () => {
  router.push({ name: 'SessionCollection' });
};

// 加入班级相关
const joinClassVisible = ref(false);
const joinStep = ref('input'); // 'input' | 'confirm'
const joinForm = ref({ classCode: '' });
const classInfo = ref({});
const queryLoading = ref(false);
const joinLoading = ref(false);

const openJoinClassDialog = () => {
  joinClassVisible.value = true;
  joinStep.value = 'input';
  joinForm.value.classCode = '';
  classInfo.value = {};
};

const queryClassByCode = async () => {
  if (!joinForm.value.classCode || joinForm.value.classCode.trim().length === 0) {
    ElMessage.warning('请输入班级验证码');
    return;
  }
  queryLoading.value = true;
  try {
    const res = await studentAPI.getClassByCode(joinForm.value.classCode.trim().toUpperCase());
    if (res && res.class) {
      classInfo.value = res.class;
      joinStep.value = 'confirm';
    } else {
      ElMessage.error('班级不存在，请检查验证码');
    }
  } catch (err) {
    ElMessage.error('班级不存在，请检查验证码');
  } finally {
    queryLoading.value = false;
  }
};

const confirmJoinClass = async () => {
  const studentId = localStorage.getItem('userId') || localStorage.getItem('studentId');
  if (!studentId) {
    ElMessage.error('获取学生信息失败，请重新登录');
    return;
  }
  joinLoading.value = true;
  try {
    await studentAPI.joinClass(studentId, joinForm.value.classCode.trim().toUpperCase());
    ElMessage.success('加入班级成功！');
    joinClassVisible.value = false;
  } catch (err) {
    ElMessage.error(typeof err === 'string' ? err : '加入班级失败');
  } finally {
    joinLoading.value = false;
  }
};

// 页面加载时获取数据
onMounted(() => {
  loadTodoList();
  loadClassAnnouncements();
  loadSystemAnnouncements();
});
</script>

<style scoped lang="scss">
.student-dashboard {
  min-height: 100vh;
  background: linear-gradient(135deg, #e3f2fd 0%, #f5f5f5 100%);
  padding: 20px;

  // 顶部导航栏
  .top-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: white;
    padding: 15px 25px;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    margin-bottom: 20px;

    .nav-left {
      :deep(.el-breadcrumb__inner) {
        color: #409eff;
        font-weight: 500;
      }
    }

    .nav-right {
      .el-button {
        font-size: 16px;
        font-weight: 500;
      }
    }
  }

  // 欢迎语区域
  .welcome-section {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 30px;
    border-radius: 12px;
    margin-bottom: 20px;
    box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);

    h2 {
      margin: 0 0 10px 0;
      font-size: 28px;
      font-weight: 600;
    }

    .welcome-subtitle {
      margin: 0;
      font-size: 16px;
      opacity: 0.9;
    }
  }

  // 主内容区
  .main-content {
    background: white;
    border-radius: 12px;
    padding: 25px;
    margin-bottom: 20px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

    .content-tabs {
      :deep(.el-tabs__item) {
        font-size: 16px;
        font-weight: 500;
      }

      :deep(.el-tabs__item.is-active) {
        color: #409eff;
      }
    }

    // 空状态
    .empty-state {
      padding: 60px 0;
      text-align: center;
    }

    // 待办事项列表
    .todo-list {
      .todo-item {
        margin-bottom: 15px;
        transition: all 0.3s;

        &:hover {
          transform: translateY(-2px);
        }

        .todo-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;

          .todo-title {
            font-size: 16px;
            font-weight: 600;
            color: #303133;
          }
        }

        .todo-info {
          display: flex;
          gap: 20px;
          margin-bottom: 15px;
          font-size: 14px;
          color: #606266;

          span {
            display: flex;
            align-items: center;
            gap: 5px;
          }

          .deadline.urgent {
            color: #f56c6c;
            font-weight: 600;
          }
        }

        .todo-actions {
          text-align: right;
        }
      }
    }

    // 公告列表
    .announcement-list {
      .announcement-item {
        margin-bottom: 15px;
        transition: all 0.3s;

        &:hover {
          transform: translateY(-2px);
        }

        .announcement-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;

          h3 {
            margin: 0;
            font-size: 18px;
            font-weight: 600;
            color: #303133;
          }
        }

        .announcement-meta {
          display: flex;
          gap: 20px;
          margin-bottom: 12px;
          font-size: 14px;
          color: #909399;

          span {
            display: flex;
            align-items: center;
            gap: 5px;
          }
        }

        .announcement-content {
          font-size: 14px;
          color: #606266;
          line-height: 1.6;
        }
      }
    }

    // 分页
    .pagination {
      margin-top: 20px;
      display: flex;
      justify-content: center;
    }
  }

  // 快捷入口区
  .quick-access {
    background: white;
    border-radius: 12px;
    padding: 25px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

    .section-title {
      margin: 0 0 20px 0;
      font-size: 20px;
      font-weight: 600;
      color: #303133;
    }

    .access-cards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 20px;

      .access-card {
        background: white;
        border-radius: 12px;
        padding: 25px;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s;
        border: 2px solid #f0f0f0;

        &:hover {
          transform: translateY(-5px) scale(1.02);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          border-color: #409eff;
        }

        .card-icon {
          width: 70px;
          height: 70px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 15px;
          color: white;
        }

        .card-title {
          font-size: 18px;
          font-weight: 600;
          color: #303133;
          margin-bottom: 8px;
        }

        .card-desc {
          font-size: 14px;
          color: #909399;
        }
      }
    }
  }
}

// 响应式布局
@media (max-width: 768px) {
  .student-dashboard {
    padding: 10px;

    .welcome-section {
      padding: 20px;

      h2 {
        font-size: 22px;
      }
    }

    .quick-access .access-cards {
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 15px;
    }
  }
}
</style>
