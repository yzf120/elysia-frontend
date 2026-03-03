<template>
  <div class="course-study-page">

    <!-- ===== 第一层：班级列表 ===== -->
    <div v-if="currentView === 'classList'">
      <div class="page-header">
        <el-button @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回首页
        </el-button>
        <h2 class="page-title">课程学习</h2>
      </div>

      <div class="class-list-body">
        <div class="section-header">
          <span class="section-title">我加入的班级</span>
          <span class="section-sub">点击班级进入课程学习</span>
        </div>

        <!-- 加载中 -->
        <div v-if="classListLoading" style="text-align:center;padding:60px 0;">
          <el-icon class="is-loading" :size="24"><Loading /></el-icon>
          <div style="margin-top:8px;color:#909399;font-size:14px;">加载中...</div>
        </div>

        <!-- 加载失败 -->
        <div v-else-if="classListError" style="text-align:center;padding:40px 16px;color:#f56c6c;">
          {{ classListError }}
          <div style="margin-top:12px">
            <el-button size="small" type="primary" @click="loadStudentClasses">重新加载</el-button>
          </div>
        </div>

        <!-- 空列表 -->
        <div v-else-if="classList.length === 0" class="empty-wrap">
          <el-empty description="暂未加入任何班级" />
        </div>

        <div v-else class="class-grid">
          <div
            v-for="cls in classList"
            :key="cls.id"
            class="class-card"
            @click="enterClass(cls)"
          >
            <div class="class-card-top" :style="{ background: cls.color }">
              <el-icon :size="36" color="#fff"><Reading /></el-icon>
              <div class="class-status-tag">
                <el-tag :type="cls.status === '进行中' ? 'success' : 'info'" size="small" effect="dark">
                  {{ cls.status }}
                </el-tag>
              </div>
            </div>
            <div class="class-card-body">
              <div class="class-name">{{ cls.name }}</div>
              <div class="class-meta">
                <span><el-icon><User /></el-icon> {{ cls.teacher }}</span>
                <span><el-icon><UserFilled /></el-icon> {{ cls.studentCount }}人</span>
              </div>
              <div class="class-subject-row">
                <el-tag type="primary" size="small">{{ cls.subject }}</el-tag>
              </div>
              <div class="class-progress-row">
                <span class="progress-label">完成度</span>
                <el-progress
                  :percentage="cls.progress"
                  :stroke-width="8"
                  :color="progressColor(cls.progress)"
                  style="flex:1"
                />
                <span class="progress-num">{{ cls.progress }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== 第二层：课程目录 ===== -->
    <div v-else-if="currentView === 'catalog'">
      <div class="page-header">
        <el-button @click="currentView = 'classList'">
          <el-icon><ArrowLeft /></el-icon>
          返回班级列表
        </el-button>
        <el-breadcrumb separator="/" class="breadcrumb">
          <el-breadcrumb-item @click="currentView = 'classList'" style="cursor:pointer">课程学习</el-breadcrumb-item>
          <el-breadcrumb-item>{{ currentClass.name }}</el-breadcrumb-item>
        </el-breadcrumb>
      </div>

      <div class="catalog-body">
        <!-- 课程信息卡 -->
        <div class="course-info-banner" :style="{ background: currentClass.color }">
          <div class="banner-left">
            <div class="banner-subject">{{ currentClass.subject }}</div>
            <div class="banner-name">{{ currentClass.name }}</div>
            <div class="banner-teacher">
              <el-icon><User /></el-icon> {{ currentClass.teacher }}
              &nbsp;&nbsp;
              <el-icon><UserFilled /></el-icon> {{ currentClass.studentCount }}人
            </div>
          </div>
          <div class="banner-right">
            <el-progress
              type="circle"
              :percentage="currentClass.progress"
              :width="80"
              :stroke-width="8"
              color="#fff"
              track-color="rgba(255,255,255,0.3)"
            >
              <template #default>
                <span class="circle-progress-text">{{ currentClass.progress }}%</span>
              </template>
            </el-progress>
            <div class="circle-label">完成度</div>
          </div>
        </div>

        <!-- 章节列表 -->
        <div class="section-header" style="margin-top:20px">
          <span class="section-title">课程目录</span>
          <span class="section-sub">共 {{ courseChapters.length }} 个章节</span>
        </div>

        <el-collapse v-model="activeChapters" class="chapter-collapse">
          <el-collapse-item
            v-for="chapter in courseChapters"
            :key="chapter.id"
            :name="chapter.id"
          >
            <template #title>
              <div class="chapter-title-row">
                <el-icon color="#667eea"><Notebook /></el-icon>
                <span class="chapter-title-text">{{ chapter.title }}</span>
                <el-badge :value="chapter.problems.length" type="primary" class="chapter-badge" />
                <span class="chapter-solved">
                  已完成 {{ chapter.problems.filter(p => p.solved).length }}/{{ chapter.problems.length }}
                </span>
              </div>
            </template>

            <div class="problem-list">
              <div
                v-for="problem in chapter.problems"
                :key="problem.id"
                class="problem-item"
                @click="viewProblem(problem)"
              >
                <div class="problem-left">
                  <el-tag
                    :type="difficultyType(problem.difficulty)"
                    size="small"
                    class="diff-tag"
                  >{{ difficultyLabel(problem.difficulty) }}</el-tag>
                  <div class="problem-info">
                    <div class="problem-title">{{ problem.title }}</div>
                    <div class="problem-tags">
                      <el-tag
                        v-for="tag in problem.tags"
                        :key="tag"
                        size="small"
                        plain
                        type="info"
                        style="margin-right:4px;margin-top:2px"
                      >{{ tag }}</el-tag>
                    </div>
                  </div>
                </div>
                <div class="problem-right">
                  <el-icon v-if="problem.solved" color="#67c23a" :size="20"><CircleCheck /></el-icon>
                  <el-icon v-else color="#c8c9cc" :size="20"><CircleClose /></el-icon>
                  <span class="time-limit">{{ problem.timeLimit }}ms</span>
                  <el-icon color="#c8c9cc"><ArrowRight /></el-icon>
                </div>
              </div>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>
    </div>

    <!-- ===== 第三层：题目详情抽屉 ===== -->
    <el-drawer
      v-model="showProblemDetail"
      :title="currentProblem ? currentProblem.title : ''"
      direction="rtl"
      size="680px"
      :destroy-on-close="false"
    >
      <template #header>
        <div class="drawer-header" v-if="currentProblem">
          <div class="drawer-title">{{ currentProblem.title }}</div>
          <div class="drawer-meta">
            <el-tag :type="difficultyType(currentProblem.difficulty)" size="default">
              {{ difficultyLabel(currentProblem.difficulty) }}
            </el-tag>
            <span class="meta-chip">
              <el-icon><Timer /></el-icon> 时间限制：{{ currentProblem.timeLimit }}ms
            </span>
            <span class="meta-chip">
              <el-icon><Coin /></el-icon> 内存限制：{{ currentProblem.memoryLimit }}MB
            </span>
          </div>
          <div class="drawer-tags">
            <el-tag
              v-for="tag in currentProblem.tags"
              :key="tag"
              plain
              type="primary"
              size="small"
              style="margin-right:6px;margin-bottom:4px"
            >{{ tag }}</el-tag>
          </div>
        </div>
      </template>

      <div class="problem-detail-body" v-if="currentProblem">
        <!-- 题目描述 -->
        <div class="detail-section">
          <div class="detail-section-title">📝 题目描述</div>
          <div class="detail-section-content" v-html="currentProblem.description"></div>
        </div>

        <!-- 输入格式 -->
        <div class="detail-section">
          <div class="detail-section-title">📥 输入格式</div>
          <div class="detail-section-content">{{ currentProblem.inputFormat }}</div>
        </div>

        <!-- 输出格式 -->
        <div class="detail-section">
          <div class="detail-section-title">📤 输出格式</div>
          <div class="detail-section-content">{{ currentProblem.outputFormat }}</div>
        </div>

        <!-- 输入输出样例 -->
        <div class="detail-section">
          <div class="detail-section-title">💡 输入输出样例</div>
          <div
            v-for="(sample, idx) in currentProblem.samples"
            :key="idx"
            class="sample-block"
          >
            <div class="sample-row">
              <div class="sample-col">
                <div class="sample-label">输入 {{ idx + 1 }}</div>
                <pre class="sample-code">{{ sample.input }}</pre>
              </div>
              <div class="sample-col">
                <div class="sample-label">输出 {{ idx + 1 }}</div>
                <pre class="sample-code">{{ sample.output }}</pre>
              </div>
            </div>
            <div v-if="sample.explanation" class="sample-explanation">
              <el-icon><InfoFilled /></el-icon> 说明：{{ sample.explanation }}
            </div>
          </div>
        </div>

        <!-- 提示 -->
        <div v-if="currentProblem.hint" class="detail-section">
          <div class="detail-section-title">🔔 提示</div>
          <el-alert :title="currentProblem.hint" type="info" :closable="false" show-icon />
        </div>
      </div>

      <template #footer>
        <div class="drawer-footer">
          <el-button @click="showProblemDetail = false">关闭</el-button>
          <el-button type="primary" @click="goToSubmit">
            <el-icon><Edit /></el-icon>
            开始作答
          </el-button>
        </div>
      </template>
    </el-drawer>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { studentAPI } from '@/services/index.js'
import {
  ArrowLeft, ArrowRight, Reading, User, UserFilled,
  Notebook, CircleCheck, CircleClose, Timer, Coin,
  InfoFilled, Edit, Loading
} from '@element-plus/icons-vue'

const router = useRouter()

// 当前视图层级
const currentView = ref('classList')
const currentClass = ref(null)
const currentProblem = ref(null)
const showProblemDetail = ref(false)
const activeChapters = ref([])

// 班级列表加载状态
const classListLoading = ref(true)
const classListError = ref('')

// 班级列表（从后端接口加载）
const classList = ref([])

// 预设卡片颜色（按班级索引循环使用）
const cardColors = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)'
]

// 加载学生班级列表
const loadStudentClasses = async () => {
  classListLoading.value = true
  classListError.value = ''
  try {
    // 优先从 userInfo 中获取 student_id，兼容 userId 方式
    let studentId = localStorage.getItem('userId') || ''
    if (!studentId) {
      try {
        const raw = localStorage.getItem('userInfo')
        if (raw && raw !== 'undefined' && raw !== 'null') {
          const userInfo = JSON.parse(raw)
          studentId = userInfo.student_id || userInfo.id || ''
        }
      } catch (e) {
        console.warn('解析 userInfo 失败:', e)
      }
    }
    if (!studentId) {
      classListError.value = '未获取到学生信息，请重新登录'
      return
    }
    const res = await studentAPI.getStudentClasses(studentId)
    const classes = res?.classes || []
    classList.value = classes.map((cls, idx) => ({
      id: cls.class_id,
      name: cls.class_name,
      subject: cls.subject_name || cls.subject_id || '',
      teacher: cls.teacher_name ? cls.teacher_name + '老师' : '',
      studentCount: cls.current_students || 0,
      status: cls.status === 1 ? '进行中' : '已结束',
      progress: 0,
      color: cardColors[idx % cardColors.length],
      _raw: cls
    }))
  } catch (e) {
    classListError.value = '班级加载失败：' + (e?.message || e)
    ElMessage.error('班级加载失败')
  } finally {
    classListLoading.value = false
  }
}

onMounted(() => {
  loadStudentClasses()
})

const courseChapters = ref([])

// 进入班级
const enterClass = (cls) => {
  currentClass.value = cls
  courseChapters.value = []
  activeChapters.value = []
  currentView.value = 'catalog'
}

// 查看题目详情
const viewProblem = (problem) => {
  currentProblem.value = problem
  showProblemDetail.value = true
}

// 难度标签文字
const difficultyLabel = (diff) => {
  const map = { easy: '简单', medium: '中等', hard: '困难' }
  return map[diff] || diff
}

// 难度标签类型
const difficultyType = (diff) => {
  const map = { easy: 'success', medium: 'warning', hard: 'danger' }
  return map[diff] || 'info'
}

// 进度条颜色
const progressColor = (val) => {
  if (val >= 80) return '#67c23a'
  if (val >= 50) return '#409eff'
  return '#e6a23c'
}

// 去作答
const goToSubmit = () => {
  showProblemDetail.value = false
  router.push({
    name: 'ProblemCode',
    params: { problemId: currentProblem.value.id }
  })
}

// 返回首页
const goBack = () => {
  router.push({ name: 'StudentDashboard' })
}
</script>

<style scoped lang="scss">
.course-study-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20px;
}

/* 页面头部 */
.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #fff;
  padding: 16px 24px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  margin-bottom: 20px;

  .page-title {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: #303133;
  }

  .breadcrumb {
    font-size: 14px;
  }
}

/* 区块标题 */
.section-header {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 16px;

  .section-title {
    font-size: 17px;
    font-weight: 700;
    color: #303133;
  }

  .section-sub {
    font-size: 13px;
    color: #909399;
  }
}

/* ===== 班级列表 ===== */
.class-list-body {
  max-width: 1200px;
  margin: 0 auto;
}

.class-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.class-card {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.14);
  }

  .class-card-top {
    height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;

    .class-status-tag {
      position: absolute;
      top: 12px;
      right: 12px;
    }
  }

  .class-card-body {
    padding: 16px 20px;

    .class-name {
      font-size: 16px;
      font-weight: 700;
      color: #303133;
      margin-bottom: 10px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .class-meta {
      display: flex;
      gap: 16px;
      font-size: 13px;
      color: #909399;
      margin-bottom: 10px;

      span {
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }

    .class-subject-row {
      margin-bottom: 12px;
    }

    .class-progress-row {
      display: flex;
      align-items: center;
      gap: 8px;

      .progress-label {
        font-size: 12px;
        color: #909399;
        white-space: nowrap;
      }

      .progress-num {
        font-size: 12px;
        font-weight: 600;
        color: #606266;
        white-space: nowrap;
      }
    }
  }
}

/* ===== 课程目录 ===== */
.catalog-body {
  max-width: 960px;
  margin: 0 auto;
}

.course-info-banner {
  border-radius: 16px;
  padding: 24px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #fff;
  margin-bottom: 8px;

  .banner-left {
    .banner-subject {
      font-size: 22px;
      font-weight: 800;
      margin-bottom: 6px;
    }

    .banner-name {
      font-size: 15px;
      opacity: 0.9;
      margin-bottom: 8px;
    }

    .banner-teacher {
      font-size: 13px;
      opacity: 0.8;
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }

  .banner-right {
    text-align: center;

    .circle-progress-text {
      font-size: 16px;
      font-weight: 700;
      color: #fff;
    }

    .circle-label {
      font-size: 12px;
      margin-top: 6px;
      opacity: 0.85;
    }
  }
}

/* 章节折叠 */
.chapter-collapse {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);

  :deep(.el-collapse-item__header) {
    padding: 0 20px;
    height: 56px;
    font-size: 15px;
    background: #fff;

    &:hover {
      background: #f5f7fa;
    }
  }

  :deep(.el-collapse-item__content) {
    padding: 0;
  }

  :deep(.el-collapse-item__wrap) {
    border-bottom: 1px solid #ebedf0;
  }
}

.chapter-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;

  .chapter-title-text {
    font-size: 15px;
    font-weight: 600;
    color: #303133;
    flex: 1;
  }

  .chapter-badge {
    margin-right: 4px;
  }

  .chapter-solved {
    font-size: 12px;
    color: #909399;
    margin-right: 8px;
  }
}

/* 题目列表 */
.problem-list {
  background: #fafafa;
}

.problem-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 24px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.15s;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: #f0f4ff;
  }

  .problem-left {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    flex: 1;
    min-width: 0;

    .diff-tag {
      flex-shrink: 0;
      margin-top: 2px;
    }

    .problem-info {
      flex: 1;
      min-width: 0;

      .problem-title {
        font-size: 14px;
        font-weight: 600;
        color: #303133;
        margin-bottom: 6px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .problem-tags {
        display: flex;
        flex-wrap: wrap;
      }
    }
  }

  .problem-right {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    margin-left: 12px;

    .time-limit {
      font-size: 12px;
      color: #909399;
    }
  }
}

/* ===== 题目详情抽屉 ===== */
.drawer-header {
  .drawer-title {
    font-size: 18px;
    font-weight: 700;
    color: #303133;
    margin-bottom: 10px;
    line-height: 1.4;
  }

  .drawer-meta {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 10px;

    .meta-chip {
      font-size: 13px;
      color: #606266;
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }

  .drawer-tags {
    display: flex;
    flex-wrap: wrap;
  }
}

.problem-detail-body {
  padding: 0 4px;

  .detail-section {
    margin-bottom: 24px;

    .detail-section-title {
      font-size: 15px;
      font-weight: 700;
      color: #303133;
      margin-bottom: 10px;
      padding-bottom: 6px;
      border-bottom: 2px solid #f0f0f0;
    }

    .detail-section-content {
      font-size: 14px;
      color: #606266;
      line-height: 1.8;
      white-space: pre-line;

      :deep(code) {
        background: #f5f7fa;
        padding: 2px 6px;
        border-radius: 4px;
        font-family: 'Courier New', monospace;
        color: #e6a23c;
        font-size: 13px;
      }

      :deep(strong) {
        color: #303133;
        font-weight: 600;
      }
    }
  }
}

/* 样例块 */
.sample-block {
  margin-bottom: 16px;

  .sample-row {
    display: flex;
    gap: 12px;

    .sample-col {
      flex: 1;
      min-width: 0;

      .sample-label {
        font-size: 12px;
        color: #909399;
        margin-bottom: 6px;
      }

      .sample-code {
        background: #f5f7fa;
        border: 1px solid #ebedf0;
        border-radius: 8px;
        padding: 12px 14px;
        font-size: 13px;
        font-family: 'Courier New', monospace;
        color: #303133;
        margin: 0;
        white-space: pre-wrap;
        word-break: break-all;
        min-height: 48px;
      }
    }
  }

  .sample-explanation {
    margin-top: 8px;
    font-size: 13px;
    color: #909399;
    padding: 8px 12px;
    background: #fafafa;
    border-radius: 6px;
    display: flex;
    align-items: center;
    gap: 4px;
  }
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 空状态 */
.empty-wrap {
  padding: 60px 0;
  text-align: center;
}

/* 响应式 */
@media (max-width: 768px) {
  .class-grid {
    grid-template-columns: 1fr;
  }

  .course-info-banner {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
}
</style>