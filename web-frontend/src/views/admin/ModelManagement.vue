<template>
  <div class="admin-layout">
    <AdminSidebar :active-menu="activeMenu" />

    <!-- 主内容区 -->
    <div class="admin-main">
      <!-- 顶部导航栏 -->
      <el-header class="admin-header" height="60px">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/admin/dashboard' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item>模型管理</el-breadcrumb-item>
        </el-breadcrumb>
        <div class="header-actions">
          <el-button @click="$router.push('/admin/dashboard')">
            <el-icon><Back /></el-icon>
            返回首页
          </el-button>
          <el-button type="primary" @click="$router.push('/admin/profile')">
            <el-icon><User /></el-icon>
            我的
          </el-button>
        </div>
      </el-header>

      <!-- 内容区域 -->
      <div class="admin-content">
        <div class="page-container fade-in">
          <el-tabs v-model="activeTab" type="card">
            <!-- 模型配置 Tab -->
            <el-tab-pane label="模型配置" name="config">
              <div class="page-header">
                <h3 class="page-title">AI模型列表</h3>
                <p class="page-subtitle">启用或禁用各个AI模型，用户将只能使用已启用的模型</p>
              </div>

              <el-row :gutter="20">
                <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="model in models" :key="model.id">
                  <el-card class="model-card card-shadow" :class="{ 'model-enabled': model.enabled }">
                    <div class="model-icon">{{ model.icon }}</div>
                    <div class="model-name">{{ model.name }}</div>
                    <div class="model-description">{{ model.description }}</div>
                    <div class="model-status">
                      <el-switch
                        v-model="model.enabled"
                        :loading="model.switching"
                        @change="handleToggleModel(model)"
                        active-text="已启用"
                        inactive-text="已禁用"
                      />
                    </div>
                    <div class="model-info">
                      <div class="info-item">
                        <span class="label">调用次数：</span>
                        <span class="value">{{ model.callCount }}</span>
                      </div>
                      <div class="info-item">
                        <span class="label">成功率：</span>
                        <span class="value">{{ model.successRate }}%</span>
                      </div>
                    </div>
                  </el-card>
                </el-col>
              </el-row>
            </el-tab-pane>

            <!-- 调用监控 Tab -->
            <el-tab-pane label="调用监控" name="monitor">
              <div class="table-toolbar">
                <div class="toolbar-left">
                  <el-radio-group v-model="timeRange" @change="loadMonitorData">
                    <el-radio-button label="today">今日</el-radio-button>
                    <el-radio-button label="yesterday">昨日</el-radio-button>
                    <el-radio-button label="week">近7天</el-radio-button>
                    <el-radio-button label="custom">自定义</el-radio-button>
                  </el-radio-group>
                  
                  <el-date-picker
                    v-if="timeRange === 'custom'"
                    v-model="customDateRange"
                    type="daterange"
                    range-separator="至"
                    start-placeholder="开始日期"
                    end-placeholder="结束日期"
                    @change="loadMonitorData"
                    style="margin-left: 12px;"
                  />
                </div>
                <div class="toolbar-right">
                  <el-button @click="handleResetStats">
                    <el-icon><RefreshLeft /></el-icon>
                    重置统计数据
                  </el-button>
                  <el-button type="primary" @click="handleExportReport">
                    <el-icon><Download /></el-icon>
                    导出监控报表
                  </el-button>
                </div>
              </div>

              <!-- 统计卡片 -->
              <div class="stats-grid">
                <div class="stat-card" v-for="stat in monitorStats" :key="stat.model">
                  <div class="stat-icon">{{ getModelIcon(stat.model) }}</div>
                  <div class="stat-label">{{ stat.model }}</div>
                  <el-divider />
                  <div class="monitor-details">
                    <div class="detail-item">
                      <span class="detail-label">回答次数</span>
                      <span class="detail-value">{{ stat.callCount }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Token用量</span>
                      <span class="detail-value">{{ stat.tokenUsage }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">成功率</span>
                      <span class="detail-value" :style="{ color: getSuccessRateColor(stat.successRate) }">
                        {{ stat.successRate }}%
                      </span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">平均响应时间</span>
                      <span class="detail-value">{{ stat.avgResponseTime }}ms</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 调用趋势图表 -->
              <div class="chart-container">
                <div class="chart-title">模型调用趋势</div>
                <div ref="trendChartRef" style="width: 100%; height: 400px;"></div>
              </div>

              <!-- Token使用分布 -->
              <div class="chart-container">
                <div class="chart-title">Token使用分布</div>
                <div ref="tokenChartRef" style="width: 100%; height: 350px;"></div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import AdminSidebar from '@/components/admin/AdminSidebar.vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import * as echarts from 'echarts';
import * as XLSX from 'xlsx';

const router = useRouter();
const activeTab = ref('config');
const activeMenu = computed(() => router.currentRoute.value.path);

// 模型列表
const models = ref([
  {
    id: 1,
    name: 'DeepSeek',
    icon: '🤖',
    description: '深度求索AI模型，擅长代码生成和技术问答',
    enabled: true,
    switching: false,
    callCount: 3256,
    successRate: 98.5
  },
  {
    id: 2,
    name: 'Doubao',
    icon: '🎯',
    description: '豆包AI模型，通用对话能力强',
    enabled: true,
    switching: false,
    callCount: 2845,
    successRate: 97.2
  },
  {
    id: 3,
    name: 'Qwen',
    icon: '🌟',
    description: '通义千问，阿里云大模型',
    enabled: true,
    switching: false,
    callCount: 2134,
    successRate: 96.8
  },
  {
    id: 4,
    name: 'Gemini',
    icon: '💎',
    description: 'Google Gemini模型',
    enabled: false,
    switching: false,
    callCount: 856,
    successRate: 95.3
  },
  {
    id: 5,
    name: 'Claude',
    icon: '🎨',
    description: 'Anthropic Claude模型',
    enabled: false,
    switching: false,
    callCount: 423,
    successRate: 97.8
  },
  {
    id: 6,
    name: 'GPT-4',
    icon: '🚀',
    description: 'OpenAI GPT-4模型',
    enabled: false,
    switching: false,
    callCount: 1245,
    successRate: 98.9
  }
]);

// 监控数据
const timeRange = ref('today');
const customDateRange = ref([]);
const trendChartRef = ref(null);
const tokenChartRef = ref(null);
let trendChart = null;
let tokenChart = null;

const monitorStats = ref([
  {
    model: 'DeepSeek',
    callCount: 856,
    tokenUsage: '125.6K',
    successRate: 98.5,
    avgResponseTime: 1250
  },
  {
    model: 'Doubao',
    callCount: 723,
    tokenUsage: '98.3K',
    successRate: 97.2,
    avgResponseTime: 980
  },
  {
    model: 'Qwen',
    callCount: 645,
    tokenUsage: '87.5K',
    successRate: 96.8,
    avgResponseTime: 1100
  }
]);

// 切换模型状态
const handleToggleModel = async (model) => {
  model.switching = true;
  try {
    // TODO: 调用API切换模型状态
    await new Promise(resolve => setTimeout(resolve, 800));
    ElMessage.success(`${model.name} 已${model.enabled ? '启用' : '禁用'}`);
  } catch (error) {
    model.enabled = !model.enabled;
    ElMessage.error('操作失败：' + error);
  } finally {
    model.switching = false;
  }
};

// 获取模型图标
const getModelIcon = (modelName) => {
  const model = models.value.find(m => m.name === modelName);
  return model ? model.icon : '🤖';
};

// 获取成功率颜色
const getSuccessRateColor = (rate) => {
  if (rate >= 98) return '#67C23A';
  if (rate >= 95) return '#E6A23C';
  return '#F56C6C';
};

// 初始化趋势图表
const initTrendChart = () => {
  if (!trendChartRef.value) return;
  
  trendChart = echarts.init(trendChartRef.value);
  
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['DeepSeek', 'Doubao', 'Qwen']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00']
    },
    yAxis: {
      type: 'value',
      name: '调用次数'
    },
    series: [
      {
        name: 'DeepSeek',
        type: 'line',
        smooth: true,
        data: [120, 132, 101, 134, 190, 230, 210],
        itemStyle: { color: '#409EFF' }
      },
      {
        name: 'Doubao',
        type: 'line',
        smooth: true,
        data: [90, 110, 95, 115, 150, 180, 165],
        itemStyle: { color: '#67C23A' }
      },
      {
        name: 'Qwen',
        type: 'line',
        smooth: true,
        data: [80, 95, 85, 100, 130, 155, 145],
        itemStyle: { color: '#E6A23C' }
      }
    ]
  };
  
  trendChart.setOption(option);
  
  window.addEventListener('resize', () => {
    trendChart?.resize();
  });
};

// 初始化Token图表
const initTokenChart = () => {
  if (!tokenChartRef.value) return;
  
  tokenChart = echarts.init(tokenChartRef.value);
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: 'Token使用',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: '{b}: {d}%'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        data: [
          { value: 125600, name: 'DeepSeek', itemStyle: { color: '#409EFF' } },
          { value: 98300, name: 'Doubao', itemStyle: { color: '#67C23A' } },
          { value: 87500, name: 'Qwen', itemStyle: { color: '#E6A23C' } }
        ]
      }
    ]
  };
  
  tokenChart.setOption(option);
  
  window.addEventListener('resize', () => {
    tokenChart?.resize();
  });
};

// 加载监控数据
const loadMonitorData = async () => {
  try {
    // TODO: 调用API加载监控数据
    await new Promise(resolve => setTimeout(resolve, 500));
    ElMessage.success('数据已刷新');
  } catch (error) {
    ElMessage.error('加载失败：' + error);
  }
};

// 重置统计数据
const handleResetStats = () => {
  ElMessageBox.confirm(
    '确定要重置所有统计数据吗？此操作不可恢复！',
    '确认重置',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      // TODO: 调用API重置统计数据
      await new Promise(resolve => setTimeout(resolve, 1000));
      ElMessage.success('统计数据已重置');
      loadMonitorData();
    } catch (error) {
      ElMessage.error('重置失败：' + error);
    }
  });
};

// 导出监控报表
const handleExportReport = () => {
  try {
    const exportData = monitorStats.value.map(stat => ({
      '模型名称': stat.model,
      '回答次数': stat.callCount,
      'Token用量': stat.tokenUsage,
      '调用成功率': stat.successRate + '%',
      '平均响应时间': stat.avgResponseTime + 'ms'
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '模型监控报表');
    
    XLSX.writeFile(wb, `模型监控报表_${new Date().getTime()}.xlsx`);
    
    ElMessage.success('导出成功');
  } catch (error) {
    ElMessage.error('导出失败：' + error);
  }
};

onMounted(() => {
  nextTick(() => {
    initTrendChart();
    initTokenChart();
  });
});
</script>

<style scoped>
@import '@/styles/admin.css';

.model-card {
  margin-bottom: 20px;
  text-align: center;
  transition: all 0.3s;
  border: 2px solid #EBEEF5;
}

.model-card.model-enabled {
  border-color: #409EFF;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.05) 0%, rgba(64, 158, 255, 0.02) 100%);
}

.model-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.model-name {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.model-description {
  font-size: 13px;
  color: #909399;
  margin-bottom: 16px;
  min-height: 40px;
}

.model-status {
  margin-bottom: 16px;
}

.model-info {
  padding-top: 12px;
  border-top: 1px solid #EBEEF5;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
}

.info-item .label {
  color: #909399;
}

.info-item .value {
  color: #303133;
  font-weight: 600;
}

.monitor-details {
  text-align: left;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.detail-label {
  font-size: 14px;
  color: #909399;
}

.detail-value {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}
</style>
