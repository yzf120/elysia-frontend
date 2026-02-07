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
          <el-breadcrumb-item>知识库管理</el-breadcrumb-item>
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
            <!-- RAG扩充 Tab -->
            <el-tab-pane label="RAG扩充" name="rag">
              <div class="form-section">
                <h3 class="form-section-title">上传知识库文件</h3>
                <el-upload
                  ref="uploadRef"
                  class="upload-demo"
                  drag
                  :action="uploadAction"
                  :headers="uploadHeaders"
                  :on-success="handleUploadSuccess"
                  :on-error="handleUploadError"
                  :before-upload="beforeUpload"
                  :file-list="fileList"
                  multiple
                  accept=".pdf,.doc,.docx,.txt"
                >
                  <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                  <div class="el-upload__text">
                    将文件拖到此处，或<em>点击上传</em>
                  </div>
                  <template #tip>
                    <div class="el-upload__tip">
                      支持 PDF、Word、TXT 格式，单个文件不超过 50MB
                    </div>
                  </template>
                </el-upload>
                
                <div style="margin-top: 20px; text-align: right;">
                  <el-button 
                    type="primary" 
                    :loading="importing"
                    :disabled="fileList.length === 0"
                    @click="handleImport"
                  >
                    <el-icon><Upload /></el-icon>
                    导入知识库
                  </el-button>
                </div>
              </div>

              <div class="form-section" style="margin-top: 32px;">
                <h3 class="form-section-title">已导入资料列表</h3>
                
                <div class="table-toolbar">
                  <div class="toolbar-left">
                    <el-input
                      v-model="searchKeyword"
                      placeholder="搜索文件名"
                      style="width: 300px;"
                      clearable
                      @clear="loadDocuments"
                    >
                      <template #prefix>
                        <el-icon><Search /></el-icon>
                      </template>
                    </el-input>
                    <el-button @click="loadDocuments">
                      <el-icon><Refresh /></el-icon>
                      刷新
                    </el-button>
                  </div>
                  <div class="toolbar-right">
                    <el-button @click="handleBatchDelete" :disabled="selectedDocs.length === 0">
                      <el-icon><Delete /></el-icon>
                      批量删除
                    </el-button>
                  </div>
                </div>

                <el-table
                  v-loading="loading"
                  :data="documents"
                  stripe
                  @selection-change="handleSelectionChange"
                >
                  <el-table-column type="selection" width="55" />
                  <el-table-column prop="fileName" label="文件名" min-width="200" />
                  <el-table-column prop="fileSize" label="文件大小" width="120" />
                  <el-table-column prop="importTime" label="导入时间" width="180" />
                  <el-table-column prop="status" label="状态" width="100">
                    <template #default="{ row }">
                      <el-tag :type="row.status === '已处理' ? 'success' : 'warning'">
                        {{ row.status }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="150" fixed="right">
                    <template #default="{ row }">
                      <el-button type="primary" size="small" link @click="handleView(row)">
                        查看
                      </el-button>
                      <el-button type="danger" size="small" link @click="handleDelete(row)">
                        删除
                      </el-button>
                    </template>
                  </el-table-column>
                </el-table>

                <el-pagination
                  v-model:current-page="docPage"
                  v-model:page-size="docPageSize"
                  :total="docTotal"
                  :page-sizes="[10, 20, 50]"
                  layout="total, sizes, prev, pager, next, jumper"
                  @size-change="loadDocuments"
                  @current-change="loadDocuments"
                />
              </div>
            </el-tab-pane>

            <!-- 平台书架 Tab -->
            <el-tab-pane label="平台书架" name="bookshelf">
              <div class="form-section">
                <h3 class="form-section-title">发布资源</h3>
                <el-form :model="resourceForm" :rules="resourceRules" ref="resourceFormRef" label-width="120px">
                  <el-form-item label="资源类型" prop="type">
                    <el-radio-group v-model="resourceForm.type">
                      <el-radio label="book">书籍</el-radio>
                      <el-radio label="algorithm">算法题</el-radio>
                      <el-radio label="website">学习网站</el-radio>
                    </el-radio-group>
                  </el-form-item>
                  
                  <el-form-item label="资源名称" prop="name">
                    <el-input v-model="resourceForm.name" placeholder="请输入资源名称" />
                  </el-form-item>
                  
                  <el-form-item label="链接/内容" prop="content">
                    <el-input
                      v-model="resourceForm.content"
                      type="textarea"
                      :rows="4"
                      placeholder="请输入资源链接或内容描述"
                    />
                  </el-form-item>
                  
                  <el-form-item label="发布状态" prop="published">
                    <el-switch v-model="resourceForm.published" active-text="立即发布" inactive-text="保存草稿" />
                  </el-form-item>
                  
                  <el-form-item>
                    <el-button type="primary" @click="handlePublishResource" :loading="publishing">
                      <el-icon><Check /></el-icon>
                      {{ resourceForm.published ? '发布资源' : '保存草稿' }}
                    </el-button>
                    <el-button @click="resetResourceForm">
                      <el-icon><Refresh /></el-icon>
                      重置
                    </el-button>
                  </el-form-item>
                </el-form>
              </div>

              <div class="form-section" style="margin-top: 32px;">
                <h3 class="form-section-title">已发布资源列表</h3>
                
                <el-table v-loading="loading" :data="resources" stripe>
                  <el-table-column prop="name" label="资源名称" min-width="200" />
                  <el-table-column prop="type" label="类型" width="120">
                    <template #default="{ row }">
                      <el-tag v-if="row.type === 'book'" type="primary">书籍</el-tag>
                      <el-tag v-else-if="row.type === 'algorithm'" type="success">算法题</el-tag>
                      <el-tag v-else type="info">学习网站</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="publishTime" label="发布时间" width="180" />
                  <el-table-column prop="status" label="状态" width="100">
                    <template #default="{ row }">
                      <el-tag :type="row.status === '已发布' ? 'success' : 'info'">
                        {{ row.status }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="150" fixed="right">
                    <template #default="{ row }">
                      <el-button type="primary" size="small" link @click="handleEditResource(row)">
                        编辑
                      </el-button>
                      <el-button type="danger" size="small" link @click="handleDeleteResource(row)">
                        删除
                      </el-button>
                    </template>
                  </el-table-column>
                </el-table>

                <el-pagination
                  v-model:current-page="resourcePage"
                  v-model:page-size="resourcePageSize"
                  :total="resourceTotal"
                  :page-sizes="[10, 20, 50]"
                  layout="total, sizes, prev, pager, next, jumper"
                  @size-change="loadResources"
                  @current-change="loadResources"
                />
              </div>
            </el-tab-pane>

            <!-- 系统公告管理 Tab -->
            <el-tab-pane label="系统公告管理" name="announcement">
              <div class="form-section">
                <h3 class="form-section-title">发布公告</h3>
                <el-form :model="announcementForm" :rules="announcementRules" ref="announcementFormRef" label-width="120px">
                  <el-form-item label="公告标题" prop="title">
                    <el-input v-model="announcementForm.title" placeholder="请输入公告标题" />
                  </el-form-item>
                  
                  <el-form-item label="公告内容" prop="content">
                    <el-input
                      v-model="announcementForm.content"
                      type="textarea"
                      :rows="6"
                      placeholder="请输入公告内容"
                    />
                  </el-form-item>
                  
                  <el-form-item label="优先级" prop="priority">
                    <el-radio-group v-model="announcementForm.priority">
                      <el-radio label="high">高</el-radio>
                      <el-radio label="normal">普通</el-radio>
                      <el-radio label="low">低</el-radio>
                    </el-radio-group>
                  </el-form-item>
                  
                  <el-form-item>
                    <el-button type="primary" @click="handlePublishAnnouncement" :loading="publishingAnnouncement">
                      <el-icon><Promotion /></el-icon>
                      发布公告
                    </el-button>
                    <el-button @click="handlePreviewAnnouncement">
                      <el-icon><View /></el-icon>
                      预览
                    </el-button>
                    <el-button @click="resetAnnouncementForm">
                      <el-icon><Refresh /></el-icon>
                      重置
                    </el-button>
                  </el-form-item>
                </el-form>
              </div>

              <div class="form-section" style="margin-top: 32px;">
                <h3 class="form-section-title">已发布公告列表</h3>
                
                <el-table v-loading="loading" :data="announcements" stripe>
                  <el-table-column prop="title" label="公告标题" min-width="200" />
                  <el-table-column prop="priority" label="优先级" width="100">
                    <template #default="{ row }">
                      <el-tag v-if="row.priority === 'high'" type="danger">高</el-tag>
                      <el-tag v-else-if="row.priority === 'normal'" type="warning">普通</el-tag>
                      <el-tag v-else type="info">低</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="publishTime" label="发布时间" width="180" />
                  <el-table-column prop="views" label="浏览量" width="100" />
                  <el-table-column label="操作" width="150" fixed="right">
                    <template #default="{ row }">
                      <el-button type="primary" size="small" link @click="handleEditAnnouncement(row)">
                        编辑
                      </el-button>
                      <el-button type="danger" size="small" link @click="handleDeleteAnnouncement(row)">
                        删除
                      </el-button>
                    </template>
                  </el-table-column>
                </el-table>

                <el-pagination
                  v-model:current-page="announcementPage"
                  v-model:page-size="announcementPageSize"
                  :total="announcementTotal"
                  :page-sizes="[10, 20, 50]"
                  layout="total, sizes, prev, pager, next, jumper"
                  @size-change="loadAnnouncements"
                  @current-change="loadAnnouncements"
                />
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';

const router = useRouter();
const activeTab = ref('rag');
const activeMenu = computed(() => router.currentRoute.value.path);
const loading = ref(false);
const importing = ref(false);
const publishing = ref(false);
const publishingAnnouncement = ref(false);

// 文件上传
const uploadRef = ref(null);
const fileList = ref([]);
const uploadAction = ref('http://localhost:8001/api/admin/knowledge/upload');
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`
}));

// 文档列表
const searchKeyword = ref('');
const documents = ref([
  {
    id: 1,
    fileName: '计算机网络教程.pdf',
    fileSize: '12.5 MB',
    importTime: '2026-02-07 10:30:00',
    status: '已处理'
  },
  {
    id: 2,
    fileName: '数据结构与算法.docx',
    fileSize: '8.3 MB',
    importTime: '2026-02-06 15:20:00',
    status: '已处理'
  }
]);
const selectedDocs = ref([]);
const docPage = ref(1);
const docPageSize = ref(10);
const docTotal = ref(2);

// 资源表单
const resourceFormRef = ref(null);
const resourceForm = ref({
  type: 'book',
  name: '',
  content: '',
  published: true
});
const resourceRules = {
  name: [{ required: true, message: '请输入资源名称', trigger: 'blur' }],
  content: [{ required: true, message: '请输入资源链接或内容', trigger: 'blur' }]
};

// 资源列表
const resources = ref([
  {
    id: 1,
    name: '深入理解计算机系统',
    type: 'book',
    publishTime: '2026-02-05 14:00:00',
    status: '已发布'
  }
]);
const resourcePage = ref(1);
const resourcePageSize = ref(10);
const resourceTotal = ref(1);

// 公告表单
const announcementFormRef = ref(null);
const announcementForm = ref({
  title: '',
  content: '',
  priority: 'normal'
});
const announcementRules = {
  title: [{ required: true, message: '请输入公告标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入公告内容', trigger: 'blur' }]
};

// 公告列表
const announcements = ref([
  {
    id: 1,
    title: '系统维护通知',
    priority: 'high',
    publishTime: '2026-02-07 09:00:00',
    views: 256
  }
]);
const announcementPage = ref(1);
const announcementPageSize = ref(10);
const announcementTotal = ref(1);

// 文件上传前检查
const beforeUpload = (file) => {
  const isValidType = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'].includes(file.type);
  const isLt50M = file.size / 1024 / 1024 < 50;

  if (!isValidType) {
    ElMessage.error('只支持 PDF、Word、TXT 格式的文件！');
    return false;
  }
  if (!isLt50M) {
    ElMessage.error('文件大小不能超过 50MB！');
    return false;
  }
  return true;
};

// 上传成功
const handleUploadSuccess = (response, file) => {
  ElMessage.success(`${file.name} 上传成功`);
};

// 上传失败
const handleUploadError = (error, file) => {
  ElMessage.error(`${file.name} 上传失败`);
};

// 导入知识库
const handleImport = async () => {
  if (fileList.value.length === 0) {
    ElMessage.warning('请先上传文件');
    return;
  }

  importing.value = true;
  try {
    // TODO: 调用API导入知识库
    await new Promise(resolve => setTimeout(resolve, 1500));
    ElMessage.success('导入成功！');
    fileList.value = [];
    loadDocuments();
  } catch (error) {
    ElMessage.error('导入失败：' + error);
  } finally {
    importing.value = false;
  }
};

// 加载文档列表
const loadDocuments = async () => {
  loading.value = true;
  try {
    // TODO: 调用API加载文档列表
    await new Promise(resolve => setTimeout(resolve, 500));
  } catch (error) {
    ElMessage.error('加载失败：' + error);
  } finally {
    loading.value = false;
  }
};

// 选择变化
const handleSelectionChange = (selection) => {
  selectedDocs.value = selection;
};

// 查看文档
const handleView = (row) => {
  ElMessage.info('查看文档：' + row.fileName);
};

// 删除文档
const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除文档"${row.fileName}"吗？`, '确认删除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      // TODO: 调用API删除文档
      await new Promise(resolve => setTimeout(resolve, 500));
      ElMessage.success('删除成功');
      loadDocuments();
    } catch (error) {
      ElMessage.error('删除失败：' + error);
    }
  });
};

// 批量删除
const handleBatchDelete = () => {
  ElMessageBox.confirm(`确定要删除选中的 ${selectedDocs.value.length} 个文档吗？`, '确认删除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      // TODO: 调用API批量删除
      await new Promise(resolve => setTimeout(resolve, 500));
      ElMessage.success('删除成功');
      loadDocuments();
    } catch (error) {
      ElMessage.error('删除失败：' + error);
    }
  });
};

// 发布资源
const handlePublishResource = async () => {
  if (!resourceFormRef.value) return;
  
  await resourceFormRef.value.validate(async (valid) => {
    if (valid) {
      publishing.value = true;
      try {
        // TODO: 调用API发布资源
        await new Promise(resolve => setTimeout(resolve, 1000));
        ElMessage.success(resourceForm.value.published ? '发布成功！' : '保存成功！');
        resetResourceForm();
        loadResources();
      } catch (error) {
        ElMessage.error('操作失败：' + error);
      } finally {
        publishing.value = false;
      }
    }
  });
};

// 重置资源表单
const resetResourceForm = () => {
  resourceFormRef.value?.resetFields();
  resourceForm.value = {
    type: 'book',
    name: '',
    content: '',
    published: true
  };
};

// 加载资源列表
const loadResources = async () => {
  loading.value = true;
  try {
    // TODO: 调用API加载资源列表
    await new Promise(resolve => setTimeout(resolve, 500));
  } catch (error) {
    ElMessage.error('加载失败：' + error);
  } finally {
    loading.value = false;
  }
};

// 编辑资源
const handleEditResource = (row) => {
  resourceForm.value = { ...row };
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// 删除资源
const handleDeleteResource = (row) => {
  ElMessageBox.confirm(`确定要删除资源"${row.name}"吗？`, '确认删除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      // TODO: 调用API删除资源
      await new Promise(resolve => setTimeout(resolve, 500));
      ElMessage.success('删除成功');
      loadResources();
    } catch (error) {
      ElMessage.error('删除失败：' + error);
    }
  });
};

// 发布公告
const handlePublishAnnouncement = async () => {
  if (!announcementFormRef.value) return;
  
  await announcementFormRef.value.validate(async (valid) => {
    if (valid) {
      publishingAnnouncement.value = true;
      try {
        // TODO: 调用API发布公告
        await new Promise(resolve => setTimeout(resolve, 1000));
        ElMessage.success('发布成功！所有用户可在首页查看');
        resetAnnouncementForm();
        loadAnnouncements();
      } catch (error) {
        ElMessage.error('发布失败：' + error);
      } finally {
        publishingAnnouncement.value = false;
      }
    }
  });
};

// 预览公告
const handlePreviewAnnouncement = () => {
  if (!announcementForm.value.title || !announcementForm.value.content) {
    ElMessage.warning('请先填写公告标题和内容');
    return;
  }
  
  ElMessageBox.alert(
    `<div style="text-align: left;">
      <h3>${announcementForm.value.title}</h3>
      <p style="white-space: pre-wrap; margin-top: 16px;">${announcementForm.value.content}</p>
    </div>`,
    '公告预览',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '关闭'
    }
  );
};

// 重置公告表单
const resetAnnouncementForm = () => {
  announcementFormRef.value?.resetFields();
  announcementForm.value = {
    title: '',
    content: '',
    priority: 'normal'
  };
};

// 加载公告列表
const loadAnnouncements = async () => {
  loading.value = true;
  try {
    // TODO: 调用API加载公告列表
    await new Promise(resolve => setTimeout(resolve, 500));
  } catch (error) {
    ElMessage.error('加载失败：' + error);
  } finally {
    loading.value = false;
  }
};

// 编辑公告
const handleEditAnnouncement = (row) => {
  announcementForm.value = { ...row };
  activeTab.value = 'announcement';
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// 删除公告
const handleDeleteAnnouncement = (row) => {
  ElMessageBox.confirm(`确定要删除公告"${row.title}"吗？`, '确认删除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      // TODO: 调用API删除公告
      await new Promise(resolve => setTimeout(resolve, 500));
      ElMessage.success('删除成功');
      loadAnnouncements();
    } catch (error) {
      ElMessage.error('删除失败：' + error);
    }
  });
};

onMounted(() => {
  loadDocuments();
  loadResources();
  loadAnnouncements();
});
</script>

<style scoped>
@import '@/styles/admin.css';

.upload-demo {
  width: 100%;
}
</style>
