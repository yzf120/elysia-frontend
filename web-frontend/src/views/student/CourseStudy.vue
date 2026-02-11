<template>
  <div class="course-study-page">
    <!-- 顶部栏 -->
    <div class="top-bar">
      <el-button type="primary" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        返回首页
      </el-button>
      <el-breadcrumb separator="/">
        <el-breadcrumb-item>学生端</el-breadcrumb-item>
        <el-breadcrumb-item>课程学习</el-breadcrumb-item>
        <el-breadcrumb-item v-if="currentChapter">{{ currentChapter.name }}</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <div class="course-container">
      <!-- 左侧课程目录 -->
      <div class="course-sidebar">
        <div class="sidebar-header">
          <h3>课程目录</h3>
        </div>
        <el-tree
          :data="courseTree"
          :props="treeProps"
          node-key="id"
          :default-expand-all="false"
          :highlight-current="true"
          @node-click="handleNodeClick"
          class="course-tree"
        >
          <template #default="{ node, data }">
            <div class="tree-node">
              <el-icon v-if="data.type === 'video'" color="#409eff"><VideoPlay /></el-icon>
              <el-icon v-else-if="data.type === 'pdf'" color="#f56c6c"><Document /></el-icon>
              <el-icon v-else-if="data.type === 'word'" color="#67c23a"><Document /></el-icon>
              <el-icon v-else><Folder /></el-icon>
              <span class="node-label">{{ node.label }}</span>
            </div>
          </template>
        </el-tree>
      </div>

      <!-- 右侧学习区 -->
      <div class="study-main">
        <!-- 功能按钮区 -->
        <div class="function-bar">
          <el-button type="primary" @click="generateSummary" :loading="summaryLoading">
            <el-icon><Reading /></el-icon>
            AI章节总结
          </el-button>
          <el-button type="success" @click="generateKnowledgeMap" :loading="mapLoading">
            <el-icon><Connection /></el-icon>
            生成知识网络图
          </el-button>
          <el-button type="warning" @click="generateStudyPlan">
            <el-icon><Calendar /></el-icon>
            生成学习/复习方案
          </el-button>
        </div>

        <!-- 学习内容区 -->
        <div class="content-area">
          <!-- 空状态 -->
          <div v-if="!currentChapter" class="empty-state">
            <el-empty description="请从左侧选择章节开始学习">
              <el-icon :size="80" color="#d3d3d3"><Reading /></el-icon>
            </el-empty>
          </div>

          <!-- 视频内容 -->
          <div v-else-if="currentChapter.type === 'video'" class="video-content">
            <h2 class="content-title">{{ currentChapter.name }}</h2>
            <div class="video-wrapper">
              <video
                :src="currentChapter.url"
                controls
                class="video-player"
                @timeupdate="handleVideoProgress"
              >
                您的浏览器不支持视频播放
              </video>
            </div>
            <div class="content-info">
              <el-tag type="info">视频时长：{{ currentChapter.duration }}</el-tag>
              <el-tag type="success">学习进度：{{ studyProgress }}%</el-tag>
            </div>
          </div>

          <!-- PDF/Word文档内容 -->
          <div v-else-if="currentChapter.type === 'pdf' || currentChapter.type === 'word'" class="document-content">
            <h2 class="content-title">{{ currentChapter.name }}</h2>
            <div class="document-wrapper">
              <iframe
                :src="getDocumentPreviewUrl(currentChapter.url)"
                class="document-viewer"
                frameborder="0"
              ></iframe>
            </div>
            <div class="content-actions">
              <el-button type="primary" @click="downloadDocument">
                <el-icon><Download /></el-icon>
                下载文档
              </el-button>
            </div>
          </div>

          <!-- 章节内容 -->
          <div v-else class="chapter-content">
            <h2 class="content-title">{{ currentChapter.name }}</h2>
            <div class="chapter-description">
              {{ currentChapter.description || '暂无章节描述' }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- AI章节总结对话框 -->
    <el-dialog
      v-model="summaryDialogVisible"
      title="AI章节总结"
      width="700px"
      :close-on-click-modal="false"
    >
      <div class="summary-content" v-loading="summaryLoading">
        <div v-if="summaryText" v-html="formatSummary(summaryText)"></div>
        <el-empty v-else description="暂无总结内容" />
      </div>
      <template #footer>
        <el-button @click="summaryDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="downloadSummary" :disabled="!summaryText">
          <el-icon><Download /></el-icon>
          下载总结
        </el-button>
      </template>
    </el-dialog>

    <!-- 知识网络图对话框 -->
    <el-dialog
      v-model="mapDialogVisible"
      title="知识网络图"
      width="900px"
      :close-on-click-modal="false"
    >
      <div class="knowledge-map" v-loading="mapLoading">
        <div ref="knowledgeMapContainer" style="width: 100%; height: 500px;"></div>
      </div>
      <template #footer>
        <el-button @click="mapDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="downloadMap">
          <el-icon><Download /></el-icon>
          下载图片
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import * as echarts from 'echarts';

const router = useRouter();

// 课程树配置
const treeProps = {
  children: 'children',
  label: 'name'
};

// 课程树数据
const courseTree = ref([]);

// 当前选中的章节
const currentChapter = ref(null);

// 学习进度
const studyProgress = ref(0);

// AI总结相关
const summaryDialogVisible = ref(false);
const summaryLoading = ref(false);
const summaryText = ref('');

// 知识网络图相关
const mapDialogVisible = ref(false);
const mapLoading = ref(false);
const knowledgeMapContainer = ref(null);
let knowledgeMapChart = null;

// 加载课程树
const loadCourseTree = async () => {
  try {
    // TODO: 调用API获取课程树
    // 模拟数据
    courseTree.value = [
      {
        id: 1,
        name: '第一章 数据结构基础',
        type: 'folder',
        children: [
          {
            id: 11,
            name: '1.1 数据结构概述',
            type: 'video',
            url: 'https://example.com/video1.mp4',
            duration: '15:30'
          },
          {
            id: 12,
            name: '1.2 算法分析',
            type: 'pdf',
            url: 'https://example.com/doc1.pdf'
          },
          {
            id: 13,
            name: '1.3 课后习题',
            type: 'word',
            url: 'https://example.com/doc2.docx'
          }
        ]
      },
      {
        id: 2,
        name: '第二章 线性表',
        type: 'folder',
        children: [
          {
            id: 21,
            name: '2.1 线性表的定义',
            type: 'video',
            url: 'https://example.com/video2.mp4',
            duration: '20:15'
          },
          {
            id: 22,
            name: '2.2 顺序表',
            type: 'pdf',
            url: 'https://example.com/doc3.pdf'
          }
        ]
      },
      {
        id: 3,
        name: '第三章 栈和队列',
        type: 'folder',
        children: [
          {
            id: 31,
            name: '3.1 栈的基本概念',
            type: 'video',
            url: 'https://example.com/video3.mp4',
            duration: '18:45'
          }
        ]
      }
    ];
  } catch (error) {
    console.error('加载课程树失败:', error);
    ElMessage.error('加载课程树失败');
  }
};

// 处理节点点击
const handleNodeClick = (data) => {
  if (data.type !== 'folder') {
    currentChapter.value = data;
    studyProgress.value = Math.floor(Math.random() * 100); // 模拟进度
  }
};

// 获取文档预览URL
const getDocumentPreviewUrl = (url) => {
  // 使用在线预览服务
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
};

// 处理视频进度
const handleVideoProgress = (event) => {
  const video = event.target;
  const progress = (video.currentTime / video.duration) * 100;
  studyProgress.value = Math.floor(progress);
};

// 下载文档
const downloadDocument = () => {
  if (!currentChapter.value) return;
  
  const link = document.createElement('a');
  link.href = currentChapter.value.url;
  link.download = currentChapter.value.name;
  link.click();
  
  ElMessage.success('开始下载文档');
};

// 生成AI章节总结
const generateSummary = async () => {
  if (!currentChapter.value) {
    ElMessage.warning('请先选择章节');
    return;
  }

  summaryDialogVisible.value = true;
  summaryLoading.value = true;

  try {
    // TODO: 调用AI API生成总结
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    summaryText.value = `
      <h3>章节：${currentChapter.value.name}</h3>
      <h4>核心知识点：</h4>
      <ul>
        <li><strong>基本概念</strong>：介绍了数据结构的基本定义和分类</li>
        <li><strong>时间复杂度</strong>：分析算法效率的重要指标</li>
        <li><strong>空间复杂度</strong>：衡量算法内存使用的标准</li>
      </ul>
      <h4>重点难点：</h4>
      <ul>
        <li>理解大O表示法的含义</li>
        <li>掌握常见算法的时间复杂度分析方法</li>
      </ul>
      <h4>学习建议：</h4>
      <p>建议通过实际编程练习加深理解，多做习题巩固知识点。</p>
    `;
  } catch (error) {
    console.error('生成总结失败:', error);
    ElMessage.error('生成总结失败');
  } finally {
    summaryLoading.value = false;
  }
};

// 格式化总结内容
const formatSummary = (text) => {
  return text;
};

// 下载总结
const downloadSummary = () => {
  const blob = new Blob([summaryText.value], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${currentChapter.value.name}_总结.html`;
  link.click();
  URL.revokeObjectURL(url);
  
  ElMessage.success('下载成功');
};

// 生成知识网络图
const generateKnowledgeMap = async () => {
  if (!currentChapter.value) {
    ElMessage.warning('请先选择章节');
    return;
  }

  mapDialogVisible.value = true;
  mapLoading.value = true;

  try {
    await nextTick();
    
    // TODO: 调用AI API生成知识图谱数据
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // 初始化ECharts
    if (!knowledgeMapChart && knowledgeMapContainer.value) {
      knowledgeMapChart = echarts.init(knowledgeMapContainer.value);
    }

    // 模拟知识图谱数据
    const option = {
      title: {
        text: `${currentChapter.value.name} - 知识网络图`,
        left: 'center'
      },
      tooltip: {},
      series: [
        {
          type: 'graph',
          layout: 'force',
          symbolSize: 50,
          roam: true,
          label: {
            show: true
          },
          edgeSymbol: ['circle', 'arrow'],
          edgeSymbolSize: [4, 10],
          data: [
            { name: '数据结构', value: 100, itemStyle: { color: '#409eff' } },
            { name: '线性结构', value: 80 },
            { name: '非线性结构', value: 80 },
            { name: '数组', value: 60 },
            { name: '链表', value: 60 },
            { name: '栈', value: 60 },
            { name: '队列', value: 60 },
            { name: '树', value: 60 },
            { name: '图', value: 60 }
          ],
          links: [
            { source: '数据结构', target: '线性结构' },
            { source: '数据结构', target: '非线性结构' },
            { source: '线性结构', target: '数组' },
            { source: '线性结构', target: '链表' },
            { source: '线性结构', target: '栈' },
            { source: '线性结构', target: '队列' },
            { source: '非线性结构', target: '树' },
            { source: '非线性结构', target: '图' }
          ],
          lineStyle: {
            opacity: 0.9,
            width: 2,
            curveness: 0
          }
        }
      ]
    };

    knowledgeMapChart.setOption(option);
  } catch (error) {
    console.error('生成知识网络图失败:', error);
    ElMessage.error('生成知识网络图失败');
  } finally {
    mapLoading.value = false;
  }
};

// 下载知识网络图
const downloadMap = () => {
  if (!knowledgeMapChart) return;
  
  const url = knowledgeMapChart.getDataURL({
    type: 'png',
    pixelRatio: 2,
    backgroundColor: '#fff'
  });
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${currentChapter.value.name}_知识网络图.png`;
  link.click();
  
  ElMessage.success('下载成功');
};

// 生成学习方案
const generateStudyPlan = () => {
  if (!currentChapter.value) {
    ElMessage.warning('请先选择章节');
    return;
  }

  router.push({
    name: 'StudyPlan',
    query: {
      chapterId: currentChapter.value.id,
      chapterName: currentChapter.value.name
    }
  });
};

// 返回首页
const goBack = () => {
  router.push({ name: 'StudentDashboard' });
};

// 页面加载
onMounted(() => {
  loadCourseTree();
});
</script>

<style scoped lang="scss">
.course-study-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20px;

  // 顶部栏
  .top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    background: white;
    padding: 15px 25px;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  }

  // 课程容器
  .course-container {
    display: flex;
    gap: 20px;
    height: calc(100vh - 140px);

    // 左侧边栏
    .course-sidebar {
      width: 320px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
      overflow: hidden;
      display: flex;
      flex-direction: column;

      .sidebar-header {
        padding: 20px;
        border-bottom: 1px solid #e4e7ed;

        h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #303133;
        }
      }

      .course-tree {
        flex: 1;
        overflow-y: auto;
        padding: 15px;

        .tree-node {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;

          .node-label {
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        }

        :deep(.el-tree-node__content) {
          height: 40px;
          border-radius: 6px;
          margin-bottom: 4px;

          &:hover {
            background: #f5f7fa;
          }
        }

        :deep(.el-tree-node.is-current > .el-tree-node__content) {
          background: #e3f2fd;
          color: #409eff;
        }
      }
    }

    // 主学习区
    .study-main {
      flex: 1;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
      display: flex;
      flex-direction: column;
      overflow: hidden;

      // 功能栏
      .function-bar {
        display: flex;
        gap: 15px;
        padding: 20px 25px;
        border-bottom: 1px solid #e4e7ed;
        flex-wrap: wrap;
      }

      // 内容区
      .content-area {
        flex: 1;
        overflow-y: auto;
        padding: 25px;

        .empty-state {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
        }

        .content-title {
          margin: 0 0 20px 0;
          font-size: 24px;
          font-weight: 600;
          color: #303133;
        }

        // 视频内容
        .video-content {
          .video-wrapper {
            margin-bottom: 20px;
            border-radius: 8px;
            overflow: hidden;
            background: #000;

            .video-player {
              width: 100%;
              max-height: 600px;
            }
          }

          .content-info {
            display: flex;
            gap: 15px;
          }
        }

        // 文档内容
        .document-content {
          .document-wrapper {
            margin-bottom: 20px;
            border: 1px solid #e4e7ed;
            border-radius: 8px;
            overflow: hidden;

            .document-viewer {
              width: 100%;
              height: 700px;
            }
          }

          .content-actions {
            display: flex;
            gap: 15px;
          }
        }

        // 章节内容
        .chapter-content {
          .chapter-description {
            font-size: 15px;
            line-height: 1.8;
            color: #606266;
          }
        }
      }
    }
  }
}

// 总结内容样式
.summary-content {
  min-height: 300px;
  font-size: 15px;
  line-height: 1.8;
  color: #606266;

  :deep(h3) {
    color: #303133;
    margin-top: 0;
  }

  :deep(h4) {
    color: #409eff;
    margin-top: 20px;
  }

  :deep(ul) {
    padding-left: 25px;
  }

  :deep(li) {
    margin-bottom: 10px;
  }

  :deep(strong) {
    color: #303133;
  }
}

// 知识网络图样式
.knowledge-map {
  min-height: 500px;
}

// 响应式
@media (max-width: 1200px) {
  .course-container {
    .course-sidebar {
      width: 280px;
    }
  }
}

@media (max-width: 768px) {
  .course-container {
    flex-direction: column;
    height: auto;

    .course-sidebar {
      width: 100%;
      height: 300px;
    }

    .study-main {
      height: 600px;
    }
  }
}
</style>
