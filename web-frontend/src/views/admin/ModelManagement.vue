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
                <div class="model-provider">
                  <el-tag :type="model.provider === 'doubao' ? 'primary' : 'success'" size="small">
                    {{ model.provider === 'doubao' ? '豆包' : '千问' }}
                  </el-tag>
                </div>
                <div class="model-status">
                  <el-switch
                    v-model="model.enabled"
                    :loading="model.switching"
                    @change="handleToggleModel(model)"
                    active-text="已启用"
                    inactive-text="已禁用"
                  />
                </div>
                <div class="model-meta">
                  <div class="meta-item">
                    <span class="label">模型ID：</span>
                    <span class="value model-id-text">{{ model.modelId }}</span>
                  </div>
                  <div class="meta-item">
                    <span class="label">流式支持：</span>
                    <span class="value">✅ 支持</span>
                  </div>
                  <div class="meta-item">
                    <span class="label">多模态：</span>
                    <span class="value">✅ 支持</span>
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import AdminSidebar from '@/components/admin/AdminSidebar.vue';
import { adminAPI } from '@/services';
import { ElMessage, ElMessageBox } from 'element-plus';

const router = useRouter();
const activeMenu = computed(() => router.currentRoute.value.path);
const loading = ref(false);

// 模型图标映射
const providerIcons = {
  doubao: '🎯',
  qwen: '🌟'
};

// 模型列表（从后端加载）
const models = ref([]);

// 从后端加载模型配置列表
const loadModels = async () => {
  loading.value = true;
  try {
    const res = await adminAPI.getAIModelConfigs();
    const data = res?.data?.models || res?.models || [];
    models.value = data.map(m => ({
      id: m.id,
      modelId: m.model_id,
      name: m.model_name,
      icon: providerIcons[m.provider] || '🤖',
      provider: m.provider,
      description: m.description,
      enabled: m.is_enabled === 1,
      switching: false
    }));
  } catch (error) {
    console.error('加载模型配置失败:', error);
    ElMessage.error('加载模型配置失败');
  } finally {
    loading.value = false;
  }
};

// 页面加载时获取模型列表
onMounted(() => {
  loadModels();
});

// 切换模型状态
const handleToggleModel = async (model) => {
  const action = model.enabled ? '启用' : '禁用';
  
  try {
    await ElMessageBox.confirm(
      `确定要${action}模型「${model.name}」吗？${!model.enabled ? '禁用后，教师和学生用户将无法选择该模型。' : '启用后，教师和学生用户可以选择该模型。'}`,
      `确认${action}`,
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: model.enabled ? 'success' : 'warning'
      }
    );
  } catch {
    // 用户取消，恢复状态
    model.enabled = !model.enabled;
    return;
  }

  model.switching = true;
  try {
    // 调用后端API切换模型状态
    await adminAPI.toggleAIModel(model.modelId, model.enabled);
    ElMessage.success(`${model.name} 已${action}`);
  } catch (error) {
    model.enabled = !model.enabled;
    ElMessage.error('操作失败：' + (error?.message || error));
  } finally {
    model.switching = false;
  }
};
</script>

<style scoped>
@import '@/styles/admin.css';

.model-card {
  margin-bottom: 20px;
  text-align: center;
  transition: all 0.3s;
  border: 1px solid #E5EAF3;
  border-radius: 16px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
}

.model-card.model-enabled {
  border-color: rgba(79, 110, 247, 0.28);
  background: linear-gradient(180deg, rgba(79, 110, 247, 0.06) 0%, rgba(255, 255, 255, 0.98) 100%);
}

.model-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.model-name {
  font-size: 18px;
  font-weight: 600;
  color: #0F172A;
  margin-bottom: 8px;
}

.model-description {
  font-size: 13px;
  color: #94A3B8;
  margin-bottom: 12px;
  min-height: 40px;
}

.model-provider {
  margin-bottom: 16px;
}

.model-status {
  margin-bottom: 16px;
}

.model-meta {
  padding-top: 12px;
  border-top: 1px solid #EEF2F7;
  text-align: left;
}

.meta-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
}

.meta-item .label {
  color: #94A3B8;
}

.meta-item .value {
  color: #0F172A;
  font-weight: 500;
}

.model-id-text {
  font-family: 'SF Mono', 'Monaco', 'Menlo', monospace;
  font-size: 11px;
  color: #64748B !important;
  word-break: break-all;
}
</style>