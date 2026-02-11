<template>
  <div class="dashboard-page">
    <!-- 顶部导航栏 - 移动端适配 -->
    <van-nav-bar title="学生端首页" fixed placeholder>
      <template #right>
        <van-icon name="user-o" size="20" @click="goToProfile" />
      </template>
    </van-nav-bar>

    <!-- 下拉刷新 -->
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <div class="page-container">
        <!-- 欢迎语卡片 -->
        <div class="welcome-card">
          <h2>{{ greeting }}，{{ studentName }}</h2>
          <p>今天也要加油学习哦！</p>
        </div>

        <!-- Tab切换 - 移动端适配 -->
        <van-tabs v-model:active="activeTab" sticky offset-top="46px" @change="onTabChange">
          <!-- 待办事项Tab -->
          <van-tab title="待办事项" name="todo">
            <div v-if="todoList.length === 0" class="empty-state">
              <van-empty description="暂无待办事项" />
            </div>
            <van-list
              v-else
              v-model:loading="todoLoading"
              :finished="todoFinished"
              finished-text="没有更多了"
              @load="loadTodoList"
            >
              <div
                v-for="item in todoList"
                :key="item.id"
                class="todo-item"
                @click="goToTask(item)"
              >
                <div class="todo-header">
                  <van-tag :type="getTaskTypeColor(item.type)">{{ item.type }}</van-tag>
                  <span class="todo-title">{{ item.title }}</span>
                </div>
                <div class="todo-info">
                  <span class="subject">
                    <van-icon name="notes-o" />
                    {{ item.subject }}
                  </span>
                  <span class="deadline" :class="{ 'urgent': isUrgent(item.deadline) }">
                    <van-icon name="clock-o" />
                    {{ formatDate(item.deadline) }}
                  </span>
                </div>
                <van-button type="primary" size="small" round>去完成</van-button>
              </div>
            </van-list>
          </van-tab>

          <!-- 班级公告Tab -->
          <van-tab title="班级公告" name="class">
            <div v-if="classAnnouncements.length === 0" class="empty-state">
              <van-empty description="暂无班级公告" />
            </div>
            <van-list
              v-else
              v-model:loading="classLoading"
              :finished="classFinished"
              finished-text="没有更多了"
              @load="loadClassAnnouncements"
            >
              <div
                v-for="item in classAnnouncements"
                :key="item.id"
                class="announcement-item"
              >
                <div class="announcement-header">
                  <h3>{{ item.title }}</h3>
                  <van-tag type="success" size="medium">班级</van-tag>
                </div>
                <div class="announcement-meta">
                  <span>
                    <van-icon name="user-o" />
                    {{ item.teacher }}
                  </span>
                  <span>
                    <van-icon name="clock-o" />
                    {{ formatDate(item.publishTime) }}
                  </span>
                </div>
                <div class="announcement-content">{{ item.content }}</div>
              </div>
            </van-list>
          </van-tab>

          <!-- 系统公告Tab -->
          <van-tab title="系统公告" name="system">
            <div v-if="systemAnnouncements.length === 0" class="empty-state">
              <van-empty description="暂无系统公告" />
            </div>
            <van-list
              v-else
              v-model:loading="systemLoading"
              :finished="systemFinished"
              finished-text="没有更多了"
              @load="loadSystemAnnouncements"
            >
              <div
                v-for="item in systemAnnouncements"
                :key="item.id"
                class="announcement-item"
              >
                <div class="announcement-header">
                  <h3>{{ item.title }}</h3>
                  <van-tag type="warning" size="medium">系统</van-tag>
                </div>
                <div class="announcement-meta">
                  <span>
                    <van-icon name="user-o" />
                    管理员
                  </span>
                  <span>
                    <van-icon name="clock-o" />
                    {{ formatDate(item.publishTime) }}
                  </span>
                </div>
                <div class="announcement-content">{{ item.content }}</div>
              </div>
            </van-list>
          </van-tab>
        </van-tabs>

        <!-- 快捷入口 - 宫格布局 -->
        <div class="quick-access">
          <h3 class="section-title">快捷入口</h3>
          <van-grid :column-num="3" :border="false" :gutter="12">
            <van-grid-item
              icon="chat-o"
              text="AI对话"
              @click="goToAIChat"
            >
              <template #icon>
                <div class="grid-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                  <van-icon name="chat-o" size="24" color="#fff" />
                </div>
              </template>
            </van-grid-item>
            <van-grid-item
              icon="notes-o"
              text="课程学习"
              @click="goToCourse"
            >
              <template #icon>
                <div class="grid-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                  <van-icon name="notes-o" size="24" color="#fff" />
                </div>
              </template>
            </van-grid-item>
            <van-grid-item
              icon="records-o"
              text="错题本"
              @click="goToWrongBook"
            >
              <template #icon>
                <div class="grid-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                  <van-icon name="records-o" size="24" color="#fff" />
                </div>
              </template>
            </van-grid-item>
            <van-grid-item
              icon="star-o"
              text="我的收藏"
              @click="goToCollection"
            >
              <template #icon>
                <div class="grid-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
                  <van-icon name="star-o" size="24" color="#fff" />
                </div>
              </template>
            </van-grid-item>
            <van-grid-item
              icon="calendar-o"
              text="学习方案"
              @click="goToStudyPlan"
            >
              <template #icon>
                <div class="grid-icon" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
                  <van-icon name="calendar-o" size="24" color="#fff" />
                </div>
              </template>
            </van-grid-item>
          </van-grid>
        </div>
      </div>
    </van-pull-refresh>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'

const router = useRouter()

// 学生信息
const studentName = ref(localStorage.getItem('userName') || '同学')

// 下拉刷新
const refreshing = ref(false)

// 当前激活的Tab
const activeTab = ref('todo')

// 待办事项数据
const todoList = ref([])
const todoLoading = ref(false)
const todoFinished = ref(false)
const todoPage = ref(1)

// 班级公告数据
const classAnnouncements = ref([])
const classLoading = ref(false)
const classFinished = ref(false)
const classPage = ref(1)

// 系统公告数据
const systemAnnouncements = ref([])
const systemLoading = ref(false)
const systemFinished = ref(false)
const systemPage = ref(1)

// 根据时间生成问候语
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return '凌晨好'
  if (hour < 12) return '上午好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

// 格式化日期 - 移动端简化显示
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date
  
  // 未来时间（截止日期）
  if (diff < 0) {
    const futureDiff = -diff
    if (futureDiff < 24 * 60 * 60 * 1000) return '今天截止'
    if (futureDiff < 48 * 60 * 60 * 1000) return '明天截止'
    return `${Math.floor(futureDiff / (24 * 60 * 60 * 1000))}天后截止`
  }
  
  // 过去时间（发布时间）
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
  
  return `${date.getMonth() + 1}-${date.getDate()}`
}

// 判断是否紧急（距离截止时间小于24小时）
const isUrgent = (deadline) => {
  if (!deadline) return false
  const now = new Date()
  const deadlineDate = new Date(deadline)
  const diff = deadlineDate - now
  return diff > 0 && diff < 24 * 60 * 60 * 1000
}

// 获取任务类型颜色
const getTaskTypeColor = (type) => {
  const colorMap = {
    '讨论': 'primary',
    '作业': 'success',
    '考试': 'danger'
  }
  return colorMap[type] || 'default'
}

// 下拉刷新
const onRefresh = async () => {
  // 重置所有数据
  todoPage.value = 1
  classPage.value = 1
  systemPage.value = 1
  todoFinished.value = false
  classFinished.value = false
  systemFinished.value = false
  
  // 根据当前Tab加载数据
  if (activeTab.value === 'todo') {
    await loadTodoList()
  } else if (activeTab.value === 'class') {
    await loadClassAnnouncements()
  } else {
    await loadSystemAnnouncements()
  }
  
  refreshing.value = false
  showToast('刷新成功')
}

// Tab切换
const onTabChange = (name) => {
  // 切换Tab时加载对应数据
  if (name === 'todo' && todoList.value.length === 0) {
    loadTodoList()
  } else if (name === 'class' && classAnnouncements.value.length === 0) {
    loadClassAnnouncements()
  } else if (name === 'system' && systemAnnouncements.value.length === 0) {
    loadSystemAnnouncements()
  }
}

// 加载待办事项列表 - 支持分页
const loadTodoList = async () => {
  if (todoFinished.value) return
  
  todoLoading.value = true
  
  try {
    // TODO: 调用API获取待办事项
    // 模拟数据和分页
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const mockData = [
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
    ]
    
    if (todoPage.value === 1) {
      todoList.value = mockData
    } else {
      todoList.value = [...todoList.value, ...mockData]
    }
    
    // 模拟没有更多数据
    if (todoPage.value >= 1) {
      todoFinished.value = true
    } else {
      todoPage.value++
    }
  } catch (error) {
    console.error('加载待办事项失败:', error)
    showToast('加载失败')
  } finally {
    todoLoading.value = false
  }
}

// 加载班级公告 - 支持分页
const loadClassAnnouncements = async () => {
  if (classFinished.value) return
  
  classLoading.value = true
  
  try {
    // TODO: 调用API获取班级公告
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const mockData = [
      {
        id: 1,
        title: '本周课程安排调整通知',
        teacher: '张老师',
        publishTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        content: '由于教室调整，本周三的数据结构课程将在A301教室上课，请同学们注意。'
      },
      {
        id: 2,
        title: '期中考试安排',
        teacher: '李老师',
        publishTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        content: '期中考试将于下周五进行，考试范围为第1-5章内容，请同学们认真复习。'
      }
    ]
    
    if (classPage.value === 1) {
      classAnnouncements.value = mockData
    } else {
      classAnnouncements.value = [...classAnnouncements.value, ...mockData]
    }
    
    if (classPage.value >= 1) {
      classFinished.value = true
    } else {
      classPage.value++
    }
  } catch (error) {
    console.error('加载班级公告失败:', error)
    showToast('加载失败')
  } finally {
    classLoading.value = false
  }
}

// 加载系统公告 - 支持分页
const loadSystemAnnouncements = async () => {
  if (systemFinished.value) return
  
  systemLoading.value = true
  
  try {
    // TODO: 调用API获取系统公告
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const mockData = [
      {
        id: 1,
        title: '系统维护通知',
        publishTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        content: '系统将于本周六凌晨2:00-4:00进行维护升级，期间可能无法访问，请提前做好安排。'
      }
    ]
    
    if (systemPage.value === 1) {
      systemAnnouncements.value = mockData
    } else {
      systemAnnouncements.value = [...systemAnnouncements.value, ...mockData]
    }
    
    if (systemPage.value >= 1) {
      systemFinished.value = true
    } else {
      systemPage.value++
    }
  } catch (error) {
    console.error('加载系统公告失败:', error)
    showToast('加载失败')
  } finally {
    systemLoading.value = false
  }
}

// 跳转到任务完成页面
const goToTask = (task) => {
  router.push({
    path: '/student/task-complete',
    query: { id: task.id, type: task.type }
  })
}

// 跳转到个人信息中心
const goToProfile = () => {
  router.push('/student/profile')
}

// 跳转到AI对话
const goToAIChat = () => {
  router.push('/student/ai-chat')
}

// 跳转到课程学习
const goToCourse = () => {
  router.push('/student/course-study')
}

// 跳转到错题本
const goToWrongBook = () => {
  router.push('/student/wrong-book')
}

// 跳转到我的收藏
const goToCollection = () => {
  router.push('/student/session-collection')
}

// 跳转到学习方案
const goToStudyPlan = () => {
  router.push('/student/study-plan')
}

// 页面加载时获取数据
onMounted(() => {
  loadTodoList()
})
</script>

<style scoped>
.dashboard-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #e3f2fd 0%, #f5f5f5 100%);
  padding-bottom: 20px;
}

.page-container {
  padding: 12px;
}

/* 欢迎语卡片 - 移动端适配 */
.welcome-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.welcome-card h2 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
}

.welcome-card p {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
}

/* 空状态 */
.empty-state {
  padding: 60px 20px;
  text-align: center;
}

/* 待办事项列表 - 移动端适配 */
.todo-item {
  background: white;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  /* 触摸反馈 */
  active-opacity: 0.7;
}

.todo-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.todo-title {
  flex: 1;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.todo-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 13px;
  color: #606266;
}

.todo-info span {
  display: flex;
  align-items: center;
  gap: 5px;
}

.todo-info .deadline.urgent {
  color: #f56c6c;
  font-weight: 600;
}

/* 公告列表 - 移动端适配 */
.announcement-item {
  background: white;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.announcement-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 12px;
}

.announcement-header h3 {
  flex: 1;
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
}

.announcement-meta {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  font-size: 12px;
  color: #909399;
}

.announcement-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.announcement-content {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
}

/* 快捷入口 - 移动端宫格布局 */
.quick-access {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-top: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.grid-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 移动端触摸优化 */
:deep(.van-grid-item__content) {
  padding: 16px 8px;
}

:deep(.van-grid-item__text) {
  font-size: 13px;
  color: #303133;
  margin-top: 8px;
}

/* Tab样式优化 */
:deep(.van-tabs__line) {
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
}

:deep(.van-tab--active) {
  color: #667eea;
  font-weight: 600;
}
</style>
