<template>
  <div class="admin-layout">
    <AdminSidebar :active-menu="activeMenu" />

    <!-- 主内容区 -->
    <div class="admin-main">
      <!-- 顶部导航栏 -->
      <el-header class="admin-header" height="60px">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/admin/dashboard' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item>管理员首页</el-breadcrumb-item>
        </el-breadcrumb>
        <div class="header-actions">
          <el-button type="primary" @click="$router.push('/admin/profile')">
            <el-icon><User /></el-icon>
            我的
          </el-button>
        </div>
      </el-header>

      <!-- 内容区域 -->
      <div class="admin-content">
        <div class="page-container fade-in">
          <!-- Tab切换 -->
          <el-tabs v-model="activeTab" type="card">
            <!-- 系统概览 Tab -->
            <el-tab-pane label="系统概览" name="overview">
              <!-- 统计卡片 -->
              <div class="stats-grid overview-stats-grid">
                <div class="stat-card stat-card-accent" @click="viewModelStats">
                  <div class="stat-icon">📊</div>
                  <div class="stat-value">{{ usageData.summary?.total_requests?.toLocaleString() || 0 }}</div>
                  <div class="stat-label">模型调用次数（近7天）</div>
                </div>
                <div class="stat-card success stat-card-accent" @click="viewUsers">
                  <div class="stat-icon">👥</div>
                  <div class="stat-value">{{ stats.totalUsers }}</div>
                  <div class="stat-label">用户总数</div>
                </div>
                <div class="stat-card warning stat-card-accent" @click="viewModelStats">
                  <div class="stat-icon">🔤</div>
                  <div class="stat-value">{{ formatTokenCount(usageData.summary?.total_tokens || 0) }}</div>
                  <div class="stat-label">Token消耗（近7天）</div>
                </div>
                <div class="stat-card danger stat-card-accent" @click="handlePendingAudits">
                  <div class="stat-icon">⏰</div>
                  <div class="stat-value">{{ stats.pendingAudits }}</div>
                  <div class="stat-label">待审核申请</div>
                </div>
              </div>

              <!-- 快捷入口 -->
              <div class="page-header">
                <h3 class="page-title">快捷操作</h3>
              </div>
              <div class="quick-actions">
                <div class="quick-action-btn" @click="$router.push('/admin/knowledge')">
                  <div class="quick-action-icon">📚</div>
                  <div class="quick-action-text">知识库管理</div>
                </div>
                <div class="quick-action-btn" @click="$router.push('/admin/bookshelf')">
                  <div class="quick-action-icon">🗂️</div>
                  <div class="quick-action-text">平台书架</div>
                </div>
                <div class="quick-action-btn" @click="$router.push('/admin/announcements')">
                  <div class="quick-action-icon">📢</div>
                  <div class="quick-action-text">系统公告管理</div>
                </div>
                <div class="quick-action-btn" @click="$router.push('/admin/users')">
                  <div class="quick-action-icon">👥</div>
                  <div class="quick-action-text">用户管理</div>
                </div>
                <div class="quick-action-btn" @click="$router.push('/admin/models')">
                  <div class="quick-action-icon">⚙️</div>
                  <div class="quick-action-text">模型管理</div>
                </div>
              </div>
            </el-tab-pane>


          </el-tabs>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import AdminSidebar from '@/components/admin/AdminSidebar.vue';
import { ElMessage } from 'element-plus';
import { adminAPI } from '@/services';

const router = useRouter();
const activeTab = ref('overview');
const activeMenu = computed(() => router.currentRoute.value.path);
// 统计数据（真实接口）
const stats = ref({
  totalUsers: 0,
  pendingAudits: 0
});

// 推理用量数据
const usageData = ref({
  data_points: [],
  summary: { total_input_tokens: 0, total_output_tokens: 0, total_tokens: 0, total_requests: 0 }
});

// 加载Dashboard统计数据
const loadDashboardStats = async () => {
  try {
    const res = await adminAPI.getDashboardStats();
    if (res && res.data) {
      stats.value.totalUsers = res.data.total_users || 0;
      stats.value.pendingAudits = res.data.pending_audits || 0;
    }
  } catch (error) {
    console.error('加载Dashboard统计失败:', error);
  }
};

// 加载推理用量数据
const loadInferenceUsage = async () => {
  try {
    const now = new Date();
    const endTime = now.toISOString().split('T')[0];
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 7);
    const startTime = startDate.toISOString().split('T')[0];

    const res = await adminAPI.getInferenceUsage({
      interval: 'Day',
      start_time: startTime,
      end_time: endTime
    });

    if (res && res.data) {
      usageData.value = res.data;
    }
  } catch (error) {
    console.error('加载推理用量失败:', error);
  }
};

// 查看模型统计
const viewModelStats = () => {
  router.push('/admin/models');
};

// 查看用户
const viewUsers = () => {
  router.push('/admin/users');
};

// 处理待审核申请点击事件
const handlePendingAudits = () => {
  router.push({
    path: '/admin/users',
    query: {
      tab: 'teacher',
      verificationStatus: 'pending'
    }
  });
};

// 格式化Token数量（大数字友好显示）
const formatTokenCount = (count) => {
  if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
  if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
  return count.toString();
};

onMounted(async () => {
  // 并行加载所有数据
  await Promise.all([
    loadDashboardStats(),
    loadInferenceUsage()
  ]);
});
</script>

<style scoped>
@import '@/styles/admin.css';

.overview-stats-grid .stat-card-accent {
  background: linear-gradient(180deg, #FFFFFF 0%, #F8FAFF 100%);
}
</style>