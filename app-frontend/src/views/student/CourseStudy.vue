<template>
  <div class="course-study-page">

    <!-- ===== 第一层：班级列表 ===== -->
    <template v-if="currentView === 'classList'">
      <van-nav-bar title="课程学习" fixed placeholder>
        <template #right>
          <van-icon name="user-o" size="20" @click="$router.push('/student/profile')" />
        </template>
      </van-nav-bar>

      <div class="page-body">
        <div class="section-header">
          <h3>我加入的班级</h3>
          <span class="sub-text">点击班级进入课程学习</span>
        </div>

        <div v-if="classListLoading" style="text-align:center;padding:60px 0;">
          <van-loading size="24px">加载中...</van-loading>
        </div>

        <div v-else-if="classListError" style="text-align:center;padding:40px 16px;color:#ee0a24;">
          {{ classListError }}
          <div style="margin-top:12px">
            <van-button size="small" type="primary" @click="loadStudentClasses">重新加载</van-button>
          </div>
        </div>

        <div v-else-if="classList.length === 0" class="empty-wrap">
          <van-empty description="暂未加入任何班级" />
        </div>

        <template v-else>
        <div
          v-for="cls in classList"
          :key="cls.id"
          class="class-card"
          @click="enterClass(cls)"
        >
          <div class="class-icon" :style="{ background: cls.color }">
            <van-icon name="notes-o" size="28" color="#fff" />
          </div>
          <div class="class-info">
            <div class="class-name">{{ cls.name }}</div>
            <div class="class-meta">
              <span><van-icon name="user-o" /> {{ cls.teacher }}</span>
              <span><van-icon name="friends-o" /> {{ cls.studentCount }}人</span>
            </div>
            <div class="class-subject">
              <van-tag type="primary" size="medium">{{ cls.subject }}</van-tag>
              <van-tag :type="cls.status === '进行中' ? 'success' : 'default'" size="medium" style="margin-left:6px">{{ cls.status }}</van-tag>
            </div>
          </div>
          <van-icon name="arrow" color="#c8c9cc" />
        </div>
        </template>
      </div>
    </template>

    <!-- ===== 第二层：课程目录 ===== -->
    <template v-else-if="currentView === 'catalog'">
      <van-nav-bar
        :title="currentClass.name"
        left-arrow
        @click-left="currentView = 'classList'"
        fixed
        placeholder
      />

      <div class="page-body">
        <div class="course-info-card">
          <div class="course-info-left">
            <div class="course-subject">{{ currentClass.subject }}</div>
            <div class="course-teacher">授课教师：{{ currentClass.teacher }}</div>
          </div>
          <div class="course-progress">
          <van-circle
              :rate="progressPercent"
              :speed="100"
              :stroke-width="60"
              size="60px"
              :color="progressPercent === 100 ? '#07c160' : progressPercent > 0 ? '#667eea' : '#c8c9cc'"
              layer-color="rgba(255,255,255,0.3)"
            >
              <span class="progress-text" :style="{ color: progressPercent === 100 ? '#07c160' : '#fff' }">{{ progressPercent }}%</span>
            </van-circle>
            <div class="progress-label">完成度</div>
          </div>
        </div>

        <!-- 章节列表 -->
        <div class="section-header">
          <h3>课程目录</h3>
          <span v-if="totalSections > 0" class="sub-text" style="color:#07c160;font-weight:600">
            已完成 {{ completedSections }}/{{ totalSections }} 算法题
          </span>
        </div>

        <div v-if="chaptersLoading" style="text-align:center;padding:40px 0;">
          <van-loading size="24px">加载中...</van-loading>
        </div>

        <div v-else-if="courseChapters.length === 0" class="empty-wrap">
          <van-empty description="暂无课程内容" />
        </div>

        <van-collapse v-else v-model="activeChapters" accordion>
          <van-collapse-item
            v-for="chapter in courseChapters"
            :key="chapter.chapter_id"
            :name="chapter.chapter_id"
          >
            <template #title>
              <div class="chapter-title">
                <van-icon
                  :name="isChapterDone(chapter) ? 'passed' : 'bookmark-o'"
                  :color="isChapterDone(chapter) ? '#07c160' : '#667eea'"
                  :size="isChapterDone(chapter) ? '22' : '18'"
                />
                <span :style="isChapterDone(chapter) ? 'color:#07c160;font-weight:600' : ''">{{ chapter.title }}</span>
              </div>
            </template>

              <div class="problem-list">
              <div
                v-for="section in chapter.sections"
                :key="section.section_id"
                class="problem-item"
                :class="{ 'problem-item--done': isSectionDone(section) }"
                @click="viewSection(section)"
              >
                <div class="problem-left">
                  <div class="problem-difficulty" :class="section.section_type === 1 ? 'diff-problem' : 'diff-discuss'">
                    {{ section.section_type === 1 ? '算法题' : '讨论' }}
                  </div>
                  <div class="problem-info">
                    <div class="problem-title">{{ section.title }}</div>
                    <div v-if="section.description" class="problem-tags" style="color:#909399;font-size:12px;margin-top:2px">
                      {{ section.description }}
                    </div>
                  </div>
                </div>
                <div class="problem-right">
                  <template v-if="section.section_type === 1">
                    <van-icon
                      v-if="isSectionDone(section)"
                      name="passed"
                      color="#07c160"
                      size="16"
                      style="margin-right:4px"
                    />
                    <span
                      v-else
                      class="section-undone-icon"
                    ></span>
                  </template>
                  <van-icon name="arrow" color="#c8c9cc" size="14" style="margin-left:4px" />
                </div>
              </div>
              <div v-if="!chapter.sections || chapter.sections.length === 0" style="padding:12px 16px;color:#bbb;font-size:13px;text-align:center">暂无小节</div>
            </div>
          </van-collapse-item>
        </van-collapse>
      </div>
    </template>

    <!-- ===== 讨论详情弹窗 ===== -->
    <van-popup
      v-model:show="showDiscussDetail"
      position="bottom"
      round
      :style="{ height: '60%' }"
    >
      <div class="discuss-detail" v-if="currentDiscussion">
        <div class="discuss-header">
          <div class="discuss-title-row">
            <span class="discuss-title">讨论</span>
            <van-icon name="cross" size="20" color="#909399" @click="showDiscussDetail = false" />
          </div>
        </div>
        <div class="discuss-body">
          <div class="discuss-name">{{ currentDiscussion.title }}</div>
          <div class="discuss-meta">
            <van-icon name="clock-o" />
            <span>发布时间：{{ currentDiscussion.create_time || '未知' }}</span>
          </div>
          <div class="discuss-content">{{ currentDiscussion.content || '暂无内容' }}</div>
        </div>
      </div>
    </van-popup>

    <!-- ===== 第三层：题目详情弹窗 ===== -->
    <van-popup
      v-model:show="showProblemDetail"
      position="bottom"
      round
      :style="{ height: '92%' }"
    >
      <div class="problem-detail" v-if="currentProblem">
        <!-- 弹窗头部 -->
        <div class="detail-header">
          <div class="detail-title-row">
            <span class="detail-title">{{ currentProblem.title }}</span>
            <van-icon name="cross" size="20" color="#909399" @click="showProblemDetail = false" />
          </div>
          <div class="detail-meta">
            <van-tag :class="'diff-tag-' + currentProblem.difficulty" size="medium">
              {{ difficultyLabel(currentProblem.difficulty) }}
            </van-tag>
            <span class="meta-item"><van-icon name="clock-o" /> 时间限制：{{ currentProblem.timeLimit }}ms</span>
            <span class="meta-item"><van-icon name="orders-o" /> 内存限制：{{ currentProblem.memoryLimit }}MB</span>
          </div>
          <div class="detail-tags">
            <van-tag
              v-for="tag in currentProblem.tags"
              :key="tag"
              plain
              type="primary"
              size="medium"
              style="margin-right:6px;margin-bottom:4px"
            >{{ tag }}</van-tag>
          </div>
        </div>

        <div class="detail-body">
          <!-- 题目描述 -->
          <div class="detail-section">
            <div class="section-title-bar">📝 题目描述</div>
            <div class="section-content" v-html="currentProblem.description"></div>
          </div>

          <!-- 输入格式 -->
          <div class="detail-section">
            <div class="section-title-bar">📥 输入格式</div>
            <div class="section-content">{{ currentProblem.inputFormat }}</div>
          </div>

          <!-- 输出格式 -->
          <div class="detail-section">
            <div class="section-title-bar">📤 输出格式</div>
            <div class="section-content">{{ currentProblem.outputFormat }}</div>
          </div>

          <!-- 输入输出样例 -->
          <div class="detail-section">
            <div class="section-title-bar">💡 输入输出样例</div>
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
                <strong>说明：</strong>{{ sample.explanation }}
              </div>
            </div>
          </div>

          <!-- 提示 -->
          <div v-if="currentProblem.hint" class="detail-section">
            <div class="section-title-bar">🔔 提示</div>
            <div class="section-content">{{ currentProblem.hint }}</div>
          </div>
        </div>

        <!-- 底部操作 -->
        <div class="detail-footer">
          <van-button type="primary" block round size="large" @click="goToSubmit">
            <van-icon name="edit" /> 开始作答
          </van-button>
        </div>
      </div>
    </van-popup>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { studentAPI } from '@/api/index.js'
import { showToast } from 'vant'

// 讨论弹窗
const showDiscussDetail = ref(false)
const currentDiscussion = ref(null)

const router = useRouter()

// 当前视图层级
const currentView = ref('classList')
const currentClass = ref(null)
const currentProblem = ref(null)
const showProblemDetail = ref(false)
const activeChapters = ref('')

// 已完成的 problem_id 集合（算法题通过状态）—— 用数组保证响应式
const acceptedProblemIds = ref([])
// 总算法题小节数 / 已完成算法题小节数
const totalSections = ref(0)
const completedSections = ref(0)

// 当前课程完成度百分比（0-100）
const progressPercent = computed(() => {
  if (totalSections.value === 0) return 0
  return Math.round((completedSections.value / totalSections.value) * 100)
})

// 判断某小节是否已完成
const isSectionDone = (section) => {
  return section.section_type === 1 && section.problem_id && acceptedProblemIds.value.includes(section.problem_id)
}

// 判断某章节是否全部完成（所有算法题小节都已通过）
const isChapterDone = (chapter) => {
  const problemSections = (chapter.sections || []).filter(s => s.section_type === 1 && s.problem_id)
  if (problemSections.length === 0) return false
  return problemSections.every(s => acceptedProblemIds.value.includes(s.problem_id))
}

// 班级列表加载状态
const classListLoading = ref(true)
const classListError = ref('')

// 班级列表（从后端加载）
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
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    const studentId = userInfo.student_id || userInfo.id || ''
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
      // 保留原始字段以便进入班级时使用
      _raw: cls
    }))
  } catch (e) {
    classListError.value = '班级加载失败：' + (e?.message || e)
  } finally {
    classListLoading.value = false
  }
}

onMounted(() => {
  loadStudentClasses()
})

const courseChapters = ref([])
const chaptersLoading = ref(false)

// 进入班级
const enterClass = async (cls) => {
  currentClass.value = cls
  courseChapters.value = []
  activeChapters.value = ''
  acceptedProblemIds.value = []
  totalSections.value = 0
  completedSections.value = 0
  currentView.value = 'catalog'
  // 加载章节列表
  chaptersLoading.value = true
  try {
    const res = await studentAPI.getClassChapters(cls.id)
    courseChapters.value = res?.data?.chapters || res?.chapters || []

    // 统计总算法题小节数，收集所有算法题 problem_id
    let total = 0
    const problemIds = []
    for (const chapter of courseChapters.value) {
      for (const section of (chapter.sections || [])) {
        if (section.section_type === 1 && section.problem_id) {
          total++
          problemIds.push(section.problem_id)
        }
      }
    }
    totalSections.value = total

    // 批量查询已通过的题目
    if (problemIds.length > 0) {
      try {
        const progressRes = await studentAPI.getCodeProgress(problemIds)
        const acceptedIds = progressRes?.data?.accepted_problem_ids || progressRes?.accepted_problem_ids || []
        // section.problem_id 是 varchar 字符串，统一转为字符串比较
        acceptedProblemIds.value = acceptedIds.map(id => String(id))
        completedSections.value = acceptedIds.length
      } catch (e) {
        console.warn('加载完成状态失败:', e)
      }
    }
  } catch (e) {
    showToast({ type: 'fail', message: '加载章节失败' })
  } finally {
    chaptersLoading.value = false
  }
}

// 查看小节：算法题调接口查详情展示弹窗，讨论展示讨论弹窗
const viewSection = async (section) => {
  if (section.section_type === 1) {
    // 算法题
    if (!section.problem_id) {
      showToast({ type: 'text', message: '题目暂未关联' })
      return
    }
    try {
      const res = await studentAPI.getProblem(section.problem_id)
      const p = res?.problem
      if (!p) {
        showToast({ type: 'fail', message: '题目信息获取失败' })
        return
      }
      let tags = []
      try { tags = p.tags ? p.tags.split(',').map(t => t.trim()).filter(Boolean) : [] } catch { tags = [] }

      // 从 description 中解析输入格式、输出格式（### 输入格式 / ### 输出格式 段落）
      const desc = p.description || ''
      const inputMatch = desc.match(/###\s*输入格式\s*\n([\s\S]*?)(?=###|$)/)
      const outputMatch = desc.match(/###\s*输出格式\s*\n([\s\S]*?)(?=###|$)/)
      const inputFormat = inputMatch ? inputMatch[1].trim() : ''
      const outputFormat = outputMatch ? outputMatch[1].trim() : ''
      // 去掉 description 中的输入输出格式段落，只保留正文
      const cleanDesc = desc
        .replace(/###\s*输入格式\s*\n[\s\S]*?(?=###|$)/, '')
        .replace(/###\s*输出格式\s*\n[\s\S]*?(?=###|$)/, '')
        .trim()

      // 从 test_cases 解析样例（is_sample === 1）
      let samples = []
      try {
        const tc = JSON.parse(p.test_cases || '[]')
        samples = tc
          .filter(t => t.is_sample === 1)
          .map(t => ({ input: t.input, output: t.expected_output, explanation: t.explanation || '' }))
      } catch { samples = [] }

      currentProblem.value = {
        id: p.id,
        title: p.title,
        difficulty: p.difficulty,
        tags,
        description: cleanDesc,
        inputFormat,
        outputFormat,
        samples,
        hint: p.hint || '',
        timeLimit: p.time_limit || 1000,
        memoryLimit: p.memory_limit || 256
      }
      showProblemDetail.value = true
    } catch (e) {
      showToast({ type: 'fail', message: '题目信息获取失败' })
    }
  } else {
    // 讨论
    currentDiscussion.value = {
      title: section.discussion_title || section.title,
      content: section.discussion_content || section.description || '暂无内容',
      create_time: section.create_time
    }
    showDiscussDetail.value = true
  }
}

// 查看题目详情（保留兼容）
const viewProblem = (problem) => {
  currentProblem.value = problem
  showProblemDetail.value = true
}

// 难度标签（兼容中英文）
const difficultyLabel = (diff) => {
  const map = { easy: '简单', medium: '中等', hard: '困难', '简单': '简单', '中等': '中等', '困难': '困难' }
  return map[diff] || diff
}

// 去作答（跳转到代码编辑页）
const goToSubmit = () => {
  showProblemDetail.value = false
  router.push({
    name: 'student-problem-code',
    params: { problemId: currentProblem.value.id }
  })
}
</script>

<style scoped>
.course-study-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.page-body {
  padding: 12px;
  padding-bottom: 30px;
}

/* 区块标题 */
.section-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 12px;
  padding: 4px 0;
}
.section-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #303133;
}
.sub-text {
  font-size: 12px;
  color: #909399;
}

/* 班级卡片 */
.class-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #fff;
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.06);
  cursor: pointer;
  transition: transform 0.15s;
}
.class-card:active {
  transform: scale(0.98);
}
.class-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.class-info {
  flex: 1;
  min-width: 0;
}
.class-name {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.class-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}
.class-meta span {
  display: flex;
  align-items: center;
  gap: 3px;
}
.class-subject {
  display: flex;
  align-items: center;
}

/* 课程信息卡片 */
.course-info-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 14px;
  padding: 16px 20px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #fff;
}
.course-subject {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 6px;
}
.course-teacher {
  font-size: 13px;
  opacity: 0.85;
}
.progress-text {
  font-size: 13px;
  font-weight: 700;
  color: #fff;
}
.progress-label {
  font-size: 12px;
  text-align: center;
  margin-top: 4px;
  opacity: 0.85;
}

/* 章节标题 */
.chapter-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

/* 题目列表 */
.problem-list {
  padding: 4px 0;
}
.problem-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  background: #fff;
}
.problem-item:last-child {
  border-bottom: none;
}
.problem-item:active {
  background: #f5f7fa;
}
.problem-item.problem-item--done {
  background: #f6ffed;
}
.problem-item.problem-item--done .problem-title {
  color: #07c160;
}
.problem-left {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  flex: 1;
  min-width: 0;
}
.problem-difficulty {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 10px;
  white-space: nowrap;
  flex-shrink: 0;
  margin-top: 2px;
}
.diff-easy { background: #e8f5e9; color: #4caf50; }
.diff-medium { background: #fff3e0; color: #ff9800; }
.diff-hard { background: #fce4ec; color: #e91e63; }
.diff-problem { background: #e8f0fe; color: #667eea; }
.diff-discuss { background: #fff3e0; color: #ff9800; }

.problem-info {
  flex: 1;
  min-width: 0;
}
.problem-title {
  font-size: 14px;
  color: #303133;
  margin-bottom: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.problem-tags {
  display: flex;
  flex-wrap: wrap;
}
.problem-right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-left: 8px;
}
.section-undone-icon {
  display: inline-block;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid #c8c9cc;
  background: #fff;
  margin-right: 4px;
  flex-shrink: 0;
}

/* 题目详情弹窗 */
.problem-detail {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.detail-header {
  padding: 16px 16px 12px;
  border-bottom: 1px solid #ebedf0;
  flex-shrink: 0;
}
.detail-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}
.detail-title {
  font-size: 17px;
  font-weight: 700;
  color: #303133;
  line-height: 1.4;
  flex: 1;
}
.detail-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 8px;
}
.meta-item {
  font-size: 12px;
  color: #606266;
  display: flex;
  align-items: center;
  gap: 3px;
}
.diff-tag-easy, .diff-tag-简单 { background: #e8f5e9 !important; color: #4caf50 !important; border-color: #4caf50 !important; }
.diff-tag-medium, .diff-tag-中等 { background: #fff3e0 !important; color: #ff9800 !important; border-color: #ff9800 !important; }
.diff-tag-hard, .diff-tag-困难 { background: #fce4ec !important; color: #e91e63 !important; border-color: #e91e63 !important; }

.detail-body {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px 16px;
  -webkit-overflow-scrolling: touch;
}
.detail-section {
  margin-top: 16px;
}
.section-title-bar {
  font-size: 14px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 8px;
}
.section-content {
  font-size: 14px;
  color: #606266;
  line-height: 1.7;
}
.section-content :deep(code) {
  background: #f5f7fa;
  padding: 1px 5px;
  border-radius: 4px;
  font-family: monospace;
  color: #e6a23c;
}
.section-content :deep(strong) {
  color: #303133;
  font-weight: 600;
}

/* 样例块 */
.sample-block {
  margin-bottom: 12px;
}
.sample-row {
  display: flex;
  gap: 10px;
}
.sample-col {
  flex: 1;
  min-width: 0;
}
.sample-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}
.sample-code {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 13px;
  font-family: 'Courier New', monospace;
  color: #303133;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
  border: 1px solid #ebedf0;
}
.sample-explanation {
  margin-top: 6px;
  font-size: 12px;
  color: #909399;
  padding: 6px 10px;
  background: #fafafa;
  border-radius: 6px;
}

/* 底部操作 */
.detail-footer {
  padding: 12px 16px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
  border-top: 1px solid #ebedf0;
  flex-shrink: 0;
}

/* 讨论弹窗 */
.discuss-detail {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.discuss-header {
  padding: 16px 16px 12px;
  border-bottom: 1px solid #ebedf0;
  flex-shrink: 0;
}
.discuss-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.discuss-title {
  font-size: 16px;
  font-weight: 700;
  color: #303133;
}
.discuss-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}
.discuss-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
  line-height: 1.5;
}
.discuss-meta {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #909399;
  margin-bottom: 14px;
}
.discuss-content {
  font-size: 14px;
  color: #606266;
  line-height: 1.8;
  white-space: pre-line;
  background: #f5f7fa;
  border-radius: 8px;
  padding: 14px;
}

/* 折叠面板样式 */
:deep(.van-collapse-item__content) {
  padding: 0;
}
:deep(.van-collapse-item__title) {
  padding: 14px 16px;
}

.empty-wrap {
  padding: 60px 0;
}
</style>
