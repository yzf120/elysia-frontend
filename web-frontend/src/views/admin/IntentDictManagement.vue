<template>
  <div class="admin-layout">
    <AdminSidebar :active-menu="activeMenu" />

    <div class="admin-main">
      <el-header class="admin-header" height="60px">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/admin/dashboard' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item>意图字典管理</el-breadcrumb-item>
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
                <h3 class="page-title">意图字典管理</h3>
                <p class="page-subtitle">管理 AI 助教的意图分类字典，配置意图编码、关键词、路由 Agent 等信息</p>
              </div>
              <el-button type="primary" @click="handleCreate">
                <el-icon><Plus /></el-icon>
                新增意图
              </el-button>
            </div>
          </div>

          <!-- 搜索栏 -->
          <div class="table-toolbar">
            <div class="toolbar-left">
              <el-input v-model="searchKeyword" placeholder="搜索意图编码或名称" clearable prefix-icon="Search" style="width: 240px;" @clear="loadData" @keyup.enter="loadData" />
              <el-select v-model="searchLevel1" placeholder="一级意图" clearable style="width: 150px;" @change="loadData">
                <el-option label="解题相关" value="解题相关" />
                <el-option label="知识答疑" value="知识答疑" />
                <el-option label="操作交互控制" value="操作交互控制" />
                <el-option label="无关兜底" value="无关兜底" />
              </el-select>
              <el-select v-model="searchIsValid" placeholder="状态" clearable style="width: 120px;" @change="loadData">
                <el-option label="有效" :value="1" />
                <el-option label="废弃" :value="0" />
              </el-select>
            </div>
            <div class="toolbar-right">
              <el-button @click="loadData">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
          </div>

          <!-- 意图列表表格 -->
          <el-table :data="dictList" v-loading="loading" style="width: 100%" class="clean-table">
            <el-table-column prop="id" label="ID" width="60" />
            <el-table-column prop="intent_level1" label="一级意图" width="120">
              <template #default="{ row }">
                <el-tag :type="getLevel1TagType(row.intent_level1)" size="small" effect="light" round>{{ row.intent_level1 }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="intent_level2" label="二级子意图" width="140" />
            <el-table-column prop="intent_code" label="意图编码" width="180">
              <template #default="{ row }">
                <span class="code-badge">{{ row.intent_code }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
            <el-table-column prop="agent_route" label="路由Agent" width="110">
              <template #default="{ row }">
                <el-tag type="info" size="small" effect="plain" round>{{ row.agent_route }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="priority" label="优先级" width="80" sortable />
            <el-table-column prop="is_valid" label="状态" width="80">
              <template #default="{ row }">
                <el-switch
                  v-model="row.is_valid"
                  :active-value="1"
                  :inactive-value="0"
                  @change="handleToggleStatus(row)"
                  size="small"
                />
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

          <!-- 分页 -->
          <div class="table-footer">
            <span class="table-total">共 {{ total }} 条</span>
            <el-pagination
              v-model:current-page="page"
              :page-size="pageSize"
              :total="total"
              layout="prev, pager, next"
              @current-change="loadData"
              small
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑意图' : '新增意图'" width="640px" destroy-on-close>
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="110px" label-position="left">
        <el-form-item label="一级意图" prop="intent_level1">
          <el-select v-model="formData.intent_level1" placeholder="选择一级意图" style="width: 100%;">
            <el-option label="解题相关" value="解题相关" />
            <el-option label="知识答疑" value="知识答疑" />
            <el-option label="操作交互控制" value="操作交互控制" />
            <el-option label="无关兜底" value="无关兜底" />
          </el-select>
        </el-form-item>
        <el-form-item label="二级子意图" prop="intent_level2">
          <el-input v-model="formData.intent_level2" placeholder="如：题目解题思路、代码BUG排查" />
        </el-form-item>
        <el-form-item label="意图编码" prop="intent_code">
          <el-input v-model="formData.intent_code" placeholder="如：SOLVE_THINK（唯一标识）" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="formData.description" type="textarea" :rows="2" placeholder="该意图的含义和适用场景" />
        </el-form-item>
        <el-form-item label="匹配关键词" prop="match_keywords">
          <el-input v-model="formData.match_keywords" type="textarea" :rows="2" placeholder="逗号分隔，如：怎么做,解法,思路" />
        </el-form-item>
        <el-form-item label="示例问题" prop="example_queries">
          <el-input v-model="formData.example_queries" type="textarea" :rows="2" placeholder='JSON数组格式，如：["这道题怎么做","两数之和解法"]' />
        </el-form-item>
        <el-form-item label="改写模板" prop="rewrite_template">
          <el-input v-model="formData.rewrite_template" type="textarea" :rows="2" placeholder="支持{problem_id}等占位符" />
        </el-form-item>
        <el-form-item label="路由Agent" prop="agent_route">
          <el-select v-model="formData.agent_route" placeholder="选择下游Agent" style="width: 100%;">
            <el-option label="解题Agent" value="解题Agent" />
            <el-option label="知识Agent" value="知识Agent" />
            <el-option label="操作Agent" value="操作Agent" />
            <el-option label="兜底Agent" value="兜底Agent" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-input-number v-model="formData.priority" :min="0" :max="1000" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
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

// 列表数据
const dictList = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const searchLevel1 = ref('')
const searchIsValid = ref('')
const searchKeyword = ref('')

// 对话框
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref(null)
const formData = ref({
  intent_level1: '',
  intent_level2: '',
  intent_code: '',
  description: '',
  match_keywords: '',
  example_queries: '',
  rewrite_template: '',
  agent_route: '',
  priority: 0
})

const formRules = {
  intent_level1: [{ required: true, message: '请选择一级意图', trigger: 'change' }],
  intent_level2: [{ required: true, message: '请输入二级子意图', trigger: 'blur' }],
  intent_code: [{ required: true, message: '请输入意图编码', trigger: 'blur' }],
  agent_route: [{ required: true, message: '请选择路由Agent', trigger: 'change' }]
}

const getLevel1TagType = (level1) => {
  const map = { '解题相关': 'primary', '知识答疑': 'success', '操作交互控制': 'warning', '无关兜底': 'info' }
  return map[level1] || 'info'
}

const loadData = async () => {
  loading.value = true
  try {
    const params = { page: page.value, page_size: pageSize.value }
    if (searchLevel1.value) params.intent_level1 = searchLevel1.value
    if (searchIsValid.value !== '' && searchIsValid.value !== null) params.is_valid = searchIsValid.value
    const res = await adminAPI.listIntentDicts(params)
    dictList.value = res.data?.list || []
    total.value = res.data?.total || 0
  } catch (error) {
    ElMessage.error('加载意图字典失败: ' + error)
  } finally {
    loading.value = false
  }
}

const handleCreate = () => {
  isEdit.value = false
  formData.value = { intent_level1: '', intent_level2: '', intent_code: '', description: '', match_keywords: '', example_queries: '', rewrite_template: '', agent_route: '', priority: 0 }
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  formData.value = { ...row }
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate()
  submitting.value = true
  try {
    if (isEdit.value) {
      await adminAPI.updateIntentDict(formData.value.id, formData.value)
      ElMessage.success('更新成功')
    } else {
      await adminAPI.createIntentDict(formData.value)
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
    await adminAPI.updateIntentDictStatus(row.id, { is_valid: row.is_valid })
    ElMessage.success(row.is_valid ? '已启用' : '已禁用')
  } catch (error) {
    row.is_valid = row.is_valid === 1 ? 0 : 1
    ElMessage.error('操作失败: ' + error)
  }
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定删除意图「${row.intent_level2}」（${row.intent_code}）吗？`, '确认删除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await adminAPI.deleteIntentDict(row.id)
      ElMessage.success('删除成功')
      loadData()
    } catch (error) {
      ElMessage.error('删除失败: ' + error)
    }
  })
}

onMounted(() => { loadData() })
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
