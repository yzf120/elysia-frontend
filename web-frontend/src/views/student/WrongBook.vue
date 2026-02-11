<template>
  <div class="wrong-book-page">
    <!-- 顶部栏 -->
    <div class="top-bar">
      <el-button type="primary" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        返回首页
      </el-button>
      <el-breadcrumb separator="/">
        <el-breadcrumb-item>学生端</el-breadcrumb-item>
        <el-breadcrumb-item>错题本</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <div class="wrong-book-container">
      <!-- 左侧错题列表 -->
      <div class="wrong-list-section">
        <el-card>
          <template #header>
            <div class="card-header">
              <span class="header-title">我的错题</span>
              <el-button type="primary" size="small" @click="shareToClass">
                <el-icon><Share /></el-icon>
                分享至班级
              </el-button>
            </div>
          </template>

          <!-- 筛选器 -->
          <div class="filter-bar">
            <el-select v-model="filterSubject" placeholder="选择科目" clearable style="width: 150px">
              <el-option label="全部科目" value="" />
              <el-option label="数据结构" value="数据结构" />
              <el-option label="算法设计" value="算法设计" />
              <el-option label="操作系统" value="操作系统" />
            </el-select>
            <el-select v-model="filterChapter" placeholder="选择章节" clearable style="width: 150px">
              <el-option label="全部章节" value="" />
              <el-option label="第一章" value="第一章" />
              <el-option label="第二章" value="第二章" />
              <el-option label="第三章" value="第三章" />
            </el-select>
          </div>

          <!-- 错题列表 -->
          <div v-if="filteredWrongQuestions.length === 0" class="empty-state">
            <el-empty description="暂无错题记录" />
          </div>
          <div v-else class="wrong-list">
            <div
              v-for="item in filteredWrongQuestions"
              :key="item.id"
              class="wrong-item"
              :class="{ active: selectedWrongId === item.id }"
              @click="selectWrong(item)"
            >
              <div class="wrong-header">
                <el-tag :type="getSubjectColor(item.subject)" size="small">{{ item.subject }}</el-tag>
                <span class="wrong-title">{{ item.title }}</span>
              </div>
              <div class="wrong-meta">
                <span class="chapter">{{ item.chapter }}</span>
                <span class="time">{{ formatTime(item.collectTime) }}</span>
              </div>
              <div class="wrong-reason">
                <el-icon><Warning /></el-icon>
                {{ item.wrongReason }}
              </div>
              <div class="wrong-actions">
                <el-button type="text" size="small" @click.stop="viewDetail(item)">
                  查看详情
                </el-button>
                <el-button type="text" size="small" danger @click.stop="uncollect(item.id)">
                  取消收藏
                </el-button>
              </div>
            </div>
          </div>

          <!-- 分页 -->
          <el-pagination
            v-if="filteredWrongQuestions.length > 0"
            class="pagination"
            v-model:current-page="currentPage"
            :page-size="10"
            layout="prev, pager, next"
            :total="totalCount"
          />
        </el-card>
      </div>

      <!-- 右侧AI分析 -->
      <div class="analysis-section">
        <el-card>
          <template #header>
            <div class="card-header">
              <span class="header-title">AI智能分析</span>
              <el-button
                type="primary"
                size="small"
                :loading="analyzing"
                @click="generateAnalysis"
              >
                <el-icon><MagicStick /></el-icon>
                生成分析
              </el-button>
            </div>
          </template>

          <div v-if="!analysisResult" class="empty-analysis">
            <el-empty description="点击【生成分析】按钮，AI将为您分析错题本">
              <el-icon :size="80" color="#d3d3d3"><DataAnalysis /></el-icon>
            </el-empty>
          </div>
          <div v-else class="analysis-content" v-loading="analyzing">
            <div class="analysis-section-item">
              <h3>
                <el-icon><TrendCharts /></el-icon>
                错题统计
              </h3>
              <div class="stats-grid">
                <div class="stat-item">
                  <div class="stat-value">{{ analysisResult.totalCount }}</div>
                  <div class="stat-label">总错题数</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">{{ analysisResult.subjectCount }}</div>
                  <div class="stat-label">涉及科目</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">{{ analysisResult.chapterCount }}</div>
                  <div class="stat-label">涉及章节</div>
                </div>
              </div>
            </div>

            <div class="analysis-section-item">
              <h3>
                <el-icon><Warning /></el-icon>
                薄弱知识点
              </h3>
              <ul class="weak-points">
                <li v-for="(point, index) in analysisResult.weakPoints" :key="index">
                  <el-tag type="danger" size="small">{{ point.subject }}</el-tag>
                  <span>{{ point.content }}</span>
                  <span class="count">({{ point.count }}题)</span>
                </li>
              </ul>
            </div>

            <div class="analysis-section-item">
              <h3>
                <el-icon><Promotion /></el-icon>
                改进建议
              </h3>
              <div class="suggestions">
                <p v-for="(suggestion, index) in analysisResult.suggestions" :key="index">
                  {{ index + 1 }}. {{ suggestion }}
                </p>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';

const router = useRouter();

// 筛选条件
const filterSubject = ref('');
const filterChapter = ref('');

// 错题列表
const wrongQuestions = ref([]);
const selectedWrongId = ref(null);
const currentPage = ref(1);
const totalCount = ref(0);

// AI分析
const analyzing = ref(false);
const analysisResult = ref(null);

// 过滤后的错题列表
const filteredWrongQuestions = computed(() => {
  let list = wrongQuestions.value;
  
  if (filterSubject.value) {
    list = list.filter(item => item.subject === filterSubject.value);
  }
  
  if (filterChapter.value) {
    list = list.filter(item => item.chapter === filterChapter.value);
  }
  
  return list;
});

// 获取科目颜色
const getSubjectColor = (subject) => {
  const colorMap = {
    '数据结构': 'primary',
    '算法设计': 'success',
    '操作系统': 'warning'
  };
  return colorMap[subject] || 'info';
};

// 格式化时间
const formatTime = (time) => {
  if (!time) return '';
  const date = new Date(time);
  const now = new Date();
  const diff = now - date;

  if (diff < 86400000) return '今天';
  if (diff < 172800000) return '昨天';
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;
  
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// 加载错题列表
const loadWrongQuestions = async () => {
  try {
    // TODO: 调用API获取错题列表
    // 模拟数据
    wrongQuestions.value = [
      {
        id: 1,
        title: '快速排序算法实现',
        subject: '数据结构',
        chapter: '第三章',
        wrongReason: '时间复杂度分析错误',
        collectTime: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 2,
        title: '进程调度算法',
        subject: '操作系统',
        chapter: '第二章',
        wrongReason: '调度策略理解不准确',
        collectTime: new Date(Date.now() - 172800000).toISOString()
      },
      {
        id: 3,
        title: '动态规划问题',
        subject: '算法设计',
        chapter: '第五章',
        wrongReason: '状态转移方程推导错误',
        collectTime: new Date(Date.now() - 259200000).toISOString()
      }
    ];
    totalCount.value = wrongQuestions.value.length;
  } catch (error) {
    console.error('加载错题列表失败:', error);
    ElMessage.error('加载错题列表失败');
  }
};

// 选择错题
const selectWrong = (item) => {
  selectedWrongId.value = item.id;
};

// 查看详情
const viewDetail = (item) => {
  router.push({
    name: 'TaskComplete',
    query: { id: item.id, isWrong: 'true' }
  });
};

// 取消收藏
const uncollect = async (id) => {
  try {
    await ElMessageBox.confirm('确定要取消收藏这道错题吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });

    // TODO: 调用API取消收藏
    wrongQuestions.value = wrongQuestions.value.filter(item => item.id !== id);
    ElMessage.success('已取消收藏');
  } catch {
    // 用户取消
  }
};

// 分享至班级
const shareToClass = async () => {
  if (wrongQuestions.value.length === 0) {
    ElMessage.warning('暂无错题可分享');
    return;
  }

  try {
    await ElMessageBox.confirm('确定要将错题本分享至班级吗？', '分享确认', {
      confirmButtonText: '确定分享',
      cancelButtonText: '取消',
      type: 'info'
    });

    // TODO: 调用API分享
    ElMessage.success('分享成功');
  } catch {
    // 用户取消
  }
};

// 生成AI分析
const generateAnalysis = async () => {
  if (wrongQuestions.value.length === 0) {
    ElMessage.warning('暂无错题，无法生成分析');
    return;
  }

  analyzing.value = true;

  try {
    // TODO: 调用AI API生成分析
    await new Promise(resolve => setTimeout(resolve, 2000));

    analysisResult.value = {
      totalCount: wrongQuestions.value.length,
      subjectCount: new Set(wrongQuestions.value.map(item => item.subject)).size,
      chapterCount: new Set(wrongQuestions.value.map(item => item.chapter)).size,
      weakPoints: [
        { subject: '数据结构', content: '排序算法的时间复杂度分析', count: 3 },
        { subject: '操作系统', content: '进程调度策略的理解', count: 2 },
        { subject: '算法设计', content: '动态规划状态转移方程', count: 2 }
      ],
      suggestions: [
        '建议重点复习排序算法的时间复杂度分析方法，多做相关练习题',
        '加强对操作系统进程调度策略的理解，可以通过模拟实验加深印象',
        '动态规划问题需要多总结状态转移方程的推导技巧，建议整理典型题型',
        '定期回顾错题，避免重复犯错'
      ]
    };

    ElMessage.success('分析生成成功');
  } catch (error) {
    console.error('生成分析失败:', error);
    ElMessage.error('生成分析失败');
  } finally {
    analyzing.value = false;
  }
};

// 返回首页
const goBack = () => {
  router.push({ name: 'StudentDashboard' });
};

// 页面加载
onMounted(() => {
  loadWrongQuestions();
});
</script>

<style scoped lang="scss">
.wrong-book-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20px;

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

  .wrong-book-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .header-title {
        font-size: 18px;
        font-weight: 600;
        color: #303133;
      }
    }

    // 左侧错题列表
    .wrong-list-section {
      .filter-bar {
        display: flex;
        gap: 15px;
        margin-bottom: 20px;
      }

      .empty-state {
        padding: 60px 0;
      }

      .wrong-list {
        .wrong-item {
          padding: 15px;
          border: 1px solid #e4e7ed;
          border-radius: 8px;
          margin-bottom: 12px;
          cursor: pointer;
          transition: all 0.3s;

          &:hover {
            border-color: #409eff;
            box-shadow: 0 2px 12px rgba(64, 158, 255, 0.2);
          }

          &.active {
            border-color: #409eff;
            background: #e3f2fd;
          }

          .wrong-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 10px;

            .wrong-title {
              font-size: 15px;
              font-weight: 600;
              color: #303133;
            }
          }

          .wrong-meta {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 13px;
            color: #909399;
          }

          .wrong-reason {
            display: flex;
            align-items: center;
            gap: 5px;
            font-size: 14px;
            color: #f56c6c;
            margin-bottom: 10px;
          }

          .wrong-actions {
            display: flex;
            gap: 10px;
          }
        }
      }

      .pagination {
        margin-top: 20px;
        display: flex;
        justify-content: center;
      }
    }

    // 右侧AI分析
    .analysis-section {
      .empty-analysis {
        padding: 80px 20px;
        text-align: center;
      }

      .analysis-content {
        .analysis-section-item {
          margin-bottom: 30px;

          &:last-child {
            margin-bottom: 0;
          }

          h3 {
            display: flex;
            align-items: center;
            gap: 8px;
            margin: 0 0 15px 0;
            font-size: 16px;
            font-weight: 600;
            color: #303133;
          }

          .stats-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;

            .stat-item {
              text-align: center;
              padding: 20px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border-radius: 8px;
              color: white;

              .stat-value {
                font-size: 32px;
                font-weight: 600;
                margin-bottom: 8px;
              }

              .stat-label {
                font-size: 14px;
                opacity: 0.9;
              }
            }
          }

          .weak-points {
            list-style: none;
            padding: 0;
            margin: 0;

            li {
              display: flex;
              align-items: center;
              gap: 10px;
              padding: 12px;
              background: #fff3f3;
              border-radius: 6px;
              margin-bottom: 10px;
              font-size: 14px;

              .count {
                margin-left: auto;
                color: #f56c6c;
                font-weight: 600;
              }
            }
          }

          .suggestions {
            p {
              margin: 0 0 12px 0;
              padding: 12px;
              background: #f0f9ff;
              border-left: 3px solid #409eff;
              border-radius: 4px;
              font-size: 14px;
              line-height: 1.6;
              color: #606266;

              &:last-child {
                margin-bottom: 0;
              }
            }
          }
        }
      }
    }
  }
}

@media (max-width: 1200px) {
  .wrong-book-container {
    grid-template-columns: 1fr !important;
  }
}
</style>
