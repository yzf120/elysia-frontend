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
              v-model:file-list="fileList"
              multiple
              accept=".pdf,.doc,.docx,.txt,.md,.csv,.html,.htm"
            >
              <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
              <div class="el-upload__text">
                将文件拖到此处，或<em>点击上传</em>
              </div>
              <template #tip>
                <div class="el-upload__tip">
                  支持 PDF、Word、TXT、Markdown、CSV、HTML 格式，单个文件不超过 50MB
                </div>
              </template>
            </el-upload>

            <div style="margin-top: 20px; text-align: right;">
              <el-button
                type="primary"
                :loading="importing"
                :disabled="uploadedFiles.length === 0"
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
import { computed, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import AdminSidebar from '@/components/admin/AdminSidebar.vue';
import { knowledgeApi } from '@/services/index.js';

const router = useRouter();
const activeMenu = computed(() => router.currentRoute.value.path);
const loading = ref(false);
const importing = ref(false);

const uploadRef = ref(null);
const fileList = ref([]);
const uploadedFiles = ref([]); // 已上传的文件信息（含临时路径）
const uploadAction = ref('http://localhost:8001/api/admin/knowledge/upload');
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`
}));

const searchKeyword = ref('');
const documents = ref([]);
const selectedDocs = ref([]);
const docPage = ref(1);
const docPageSize = ref(10);
const docTotal = ref(0);

onMounted(() => {
  loadDocuments();
});

const beforeUpload = (file) => {
  const validTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
    'text/csv',
    'text/html',
  ];
  const validExts = ['.pdf', '.doc', '.docx', '.txt', '.md', '.csv', '.html', '.htm'];
  const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
  const isValidType = validTypes.includes(file.type) || validExts.includes(ext);
  const isLt50M = file.size / 1024 / 1024 < 50;

  if (!isValidType) {
    ElMessage.error('只支持 PDF、Word、TXT、Markdown、CSV、HTML 格式的文件！');
    return false;
  }
  if (!isLt50M) {
    ElMessage.error('文件大小不能超过 50MB！');
    return false;
  }
  return true;
};

const handleUploadSuccess = (response, file) => {
  if (response && response.data) {
    // 保存上传后的文件信息（含临时路径）
    uploadedFiles.value.push({
      file_name: response.data.file_name,
      file_size: response.data.file_size,
      file_path: response.data.file_path,
      file_type: response.data.file_type,
    });
    ElMessage.success(`${file.name} 上传成功`);
  } else {
    ElMessage.error(`${file.name} 上传失败`);
  }
};

const handleUploadError = (error, file) => {
  ElMessage.error(`${file.name} 上传失败`);
};

const handleImport = async () => {
  if (uploadedFiles.value.length === 0) {
    ElMessage.warning('请先上传文件');
    return;
  }

  importing.value = true;
  try {
    let successCount = 0;
    let failCount = 0;
    let maxEstimatedSeconds = 0;

    for (const fileInfo of uploadedFiles.value) {
      try {
        const res = await knowledgeApi.importDocument({
          file_path: fileInfo.file_path,
          file_name: fileInfo.file_name,
          file_size: fileInfo.file_size,
          file_type: fileInfo.file_type,
          tags: '',
        });
        // res 经过 axios 拦截器后是 { data: {...}, error: {code: 0} }
        if (res && res.data) {
          successCount++;
          // 记录最大预估时间
          const estimated = res.data.estimated_seconds || 5;
          if (estimated > maxEstimatedSeconds) {
            maxEstimatedSeconds = estimated;
          }
        } else {
          failCount++;
        }
      } catch (e) {
        failCount++;
      }
    }

    if (successCount > 0) {
      const timeText = maxEstimatedSeconds > 10
        ? `约 ${Math.ceil(maxEstimatedSeconds / 10) * 10} 秒`
        : `约 ${maxEstimatedSeconds} 秒`;
      ElMessage.success({
        message: `成功提交 ${successCount} 个文件，正在后台构建索引，预计${timeText}后生效${failCount > 0 ? `，${failCount} 个失败` : ''}`,
        duration: 5000,
      });
    } else {
      ElMessage.error('导入失败');
    }

    // 清理
    fileList.value = [];
    uploadedFiles.value = [];
    uploadRef.value?.clearFiles();
    loadDocuments();
  } catch (error) {
    ElMessage.error(`导入失败：${error.message || error}`);
  } finally {
    importing.value = false;
  }
};

const loadDocuments = async () => {
  loading.value = true;
  try {
    const res = await knowledgeApi.listDocuments({
      page: docPage.value,
      page_size: docPageSize.value,
      keyword: searchKeyword.value,
    });
    // axios拦截器取了response.data，res = { data: { total, items, page }, error: {code:0} }
    if (res && res.data) {
      const items = res.data.items || [];
      documents.value = items.map(item => ({
        id: item.id,
        doc_id: item.id,
        fileName: item.file_name || item.content || item.id,
        fileSize: formatFileSize(item.file_size || 0),
        importTime: item.create_time || '-',
        status: item.status === 2 ? '已处理' : item.status === 1 ? '处理中' : item.status === 3 ? '处理失败' : '待处理',
        sourceType: item.source_type,
        tags: item.tags,
      }));
      docTotal.value = res.data.total || 0;
    }
  } catch (error) {
    ElMessage.error(`加载失败：${error.message || error}`);
  } finally {
    loading.value = false;
  }
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
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
    try {
      await knowledgeApi.deleteDocument({ doc_id: row.id });
      ElMessage.success({
        message: '文档已删除，索引清理在后台进行',
        duration: 3000,
      });
      loadDocuments();
    } catch (error) {
      ElMessage.error(`删除失败：${error.message || error}`);
    }
  });
};

const handleBatchDelete = () => {
    const ids = selectedDocs.value.map(doc => doc.id);
  ElMessageBox.confirm(`确定要删除选中的 ${ids.length} 个文档吗？`, '确认删除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await knowledgeApi.deleteDocument({ ids: ids });
      ElMessage.success({
        message: `成功删除 ${ids.length} 个文档，索引清理在后台进行`,
        duration: 3000,
      });
      loadDocuments();
    } catch (error) {
      ElMessage.error(`删除失败：${error.message || error}`);
    }
  });
};
</script>

<style scoped>
@import '@/styles/admin.css';

.upload-demo {
  width: 100%;
}
</style>
