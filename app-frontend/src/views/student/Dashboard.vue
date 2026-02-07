<template>
  <div class="dashboard-page">
    <van-nav-bar title="学生主页" />
    
    <div class="page-container">
      <div class="user-card card fade-in">
        <div class="user-avatar">👨‍🎓</div>
        <div class="user-info">
          <h3>{{ userInfo.name || '学生' }}</h3>
          <p>学号：{{ userInfo.student_id || '-' }}</p>
        </div>
      </div>

      <div class="menu-list">
        <van-cell-group inset>
          <van-cell title="我的课程" icon="notes-o" is-link />
          <van-cell title="我的作业" icon="todo-list-o" is-link />
          <van-cell title="我的成绩" icon="chart-trending-o" is-link />
          <van-cell title="个人信息" icon="user-o" is-link />
        </van-cell-group>
      </div>

      <div class="logout-btn">
        <van-button round block type="danger" @click="handleLogout">
          退出登录
        </van-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showConfirmDialog, showToast } from 'vant'
import { studentAPI } from '@/api'

const router = useRouter()
const userInfo = ref({})

onMounted(() => {
  const info = localStorage.getItem('userInfo')
  if (info && info !== 'undefined' && info !== 'null') {
    try {
      userInfo.value = JSON.parse(info)
    } catch (error) {
      console.error('解析用户信息失败:', error)
      userInfo.value = {}
    }
  }
})

const handleLogout = async () => {
  showConfirmDialog({
    title: '提示',
    message: '确定要退出登录吗？'
  }).then(async () => {
    try {
      await studentAPI.logout()
    } catch (error) {
      console.error('退出登录失败:', error)
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      localStorage.removeItem('userType')
      showToast({ type: 'success', message: '已退出登录' })
      router.push('/')
    }
  }).catch(() => {
    // 取消
  })
}
</script>

<style scoped>
.dashboard-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.page-container {
  padding: 16px;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.user-avatar {
  font-size: 48px;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
}

.user-info h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
}

.user-info p {
  font-size: 14px;
  color: #666;
}

.menu-list {
  margin-bottom: 16px;
}

.logout-btn {
  margin-top: 24px;
}
</style>
