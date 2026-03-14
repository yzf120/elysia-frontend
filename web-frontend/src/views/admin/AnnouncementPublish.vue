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
          <el-breadcrumb-item>公告发布</el-breadcrumb-item>
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
          <div class="page-header">
            <h3 class="page-title">发布系统公告</h3>
            <p class="page-subtitle">发布后所有用户可在各自首页查看</p>
          </div>

          <el-card class="card-shadow">
            <el-form :model="announcementForm" :rules="announcementRules" ref="announcementFormRef" label-width="120px">
              <el-form-item label="公告标题" prop="title">
                <el-input
                  v-model="announcementForm.title"
                  placeholder="请输入公告标题"
                  maxlength="100"
                  show-word-limit
                />
              </el-form-item>

              <el-form-item label="公告内容" prop="content">
                <el-input
                  v-model="announcementForm.content"
                  type="textarea"
                  :rows="10"
                  placeholder="请输入公告内容"
                  maxlength="2000"
                  show-word-limit
                />
              </el-form-item>

              <el-form-item label="优先级" prop="priority">
                <el-radio-group v-model="announcementForm.priority">
                  <el-radio label="high">
                    <el-tag type="danger" size="small">高</el-tag>
                    <span style="margin-left: 8px;">重要公告，置顶显示</span>
                  </el-radio>
                  <el-radio label="normal">
                    <el-tag type="warning" size="small">普通</el-tag>
                    <span style="margin-left: 8px;">常规公告</span>
                  </el-radio>
                  <el-radio label="low">
                    <el-tag type="info" size="small">低</el-tag>
                    <span style="margin-left: 8px;">一般通知</span>
                  </el-radio>
                </el-radio-group>
              </el-form-item>

              <el-form-item label="发布对象" prop="target">
                <el-checkbox-group v-model="announcementForm.target">
                  <el-checkbox label="student">学生</el-checkbox>
                  <el-checkbox label="teacher">教师</el-checkbox>
                  <el-checkbox label="admin">管理员</el-checkbox>
                </el-checkbox-group>
              </el-form-item>

              <el-form-item label="生效时间" prop="effectiveTime">
                <el-radio-group v-model="announcementForm.effectiveType">
                  <el-radio label="immediate">立即生效</el-radio>
                  <el-radio label="scheduled">定时发布</el-radio>
                </el-radio-group>
                <el-date-picker
                  v-if="announcementForm.effectiveType === 'scheduled'"
                  v-model="announcementForm.effectiveTime"
                  type="datetime"
                  placeholder="选择发布时间"
                  style="margin-left: 12px;"
                />
              </el-form-item>

              <el-form-item>
                <el-button type="primary" @click="handlePublish" :loading="publishing">
                  <el-icon><Promotion /></el-icon>
                  发布公告
                </el-button>
                <el-button @click="handlePreview">
                  <el-icon><View /></el-icon>
                  预览
                </el-button>
                <el-button @click="handleReset">
                  <el-icon><Refresh /></el-icon>
                  重置
                </el-button>
                <el-button @click="handleBack">
                  <el-icon><Close /></el-icon>
                  取消
                </el-button>
              </el-form-item>
            </el-form>
          </el-card>
        </div>
      </div>
    </div>

    <!-- 预览对话框 -->
    <el-dialog v-model="previewVisible" title="公告预览" width="600px">
      <div class="preview-container">
        <div class="preview-header">
          <h2>{{ announcementForm.title || '（未填写标题）' }}</h2>
          <div class="preview-meta">
            <el-tag :type="getPriorityType(announcementForm.priority)" size="small">
              {{ getPriorityText(announcementForm.priority) }}
            </el-tag>
            <span style="margin-left: 12px; color: #909399; font-size: 14px;">
              发布时间：{{ new Date().toLocaleString('zh-CN') }}
            </span>
          </div>
        </div>
        <el-divider />
        <div class="preview-content">
          {{ announcementForm.content || '（未填写内容）' }}
        </div>
        <el-divider />
        <div class="preview-footer">
          <span style="color: #909399; font-size: 13px;">
            发布对象：{{ getTargetText() }}
          </span>
        </div>
      </div>
      <template #footer>
        <el-button @click="previewVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import AdminSidebar from '@/components/admin/AdminSidebar.vue';
import { ElMessage, ElMessageBox } from 'element-plus';

const router = useRouter();
const activeMenu = computed(() => '/admin/dashboard');
const publishing = ref(false);
const previewVisible = ref(false);

// 公告表单
const announcementFormRef = ref(null);
const announcementForm = ref({
  title: '',
  content: '',
  priority: 'normal',
  target: ['student', 'teacher'],
  effectiveType: 'immediate',
  effectiveTime: null
});

const announcementRules = {
  title: [
    { required: true, message: '请输入公告标题', trigger: 'blur' },
    { min: 5, max: 100, message: '标题长度在 5 到 100 个字符', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入公告内容', trigger: 'blur' },
    { min: 10, max: 2000, message: '内容长度在 10 到 2000 个字符', trigger: 'blur' }
  ],
  target: [
    { type: 'array', required: true, message: '请选择发布对象', trigger: 'change' },
    { type: 'array', min: 1, message: '至少选择一个发布对象', trigger: 'change' }
  ]
};

// 获取优先级类型
const getPriorityType = (priority) => {
  const types = {
    high: 'danger',
    normal: 'warning',
    low: 'info'
  };
  return types[priority] || 'info';
};

// 获取优先级文本
const getPriorityText = (priority) => {
  const texts = {
    high: '高优先级',
    normal: '普通',
    low: '低优先级'
  };
  return texts[priority] || '普通';
};

// 获取发布对象文本
const getTargetText = () => {
  if (announcementForm.value.target.length === 0) {
    return '未选择';
  }
  const targetMap = {
    student: '学生',
    teacher: '教师',
    admin: '管理员'
  };
  return announcementForm.value.target.map(t => targetMap[t]).join('、');
};

// 发布公告
const handlePublish = async () => {
  if (!announcementFormRef.value) return;

  await announcementFormRef.value.validate(async (valid) => {
    if (valid) {
      ElMessageBox.confirm(
        '确定要发布该公告吗？发布后所有选定的用户都能看到。',
        '确认发布',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(async () => {
        publishing.value = true;
        try {
          // TODO: 调用API发布公告
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          ElMessage.success('公告发布成功！');
          
          // 跳转到知识库管理页面的系统公告管理Tab
          setTimeout(() => {
            router.push({
              path: '/admin/knowledge',
              query: { tab: 'announcement' }
            });
          }, 1500);
        } catch (error) {
          ElMessage.error('发布失败：' + error);
        } finally {
          publishing.value = false;
        }
      });
    }
  });
};

// 预览公告
const handlePreview = () => {
  if (!announcementForm.value.title || !announcementForm.value.content) {
    ElMessage.warning('请先填写公告标题和内容');
    return;
  }
  previewVisible.value = true;
};

// 重置表单
const handleReset = () => {
  ElMessageBox.confirm(
    '确定要重置表单吗？所有填写的内容将被清空。',
    '确认重置',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    announcementFormRef.value?.resetFields();
    announcementForm.value = {
      title: '',
      content: '',
      priority: 'normal',
      target: ['student', 'teacher'],
      effectiveType: 'immediate',
      effectiveTime: null
    };
    ElMessage.success('表单已重置');
  });
};

// 返回
const handleBack = () => {
  if (announcementForm.value.title || announcementForm.value.content) {
    ElMessageBox.confirm(
      '当前有未保存的内容，确定要离开吗？',
      '确认离开',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      router.push('/admin/dashboard');
    });
  } else {
    router.push('/admin/dashboard');
  }
};
</script>

<style scoped>
@import '@/styles/admin.css';

.preview-container {
  padding: 20px;
}

.preview-header h2 {
  margin: 0 0 12px 0;
  font-size: 24px;
  color: #303133;
}

.preview-meta {
  display: flex;
  align-items: center;
}

.preview-content {
  white-space: pre-wrap;
  line-height: 1.8;
  color: #606266;
  font-size: 15px;
  min-height: 200px;
}

.preview-footer {
  text-align: right;
}

:deep(.el-radio) {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}
</style>
