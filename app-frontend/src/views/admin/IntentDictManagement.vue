<template>
  <div class="intent-dict-page">
    <van-nav-bar title="意图字典管理" left-arrow @click-left="$router.back()" class="custom-nav" />

    <div class="page-container">
      <!-- 过滤栏 -->
      <van-dropdown-menu>
        <van-dropdown-item v-model="searchLevel1" :options="level1Options" @change="loadData" />
        <van-dropdown-item v-model="searchIsValid" :options="validOptions" @change="loadData" />
      </van-dropdown-menu>

      <!-- 新增按钮 -->
      <div class="action-bar">
        <van-button type="primary" block round icon="plus" @click="showCreateDialog" class="primary-btn">新增意图</van-button>
      </div>

      <!-- 意图列表 -->
      <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <van-list v-model:loading="listLoading" :finished="finished" finished-text="没有更多了" @load="onLoadMore">
          <van-cell-group inset v-for="item in dictList" :key="item.id" class="card-group">
            <van-cell :title="item.intent_level2" :label="item.intent_code" is-link @click="handleEdit(item)">
              <template #value>
                <van-tag :type="getLevel1TagType(item.intent_level1)" size="medium">{{ item.intent_level1 }}</van-tag>
              </template>
            </van-cell>
            <van-cell title="路由Agent" :value="item.agent_route" />
            <van-cell title="优先级" :value="String(item.priority)" />
            <van-cell title="状态">
              <template #value>
                <van-switch v-model="item.is_valid_bool" size="20px" @change="handleToggleStatus(item)" />
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
          {{ isEdit ? '编辑意图' : '新增意图' }}
        </div>
        <van-form @submit="handleSubmit">
          <van-field v-model="formData.intent_level1" label="一级意图" placeholder="选择一级意图" is-link readonly @click="showLevel1Picker = true" required :rules="[{ required: true, message: '请选择一级意图' }]" />
          <van-field v-model="formData.intent_level2" label="二级子意图" placeholder="如：题目解题思路" required :rules="[{ required: true, message: '请输入二级子意图' }]" />
          <van-field v-model="formData.intent_code" label="意图编码" placeholder="如：SOLVE_THINK" :disabled="isEdit" required :rules="[{ required: true, message: '请输入意图编码' }]" />
          <van-field v-model="formData.description" label="描述" type="textarea" rows="2" placeholder="意图的含义和适用场景" />
          <van-field v-model="formData.match_keywords" label="匹配关键词" type="textarea" rows="2" placeholder="逗号分隔" />
          <van-field v-model="formData.agent_route" label="路由Agent" placeholder="选择下游Agent" is-link readonly @click="showAgentPicker = true" required :rules="[{ required: true, message: '请选择路由Agent' }]" />
          <van-field v-model="formData.priority" label="优先级" type="digit" placeholder="0-1000" />
          <div class="submit-bar">
            <van-button type="primary" block round native-type="submit" :loading="submitting" class="primary-btn">提交</van-button>
          </div>
        </van-form>
      </div>
    </van-popup>

    <!-- 一级意图选择器 -->
    <van-popup v-model:show="showLevel1Picker" position="bottom" round>
      <van-picker :columns="['解题相关', '知识答疑', '操作交互控制', '无关兜底']" @confirm="(val) => { formData.intent_level1 = val.selectedValues[0]; showLevel1Picker = false }" @cancel="showLevel1Picker = false" />
    </van-popup>

    <!-- Agent选择器 -->
    <van-popup v-model:show="showAgentPicker" position="bottom" round>
      <van-picker :columns="['解题Agent', '知识Agent', '操作Agent', '兜底Agent']" @confirm="(val) => { formData.agent_route = val.selectedValues[0]; showAgentPicker = false }" @cancel="showAgentPicker = false" />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { showConfirmDialog, showToast } from 'vant'
import { adminAPI } from '@/api'

const dictList = ref([])
const listLoading = ref(false)
const refreshing = ref(false)
const finished = ref(false)
const page = ref(1)
const pageSize = ref(20)

const searchLevel1 = ref('')
const searchIsValid = ref('')
const level1Options = [
  { text: '全部意图', value: '' },
  { text: '解题相关', value: '解题相关' },
  { text: '知识答疑', value: '知识答疑' },
  { text: '操作交互控制', value: '操作交互控制' },
  { text: '无关兜底', value: '无关兜底' }
]
const validOptions = [
  { text: '全部状态', value: '' },
  { text: '有效', value: '1' },
  { text: '废弃', value: '0' }
]

const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const showLevel1Picker = ref(false)
const showAgentPicker = ref(false)
const formData = ref({ intent_level1: '', intent_level2: '', intent_code: '', description: '', match_keywords: '', agent_route: '', priority: 0 })

const getLevel1TagType = (level1) => {
  const map = { '解题相关': 'primary', '知识答疑': 'success', '操作交互控制': 'warning', '无关兜底': 'default' }
  return map[level1] || 'default'
}

const loadData = async (reset = true) => {
  if (reset) {
    page.value = 1
    dictList.value = []
    finished.value = false
  }
  listLoading.value = true
  try {
    const params = { page: page.value, page_size: pageSize.value }
    if (searchLevel1.value) params.intent_level1 = searchLevel1.value
    if (searchIsValid.value !== '') params.is_valid = searchIsValid.value
    const res = await adminAPI.listIntentDicts(params)
    const list = (res.data?.list || []).map(item => ({ ...item, is_valid_bool: item.is_valid === 1 }))
    if (reset) {
      dictList.value = list
    } else {
      dictList.value.push(...list)
    }
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
  formData.value = { intent_level1: '', intent_level2: '', intent_code: '', description: '', match_keywords: '', agent_route: '', priority: 0 }
  dialogVisible.value = true
}

const handleEdit = (item) => {
  isEdit.value = true
  formData.value = { ...item }
  dialogVisible.value = true
}

const handleSubmit = async () => {
  submitting.value = true
  try {
    if (isEdit.value) {
      await adminAPI.updateIntentDict(formData.value.id, formData.value)
      showToast({ type: 'success', message: '更新成功' })
    } else {
      await adminAPI.createIntentDict(formData.value)
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
    const isValid = item.is_valid_bool ? 1 : 0
    await adminAPI.updateIntentDictStatus(item.id, { is_valid: isValid })
    item.is_valid = isValid
    showToast({ type: 'success', message: isValid ? '已启用' : '已禁用' })
  } catch (error) {
    item.is_valid_bool = !item.is_valid_bool
    showToast('操作失败: ' + error)
  }
}

const handleDelete = (item) => {
  showConfirmDialog({ title: '确认删除', message: `确定删除「${item.intent_level2}」？` })
    .then(async () => {
      try {
        await adminAPI.deleteIntentDict(item.id)
        showToast({ type: 'success', message: '删除成功' })
        loadData(true)
      } catch (error) {
        showToast('删除失败: ' + error)
      }
    }).catch(() => {})
}

onMounted(() => loadData())
</script>

<style scoped>
.intent-dict-page {
  min-height: 100vh;
  background: #F5F7FB;
}

.custom-nav :deep(.van-nav-bar) {
  background: #0F172A;
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
  letter-spacing: 0.5px;
}

.card-group {
  margin-bottom: 12px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.05);
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
</style>