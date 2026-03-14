<template>
  <div class="dashboard-page">
    <van-nav-bar title="管理员主页" />
    
    <div class="page-container">
      <div class="user-card card fade-in">
        <div class="user-avatar">👨‍💼</div>
        <div class="user-info">
          <h3>{{ userInfo.name || '管理员' }}</h3>
          <p>管理员ID：{{ userInfo.admin_id || '-' }}</p>
        </div>
      </div>

      <div class="menu-list">
        <van-cell-group inset>
          <van-cell title="用户管理" icon="friends-o" is-link />
          <van-cell title="教师审核" icon="passed" is-link />
          <van-cell title="课程管理" icon="notes-o" is-link />
          <van-cell title="系统设置" icon="setting-o" is-link />
          <van-cell title="数据统计" icon="chart-trending-o" is-link />
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
import { adminAPI } from '@/api'

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
      await adminAPI.logout()
    } catch (error) {
      console.error('退出登录失败:', error)
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      localStorage.removeItem('userType')
      localStorage.removeItem('userId')
      localStorage.removeItem('userName')
      localStorage.removeItem('teacherId')
      showToast({ type: 'success', message: '已退出登录' })
      router.push('/')
    }
  }).catch(() => {})
}
</script>

<style scoped>
.dashboard-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #F0FDF4 0%, #FFFFFF 100%);
}

.fresh-nav-bar {
  background: linear-gradient(135deg, #10B981 0%, #06B6D4 100%);
  :deep(.van-nav-bar__title) {
    color: white;
    font-weight: 600;
  }
}

.page-container {
  padding: 16px;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  background: linear-gradient(135deg, #FFFFFF 0%, #F0FDF4 100%);
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.1);
}

.user-avatar {
  position: relative;
  width: 72px;
  height: 72px;
}

.avatar-icon {
  font-size: 48px;
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #10B981 0%, #06B6D4 100%);
  border-radius: 50%;
  position: relative;
  z-index: 1;
}

.avatar-ring {
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(6, 182, 212, 0.3));
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.4;
  }
}

.user-info h3 {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 4px;
  background: linear-gradient(135deg, #10B981, #06B6D4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.user-info p {
  font-size: 14px;
  color: #6B7280;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.stat-card {
  background: linear-gradient(135deg, #10B981 0%, #06B6D4 100%);
  border-radius: 16px;
  padding: 20px 16px;
  text-align: center;
  color: white;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 80px;
  height: 80px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%);
  border-radius: 50%;
  transform: translate(30%, -30%);
}

.stat-icon {
  font-size: 32px;
  margin-bottom: 8px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 13px;
  opacity: 0.95;
}

.menu-section {
  margin-bottom: 20px;
  animation: fadeIn 0.5s ease-out 0.2s both;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: #1F2937;
  margin-bottom: 12px;
  padding-left: 4px;
}

.menu-group {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(16, 185, 129, 0.08);
  background: white;
}

.menu-cell {
  transition: all 0.3s;
}

.menu-cell:active {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(6, 182, 212, 0.05) 100%);
}

.menu-cell :deep(.van-cell__title) {
  font-weight: 500;
  color: #1F2937;
}

.menu-cell :deep(.van-icon) {
  color: #10B981;
  font-size: 20px;
}

.logout-btn {
  margin-top: 32px;
}

.logout-button {
  background: linear-gradient(135deg, #F87171 0%, #EF4444 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(248, 113, 113, 0.3);
  font-weight: 600;
  height: 48px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in {
  animation: fadeIn 0.5s ease-out;
}
</style>
