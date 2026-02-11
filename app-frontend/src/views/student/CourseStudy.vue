<template>
  <div class="course-study-page">
    <!-- 顶部导航栏 -->
    <van-nav-bar
      :title="currentChapter || '课程学习'"
      left-arrow
      @click-left="goBack"
      fixed
      placeholder
    >
      <template #right>
        <van-icon name="bars" size="20" @click="showCatalog = true" />
      </template>
    </van-nav-bar>

    <!-- 左侧课程目录侧滑栏 -->
    <van-popup
      v-model:show="showCatalog"
      position="left"
      :style="{ width: '80%', height: '100%' }"
    >
      <div class="catalog-content">
        <h3>课程目录</h3>
        <van-tree-select
          v-model:active-id="activeChapterId"
          v-model:main-active-index="mainActiveIndex"
          :items="catalogTree"
          @click-nav="onNavClick"
          @click-item="onItemClick"
        />
      </div>
    </van-popup>

    <!-- 学习内容区 -->
    <div class="study-content">
      <van-loading v-if="loading" type="spinner" size="40" vertical>加载中...</van-loading>

      <div v-else-if="currentContent" class="content-wrapper">
        <!-- 视频内容 -->
        <div v-if="currentContent.type === 'video'" class="video-container">
          <video
            :src="currentContent.url"
            controls
            controlslist="nodownload"
            class="video-player"
          >
            您的浏览器不支持视频播放
          </video>
        </div>

        <!-- PDF/Word预览 -->
        <div v-else-if="['pdf', 'word'].includes(currentContent.type)" class="document-container">
          <iframe
            :src="getDocumentPreviewUrl(currentContent.url)"
            frameborder="0"
            class="document-viewer"
          ></iframe>
        </div>

        <!-- 文本内容 -->
        <div v-else class="text-container">
          <div class="text-content" v-html="formatContent(currentContent.content)"></div>
        </div>
      </div>

      <van-empty v-else description="请从目录中选择章节" />
    </div>

    <!-- 底部功能按钮栏 -->
    <div class="bottom-actions">
      <van-button
        type="primary"
        size="small"
        round
        @click="generateSummary"
        :loading="summaryLoading"
      >
        <van-icon name="notes-o" />
        AI章节总结
      </van-button>
      <van-button
        type="success"
        size="small"
        round
        @click="generateKnowledgeMap"
        :loading="mapLoading"
      >
        <van-icon name="cluster-o" />
        知识网络图
      </van-button>
      <van-button
        type="warning"
        size="small"
        round
        @click="generateStudyPlan"
      >
        <van-icon name="calendar-o" />
        学习方案
      </van-button>
    </div>

    <!-- AI章节总结弹窗 -->
    <van-dialog
      v-model:show="summaryDialogVisible"
      title="AI章节总结"
      :show-confirm-button="false"
      close-on-click-overlay
    >
      <div class="summary-content">
        <div v-html="formatContent(summaryText)"></div>
        <van-button
          type="primary"
          size="small"
          round
          block
          @click="downloadSummary"
          style="margin-top: 16px;"
        >
          <van-icon name="down" />
          下载总结
        </van-button>
      </div>
    </van-dialog>

    <!-- 知识网络图弹窗 -->
    <van-dialog
      v-model:show="mapDialogVisible"
      title="知识网络图"
      :show-confirm-button="false"
      close-on-click-overlay
    >
      <div class="map-content">
        <div id="knowledge-map" style="width: 100%; height: 400px;"></div>
        <van-button
          type="primary"
          size="small"
          round
          block
          @click="downloadMap"
          style="margin-top: 16px;"
        >
          <van-icon name="down" />
          下载网络图
        </van-button>
      </div>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'

const router = useRouter()

// 目录相关
const showCatalog = ref(false)
const activeChapterId = ref([])
const mainActiveIndex = ref(0)
const currentChapter = ref('')

// 课程目录树
const catalogTree = ref([
  {
    text: '第一章 数据结构基础',
    children: [
      { text: '1.1 数组与链表', id: '1-1', type: 'video', url: 'https://example.com/video1.mp4' },
      { text: '1.2 栈与队列', id: '1-2', type: 'pdf', url: 'https://example.com/doc1.pdf' },
      { text: '1.3 树与图', id: '1-3', type: 'text', content: '树和图的基本概念...' }
    ]
  },
  {
    text: '第二章 算法分析',
    children: [
      { text: '2.1 时间复杂度', id: '2-1', type: 'video', url: 'https://example.com/video2.mp4' },
      { text: '2.2 空间复杂度', id: '2-2', type: 'pdf', url: 'https://example.com/doc2.pdf' }
    ]
  },
  {
    text: '第三章 排序算法',
    children: [
      { text: '3.1 冒泡排序', id: '3-1', type: 'video', url: 'https://example.com/video3.mp4' },
      { text: '3.2 快速排序', id: '3-2', type: 'video', url: 'https://example.com/video4.mp4' },
      { text: '3.3 归并排序', id: '3-3', type: 'pdf', url: 'https://example.com/doc3.pdf' }
    ]
  }
])

// 当前学习内容
const currentContent = ref(null)
const loading = ref(false)

// AI功能相关
const summaryDialogVisible = ref(false)
const summaryText = ref('')
const summaryLoading = ref(false)

const mapDialogVisible = ref(false)
const mapLoading = ref(false)

// 导航点击
const onNavClick = (index) => {
  mainActiveIndex.value = index
}

// 章节点击
const onItemClick = (item) => {
  loadChapterContent(item)
  showCatalog.value = false
}

// 加载章节内容
const loadChapterContent = async (item) => {
  loading.value = true
  currentChapter.value = item.text

  try {
    // TODO: 调用API加载章节内容
    await new Promise(resolve => setTimeout(resolve, 500))

    currentContent.value = {
      type: item.type,
      url: item.url,
      content: item.content || '这是章节的详细内容...'
    }
  } catch (error) {
    console.error('加载章节内容失败:', error)
    showToast('加载失败')
  } finally {
    loading.value = false
  }
}

// 获取文档预览URL
const getDocumentPreviewUrl = (url) => {
  // 使用在线预览服务
  return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(url)}`
}

// 格式化内容
const formatContent = (content) => {
  if (!content) return ''
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>')
}

// 生成AI章节总结
const generateSummary = async () => {
  if (!currentContent.value) {
    showToast('请先选择章节')
    return
  }

  summaryLoading.value = true

  try {
    // TODO: 调用AI API生成总结
    await new Promise(resolve => setTimeout(resolve, 2000))

    summaryText.value = `# ${currentChapter.value} 总结\n\n## 核心概念\n\n1. **基本定义**：本章介绍了数据结构的基本概念和重要性。\n\n2. **关键知识点**：\n   - 数组的特点和应用场景\n   - 链表的优势和劣势\n   - 栈和队列的区别\n\n## 重点难点\n\n- 理解不同数据结构的时间复杂度\n- 掌握数据结构的选择原则\n\n## 学习建议\n\n建议通过大量练习来巩固理论知识，特别是要动手实现各种数据结构。`

    summaryDialogVisible.value = true
  } catch (error) {
    console.error('生成总结失败:', error)
    showToast('生成失败')
  } finally {
    summaryLoading.value = false
  }
}

// 下载总结
const downloadSummary = () => {
  const blob = new Blob([summaryText.value], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${currentChapter.value}_总结.md`
  link.click()
  URL.revokeObjectURL(url)
  showToast('下载成功')
}

// 生成知识网络图
const generateKnowledgeMap = async () => {
  if (!currentContent.value) {
    showToast('请先选择章节')
    return
  }

  mapLoading.value = true

  try {
    // TODO: 调用AI API生成知识网络图
    await new Promise(resolve => setTimeout(resolve, 2000))

    mapDialogVisible.value = true

    // 这里应该使用图表库（如ECharts）绘制知识网络图
    // 简化示例
    setTimeout(() => {
      const mapElement = document.getElementById('knowledge-map')
      if (mapElement) {
        mapElement.innerHTML = '<div style="padding: 20px; text-align: center;">知识网络图将在这里显示<br/>（需要集成图表库）</div>'
      }
    }, 100)
  } catch (error) {
    console.error('生成知识网络图失败:', error)
    showToast('生成失败')
  } finally {
    mapLoading.value = false
  }
}

// 下载知识网络图
const downloadMap = () => {
  showToast('下载功能开发中')
}

// 生成学习方案
const generateStudyPlan = () => {
  router.push({
    path: '/student/study-plan',
    query: { chapter: currentChapter.value }
  })
}

// 返回
const goBack = () => {
  router.back()
}

// 页面加载
onMounted(() => {
  // 默认加载第一个章节
  if (catalogTree.value.length > 0 && catalogTree.value[0].children.length > 0) {
    loadChapterContent(catalogTree.value[0].children[0])
  }
})
</script>

<style scoped>
.course-study-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

/* 目录内容 */
.catalog-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
}

.catalog-content h3 {
  margin: 0;
  padding: 16px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  border-bottom: 1px solid #ebedf0;
}

/* 学习内容区 */
.study-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  padding-bottom: 80px;
  -webkit-overflow-scrolling: touch;
}

.content-wrapper {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

/* 视频容器 */
.video-container {
  width: 100%;
  background: #000;
}

.video-player {
  width: 100%;
  max-height: 60vh;
  display: block;
}

/* 文档容器 */
.document-container {
  width: 100%;
  height: 70vh;
}

.document-viewer {
  width: 100%;
  height: 100%;
}

/* 文本容器 */
.text-container {
  padding: 16px;
}

.text-content {
  font-size: 15px;
  line-height: 1.8;
  color: #303133;
}

.text-content :deep(strong) {
  font-weight: 600;
  color: #409eff;
}

/* 底部功能按钮栏 */
.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  padding: 12px;
  background: white;
  border-top: 1px solid #ebedf0;
  /* 适配iOS安全区域 */
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.06);
}

/* 总结内容 */
.summary-content {
  padding: 16px;
  max-height: 60vh;
  overflow-y: auto;
}

.summary-content :deep(h1),
.summary-content :deep(h2),
.summary-content :deep(h3) {
  margin: 16px 0 8px;
  color: #303133;
}

.summary-content :deep(strong) {
  font-weight: 600;
  color: #409eff;
}

/* 知识网络图内容 */
.map-content {
  padding: 16px;
}
</style>
