<template>
  <div class="admin-layout">
    <AdminSidebar :active-menu="activeMenu" />

    <div class="admin-main">
      <el-header class="admin-header" height="60px">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/admin/dashboard' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item>系统公告管理</el-breadcrumb-item>
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
            <h3 class="page-title">系统公告管理</h3>
            <p class="page-subtitle">只有管理员可以增删改，教师和学生首页会实时读取这里的已发布内容</p>
          </div>

          <div class="form-section">
            <h3 class="form-section-title">{{ editingId ? '编辑公告' : '发布公告' }}</h3>
            <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
              <el-form-item label="公告标题" prop="title">
                <el-input v-model="form.title" maxlength="100" show-word-limit placeholder="请输入公告标题" />
              </el-form-item>

              <el-form-item label="公告内容" prop="content">
                <el-input
                  v-model="form.content"
                  type="textarea"
                  :rows="7"
                  maxlength="2000"
                  show-word-limit
                  placeholder="请输入公告内容"
                />
              </el-form-item>

              <el-form-item label="优先级" prop="priority">
                <el-radio-group v-model="form.priority">
                  <el-radio label="high">高</el-radio>
                  <el-radio label="normal">普通</el-radio>
                  <el-radio label="low">低</el-radio>
                </el-radio-group>
              </el-form-item>

              <el-form-item label="发布状态">
                <el-switch v-model="form.published" active-text="立即发布" inactive-text="保存草稿" />
              </el-form-item>

              <el-form-item>
                <el-button type="primary" :loading="submitting" @click="handleSubmit">
                  <el-icon><Promotion /></el-icon>
                  {{ editingId ? '保存修改' : form.published ? '发布公告' : '保存草稿' }}
                </el-button>
                <el-button @click="handlePreview">
                  <el-icon><View /></el-icon>
                  预览
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
                  placeholder="搜索标题或内容"
                  clearable
                  style="width: 300px;"
                  @keyup.enter="loadAnnouncements"
                  @clear="loadAnnouncements"
                >
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                </el-input>
                <el-select v-model="statusFilter" placeholder="全部状态" clearable style="width: 160px;" @change="loadAnnouncements">
                  <el-option label="全部状态" :value="undefined" />
                  <el-option label="草稿" :value="0" />
                  <el-option label="已发布" :value="1" />
                </el-select>
                <el-button type="primary" @click="loadAnnouncements">
                  <el-icon><Search /></el-icon>
                  搜索
                </el-button>
                <el-button @click="loadAnnouncements">
                  <el-icon><Refresh /></el-icon>
                  刷新
                </el-button>
              </div>
            </div>

            <el-table v-loading="loading" :data="announcements" stripe>
              <el-table-column prop="title" label="公告标题" min-width="220" />
              <el-table-column prop="priority" label="优先级" width="110">
                <template #default="{ row }">
                  <el-tag :type="priorityTagType(row.priority)">{{ priorityLabel(row.priority) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="published" label="状态" width="110">
                <template #default="{ row }">
                  <el-tag :type="row.published ? 'success' : 'info'">
                    {{ row.published ? '已发布' : '草稿' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="publisher_name" label="发布人" width="120" />
              <el-table-column prop="publish_time" label="发布时间" width="180">
                <template #default="{ row }">{{ formatDate(row.publish_time) }}</template>
              </el-table-column>
              <el-table-column prop="update_time" label="更新时间" width="180">
                <template #default="{ row }">{{ formatDate(row.update_time) }}</template>
              </el-table-column>
              <el-table-column label="操作" width="180" fixed="right">
                <template #default="{ row }">
                  <el-button type="primary" size="small" link @click="handleEdit(row)">编辑</el-button>
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
              @size-change="loadAnnouncements"
              @current-change="loadAnnouncements"
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

const router = useRouter();
const activeMenu = computed(() => router.currentRoute.value.path);
const formRef = ref(null);
const loading = ref(false);
const submitting = ref(false);
const announcements = ref([]);
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);
const keyword = ref('');
const statusFilter = ref(undefined);
const editingId = ref('');

const defaultForm = () => ({
  title: '',
  content: '',
  priority: 'normal',
  published: true
});

const form = ref(defaultForm());
const rules = {
  title: [{ required: true, message: '请输入公告标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入公告内容', trigger: 'blur' }]
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '-';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const priorityLabel = (priority) => {
  if (priority === 'high') return '高';
  if (priority === 'low') return '低';
  return '普通';
};

const priorityTagType = (priority) => {
  if (priority === 'high') return 'danger';
  if (priority === 'low') return 'info';
  return 'warning';
};

const resetForm = () => {
  editingId.value = '';
  form.value = defaultForm();
  formRef.value?.clearValidate();
};

const loadAnnouncements = async () => {
  loading.value = true;
  try {
    const params = {
      page: page.value,
      page_size: pageSize.value,
      keyword: keyword.value || undefined,
      status: statusFilter.value
    };
    const res = await adminAPI.listSystemAnnouncements(params);
    announcements.value = res.announcements || [];
    total.value = res.total || 0;
  } catch (error) {
    ElMessage.error(`加载系统公告失败：${error}`);
  } finally {
    loading.value = false;
  }
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    submitting.value = true;
    try {
      if (editingId.value) {
        await adminAPI.updateSystemAnnouncement(editingId.value, form.value);
        ElMessage.success('公告更新成功');
      } else {
        await adminAPI.createSystemAnnouncement(form.value);
        ElMessage.success(form.value.published ? '公告发布成功' : '草稿保存成功');
      }
      resetForm();
      loadAnnouncements();
    } catch (error) {
      ElMessage.error(`操作失败：${error}`);
    } finally {
      submitting.value = false;
    }
  });
};

const handlePreview = () => {
  if (!form.value.title || !form.value.content) {
    ElMessage.warning('请先填写标题和内容');
    return;
  }
  ElMessageBox.alert(form.value.content.replace(/\n/g, '<br/>'), form.value.title, {
    dangerouslyUseHTMLString: true,
    confirmButtonText: '关闭'
  });
};

const handleEdit = (row) => {
  editingId.value = row.announcement_id;
  form.value = {
    title: row.title,
    content: row.content,
    priority: row.priority || 'normal',
    published: !!row.published
  };
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定删除公告“${row.title}”吗？`, '确认删除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await adminAPI.deleteSystemAnnouncement(row.announcement_id);
      ElMessage.success('删除成功');
      loadAnnouncements();
    } catch (error) {
      ElMessage.error(`删除失败：${error}`);
    }
  }).catch(() => {});
};

onMounted(() => {
  loadAnnouncements();
});
</script>

<style scoped>
@import '@/styles/admin.css';
</style>
