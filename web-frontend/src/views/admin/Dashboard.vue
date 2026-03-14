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
              <div class="stats-grid">
                <div class="stat-card" @click="viewModelStats">
                  <div class="stat-icon">📊</div>
                  <div class="stat-value">{{ stats.modelCalls }}</div>
                  <div class="stat-label">模型调用总数</div>
                </div>
                <div class="stat-card success" @click="viewUsers">
                  <div class="stat-icon">👥</div>
                  <div class="stat-value">{{ stats.totalUsers }}</div>
                  <div class="stat-label">用户总数</div>
                </div>
                <div class="stat-card warning" @click="viewKnowledge">
                  <div class="stat-icon">📚</div>
                  <div class="stat-value">{{ stats.knowledgeSize }} GB</div>
                  <div class="stat-label">知识库容量</div>
                </div>
                <div class="stat-card danger" @click="activeTab = 'audit'">
                  <div class="stat-icon">⏰</div>
                  <div class="stat-value">{{ stats.pendingAudits }}</div>
                  <div class="stat-label">待审核申请</div>
                </div>
              </div>

              <!-- 模型调用统计图表 -->
              <div class="chart-container">
                <div class="chart-title">模型调用趋势（近7天）</div>
                <div ref="chartRef" style="width: 100%; height: 300px;"></div>
              </div>

              <!-- 知识库容量进度 -->
              <el-card class="card-shadow" style="margin-bottom: 20px;">
                <template #header>
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 600;">知识库容量使用情况</span>
                    <el-tag type="info">总容量: 100 GB</el-tag>
                  </div>
                </template>
                <el-progress 
                  :percentage="stats.knowledgePercentage" 
                  :color="getProgressColor(stats.knowledgePercentage)"
                  :stroke-width="20"
                  text-inside
                />
                <div style="margin-top: 12px; font-size: 14px; color: #909399;">
                  已使用 {{ stats.knowledgeSize }} GB / 100 GB
                </div>
              </el-card>

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

            <!-- 待审核 Tab -->
            <el-tab-pane name="audit">
              <template #label>
                <el-badge :value="stats.pendingAudits" :hidden="stats.pendingAudits === 0">
                  待审核
                </el-badge>
              </template>
              
              <div v-if="loading" class="loading-container">
                <el-icon class="is-loading" :size="40"><Loading /></el-icon>
              </div>
              
              <div v-else-if="pendingAudits.length === 0" class="empty-state">
                <div class="empty-icon">✅</div>
                <div class="empty-text">暂无待审核申请</div>
                <div class="empty-hint">所有教师认证申请已处理完毕</div>
              </div>
              
              <el-table v-else :data="pendingAudits" stripe style="width: 100%">
                <el-table-column prop="employeeNumber" label="工号" width="150" />
                <el-table-column prop="name" label="姓名" width="120" />
                <el-table-column prop="email" label="学校邮箱" min-width="200" />
                <el-table-column prop="department" label="院系" width="150" />
                <el-table-column prop="submitTime" label="提交时间" width="180" />
                <el-table-column label="状态" width="100">
                  <template #default>
                    <el-tag type="warning">待审核</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="120" fixed="right">
                  <template #default="{ row }">
                    <el-button 
                      type="primary" 
                      size="small" 
                      @click="handleAudit(row)"
                    >
                      审核
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
              
              <el-pagination
                v-if="pendingAudits.length > 0"
                v-model:current-page="currentPage"
                v-model:page-size="pageSize"
                :total="totalAudits"
                :page-sizes="[10, 20, 50]"
                layout="total, sizes, prev, pager, next, jumper"
                @size-change="loadPendingAudits"
                @current-change="loadPendingAudits"
              />
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import AdminSidebar from '@/components/admin/AdminSidebar.vue';
import * as echarts from 'echarts';
import { ElMessage, ElMessageBox } from 'element-plus';

const router = useRouter();
const activeTab = ref('overview');
const activeMenu = computed(() => router.currentRoute.value.path);
const loading = ref(false);
const chartRef = ref(null);
let chartInstance = null;

// 统计数据
const stats = ref({
  modelCalls: 15234,
  totalUsers: 1256,
  knowledgeSize: 45.6,
  knowledgePercentage: 45.6,
  pendingAudits: 8
});

// 待审核列表
const pendingAudits = ref([
  {
    id: 1,
    employeeNumber: 'T20240001',
    name: '张教授',
    email: 'zhang@university.edu.cn',
    department: '计算机学院',
    submitTime: '2026-02-07 10:30:00'
  },
  {
    id: 2,
    employeeNumber: 'T20240002',
    name: '李老师',
    email: 'li@university.edu.cn',
    department: '数学学院',
    submitTime: '2026-02-07 09:15:00'
  },
  {
    id: 3,
    employeeNumber: 'T20240003',
    name: '王副教授',
    email: 'wang@university.edu.cn',
    department: '物理学院',
    submitTime: '2026-02-06 16:45:00'
  }
]);

const currentPage = ref(1);
const pageSize = ref(10);
const totalAudits = ref(8);

// 初始化图表
const initChart = () => {
  if (!chartRef.value) return;
  
  chartInstance = echarts.init(chartRef.value);
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['02-01', '02-02', '02-03', '02-04', '02-05', '02-06', '02-07'],
      axisLine: {
        lineStyle: {
          color: '#DCDFE6'
        }
      },
      axisLabel: {
        color: '#606266'
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        lineStyle: {
          color: '#DCDFE6'
        }
      },
      axisLabel: {
        color: '#606266'
      },
      splitLine: {
        lineStyle: {
          color: '#EBEEF5'
        }
      }
    },
    series: [
      {
        name: '调用次数',
        type: 'line',
        smooth: true,
        data: [1850, 2100, 2350, 2200, 2450, 2300, 2584],
        itemStyle: {
          color: '#10B981'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
            { offset: 1, color: 'rgba(16, 185, 129, 0.05)' }
          ])
        }
      }
    ]
  };
  
  chartInstance.setOption(option);
  
  // 响应式
  window.addEventListener('resize', () => {
    chartInstance?.resize();
  });
};

// 加载待审核列表
const loadPendingAudits = async () => {
  loading.value = true;
  try {
    // TODO: 调用API获取待审核列表
    await new Promise(resolve => setTimeout(resolve, 500));
  } catch (error) {
    ElMessage.error('加载失败：' + error);
  } finally {
    loading.value = false;
  }
};

// 处理审核
const handleAudit = (row) => {
  router.push({
    path: '/admin/teacher-audit',
    query: { id: row.id }
  });
};

// 查看模型统计
const viewModelStats = () => {
  router.push('/admin/models');
};

// 查看用户
const viewUsers = () => {
  router.push('/admin/users');
};

// 查看知识库
const viewKnowledge = () => {
  router.push('/admin/knowledge');
};

// 获取进度条颜色
const getProgressColor = (percentage) => {
  if (percentage < 50) return '#67C23A';
  if (percentage < 80) return '#E6A23C';
  return '#F56C6C';
};

onMounted(() => {
  nextTick(() => {
    initChart();
  });
  loadPendingAudits();
});
</script>

<style scoped>
@import '@/styles/admin.css';
</style>
