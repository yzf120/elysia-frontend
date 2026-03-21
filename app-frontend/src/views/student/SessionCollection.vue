<template>
  <div class="session-collection">
    <!-- 顶部导航 -->
    <van-nav-bar title="我的收藏" left-arrow @click-left="goBack" />

    <!-- 来源筛选 -->
    <van-tabs v-model:active="activeTab" sticky @change="onTabChange">
      <van-tab title="全部" name="all" />
      <van-tab title="AI对话" name="ai_chat" />
      <van-tab title="编程答疑" name="problem_chat" />
    </van-tabs>

    <!-- 列表 -->
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="onLoad"
      >
        <van-empty v-if="!loading && filteredList.length === 0" description="暂无收藏的会话" />

        <van-cell-group v-else inset style="margin-top: 12px;">
          <van-swipe-cell v-for="item in filteredList" :key="item.session_id">
            <van-cell :title="item.session_title || '未命名会话'" :label="formatDate(item.create_time)" is-link @click="viewSession(item)">
              <template #value>
                <van-tag :type="item.problem_id > 0 ? 'warning' : 'primary'" size="medium">
                  {{ item.problem_id > 0 ? '编程答疑' : 'AI对话' }}
                </van-tag>
              </template>
            </van-cell>
            <template #right>
              <van-button v-if="item.problem_id > 0" square type="warning" text="跳转题目" @click="gotoProblem(item.problem_id)" style="height: 100%;" />
              <van-button square type="danger" text="取消收藏" @click="uncollect(item.session_id)" style="height: 100%;" />
            </template>
          </van-swipe-cell>
        </van-cell-group>
      </van-list>
    </van-pull-refresh>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showSuccessToast } from 'vant'
import { studentAPI } from '@/api/index.js'

const router = useRouter()

const list = ref([])
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)
const page = ref(1)
const pageSize = 20
const activeTab = ref('all')

// 根据 problem_id 判断来源
const getItemSource = (item) => {
  return item.problem_id > 0 ? 'problem_chat' : 'ai_chat'
}

const filteredList = computed(() => {
  if (activeTab.value === 'all') return list.value
  return list.value.filter(f => getItemSource(f) === activeTab.value)
})

const onTabChange = () => {
  // Tab切换仅前端筛选，不重新请求
}

const onLoad = async () => {
  try {
    const res = await studentAPI.listFavorites(page.value, pageSize)
    const data = res?.data
    const items = data?.favorites || []

    if (refreshing.value) {
      list.value = items
      refreshing.value = false
    } else {
      list.value.push(...items)
    }

    if (items.length < pageSize) {
      finished.value = true
    } else {
      page.value++
    }
  } catch (e) {
    console.error('加载收藏列表失败:', e)
    showToast('加载失败')
    finished.value = true
  } finally {
    loading.value = false
  }
}

const onRefresh = () => {
  page.value = 1
  finished.value = false
  loading.value = true
  list.value = []
  onLoad()
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('zh-CN')
}

const viewSession = (item) => {
  router.push({ name: 'student-ai-chat', query: { sessionId: item.session_id } })
}

const gotoProblem = (problemId) => {
  router.push({ name: 'student-problem-code', params: { id: problemId } })
}

const uncollect = async (sessionId) => {
  try {
    await studentAPI.unfavoriteSession(sessionId)
    list.value = list.value.filter(f => f.session_id !== sessionId)
    showSuccessToast('已取消收藏')
  } catch (e) {
    console.error('取消收藏失败:', e)
    showToast('取消收藏失败')
  }
}

const goBack = () => {
  router.back()
}
</script>

<style scoped>
.session-collection {
  min-height: 100vh;
  background: #f7f8fa;
}
</style>