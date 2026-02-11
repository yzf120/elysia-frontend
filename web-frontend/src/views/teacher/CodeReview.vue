<template>
  <div class="teacher-page code-review-page">
    <!-- 顶部导航栏 -->
    <div class="teacher-top-nav">
      <div class="nav-left">
        <el-button type="primary" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回首页
        </el-button>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item>教师端</el-breadcrumb-item>
          <el-breadcrumb-item>AI代码审核</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
    </div>

    <!-- 功能按钮区 -->
    <div class="teacher-card function-bar">
      <el-button type="primary" :loading="batchReviewing" @click="batchReview">
        <el-icon><MagicStick /></el-icon>
        AI自动批改
      </el-button>
      <el-button type="success" @click="exportReport">
        <el-icon><Download /></el-icon>
        导出审核报告
      </el-button>
    </div>

    <!-- 主内容区 - Tab切换 -->
    <div class="teacher-card">
      <el-tabs v-model="activeTab" class="teacher-tabs">
        <!-- 待审核列表Tab -->
        <el-tab-pane label="待审核列表" name="pending">
          <div class="filter-bar">
            <el-select v-model="filterClass" placeholder="筛选班级" style="width: 200px" clearable>
              <el-option label="全部班级" value="" />
              <el-option label="2024春季Python编程班" value="1" />
              <el-option label="2024春季数据结构班" value="2" />
            </el-select>
            <el-date-picker
              v-model="filterDate"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              style="width: 300px"
            />
          </div>

          <el-table
            :data="pendingList"
            class="teacher-table"
            stripe
            @selection-change="handleSelectionChange"
          >
            <el-table-column type="selection" width="55" />
            <el-table-column prop="className" label="班级名称" width="180" />
            <el-table-column prop="studentName" label="学生姓名" width="120" />
            <el-table-column prop="taskTitle" label="任务名称" min-width="200" />
            <el-table-column prop="fileName" label="代码文件" width="180" />
            <el-table-column prop="submitTime" label="提交时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.submitTime) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="reviewCode(row)">
                  审核
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="teacher-pagination">
            <el-pagination
              v-model:current-page="pendingPage"
              :page-size="10"
              layout="prev, pager, next"
              :total="pendingTotal"
            />
          </div>
        </el-tab-pane>

        <!-- 审核结果Tab -->
        <el-tab-pane label="审核结果" name="reviewed">
          <el-table :data="reviewedList" class="teacher-table" stripe>
            <el-table-column prop="className" label="班级名称" width="180" />
            <el-table-column prop="studentName" label="学生姓名" width="120" />
            <el-table-column prop="taskTitle" label="任务名称" min-width="200" />
            <el-table-column label="分数" width="100">
              <template #default="{ row }">
                <span :class="getScoreClass(row.score)">{{ row.score }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="reviewTime" label="审核时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.reviewTime) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" link @click="viewDetail(row)">
                  查看详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="teacher-pagination">
            <el-pagination
              v-model:current-page="reviewedPage"
              :page-size="10"
              layout="prev, pager, next"
              :total="reviewedTotal"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 代码审核对话框 -->
    <el-dialog
      v-model="reviewDialogVisible"
      title="代码审核"
      width="80%"
      class="teacher-dialog review-dialog"
    >
      <div class="review-content">
        <!-- 左侧：代码展示 -->
        <div class="code-section">
          <h4>学生代码</h4>
          <div class="code-display">
            <pre><code class="language-python">{{ currentCode }}</code></pre>
          </div>
        </div>

        <!-- 右侧：AI批改结果 -->
        <div class="result-section">
          <h4>AI批改结果</h4>
          <div class="ai-result">
            <div class="result-item">
              <div class="item-label">预估分数：</div>
              <div class="item-value score">{{ aiResult.score }}</div>
            </div>

            <div class="result-item">
              <div class="item-label">错误点：</div>
              <div class="item-value">
                <ul>
                  <li v-for="(error, index) in aiResult.errors" :key="index">
                    {{ error }}
                  </li>
                </ul>
              </div>
            </div>

            <div class="result-item">
              <div class="item-label">修改建议：</div>
              <div class="item-value">
                <p v-for="(suggestion, index) in aiResult.suggestions" :key="index">
                  {{ suggestion }}
                </p>
              </div>
            </div>
          </div>

          <!-- 手动调整 -->
          <div class="manual-adjust">
            <h4>手动调整</h4>
            <el-form :model="reviewForm" label-width="80px">
              <el-form-item label="最终分数">
                <el-input-number
                  v-model="reviewForm.score"
                  :min="0"
                  :max="100"
                  style="width: 100%"
                />
              </el-form-item>
              <el-form-item label="修改意见">
                <el-input
                  v-model="reviewForm.comment"
                  type="textarea"
                  :rows="4"
                  placeholder="请输入修改意见"
                />
              </el-form-item>
            </el-form>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="reviewDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submittingReview" @click="submitReview">
          提交审核
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import * as XLSX from 'xlsx';

const router = useRouter();

// 当前激活的Tab
const activeTab = ref('pending');

// 筛选条件
const filterClass = ref('');
const filterDate = ref(null);

// 待审核列表
const pendingList = ref([]);
const pendingPage = ref(1);
const pendingTotal = ref(0);
const selectedPending = ref([]);

// 已审核列表
const reviewedList = ref([]);
const reviewedPage = ref(1);
const reviewedTotal = ref(0);

// 批量审核状态
const batchReviewing = ref(false);

// 审核对话框
const reviewDialogVisible = ref(false);
const currentCode = ref('');
const aiResult = ref({
  score: 0,
  errors: [],
  suggestions: []
});
const reviewForm = ref({
  score: 0,
  comment: ''
});
const submittingReview = ref(false);
const currentReviewItem = ref(null);

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

// 获取分数样式类
const getScoreClass = (score) => {
  if (score >= 90) return 'score-excellent';
  if (score >= 80) return 'score-good';
  if (score >= 60) return 'score-pass';
  return 'score-fail';
};

// 加载待审核列表
const loadPendingList = async () => {
  try {
    // TODO: 调用API获取待审核列表
    // 模拟数据
    pendingList.value = [
      {
        id: 1,
        className: '2024春季Python编程班',
        studentName: '张三',
        taskTitle: '第三章课后习题',
        fileName: 'homework3.py',
        submitTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 2,
        className: '2024春季Python编程班',
        studentName: '李四',
        taskTitle: '第三章课后习题',
        fileName: 'homework3.py',
        submitTime: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 3,
        className: '2024春季数据结构班',
        studentName: '王五',
        taskTitle: '栈与队列实现',
        fileName: 'stack_queue.py',
        submitTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    pendingTotal.value = pendingList.value.length;
  } catch (error) {
    console.error('加载待审核列表失败:', error);
    ElMessage.error('加载待审核列表失败');
  }
};

// 加载已审核列表
const loadReviewedList = async () => {
  try {
    // TODO: 调用API获取已审核列表
    // 模拟数据
    reviewedList.value = [
      {
        id: 1,
        className: '2024春季Python编程班',
        studentName: '赵六',
        taskTitle: '第二章课后习题',
        score: 95,
        reviewTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 2,
        className: '2024春季Python编程班',
        studentName: '孙七',
        taskTitle: '第二章课后习题',
        score: 78,
        reviewTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    reviewedTotal.value = reviewedList.value.length;
  } catch (error) {
    console.error('加载已审核列表失败:', error);
    ElMessage.error('加载已审核列表失败');
  }
};

// 处理选择变化
const handleSelectionChange = (selection) => {
  selectedPending.value = selection;
};

// 批量审核
const batchReview = async () => {
  if (selectedPending.value.length === 0) {
    ElMessage.warning('请先选择要批改的作业');
    return;
  }

  try {
    batchReviewing.value = true;
    // TODO: 调用AI API批量批改
    await new Promise(resolve => setTimeout(resolve, 3000));

    ElMessage.success('批量批改成功');
    loadPendingList();
    loadReviewedList();
    activeTab.value = 'reviewed';
  } catch (error) {
    console.error('批量批改失败:', error);
    ElMessage.error('批量批改失败');
  } finally {
    batchReviewing.value = false;
  }
};

// 审核代码
const reviewCode = async (item) => {
  currentReviewItem.value = item;
  reviewDialogVisible.value = true;

  // 模拟加载代码
  currentCode.value = `def fibonacci(n):
    """计算斐波那契数列第n项"""
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

# 测试
for i in range(10):
    print(f"fibonacci({i}) = {fibonacci(i)}")`;

  // 模拟AI批改
  await new Promise(resolve => setTimeout(resolve, 1500));
  aiResult.value = {
    score: 85,
    errors: [
      '第2行：缺少输入参数验证',
      '第5行：递归实现效率较低，建议使用动态规划'
    ],
    suggestions: [
      '建议添加参数类型检查和边界条件验证',
      '可以使用记忆化搜索或动态规划优化算法效率',
      '代码整体逻辑正确，但可以进一步优化性能'
    ]
  };

  reviewForm.value.score = aiResult.value.score;
  reviewForm.value.comment = aiResult.value.suggestions.join('\n');
};

// 提交审核
const submitReview = async () => {
  try {
    submittingReview.value = true;
    // TODO: 调用API提交审核结果
    await new Promise(resolve => setTimeout(resolve, 1000));

    ElMessage.success('审核提交成功');
    reviewDialogVisible.value = false;
    loadPendingList();
    loadReviewedList();
    activeTab.value = 'reviewed';
  } catch (error) {
    console.error('提交审核失败:', error);
    ElMessage.error('提交审核失败');
  } finally {
    submittingReview.value = false;
  }
};

// 查看详情
const viewDetail = (item) => {
  reviewCode(item);
};

// 导出审核报告
const exportReport = () => {
  try {
    // 准备导出数据
    const data = reviewedList.value.map(item => ({
      '班级名称': item.className,
      '学生姓名': item.studentName,
      '任务名称': item.taskTitle,
      '分数': item.score,
      '审核时间': formatDate(item.reviewTime)
    }));

    // 创建工作簿
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '审核报告');

    // 导出文件
    XLSX.writeFile(wb, `代码审核报告_${new Date().toISOString().split('T')[0]}.xlsx`);

    ElMessage.success('导出成功');
  } catch (error) {
    console.error('导出失败:', error);
    ElMessage.error('导出失败');
  }
};

// 返回首页
const goBack = () => {
  router.push({ name: 'TeacherDashboard' });
};

// 页面加载
onMounted(() => {
  loadPendingList();
  loadReviewedList();
});
</script>

<style scoped lang="scss">
@import '@/styles/teacher.css';

.code-review-page {
  // 功能按钮栏
  .function-bar {
    display: flex;
    gap: 12px;
    padding: 16px 24px;
  }

  // 筛选栏
  .filter-bar {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
  }

  // 分数样式
  .score-excellent {
    color: var(--teacher-success);
    font-weight: 600;
  }

  .score-good {
    color: #67c23a;
    font-weight: 600;
  }

  .score-pass {
    color: var(--teacher-warning);
    font-weight: 600;
  }

  .score-fail {
    color: var(--teacher-danger);
    font-weight: 600;
  }

  // 审核对话框
  .review-dialog {
    :deep(.el-dialog__body) {
      padding: 0;
    }

    .review-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0;
      max-height: 70vh;

      .code-section,
      .result-section {
        padding: 24px;
        overflow-y: auto;

        h4 {
          margin: 0 0 16px 0;
          font-size: 16px;
          font-weight: 600;
          color: var(--teacher-text-primary);
        }
      }

      .code-section {
        border-right: 1px solid var(--teacher-border);

        .code-display {
          background: #282c34;
          border-radius: 8px;
          padding: 16px;
          overflow-x: auto;

          pre {
            margin: 0;

            code {
              color: #abb2bf;
              font-family: 'Courier New', Consolas, monospace;
              font-size: 14px;
              line-height: 1.6;
            }
          }
        }
      }

      .result-section {
        .ai-result {
          background: var(--teacher-bg);
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 20px;

          .result-item {
            margin-bottom: 16px;

            &:last-child {
              margin-bottom: 0;
            }

            .item-label {
              font-size: 14px;
              font-weight: 600;
              color: var(--teacher-text-primary);
              margin-bottom: 8px;
            }

            .item-value {
              font-size: 14px;
              color: var(--teacher-text-primary);

              &.score {
                font-size: 32px;
                font-weight: 700;
                color: var(--teacher-primary);
              }

              ul {
                margin: 0;
                padding-left: 20px;

                li {
                  margin-bottom: 6px;
                  color: var(--teacher-danger);
                }
              }

              p {
                margin: 0 0 8px 0;
                line-height: 1.6;

                &:last-child {
                  margin-bottom: 0;
                }
              }
            }
          }
        }

        .manual-adjust {
          h4 {
            margin: 0 0 16px 0;
            font-size: 15px;
            font-weight: 600;
            color: var(--teacher-text-primary);
          }
        }
      }
    }
  }
}

// 响应式
@media (max-width: 1200px) {
  .review-dialog .review-content {
    grid-template-columns: 1fr !important;

    .code-section {
      border-right: none;
      border-bottom: 1px solid var(--teacher-border);
    }
  }
}
</style>
