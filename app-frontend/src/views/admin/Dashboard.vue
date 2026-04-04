<template>
  <div class="dashboard-page">
    <van-nav-bar title="管理员主页" class="admin-nav-bar" />
    
    <div class="page-container">
      <div class="user-card card fade-in">
        <div class="user-avatar">
          <div class="avatar-icon">👨‍💼</div>
          <div class="avatar-ring"></div>
        </div>
        <div class="user-info">
          <h3>{{ userInfo.name || '管理员' }}</h3>
          <p>管理员ID：{{ userInfo.admin_id || '-' }}</p>
        </div>
      </div>

      <!-- 统计卡片 -->
      <div class="stats-grid fade-in">
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-value">{{ dashStats.totalRequests?.toLocaleString() || 0 }}</div>
          <div class="stat-label">调用次数(7天)</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🔤</div>
          <div class="stat-value">{{ formatTokenCount(dashStats.totalTokens || 0) }}</div>
          <div class="stat-label">Token消耗(7天)</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-value">{{ dashStats.totalUsers || 0 }}</div>
          <div class="stat-label">用户总数</div>
        </div>
        <div class="stat-card" @click="handlePendingAudits">
          <div class="stat-icon">⏰</div>
          <div class="stat-value">{{ dashStats.pendingAudits || 0 }}</div>
          <div class="stat-label">待审核</div>
        </div>
      </div>

      <div class="menu-list fade-in">
        <van-cell-group inset class="menu-group">
          <van-cell title="用户管理" icon="friends-o" is-link class="menu-cell" />

          <van-cell title="课程管理" icon="notes-o" is-link class="menu-cell" />
          <van-cell title="意图字典" icon="label-o" is-link to="/admin/intent-dict" class="menu-cell" />
          <van-cell title="提示词模板" icon="edit" is-link to="/admin/intent-prompt" class="menu-cell" />
          <van-cell title="意图记录" icon="chart-trending-o" is-link to="/admin/intent-records" class="menu-cell" />
          <van-cell title="系统设置" icon="setting-o" is-link class="menu-cell" />
          <van-cell title="数据统计" icon="chart-trending-o" is-link class="menu-cell" />
        </van-cell-group>
      </div>

      <div class="action-buttons fade-in">
        <van-button round block type="primary" class="profile-button" @click="router.push('/admin/profile')">
          <van-icon name="contact" style="margin-right: 6px;" />
          我的
        </van-button>
        <van-button round block type="danger" class="logout-button" @click="handleLogout">
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

// Dashboard 统计数据
const dashStats = ref({
  totalRequests: 0,
  totalTokens: 0,
  totalUsers: 0,
  pendingAudits: 0
})

// 格式化Token数量
const formatTokenCount = (count) => {
  if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M'
  if (count >= 1000) return (count / 1000).toFixed(1) + 'K'
  return count.toString()
}

// 加载统计数据
const loadDashboardData = async () => {
  try {
    // 并行请求统计数据和推理用量
    const [statsRes, usageRes] = await Promise.all([
      adminAPI.getDashboardStats().catch(() => null),
      adminAPI.getInferenceUsage({
        interval: 'Day',
        start_time: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
        end_time: new Date().toISOString().split('T')[0]
      }).catch(() => null)
    ])

    if (statsRes?.data) {
      dashStats.value.totalUsers = statsRes.data.total_users || 0
      dashStats.value.pendingAudits = statsRes.data.pending_audits || 0
    }

    if (usageRes?.data?.summary) {
      dashStats.value.totalRequests = usageRes.data.summary.total_requests || 0
      dashStats.value.totalTokens = usageRes.data.summary.total_tokens || 0
    }
  } catch (error) {
    console.error('加载Dashboard数据失败:', error)
  }
}

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
  loadDashboardData()
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

// 处理待审核申请点击事件
const handlePendingAudits = () => {
  showToast({
    type: 'info',
    message: '用户管理功能请在Web端使用',
    duration: 2000
  })
}
</script>

<style scoped>
.dashboard-page {
  min-height: 100vh;
  background: #F5F7FB;
}

.admin-nav-bar :deep(.van-nav-bar) {
  background: #0F172A;
  --van-nav-bar-title-text-color: #FFFFFF;
  --van-nav-bar-icon-color: #FFFFFF;
  border-bottom: 1px solid rgba(148, 163, 184, 0.08);
}

.page-container {
  padding: 16px;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  background: linear-gradient(180deg, #FFFFFF 0%, #F8FAFF 100%);
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.05);
  border: 1px solid #EAF0F8;
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
  background: linear-gradient(135deg, #4F6EF7 0%, #60A5FA 100%);
  border-radius: 50%;
  position: relative;
  z-index: 1;
  box-shadow: 0 10px 20px rgba(79, 110, 247, 0.24);
}

.avatar-ring {
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(79, 110, 247, 0.22), rgba(96, 165, 250, 0.18));
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
  color: #0F172A;
}

.user-info p {
  font-size: 14px;
  color: #64748B;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.stat-card {
  background: linear-gradient(135deg, #4F6EF7 0%, #60A5FA 100%);
  border-radius: 16px;
  padding: 20px 16px;
  text-align: center;
  color: white;
  box-shadow: 0 10px 20px rgba(79, 110, 247, 0.22);
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
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
  background: white;
}

.menu-cell {
  transition: all 0.3s;
}

.menu-cell:active {
  background: linear-gradient(135deg, rgba(79, 110, 247, 0.06) 0%, rgba(96, 165, 250, 0.04) 100%);
}

.menu-cell :deep(.van-cell__title) {
  font-weight: 500;
  color: #0F172A;
}

.menu-cell :deep(.van-icon) {
  color: #4F6EF7;
  font-size: 20px;
}

.action-buttons {
  margin-top: 32px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.profile-button {
  background: linear-gradient(135deg, #4F6EF7 0%, #60A5FA 100%) !important;
  border: none !important;
  box-shadow: 0 8px 16px rgba(79, 110, 247, 0.24);
  font-weight: 600;
  height: 48px;
}

.logout-button {
  background: linear-gradient(135deg, #F87171 0%, #EF4444 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(248, 113, 113, 0.24);
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