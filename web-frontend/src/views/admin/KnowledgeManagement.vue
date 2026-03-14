<template>
  <div class="admin-layout">
    <AdminSidebar :active-menu="activeMenu" />

    <div class="admin-main">
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

      <div class="admin-content">
        <div class="page-container fade-in">
          <div class="page-header">
            <h3 class="page-title">RAG 知识库扩充</h3>
            <p class="page-subtitle">系统公告管理和平台书架已独立到侧边栏入口中</p>
          </div>

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
              <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
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
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import AdminSidebar from '@/components/admin/AdminSidebar.vue';

const router = useRouter();
const activeMenu = computed(() => router.currentRoute.value.path);
const loading = ref(false);
const importing = ref(false);

const uploadRef = ref(null);
const fileList = ref([]);
const uploadAction = ref('http://localhost:8001/api/admin/knowledge/upload');
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`
}));

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

const beforeUpload = (file) => {
  const isValidType = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ].includes(file.type);
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

const handleUploadSuccess = (response, file) => {
  ElMessage.success(`${file.name} 上传成功`);
};

const handleUploadError = (error, file) => {
  ElMessage.error(`${file.name} 上传失败`);
};

const handleImport = async () => {
  if (fileList.value.length === 0) {
    ElMessage.warning('请先上传文件');
    return;
  }

  importing.value = true;
  try {
    await new Promise(resolve => setTimeout(resolve, 1200));
    ElMessage.success('导入成功！');
    fileList.value = [];
    uploadRef.value?.clearFiles();
    loadDocuments();
  } catch (error) {
    ElMessage.error(`导入失败：${error}`);
  } finally {
    importing.value = false;
  }
};

const loadDocuments = async () => {
  loading.value = true;
  try {
    await new Promise(resolve => setTimeout(resolve, 400));
  } catch (error) {
    ElMessage.error(`加载失败：${error}`);
  } finally {
    loading.value = false;
  }
};

const handleSelectionChange = (selection) => {
  selectedDocs.value = selection;
};

const handleView = (row) => {
  ElMessage.info(`查看文档：${row.fileName}`);
};

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除文档“${row.fileName}”吗？`, '确认删除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    ElMessage.success('删除成功');
    loadDocuments();
  });
};

const handleBatchDelete = () => {
  ElMessageBox.confirm(`确定要删除选中的 ${selectedDocs.value.length} 个文档吗？`, '确认删除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    ElMessage.success('删除成功');
    loadDocuments();
  });
};
</script>

<style scoped>
@import '@/styles/admin.css';

.upload-demo {
  width: 100%;
}
</style>
