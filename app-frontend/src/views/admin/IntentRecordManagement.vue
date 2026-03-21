<template>
  <div class="intent-record-page">
    <van-nav-bar title="意图记录与统计" left-arrow @click-left="$router.back()" class="custom-nav" />

    <div class="page-container">
      <van-tabs v-model:active="activeTab" sticky>
        <!-- 意图记录 -->
        <van-tab title="意图记录">
          <div style="padding: 12px 16px;">
            <van-search v-model="searchUserId" placeholder="搜索用户ID" @search="loadRecords(true)" />
          </div>

          <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
            <van-list v-model:loading="listLoading" :finished="finished" finished-text="没有更多了" @load="onLoadMore">
              <van-cell-group inset v-for="item in recordList" :key="item.id" class="card-group">
                <van-cell :title="item.original_request" :label="`用户: ${item.user_id} | ${item.create_time}`">
                  <template #value>
                    <van-tag :type="item.recognize_status === 1 ? 'success' : item.recognize_status === 2 ? 'warning' : 'danger'" size="medium">
                      {{ item.recognize_status === 1 ? '成功' : item.recognize_status === 2 ? '降级' : '失败' }}
                    </van-tag>
                  </template>
                </van-cell>
                <van-cell title="意图编码">
                  <template #value>
                    <van-tag type="primary" size="medium">{{ item.intent_code }}</van-tag>
                  </template>
                </van-cell>
                <van-cell title="一级意图">
                  <template #value>
                    <van-tag :type="getLevel1TagType(item.intent_level1)" size="medium">{{ item.intent_level1 }}</van-tag>
                  </template>
                </van-cell>
                <van-cell v-if="item.rewritten_request" title="改写请求" :label="item.rewritten_request" />
                <van-cell title="置信度 / 耗时" :value="`${item.intent_confidence || '-'}% / ${item.response_time_ms || '-'}ms`" />
              </van-cell-group>
            </van-list>
          </van-pull-refresh>
        </van-tab>

        <!-- 意图统计 -->
        <van-tab title="意图统计">
          <div class="stats-container">
            <van-cell-group inset class="stats-card-group">
              <van-cell v-for="(count, code) in intentStats" :key="code" :title="code" :value="`${count} 次`">
                <template #icon>
                  <span style="margin-right: 8px;">🎯</span>
                </template>
              </van-cell>
              <van-empty v-if="Object.keys(intentStats).length === 0" description="暂无统计数据" />
            </van-cell-group>
          </div>
        </van-tab>
      </van-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { showToast } from 'vant'
import { adminAPI } from '@/api'

const activeTab = ref(0)
const searchUserId = ref('')

// 记录列表
const recordList = ref([])
const listLoading = ref(false)
const refreshing = ref(false)
const finished = ref(false)
const page = ref(1)
const pageSize = ref(20)

// 统计
const intentStats = ref({})

const getLevel1TagType = (level1) => {
  const map = { '解题相关': 'primary', '知识答疑': 'success', '操作交互控制': 'warning', '无关兜底': 'default' }
  return map[level1] || 'default'
}

const loadRecords = async (reset = true) => {
  if (reset) { page.value = 1; recordList.value = []; finished.value = false }
  listLoading.value = true
  try {
    const params = { page: page.value, page_size: pageSize.value }
    if (searchUserId.value) params.user_id = searchUserId.value
    const res = await adminAPI.listIntentRecords(params)
    const list = res.data?.list || []
    if (reset) { recordList.value = list } else { recordList.value.push(...list) }
    if (list.length < pageSize.value) finished.value = true
  } catch (error) {
    showToast('加载失败: ' + error)
  } finally {
    listLoading.value = false
    refreshing.value = false
  }
}

const onRefresh = () => loadRecords(true)
const onLoadMore = () => { page.value++; loadRecords(false) }

const loadStats = async () => {
  try {
    const res = await adminAPI.getIntentStats()
    intentStats.value = res.data?.intent_count || {}
  } catch (error) {
    showToast('加载统计失败: ' + error)
  }
}

onMounted(() => { loadRecords(); loadStats() })
</script>

<style scoped>
.intent-record-page {
  min-height: 100vh;
  background: #F5F7FB;
}

:deep(.van-nav-bar) {
  background: #0F172A !important;
  --van-nav-bar-title-text-color: #fff;
  --van-nav-bar-icon-color: #fff;
}

:deep(.van-tabs__nav) {
  background: #fff;
}

:deep(.van-tab--active) {
  color: #4F6EF7;
  font-weight: 600;
}

:deep(.van-tabs__line) {
  background: #4F6EF7;
}

.page-container {
  padding-bottom: 20px;
}

.card-group {
  margin-bottom: 12px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.05);
}

.stats-container {
  padding: 16px;
}

.stats-card-group {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

:deep(.van-cell__value) {
  color: #4F6EF7;
  font-weight: 600;
}
</style>