<template>
  <div class="admin-layout">
    <AdminSidebar :active-menu="activeMenu" />

    <div class="admin-main">
      <el-header class="admin-header" height="60px">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/admin/dashboard' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item>提示词模板管理</el-breadcrumb-item>
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
            <div class="page-header-row">
              <div>
                <h3 class="page-title">提示词模板管理</h3>
                <p class="page-subtitle">管理各意图对应的系统提示词和改写提示词模板，支持多版本管理和灵活启用/禁用</p>
              </div>
              <el-button type="primary" @click="handleCreate">
                <el-icon><Plus /></el-icon>
                新增模板
              </el-button>
            </div>
          </div>

          <!-- 搜索栏 -->
          <div class="table-toolbar">
            <div class="toolbar-left">
              <el-input v-model="searchKeyword" placeholder="搜索模板名称" clearable prefix-icon="Search" style="width: 220px;" @clear="loadData" @keyup.enter="loadData" />
              <el-select v-model="searchIntentCode" placeholder="意图编码" clearable style="width: 200px;" @change="loadData">
                <el-option v-for="dict in intentDicts" :key="dict.intent_code" :label="`${dict.intent_level2} (${dict.intent_code})`" :value="dict.intent_code" />
              </el-select>
              <el-select v-model="searchTemplateType" placeholder="模板类型" clearable style="width: 150px;" @change="loadData">
                <el-option label="系统提示词" value="system_prompt" />
                <el-option label="改写提示词" value="rewrite_prompt" />
                <el-option label="Few-shot示例" value="few_shot" />
              </el-select>
            </div>
            <div class="toolbar-right">
              <el-button @click="loadData">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
          </div>

          <!-- 模板列表 -->
          <el-table :data="templateList" v-loading="loading" style="width: 100%" class="clean-table">
            <el-table-column prop="id" label="ID" width="60" />
            <el-table-column prop="intent_code" label="意图编码" width="180">
              <template #default="{ row }">
                <span class="code-badge">{{ row.intent_code }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="template_type" label="模板类型" width="120">
              <template #default="{ row }">
                <el-tag :type="getTemplateTypeTag(row.template_type)" size="small" effect="light" round>{{ getTemplateTypeName(row.template_type) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="template_name" label="模板名称" width="200" show-overflow-tooltip />
            <el-table-column prop="template_content" label="模板内容" min-width="300">
              <template #default="{ row }">
                <div class="content-preview" @click="handlePreview(row)">
                  {{ row.template_content?.substring(0, 80) }}{{ row.template_content?.length > 80 ? '...' : '' }}
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="version" label="版本" width="70">
              <template #default="{ row }">
                <span class="version-badge">v{{ row.version }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="is_active" label="状态" width="80">
              <template #default="{ row }">
                <el-switch v-model="row.is_active" :active-value="1" :inactive-value="0" @change="handleToggleStatus(row)" size="small" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="140" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="handleEdit(row)">
                  <el-icon><Edit /></el-icon> 编辑
                </el-button>
                <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="table-footer">
            <span class="table-total">共 {{ total }} 条</span>
            <el-pagination v-model:current-page="page" :page-size="pageSize" :total="total" layout="prev, pager, next" @current-change="loadData" small />
          </div>
        </div>
      </div>
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑模板' : '新增模板'" width="680px" destroy-on-close>
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="110px" label-position="left">
        <el-form-item label="意图编码" prop="intent_code">
          <el-select v-model="formData.intent_code" placeholder="选择关联意图" style="width: 100%;" :disabled="isEdit">
            <el-option v-for="dict in intentDicts" :key="dict.intent_code" :label="`${dict.intent_level2} (${dict.intent_code})`" :value="dict.intent_code" />
          </el-select>
        </el-form-item>
        <el-form-item label="模板类型" prop="template_type">
          <el-select v-model="formData.template_type" placeholder="选择模板类型" style="width: 100%;">
            <el-option label="系统提示词" value="system_prompt" />
            <el-option label="改写提示词" value="rewrite_prompt" />
            <el-option label="Few-shot示例" value="few_shot" />
          </el-select>
        </el-form-item>
        <el-form-item label="模板名称" prop="template_name">
          <el-input v-model="formData.template_name" placeholder="如：解题思路-系统提示词v1" />
        </el-form-item>
        <el-form-item label="模板内容" prop="template_content">
          <el-input v-model="formData.template_content" type="textarea" :rows="10" placeholder="输入提示词模板内容，支持变量：{user_query}、{problem_id}、{intent_code}" />
        </el-form-item>
        <el-form-item label="版本号" prop="version">
          <el-input-number v-model="formData.version" :min="1" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 内容预览对话框 -->
    <el-dialog v-model="previewVisible" title="模板内容预览" width="640px">
      <pre class="preview-content">{{ previewContent }}</pre>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AdminSidebar from '@/components/admin/AdminSidebar.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { adminAPI } from '@/services'

const router = useRouter()
const activeMenu = computed(() => router.currentRoute.value.path)

const templateList = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const searchIntentCode = ref('')
const searchTemplateType = ref('')
const searchKeyword = ref('')
const intentDicts = ref([])

const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref(null)
const previewVisible = ref(false)
const previewContent = ref('')

const formData = ref({
  intent_code: '',
  template_type: '',
  template_name: '',
  template_content: '',
  version: 1
})

const formRules = {
  intent_code: [{ required: true, message: '请选择意图编码', trigger: 'change' }],
  template_type: [{ required: true, message: '请选择模板类型', trigger: 'change' }],
  template_name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
  template_content: [{ required: true, message: '请输入模板内容', trigger: 'blur' }]
}

const getTemplateTypeName = (type) => {
  const map = { 'system_prompt': '系统提示词', 'rewrite_prompt': '改写提示词', 'few_shot': 'Few-shot' }
  return map[type] || type
}

const getTemplateTypeTag = (type) => {
  const map = { 'system_prompt': 'primary', 'rewrite_prompt': 'success', 'few_shot': 'warning' }
  return map[type] || 'info'
}

const loadIntentDicts = async () => {
  try {
    const res = await adminAPI.listIntentDicts({ page: 1, page_size: 100, is_valid: 1 })
    intentDicts.value = res.data?.list || []
  } catch (error) {
    console.error('加载意图字典失败:', error)
  }
}

const loadData = async () => {
  loading.value = true
  try {
    const params = { page: page.value, page_size: pageSize.value }
    if (searchIntentCode.value) params.intent_code = searchIntentCode.value
    if (searchTemplateType.value) params.template_type = searchTemplateType.value
    const res = await adminAPI.listIntentPromptTemplates(params)
    templateList.value = res.data?.list || []
    total.value = res.data?.total || 0
  } catch (error) {
    ElMessage.error('加载模板列表失败: ' + error)
  } finally {
    loading.value = false
  }
}

const handleCreate = () => {
  isEdit.value = false
  formData.value = { intent_code: '', template_type: '', template_name: '', template_content: '', version: 1 }
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  formData.value = { ...row }
  dialogVisible.value = true
}

const handlePreview = (row) => {
  previewContent.value = row.template_content
  previewVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate()
  submitting.value = true
  try {
    if (isEdit.value) {
      await adminAPI.updateIntentPromptTemplate(formData.value.id, formData.value)
      ElMessage.success('更新成功')
    } else {
      await adminAPI.createIntentPromptTemplate(formData.value)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadData()
  } catch (error) {
    ElMessage.error(isEdit.value ? '更新失败: ' + error : '创建失败: ' + error)
  } finally {
    submitting.value = false
  }
}

const handleToggleStatus = async (row) => {
  try {
    await adminAPI.updateIntentPromptTemplateStatus(row.id, { is_active: row.is_active })
    ElMessage.success(row.is_active ? '已启用' : '已禁用')
  } catch (error) {
    row.is_active = row.is_active === 1 ? 0 : 1
    ElMessage.error('操作失败: ' + error)
  }
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定删除模板「${row.template_name}」吗？`, '确认删除', {
    confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
  }).then(async () => {
    try {
      await adminAPI.deleteIntentPromptTemplate(row.id)
      ElMessage.success('删除成功')
      loadData()
    } catch (error) {
      ElMessage.error('删除失败: ' + error)
    }
  })
}

onMounted(() => {
  loadIntentDicts()
  loadData()
})
</script>

<style scoped>
@import '@/styles/admin.css';

.page-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.code-badge {
  display: inline-block;
  background: #EEF3FF;
  color: #4F6EF7;
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-family: 'SF Mono', 'Monaco', 'Menlo', monospace;
  font-weight: 500;
}

.version-badge {
  display: inline-block;
  background: #EFF6FF;
  color: #3B82F6;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.content-preview {
  cursor: pointer;
  color: var(--text-regular);
  font-size: 13px;
  line-height: 1.5;
  transition: color 0.2s;
}

.content-preview:hover {
  color: var(--primary-color);
}

.preview-content {
  white-space: pre-wrap;
  word-break: break-all;
  background: #FAFBFC;
  padding: 20px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.7;
  max-height: 500px;
  overflow-y: auto;
  border: 1px solid var(--border-light);
  color: var(--text-primary);
}

.clean-table {
  --el-table-border: none;
}

.table-footer {
  margin-top: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-total {
  font-size: 13px;
  color: var(--text-secondary);
}
</style>
