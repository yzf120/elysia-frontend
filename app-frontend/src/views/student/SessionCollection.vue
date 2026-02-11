<template>
  <div class="session-collection-page">
    <!-- 顶部导航栏 -->
    <van-nav-bar
      title="我的收藏"
      left-arrow
      @click-left="goBack"
      fixed
      placeholder
    />

    <!-- 分类标签 -->
    <div class="category-section">
      <van-tabs v-model:active="activeCategory" @change="onCategoryChange">
        <van-tab title="全部" name="all" />
        <van-tab
          v-for="category in categories"
          :key="category.id"
          :title="category.name"
          :name="category.id"
        />
      </van-tabs>
    </div>

    <!-- 下拉刷新 -->
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <div v-if="collections.length === 0" class="empty-state">
        <van-empty description="暂无收藏记录" />
      </div>

      <!-- 收藏列表 - 支持上拉加载 -->
      <van-list
        v-else
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="loadCollections"
      >
        <div
          v-for="item in collections"
          :key="item.id"
          class="collection-card"
          @click="viewCollection(item)"
        >
          <div class="card-header">
            <h3>{{ item.title }}</h3>
            <van-tag :type="getCategoryColor(item.category)" size="medium">
              {{ getCategoryName(item.category) }}
            </van-tag>
          </div>

          <div class="card-content">
            <div class="content-preview" v-html="formatContent(item.content)"></div>
          </div>

          <div class="card-footer">
            <div class="meta-info">
              <span>
                <van-icon name="clock-o" />
                {{ formatDate(item.collectTime) }}
              </span>
              <span>
                <van-icon name="chat-o" />
                {{ item.messageCount }}条对话
              </span>
            </div>
            <div class="actions">
              <van-button
                size="small"
                plain
                type="primary"
                @click.stop="editCategory(item)"
              >
                <van-icon name="edit" />
                分类
              </van-button>
              <van-button
                size="small"
                plain
                type="danger"
                @click.stop="removeCollection(item.id)"
              >
                <van-icon name="delete-o" />
                删除
              </van-button>
            </div>
          </div>
        </div>
      </van-list>
    </van-pull-refresh>

    <!-- 分类编辑弹窗 -->
    <van-action-sheet
      v-model:show="categorySheetVisible"
      title="选择分类"
      :actions="categoryActions"
      @select="onCategorySelect"
    />

    <!-- 新建分类弹窗 -->
    <van-dialog
      v-model:show="newCategoryDialogVisible"
      title="新建分类"
      show-cancel-button
      @confirm="createCategory"
    >
      <van-field
        v-model="newCategoryName"
        placeholder="请输入分类名称"
        maxlength="10"
        show-word-limit
      />
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'

const router = useRouter()

// 当前分类
const activeCategory = ref('all')

// 分类列表
const categories = ref([
  { id: 'study', name: '学习笔记' },
  { id: 'homework', name: '作业讨论' },
  { id: 'exam', name: '考试复习' },
  { id: 'other', name: '其他' }
])

// 收藏列表数据
const collections = ref([])
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)
const page = ref(1)

// 分类编辑
const categorySheetVisible = ref(false)
const currentEditItem = ref(null)
const categoryActions = computed(() => [
  ...categories.value.map(cat => ({ name: cat.name, value: cat.id })),
  { name: '新建分类', value: 'new', color: '#409eff' }
])

// 新建分类
const newCategoryDialogVisible = ref(false)
const newCategoryName = ref('')

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`

  return `${date.getMonth() + 1}-${date.getDate()}`
}

// 获取分类名称
const getCategoryName = (categoryId) => {
  const category = categories.value.find(c => c.id === categoryId)
  return category ? category.name : '未分类'
}

// 获取分类颜色
const getCategoryColor = (categoryId) => {
  const colorMap = {
    'study': 'primary',
    'homework': 'success',
    'exam': 'warning',
    'other': 'default'
  }
  return colorMap[categoryId] || 'default'
}

// 格式化内容
const formatContent = (content) => {
  if (!content) return ''
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>')
    .substring(0, 150) + (content.length > 150 ? '...' : '')
}

// 分类切换
const onCategoryChange = (name) => {
  page.value = 1
  finished.value = false
  collections.value = []
  loadCollections()
}

// 下拉刷新
const onRefresh = async () => {
  page.value = 1
  finished.value = false
  await loadCollections()
  refreshing.value = false
  showToast('刷新成功')
}

// 加载收藏列表
const loadCollections = async () => {
  if (finished.value) return

  loading.value = true

  try {
    // TODO: 调用API获取收藏列表
    await new Promise(resolve => setTimeout(resolve, 500))

    const mockData = [
      {
        id: 1,
        title: '快速排序算法讨论',
        category: 'study',
        content: '用户：请解释快速排序的原理\n\nAI：快速排序是一种分治算法，其基本思想是选择一个基准元素，将数组分为两部分...',
        collectTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        messageCount: 8
      },
      {
        id: 2,
        title: '数据结构作业第三题',
        category: 'homework',
        content: '用户：这道题应该用什么数据结构？\n\nAI：根据题目要求，建议使用栈来实现...',
        collectTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        messageCount: 12
      },
      {
        id: 3,
        title: '期中考试复习要点',
        category: 'exam',
        content: '用户：请总结一下期中考试的重点\n\nAI：期中考试主要涵盖以下内容：1. 数据结构基础...',
        collectTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        messageCount: 15
      }
    ]

    // 根据分类筛选
    let filteredData = mockData
    if (activeCategory.value !== 'all') {
      filteredData = mockData.filter(item => item.category === activeCategory.value)
    }

    if (page.value === 1) {
      collections.value = filteredData
    } else {
      collections.value = [...collections.value, ...filteredData]
    }

    // 模拟没有更多数据
    if (page.value >= 1) {
      finished.value = true
    } else {
      page.value++
    }
  } catch (error) {
    console.error('加载收藏列表失败:', error)
    showToast('加载失败')
  } finally {
    loading.value = false
  }
}

// 查看收藏详情
const viewCollection = (item) => {
  router.push({
    path: '/student/ai-chat',
    query: { sessionId: item.id }
  })
}

// 编辑分类
const editCategory = (item) => {
  currentEditItem.value = item
  categorySheetVisible.value = true
}

// 选择分类
const onCategorySelect = async (action) => {
  categorySheetVisible.value = false

  if (action.value === 'new') {
    // 新建分类
    newCategoryDialogVisible.value = true
  } else {
    // 更新分类
    try {
      // TODO: 调用API更新分类
      await new Promise(resolve => setTimeout(resolve, 500))

      const item = collections.value.find(c => c.id === currentEditItem.value.id)
      if (item) {
        item.category = action.value
      }

      showToast('分类已更新')
    } catch (error) {
      console.error('更新分类失败:', error)
      showToast('更新失败')
    }
  }
}

// 创建新分类
const createCategory = async () => {
  if (!newCategoryName.value.trim()) {
    showToast('请输入分类名称')
    return
  }

  try {
    // TODO: 调用API创建分类
    await new Promise(resolve => setTimeout(resolve, 500))

    const newCategory = {
      id: `custom_${Date.now()}`,
      name: newCategoryName.value
    }

    categories.value.push(newCategory)

    // 如果正在编辑某个收藏，则更新其分类
    if (currentEditItem.value) {
      const item = collections.value.find(c => c.id === currentEditItem.value.id)
      if (item) {
        item.category = newCategory.id
      }
    }

    showToast('分类创建成功')
    newCategoryName.value = ''
  } catch (error) {
    console.error('创建分类失败:', error)
    showToast('创建失败')
  }
}

// 删除收藏
const removeCollection = async (id) => {
  try {
    await showConfirmDialog({
      title: '确认删除',
      message: '确定要删除这条收藏吗？'
    })

    // TODO: 调用API删除收藏
    await new Promise(resolve => setTimeout(resolve, 500))

    collections.value = collections.value.filter(c => c.id !== id)
    showToast('已删除')
  } catch {
    // 用户取消
  }
}

// 返回
const goBack = () => {
  router.back()
}

// 页面加载
onMounted(() => {
  loadCollections()
})
</script>

<style scoped>
.session-collection-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 20px;
}

/* 分类标签 */
.category-section {
  background: white;
  border-bottom: 1px solid #ebedf0;
}

/* 空状态 */
.empty-state {
  padding: 60px 20px;
  text-align: center;
}

/* 收藏卡片 */
.collection-card {
  background: white;
  margin: 12px;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  /* 触摸反馈 */
  active-opacity: 0.7;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 12px;
}

.card-header h3 {
  flex: 1;
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
}

.card-content {
  margin-bottom: 12px;
}

.content-preview {
  font-size: 13px;
  line-height: 1.6;
  color: #606266;
}

.content-preview :deep(strong) {
  font-weight: 600;
  color: #409eff;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #ebedf0;
}

.meta-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  color: #909399;
}

.meta-info span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.actions {
  display: flex;
  gap: 8px;
}

/* Tab样式优化 */
:deep(.van-tabs__line) {
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
}

:deep(.van-tab--active) {
  color: #667eea;
  font-weight: 600;
}
</style>
