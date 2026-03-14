<template>
  <div class="admin-layout">
    <AdminSidebar :active-menu="activeMenu" />

    <div class="admin-main">
      <el-header class="admin-header" height="60px">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/admin/dashboard' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item>平台书架</el-breadcrumb-item>
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
            <h3 class="page-title">平台书架</h3>
            <p class="page-subtitle">支持文本、链接、附件三种内容形态，教师和学生只能查询和下载附件</p>
          </div>

          <div class="form-section">
            <h3 class="form-section-title">{{ editingId ? '编辑书架内容' : '新增书架内容' }}</h3>
            <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
              <el-form-item label="标题" prop="title">
                <el-input v-model="form.title" maxlength="100" show-word-limit placeholder="请输入标题" />
              </el-form-item>

              <el-form-item label="内容类型" prop="contentType">
                <el-radio-group v-model="form.contentType">
                  <el-radio label="text">文本</el-radio>
                  <el-radio label="link">链接</el-radio>
                  <el-radio label="attachment">附件</el-radio>
                  <el-radio label="mixed">文本 + 链接/附件</el-radio>
                </el-radio-group>
              </el-form-item>

              <el-form-item label="文本说明" prop="description">
                <el-input
                  v-model="form.description"
                  type="textarea"
                  :rows="5"
                  maxlength="2000"
                  show-word-limit
                  placeholder="可填写简单文本、资源说明或补充介绍"
                />
              </el-form-item>

              <el-form-item v-if="showLinkField" label="外部链接" prop="externalUrl">
                <el-input v-model="form.externalUrl" placeholder="请输入链接，例如 https://example.com" />
              </el-form-item>

              <el-form-item v-if="showAttachmentField" label="上传附件">
                <el-upload
                  class="upload-demo"
                  :auto-upload="false"
                  :limit="1"
                  :on-change="handleAttachmentChange"
                  :on-remove="handleAttachmentRemove"
                  :before-upload="beforeAttachmentUpload"
                >
                  <el-button type="primary">
                    <el-icon><Upload /></el-icon>
                    选择附件
                  </el-button>
                  <template #tip>
                    <div class="el-upload__tip">支持上传一个附件，大小不超过 50MB</div>
                  </template>
                </el-upload>

                <div v-if="currentAttachmentName" class="attachment-meta">
                  当前附件：
                  <el-link type="primary" @click="handleViewAttachment({ item_id: editingId, attachment_name: currentAttachmentName })">
                    {{ currentAttachmentName }}
                  </el-link>
                </div>
                <el-checkbox v-if="currentAttachmentName" v-model="form.clearAttachment" style="margin-top: 8px;">
                  移除现有附件
                </el-checkbox>
              </el-form-item>

              <el-form-item label="排序值">
                <el-input-number v-model="form.sortOrder" :min="0" :max="9999" />
              </el-form-item>

              <el-form-item label="发布状态">
                <el-switch v-model="form.published" active-text="立即发布" inactive-text="保存草稿" />
              </el-form-item>

              <el-form-item>
                <el-button type="primary" :loading="submitting" @click="handleSubmit">
                  <el-icon><Check /></el-icon>
                  {{ editingId ? '保存修改' : form.published ? '发布内容' : '保存草稿' }}
                </el-button>
                <el-button @click="resetForm">重置</el-button>
              </el-form-item>
            </el-form>
          </div>

          <div class="form-section" style="margin-top: 32px;">
            <div class="table-toolbar">
              <div class="toolbar-left">
                <el-input
                  v-model="keyword"
                  placeholder="搜索标题或说明"
                  clearable
                  style="width: 300px;"
                  @keyup.enter="loadBookshelfItems"
                  @clear="loadBookshelfItems"
                >
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                </el-input>
                <el-select v-model="statusFilter" placeholder="全部状态" clearable style="width: 160px;" @change="loadBookshelfItems">
                  <el-option label="全部状态" :value="undefined" />
                  <el-option label="草稿" :value="0" />
                  <el-option label="已发布" :value="1" />
                </el-select>
                <el-button type="primary" @click="loadBookshelfItems">
                  <el-icon><Search /></el-icon>
                  搜索
                </el-button>
                <el-button @click="loadBookshelfItems">
                  <el-icon><Refresh /></el-icon>
                  刷新
                </el-button>
              </div>
            </div>

            <el-table v-loading="loading" :data="items" stripe>
              <el-table-column prop="title" label="标题" min-width="220" />
              <el-table-column prop="content_type_label" label="类型" width="150" />
              <el-table-column prop="published" label="状态" width="110">
                <template #default="{ row }">
                  <el-tag :type="row.published ? 'success' : 'info'">
                    {{ row.published ? '已发布' : '草稿' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="attachment_name" label="附件" min-width="180">
                <template #default="{ row }">
                  <span v-if="row.has_attachment">{{ row.attachment_name }}</span>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column prop="publish_time" label="发布时间" width="180">
                <template #default="{ row }">{{ formatDate(row.publish_time) }}</template>
              </el-table-column>
              <el-table-column prop="update_time" label="更新时间" width="180">
                <template #default="{ row }">{{ formatDate(row.update_time) }}</template>
              </el-table-column>
              <el-table-column label="操作" width="280" fixed="right">
                <template #default="{ row }">
                  <el-button type="primary" size="small" link @click="handleEdit(row)">编辑</el-button>
                  <el-button v-if="row.external_url" type="primary" size="small" link @click="openExternalLink(row.external_url)">打开链接</el-button>
                  <el-button v-if="row.has_attachment" type="primary" size="small" link @click="handleViewAttachment(row)">预览附件</el-button>
                  <el-button v-if="row.has_attachment" type="primary" size="small" link @click="handleDownloadAttachment(row)">下载附件</el-button>
                  <el-button type="danger" size="small" link @click="handleDelete(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>

            <el-pagination
              v-model:current-page="page"
              v-model:page-size="pageSize"
              :total="total"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="loadBookshelfItems"
              @current-change="loadBookshelfItems"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import AdminSidebar from '@/components/admin/AdminSidebar.vue';
import { adminAPI } from '@/services';
import { downloadBlob, openBlobInNewTab } from '@/utils/file';

const router = useRouter();
const activeMenu = computed(() => router.currentRoute.value.path);
const formRef = ref(null);
const loading = ref(false);
const submitting = ref(false);
const items = ref([]);
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);
const keyword = ref('');
const statusFilter = ref(undefined);
const editingId = ref('');
const selectedFile = ref(null);
const currentAttachmentName = ref('');

const defaultForm = () => ({
  title: '',
  description: '',
  contentType: 'text',
  externalUrl: '',
  published: true,
  sortOrder: 0,
  clearAttachment: false
});

const form = ref(defaultForm());
const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  contentType: [{ required: true, message: '请选择内容类型', trigger: 'change' }]
};

const showLinkField = computed(() => ['link', 'mixed'].includes(form.value.contentType));
const showAttachmentField = computed(() => ['attachment', 'mixed'].includes(form.value.contentType));

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '-';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const beforeAttachmentUpload = (file) => {
  const isLt50M = file.size / 1024 / 1024 < 50;
  if (!isLt50M) {
    ElMessage.error('附件大小不能超过 50MB');
    return false;
  }
  return true;
};

const handleAttachmentChange = (file) => {
  selectedFile.value = file.raw;
  form.value.clearAttachment = false;
};

const handleAttachmentRemove = () => {
  selectedFile.value = null;
};

const resetForm = () => {
  editingId.value = '';
  selectedFile.value = null;
  currentAttachmentName.value = '';
  form.value = defaultForm();
  formRef.value?.clearValidate();
};

const buildFormData = () => {
  const formData = new FormData();
  formData.append('title', form.value.title);
  formData.append('description', form.value.description || '');
  formData.append('content_type', form.value.contentType);
  formData.append('external_url', form.value.externalUrl || '');
  formData.append('published', String(form.value.published));
  formData.append('sort_order', String(form.value.sortOrder || 0));
  formData.append('clear_attachment', String(form.value.clearAttachment));
  if (selectedFile.value) {
    formData.append('attachment', selectedFile.value);
  }
  return formData;
};

const validateForm = () => {
  if (!form.value.title.trim()) {
    ElMessage.warning('请输入标题');
    return false;
  }
  if ((form.value.contentType === 'text' || form.value.contentType === 'mixed') && !form.value.description.trim()) {
    ElMessage.warning('请输入文本说明');
    return false;
  }
  if ((form.value.contentType === 'link' || form.value.contentType === 'mixed') && !form.value.externalUrl.trim()) {
    ElMessage.warning('请输入外部链接');
    return false;
  }
  if ((form.value.contentType === 'attachment' || form.value.contentType === 'mixed') && !selectedFile.value && !currentAttachmentName.value && !form.value.clearAttachment) {
    ElMessage.warning('请上传附件');
    return false;
  }
  return true;
};

const loadBookshelfItems = async () => {
  loading.value = true;
  try {
    const params = {
      page: page.value,
      page_size: pageSize.value,
      keyword: keyword.value || undefined,
      status: statusFilter.value
    };
    const res = await adminAPI.listPlatformBookshelf(params);
    items.value = res.bookshelf_items || [];
    total.value = res.total || 0;
  } catch (error) {
    ElMessage.error(`加载平台书架失败：${error}`);
  } finally {
    loading.value = false;
  }
};

const handleSubmit = async () => {
  if (!validateForm()) return;
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    submitting.value = true;
    try {
      const payload = buildFormData();
      if (editingId.value) {
        await adminAPI.updatePlatformBookshelf(editingId.value, payload);
        ElMessage.success('平台书架内容更新成功');
      } else {
        await adminAPI.createPlatformBookshelf(payload);
        ElMessage.success(form.value.published ? '平台书架内容发布成功' : '草稿保存成功');
      }
      resetForm();
      loadBookshelfItems();
    } catch (error) {
      ElMessage.error(`操作失败：${error}`);
    } finally {
      submitting.value = false;
    }
  });
};

const handleEdit = (row) => {
  editingId.value = row.item_id;
  currentAttachmentName.value = row.attachment_name || '';
  selectedFile.value = null;
  form.value = {
    title: row.title || '',
    description: row.description || '',
    contentType: row.content_type || 'text',
    externalUrl: row.external_url || '',
    published: !!row.published,
    sortOrder: row.sort_order || 0,
    clearAttachment: false
  };
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定删除“${row.title}”吗？`, '确认删除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await adminAPI.deletePlatformBookshelf(row.item_id);
      ElMessage.success('删除成功');
      loadBookshelfItems();
    } catch (error) {
      ElMessage.error(`删除失败：${error}`);
    }
  }).catch(() => {});
};

const handleViewAttachment = async (row) => {
  try {
    const blob = await adminAPI.viewPlatformBookshelfAttachment(row.item_id);
    openBlobInNewTab(blob);
  } catch (error) {
    ElMessage.error(`附件预览失败：${error}`);
  }
};

const handleDownloadAttachment = async (row) => {
  try {
    const blob = await adminAPI.downloadPlatformBookshelfAttachment(row.item_id);
    downloadBlob(blob, row.attachment_name || 'attachment');
  } catch (error) {
    ElMessage.error(`附件下载失败：${error}`);
  }
};

const openExternalLink = (url) => {
  if (!url) return;
  window.open(url, '_blank', 'noopener,noreferrer');
};

onMounted(() => {
  loadBookshelfItems();
});
</script>

<style scoped>
@import '@/styles/admin.css';

.attachment-meta {
  margin-top: 8px;
  color: #606266;
}
</style>
