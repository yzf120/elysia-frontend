<template>
  <div class="teacher-dashboard-page">
    <van-nav-bar title="教师主页">
      <template #right>
        <van-icon name="manager-o" size="20" @click="goToProfile" />
      </template>
    </van-nav-bar>

    <!-- 欢迎卡片 -->
    <div class="welcome-card">
      <div class="user-avatar">👨‍🏫</div>
      <div class="user-info">
        <h3>{{ greeting }}，{{ teacherName }}老师</h3>
        <p>今天也要认真教学哦！</p>
      </div>
    </div>

    <!-- 快捷入口 -->
    <div class="section-card">
      <div class="section-title">快捷入口</div>
      <van-grid :column-num="3" :border="false">
        <van-grid-item icon="plus" text="创建班级" @click="goTo('teacher-create-class')" />
        <van-grid-item icon="notes-o" text="班级管理" @click="goTo('teacher-class-management')" />
        <van-grid-item icon="chat-o" text="AI对话" @click="goTo('teacher-ai-chat')" />
        <van-grid-item icon="star-o" text="收藏会话" @click="goTo('teacher-session-collection')" />
      </van-grid>
    </div>

    <!-- Tab：我的班级 / 系统公告 -->
    <div class="section-card tab-card">
      <van-tabs v-model:active="activeTab">
        <!-- 我的班级 -->
        <van-tab title="我的班级" name="classes">
          <div v-if="classLoading" class="loading-wrap">
            <van-loading type="spinner" color="#4F6EF7" />
          </div>
          <van-empty v-else-if="classList.length === 0" description="暂无班级，点击创建班级开始吧" />
          <div v-else class="class-list">
            <div
              v-for="cls in classList"
              :key="cls.classId"
              class="class-card"
              @click="goToClassDetail(cls.classId)"
            >
              <div class="class-header">
                <span class="class-name">{{ cls.className }}</span>
                <van-tag :type="getStatusType(cls.status)">{{ getStatusLabel(cls.status) }}</van-tag>
              </div>
              <div class="class-meta">
                <span>📅 {{ cls.semester }}</span>
                <span>👥 {{ cls.currentStudents }}/{{ cls.maxStudents }} 人</span>
              </div>
              <div class="class-code">验证码：<strong>{{ cls.classCode }}</strong></div>
            </div>
          </div>
        </van-tab>

        <!-- 系统公告 -->
        <van-tab title="系统公告" name="announcements">
          <van-empty v-if="announcements.length === 0" description="暂无系统公告" />
          <div v-else class="announcement-list">
            <div v-for="item in announcements" :key="item.id" class="announcement-item">
              <div class="ann-title">{{ item.title }}</div>
              <div class="ann-time">{{ formatDate(item.publishTime) }}</div>
              <div class="ann-content">{{ item.content }}</div>
            </div>
          </div>
        </van-tab>
      </van-tabs>
    </div>

    <!-- 退出登录 -->
    <div class="logout-wrap">
      <van-button round block type="danger" plain @click="handleLogout">退出登录</van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showConfirmDialog, showToast } from 'vant'
import { teacherAPI } from '@/api'

const router = useRouter()
const teacherName = ref(localStorage.getItem('userName') || '教师')
const activeTab = ref('classes')

const classList = ref([])
const classLoading = ref(false)
const announcements = ref([])

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '凌晨好'
  if (h < 12) return '上午好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const getStatusLabel = (status) => ({ 1: '进行中', 2: '已结束', 3: '已归档' }[status] || '未知')
const getStatusType = (status) => ({ 1: 'success', 2: 'default', 3: 'warning' }[status] || 'default')

const loadClasses = async () => {
  classLoading.value = true
  try {
    const raw = localStorage.getItem('userInfo')
    const userInfo = (raw && raw !== 'undefined' && raw !== 'null') ? JSON.parse(raw) : {}
    const teacherId = userInfo.teacher_id || userInfo.id || localStorage.getItem('userId') || localStorage.getItem('teacherId') || ''
    if (!teacherId) {
      showToast({ type: 'fail', message: '未获取到教师信息，请重新登录' })
      return
    }
    const res = await teacherAPI.getTeacherClasses(teacherId)
    const classes = res.classes || []
    classList.value = classes.map(cls => ({
      classId: cls.class_id,
      className: cls.class_name,
      classCode: cls.class_code,
      subjectName: cls.subject_name,
      semester: cls.semester,
      currentStudents: cls.current_students,
      maxStudents: cls.max_students,
      status: cls.status
    }))
  } catch (e) {
    console.error('[loadClasses] 失败:', e)
    showToast({ type: 'fail', message: '加载班级列表失败' })
  } finally {
    classLoading.value = false
  }
}

const goToClassDetail = (classId) => {
  router.push({ name: 'teacher-class-detail', params: { classId } })
}

const goTo = (name) => {
  router.push({ name })
}

const goToProfile = () => {
  router.push({ name: 'teacher-profile' })
}

const handleLogout = async () => {
  showConfirmDialog({ title: '提示', message: '确定要退出登录吗？' })
    .then(async () => {
      try { await teacherAPI.logout() } catch {}
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      localStorage.removeItem('userType')
      localStorage.removeItem('userName')
      localStorage.removeItem('userId')
      localStorage.removeItem('teacherId')
      showToast({ type: 'success', message: '已退出登录' })
      router.push('/')
    }).catch(() => {})
}

onMounted(() => {
  const info = localStorage.getItem('userInfo')
  if (info && info !== 'undefined' && info !== 'null') {
    try {
      const parsed = JSON.parse(info)
      teacherName.value = parsed.teacher_name || parsed.name || localStorage.getItem('userName') || '教师'
    } catch {}
  }
  loadClasses()
})
</script>

<style scoped>
.teacher-dashboard-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 24px;
}

.welcome-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: linear-gradient(135deg, #4F6EF7 0%, #60A5FA 100%);
  margin: 12px 16px;
  border-radius: 14px;
  padding: 18px 20px;
  color: #fff;
}

.user-avatar {
  font-size: 40px;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.2);
  border-radius: 50%;
}

.user-info h3 {
  font-size: 17px;
  font-weight: 600;
  margin-bottom: 4px;
}

.user-info p {
  font-size: 13px;
  opacity: 0.85;
}

.section-card {
  background: #fff;
  border-radius: 14px;
  margin: 12px 16px;
  overflow: hidden;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  padding: 14px 16px 8px;
}

.tab-card {
  padding-bottom: 8px;
}

.loading-wrap {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}

.class-list {
  padding: 8px 12px 4px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.class-card {
  background: #f8f8ff;
  border-radius: 10px;
  padding: 14px;
  border: 1px solid #e8e8f0;
}

.class-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.class-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  flex: 1;
  margin-right: 8px;
}

.class-meta {
  display: flex;
  gap: 14px;
  font-size: 13px;
  color: #666;
  margin-bottom: 6px;
}

.class-code {
  font-size: 13px;
  color: #666;
}

.class-code strong {
  color: #4F6EF7;
  font-family: 'Courier New', monospace;
  font-size: 15px;
}

.announcement-list {
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.announcement-item {
  background: #f8f8ff;
  border-radius: 10px;
  padding: 14px;
}

.ann-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.ann-time {
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
}

.ann-content {
  font-size: 13px;
  color: #555;
  line-height: 1.6;
}

.logout-wrap {
  padding: 16px;
  margin-top: 8px;
}
</style>
