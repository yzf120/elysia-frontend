<template>
  <div class="admin-layout">
    <!-- 侧边栏 -->
    <el-aside width="240px" class="admin-sidebar">
      <div class="sidebar-logo">
        <el-icon style="margin-right: 8px;"><Platform /></el-icon>
        Elysia 管理端
      </div>
      <el-menu
        :default-active="activeMenu"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        router
      >
        <el-menu-item index="/admin/dashboard">
          <el-icon><HomeFilled /></el-icon>
          <span>管理员首页</span>
        </el-menu-item>
        <el-menu-item index="/admin/knowledge">
          <el-icon><Reading /></el-icon>
          <span>知识库管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/users">
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/models">
          <el-icon><Setting /></el-icon>
          <span>模型管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 主内容区 -->
    <div class="admin-main">
      <!-- 顶部导航栏 -->
      <el-header class="admin-header" height="60px">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/admin/dashboard' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item>教师认证审核</el-breadcrumb-item>
        </el-breadcrumb>
        <div class="header-actions">
          <el-button @click="handleBack">
            <el-icon><Back /></el-icon>
            返回
          </el-button>
        </div>
      </el-header>

      <!-- 内容区域 -->
      <div class="admin-content">
        <div class="page-container fade-in">
          <div v-if="loading" class="loading-container">
            <el-icon class="is-loading" :size="40"><Loading /></el-icon>
          </div>

          <div v-else-if="!auditData" class="empty-state">
            <div class="empty-icon">❌</div>
            <div class="empty-text">未找到审核信息</div>
            <el-button type="primary" @click="handleBack" style="margin-top: 20px;">
              返回首页
            </el-button>
          </div>

          <div v-else>
            <div class="page-header">
              <h3 class="page-title">教师认证信息审核</h3>
              <p class="page-subtitle">请仔细核对教师提交的认证信息</p>
            </div>

            <el-card class="card-shadow" style="margin-bottom: 24px;">
              <template #header>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-weight: 600;">基本信息</span>
                  <el-tag :type="getStatusType(auditData.status)">{{ auditData.status }}</el-tag>
                </div>
              </template>

              <el-descriptions :column="2" border>
                <el-descriptions-item label="姓名">{{ auditData.name }}</el-descriptions-item>
                <el-descriptions-item label="工号">{{ auditData.employeeNumber }}</el-descriptions-item>
                <el-descriptions-item label="学校邮箱">{{ auditData.email }}</el-descriptions-item>
                <el-descriptions-item label="手机号">{{ auditData.phoneNumber }}</el-descriptions-item>
                <el-descriptions-item label="院系">{{ auditData.department }}</el-descriptions-item>
                <el-descriptions-item label="职称">{{ auditData.title }}</el-descriptions-item>
                <el-descriptions-item label="提交时间" :span="2">{{ auditData.submitTime }}</el-descriptions-item>
              </el-descriptions>
            </el-card>

            <el-card class="card-shadow" style="margin-bottom: 24px;">
              <template #header>
                <span style="font-weight: 600;">认证资料</span>
              </template>

              <div class="materials-grid">
                <div class="material-item" v-for="(file, index) in auditData.materials" :key="index">
                  <div class="material-preview">
                    <el-icon :size="48"><Document /></el-icon>
                  </div>
                  <div class="material-name">{{ file.name }}</div>
                  <el-button type="primary" size="small" @click="handlePreviewFile(file)">
                    <el-icon><View /></el-icon>
                    查看
                  </el-button>
                </div>
              </div>
            </el-card>

            <el-card class="card-shadow" v-if="auditData.status === '待审核'">
              <template #header>
                <span style="font-weight: 600;">审核操作</span>
              </template>

              <el-form :model="auditForm" :rules="auditRules" ref="auditFormRef" label-width="100px">
                <el-form-item label="审核结果" prop="result">
                  <el-radio-group v-model="auditForm.result">
                    <el-radio label="approved">通过</el-radio>
                    <el-radio label="rejected">驳回</el-radio>
                  </el-radio-group>
                </el-form-item>

                <el-form-item label="审核意见" prop="comment">
                  <el-input
                    v-model="auditForm.comment"
                    type="textarea"
                    :rows="4"
                    :placeholder="auditForm.result === 'rejected' ? '请填写驳回原因（必填）' : '可填写审核意见（选填）'"
                  />
                </el-form-item>

                <el-form-item>
                  <el-button type="primary" @click="handleSubmitAudit" :loading="submitting">
                    <el-icon><Check /></el-icon>
                    提交审核
                  </el-button>
                  <el-button @click="handleBack">
                    <el-icon><Close /></el-icon>
                    取消
                  </el-button>
                </el-form-item>
              </el-form>
            </el-card>

            <el-card class="card-shadow" v-else>
              <template #header>
                <span style="font-weight: 600;">审核记录</span>
              </template>

              <el-descriptions :column="1" border>
                <el-descriptions-item label="审核结果">
                  <el-tag :type="auditData.status === '已通过' ? 'success' : 'danger'">
                    {{ auditData.status }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="审核人">{{ auditData.auditor || '管理员' }}</el-descriptions-item>
                <el-descriptions-item label="审核时间">{{ auditData.auditTime }}</el-descriptions-item>
                <el-descriptions-item label="审核意见">{{ auditData.auditComment || '无' }}</el-descriptions-item>
              </el-descriptions>
            </el-card>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';

const router = useRouter();
const route = useRoute();
const activeMenu = computed(() => '/admin/dashboard');
const loading = ref(true);
const submitting = ref(false);

// 审核数据
const auditData = ref(null);

// 审核表单
const auditFormRef = ref(null);
const auditForm = ref({
  result: 'approved',
  comment: ''
});

const auditRules = {
  result: [{ required: true, message: '请选择审核结果', trigger: 'change' }],
  comment: [
    {
      validator: (rule, value, callback) => {
        if (auditForm.value.result === 'rejected' && !value) {
          callback(new Error('驳回时必须填写驳回原因'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ]
};

// 加载审核数据
const loadAuditData = async () => {
  loading.value = true;
  try {
    const id = route.query.id;
    if (!id) {
      auditData.value = null;
      return;
    }

    // TODO: 调用API加载审核数据
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 模拟数据
    auditData.value = {
      id: id,
      name: '张教授',
      employeeNumber: 'T20240001',
      email: 'zhang@university.edu.cn',
      phoneNumber: '13800138001',
      department: '计算机学院',
      title: '教授',
      submitTime: '2026-02-07 10:30:00',
      status: '待审核',
      materials: [
        { name: '教师资格证.pdf', url: '/files/cert1.pdf' },
        { name: '工作证明.pdf', url: '/files/cert2.pdf' }
      ]
    };
  } catch (error) {
    ElMessage.error('加载失败：' + error);
    auditData.value = null;
  } finally {
    loading.value = false;
  }
};

// 获取状态类型
const getStatusType = (status) => {
  if (status === '已通过') return 'success';
  if (status === '待审核') return 'warning';
  return 'danger';
};

// 预览文件
const handlePreviewFile = (file) => {
  ElMessage.info('预览文件：' + file.name);
  // TODO: 实现文件预览功能
};

// 提交审核
const handleSubmitAudit = async () => {
  if (!auditFormRef.value) return;

  await auditFormRef.value.validate(async (valid) => {
    if (valid) {
      const resultText = auditForm.value.result === 'approved' ? '通过' : '驳回';
      
      ElMessageBox.confirm(
        `确定要${resultText}该教师的认证申请吗？`,
        `确认${resultText}`,
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(async () => {
        submitting.value = true;
        try {
          // TODO: 调用API提交审核
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          ElMessage.success(`审核${resultText}成功`);
          
          // 返回首页待审核Tab
          setTimeout(() => {
            router.push({
              path: '/admin/dashboard',
              query: { tab: 'audit' }
            });
          }, 1500);
        } catch (error) {
          ElMessage.error('提交失败：' + error);
        } finally {
          submitting.value = false;
        }
      });
    }
  });
};

// 返回
const handleBack = () => {
  router.push({
    path: '/admin/dashboard',
    query: { tab: 'audit' }
  });
};

onMounted(() => {
  loadAuditData();
});
</script>

<style scoped>
@import '@/styles/admin.css';

.materials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.material-item {
  border: 1px solid #EBEEF5;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  transition: all 0.3s;
}

.material-item:hover {
  border-color: #409EFF;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.15);
}

.material-preview {
  margin-bottom: 12px;
  color: #409EFF;
}

.material-name {
  font-size: 14px;
  color: #606266;
  margin-bottom: 12px;
  word-break: break-all;
}
</style>
