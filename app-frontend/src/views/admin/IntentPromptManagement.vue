<template>
  <div class="intent-prompt-page">
    <van-nav-bar title="提示词模板管理" left-arrow @click-left="$router.back()" class="custom-nav" />

    <div class="page-container">
      <!-- 新增按钮 -->
      <div class="action-bar">
        <van-button type="primary" block round icon="plus" @click="showCreateDialog" class="primary-btn">新增模板</van-button>
      </div>

      <!-- 模板列表 -->
      <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <van-list v-model:loading="listLoading" :finished="finished" finished-text="没有更多了" @load="onLoadMore">
          <van-cell-group inset v-for="item in templateList" :key="item.id" class="card-group">
            <van-cell :title="item.template_name" is-link @click="handleEdit(item)">
              <template #label>
                <div style="display: flex; gap: 8px; margin-top: 4px;">
                  <van-tag type="primary" size="medium">{{ item.intent_code }}</van-tag>
                  <van-tag :type="getTypeTag(item.template_type)" size="medium">{{ getTypeName(item.template_type) }}</van-tag>
                  <van-tag plain size="medium">v{{ item.version }}</van-tag>
                </div>
              </template>
              <template #value>
                <van-switch v-model="item.is_active_bool" size="20px" @click.stop @change="handleToggleStatus(item)" />
              </template>
            </van-cell>
            <van-cell title="内容预览" @click="handlePreview(item)">
              <template #label>
                <div class="preview-text">
                  {{ item.template_content?.substring(0, 100) }}...
                </div>
              </template>
            </van-cell>
            <van-cell>
              <template #value>
                <van-button type="danger" size="small" plain @click.stop="handleDelete(item)">删除</van-button>
              </template>
            </van-cell>
          </van-cell-group>
        </van-list>
      </van-pull-refresh>
    </div>

    <!-- 新增/编辑弹窗 -->
    <van-popup v-model:show="dialogVisible" position="bottom" round :style="{ height: '85%' }">
      <div class="popup-content">
        <div class="popup-title">
          {{ isEdit ? '编辑模板' : '新增模板' }}
        </div>
        <van-form @submit="handleSubmit">
          <van-field v-model="formData.intent_code" label="意图编码" placeholder="选择关联意图" is-link readonly @click="showIntentPicker = true" required :rules="[{ required: true, message: '请选择意图编码' }]" />
          <van-field v-model="formData.template_type_label" label="模板类型" placeholder="选择类型" is-link readonly @click="showTypePicker = true" required :rules="[{ required: true, message: '请选择模板类型' }]" />
          <van-field v-model="formData.template_name" label="模板名称" placeholder="如：解题思路-系统提示词v1" required :rules="[{ required: true, message: '请输入模板名称' }]" />
          <van-field v-model="formData.template_content" label="模板内容" type="textarea" rows="8" placeholder="输入提示词模板内容" required :rules="[{ required: true, message: '请输入模板内容' }]" />
          <van-field v-model="formData.version" label="版本号" type="digit" placeholder="1" />
          <div class="submit-bar">
            <van-button type="primary" block round native-type="submit" :loading="submitting" class="primary-btn">提交</van-button>
          </div>
        </van-form>
      </div>
    </van-popup>

    <!-- 内容预览弹窗 -->
    <van-popup v-model:show="previewVisible" position="bottom" round :style="{ height: '60%' }">
      <div class="popup-content">
        <div class="popup-title" style="font-size: 16px;">模板内容预览</div>
        <pre class="preview-block">{{ previewContent }}</pre>
      </div>
    </van-popup>

    <!-- 意图编码选择器 -->
    <van-popup v-model:show="showIntentPicker" position="bottom" round>
      <van-picker :columns="intentCodeColumns" @confirm="onIntentConfirm" @cancel="showIntentPicker = false" />
    </van-popup>

    <!-- 模板类型选择器 -->
    <van-popup v-model:show="showTypePicker" position="bottom" round>
      <van-picker :columns="typeColumns" @confirm="onTypeConfirm" @cancel="showTypePicker = false" />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { showConfirmDialog, showToast } from 'vant'
import { adminAPI } from '@/api'

const templateList = ref([])
const listLoading = ref(false)
const refreshing = ref(false)
const finished = ref(false)
const page = ref(1)
const pageSize = ref(20)

const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const previewVisible = ref(false)
const previewContent = ref('')
const showIntentPicker = ref(false)
const showTypePicker = ref(false)

const intentCodeColumns = ref([])
const typeColumns = [
  { text: '系统提示词', value: 'system_prompt' },
  { text: '改写提示词', value: 'rewrite_prompt' },
  { text: 'Few-shot示例', value: 'few_shot' }
]

const formData = ref({ intent_code: '', template_type: '', template_type_label: '', template_name: '', template_content: '', version: 1 })

const getTypeName = (type) => ({ 'system_prompt': '系统提示词', 'rewrite_prompt': '改写提示词', 'few_shot': 'Few-shot' }[type] || type)
const getTypeTag = (type) => ({ 'system_prompt': 'primary', 'rewrite_prompt': 'success', 'few_shot': 'warning' }[type] || 'default')

const loadIntentDicts = async () => {
  try {
    const res = await adminAPI.listIntentDicts({ page: 1, page_size: 100, is_valid: 1 })
    const list = res.data?.list || []
    intentCodeColumns.value = list.map(d => ({ text: `${d.intent_level2} (${d.intent_code})`, value: d.intent_code }))
  } catch (error) {
    console.error('加载意图字典失败:', error)
  }
}

const loadData = async (reset = true) => {
  if (reset) { page.value = 1; templateList.value = []; finished.value = false }
  listLoading.value = true
  try {
    const params = { page: page.value, page_size: pageSize.value }
    const res = await adminAPI.listIntentPromptTemplates(params)
    const list = (res.data?.list || []).map(item => ({ ...item, is_active_bool: item.is_active === 1 }))
    if (reset) { templateList.value = list } else { templateList.value.push(...list) }
    if (list.length < pageSize.value) finished.value = true
  } catch (error) {
    showToast('加载失败: ' + error)
  } finally {
    listLoading.value = false
    refreshing.value = false
  }
}

const onRefresh = () => loadData(true)
const onLoadMore = () => { page.value++; loadData(false) }

const showCreateDialog = () => {
  isEdit.value = false
  formData.value = { intent_code: '', template_type: '', template_type_label: '', template_name: '', template_content: '', version: 1 }
  dialogVisible.value = true
}

const handleEdit = (item) => {
  isEdit.value = true
  formData.value = { ...item, template_type_label: getTypeName(item.template_type) }
  dialogVisible.value = true
}

const handlePreview = (item) => {
  previewContent.value = item.template_content
  previewVisible.value = true
}

const onIntentConfirm = (val) => {
  formData.value.intent_code = val.selectedValues[0]
  showIntentPicker.value = false
}

const onTypeConfirm = (val) => {
  formData.value.template_type = val.selectedValues[0]
  formData.value.template_type_label = getTypeName(val.selectedValues[0])
  showTypePicker.value = false
}

const handleSubmit = async () => {
  submitting.value = true
  try {
    const data = { ...formData.value }
    delete data.template_type_label
    delete data.is_active_bool
    if (isEdit.value) {
      await adminAPI.updateIntentPromptTemplate(data.id, data)
      showToast({ type: 'success', message: '更新成功' })
    } else {
      await adminAPI.createIntentPromptTemplate(data)
      showToast({ type: 'success', message: '创建成功' })
    }
    dialogVisible.value = false
    loadData(true)
  } catch (error) {
    showToast('操作失败: ' + error)
  } finally {
    submitting.value = false
  }
}

const handleToggleStatus = async (item) => {
  try {
    const isActive = item.is_active_bool ? 1 : 0
    await adminAPI.updateIntentPromptTemplateStatus(item.id, { is_active: isActive })
    item.is_active = isActive
    showToast({ type: 'success', message: isActive ? '已启用' : '已禁用' })
  } catch (error) {
    item.is_active_bool = !item.is_active_bool
    showToast('操作失败: ' + error)
  }
}

const handleDelete = (item) => {
  showConfirmDialog({ title: '确认删除', message: `确定删除「${item.template_name}」？` })
    .then(async () => {
      try {
        await adminAPI.deleteIntentPromptTemplate(item.id)
        showToast({ type: 'success', message: '删除成功' })
        loadData(true)
      } catch (error) {
        showToast('删除失败: ' + error)
      }
    }).catch(() => {})
}

onMounted(() => { loadIntentDicts(); loadData() })
</script>

<style scoped>
.intent-prompt-page {
  min-height: 100vh;
  background: #F5F7FB;
}

:deep(.van-nav-bar) {
  background: #0F172A !important;
  --van-nav-bar-title-text-color: #fff;
  --van-nav-bar-icon-color: #fff;
}

.page-container {
  padding-bottom: 20px;
}

.action-bar {
  padding: 14px 16px;
}

.primary-btn {
  --van-button-primary-background: #4F6EF7;
  --van-button-primary-border-color: #4F6EF7;
  font-weight: 600;
}

.card-group {
  margin-bottom: 12px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.05);
}

.preview-text {
  color: #94A3B8;
  font-size: 12px;
  max-height: 40px;
  overflow: hidden;
  line-height: 1.5;
}

.popup-content {
  padding: 20px 16px;
}

.popup-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 20px;
  text-align: center;
  color: #0F172A;
}

.submit-bar {
  margin: 20px 0;
}

.preview-block {
  white-space: pre-wrap;
  word-break: break-all;
  background: #F8FAFF;
  padding: 16px;
  border-radius: 10px;
  font-size: 13px;
  line-height: 1.7;
  color: #334155;
  border: 1px solid #E2E8F0;
}
</style>