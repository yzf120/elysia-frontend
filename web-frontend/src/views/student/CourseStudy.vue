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
              :percentage="progressPercent"
              :width="80"
              :stroke-width="8"
              :color="progressPercent === 100 ? '#52c41a' : progressPercent > 0 ? '#fff' : 'rgba(255,255,255,0.35)'"
              track-color="rgba(255,255,255,0.25)"
            >
              <template #default>
                <span class="circle-progress-text" :style="{ color: progressPercent === 100 ? '#52c41a' : '#fff' }">{{ progressPercent }}%</span>
              </template>
            </el-progress>
            <div class="circle-label">完成度</div>
          </div>
        </div>

        <!-- 章节列表 -->
        <div class="section-header" style="margin-top:20px">
          <span class="section-title">课程目录</span>
          <span class="section-sub">共 {{ courseChapters.length }} 个章节</span>
          <span v-if="totalSections > 0" class="section-sub" style="margin-left:8px;color:#67c23a;font-weight:600">
            已完成 {{ completedSections }}/{{ totalSections }} 算法题
          </span>
        </div>

        <!-- 加载中 -->
        <div v-if="chaptersLoading" style="text-align:center;padding:60px 0;">
          <el-icon class="is-loading" :size="24"><Loading /></el-icon>
          <div style="margin-top:8px;color:#909399;font-size:14px;">加载中...</div>
        </div>

        <!-- 空状态 -->
        <div v-else-if="courseChapters.length === 0" class="empty-wrap">
          <el-empty description="暂无课程内容" />
        </div>

        <el-collapse v-else v-model="activeChapters" class="chapter-collapse">
          <el-collapse-item
            v-for="chapter in courseChapters"
            :key="chapter.chapter_id"
            :name="chapter.chapter_id"
          >
            <template #title>
              <div class="chapter-title-row">
                <el-icon :color="isChapterDone(chapter) ? '#67c23a' : '#4F6EF7'"><Notebook /></el-icon>
                <span class="chapter-title-text" :style="isChapterDone(chapter) ? 'color:#52c41a' : ''">{{ chapter.title }}</span>
                <el-icon v-if="isChapterDone(chapter)" color="#67c23a" :size="22" style="margin-left:6px"><CircleCheck /></el-icon>
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
                  <el-tag
                    :type="section.section_type === 1 ? 'primary' : section.section_type === 3 ? 'success' : 'warning'"
                    size="small"
                    class="diff-tag"
                  >{{ section.section_type === 1 ? '算法题' : section.section_type === 3 ? '学习资料' : '讨论' }}</el-tag>
                  <div class="problem-info">
                    <div class="problem-title">{{ section.title }}</div>
                    <div v-if="section.section_type === 3 && section.material_count" class="problem-tags" style="color:#67c23a;font-size:12px;margin-top:2px">
                      {{ section.material_count }}份资料
                    </div>
                    <div v-else-if="section.description" class="problem-tags" style="color:#909399;font-size:12px;margin-top:2px">
                      {{ section.description }}
                    </div>
                  </div>
                </div>
                <div class="problem-right">
                  <template v-if="section.section_type === 1">
                    <el-icon
                      v-if="isSectionDone(section)"
                      color="#67c23a"
                      :size="16"
                      style="margin-right:6px"
                    ><CircleCheck /></el-icon>
                    <span v-else class="section-undone-icon"></span>
                  </template>
                  <el-icon color="#c8c9cc"><ArrowRight /></el-icon>
                </div>
              </div>
              <div v-if="!chapter.sections || chapter.sections.length === 0" style="padding:16px 24px;color:#bbb;font-size:13px;text-align:center">暂无小节</div>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>
    </div>

    <!-- ===== 第三层：讨论详情弹窗 ===== -->
    <el-dialog
      v-model="showDiscussDetail"
      title="讨论"
      width="560px"
      :destroy-on-close="true"
    >
      <div v-if="currentDiscussion" class="discuss-detail-body">
        <div class="discuss-title">{{ currentDiscussion.title }}</div>
        <div class="discuss-meta">
          <el-icon><Timer /></el-icon>
          <span>发布时间：{{ currentDiscussion.publish_time || currentDiscussion.create_time || '未知' }}</span>
        </div>
        <div class="discuss-content">{{ currentDiscussion.content }}</div>
      </div>
      <template #footer>
        <el-button @click="showDiscussDetail = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- ===== 学习资料弹窗 ===== -->
    <el-dialog
      v-model="showMaterialDetail"
      :title="currentMaterialSection ? currentMaterialSection.title : '学习资料'"
      width="700px"
      :destroy-on-close="true"
    >
      <div v-if="materialLoading" style="text-align:center;padding:40px 0">
        <el-icon class="is-loading" :size="24"><Loading /></el-icon>
        <div style="margin-top:8px;color:#909399;font-size:14px;">加载中...</div>
      </div>
      <div v-else-if="materialList.length === 0" style="text-align:center;padding:40px 0">
        <el-empty description="暂无学习资料" />
      </div>
      <div v-else class="material-list">
        <div v-for="mat in materialList" :key="mat.material_id" class="material-card">
          <div class="material-card-header">
            <div class="material-card-left">
              <el-tag :type="materialTagType(mat.material_type)" size="small">{{ materialTypeLabel(mat.material_type) }}</el-tag>
              <span class="material-card-title">{{ mat.title }}</span>
            </div>
            <div class="material-card-actions">
              <el-button v-if="mat.material_type === 'pdf' || mat.material_type === 'video'" type="primary" size="small" link @click="viewMaterialOnline(mat)">
                <el-icon><View /></el-icon> 在线查看
              </el-button>
              <el-button v-if="mat.material_type === 'pdf' || mat.material_type === 'word'" type="success" size="small" link @click="downloadMaterialAttachment(mat)">
                <el-icon><Download /></el-icon> 下载
              </el-button>
            </div>
          </div>
          <div v-if="mat.material_type === 'text' && mat.description" class="material-text-content">
            {{ mat.description }}
          </div>
          <div v-if="mat.file_name && mat.material_type !== 'text'" class="material-file-info">
            <span>{{ mat.file_name }}</span>
            <span v-if="mat.file_size" style="margin-left:12px;color:#909399">{{ formatFileSize(mat.file_size) }}</span>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showMaterialDetail = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- ===== 第四层：题目详情抽屉 ===== -->
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { studentAPI } from '@/services/index.js'
import {
  ArrowLeft, ArrowRight, Reading, User, UserFilled,
  Notebook, Timer, Coin,
  InfoFilled, Edit, Loading, CircleCheck
} from '@element-plus/icons-vue'

// 讨论弹窗
const showDiscussDetail = ref(false)
const currentDiscussion = ref(null)

const router = useRouter()

// 当前视图层级
const currentView = ref('classList')
const currentClass = ref(null)
const currentProblem = ref(null)
const showProblemDetail = ref(false)
const activeChapters = ref([])

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

// 班级列表（从后端接口加载）
const classList = ref([])

// 预设卡片颜色（按班级索引循环使用）
const cardColors = [
  'linear-gradient(135deg, #4F6EF7 0%, #7CB8FF 100%)',
  'linear-gradient(135deg, #5B8CFF 0%, #93C5FD 100%)',
  'linear-gradient(135deg, #60A5FA 0%, #38BDF8 100%)',
  'linear-gradient(135deg, #34D399 0%, #2DD4BF 100%)',
  'linear-gradient(135deg, #93C5FD 0%, #60A5FA 100%)',
  'linear-gradient(135deg, #A5D8FF 0%, #7CB8FF 100%)'
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

    // 查询各班级完成度
    try {
      const progressRes = await studentAPI.getClassProgress()
      const progressList = progressRes?.data?.class_progress || []
      for (const cp of progressList) {
        const cls = classList.value.find(c => c.id === cp.class_id)
        if (cls) {
          cls.progress = cp.progress_percent || 0
        }
      }
    } catch (e) {
      console.warn('加载班级完成度失败:', e)
    }
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
const chaptersLoading = ref(false)

// 进入班级
const enterClass = async (cls) => {
  currentClass.value = cls
  courseChapters.value = []
  activeChapters.value = []
  acceptedProblemIds.value = []
  totalSections.value = 0
  completedSections.value = 0
  currentView.value = 'catalog'
  // 调用后端接口加载章节目录
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
    ElMessage.error('加载章节失败')
  } finally {
    chaptersLoading.value = false
  }
}

// 查看小节：算法题调接口查详情展示抽屉，讨论展示讨论弹窗
const viewSection = async (section) => {
  if (section.section_type === 1) {
    // 算法题
    if (!section.problem_id) {
      ElMessage.info('题目暂未关联')
      return
    }
    try {
      const res = await studentAPI.getProblem(section.problem_id)
      const p = res?.problem
      if (!p) {
        ElMessage.error('题目信息获取失败')
        return
      }
      // 解析 tags（逗号分隔的字符串）
      let tags = []
      try { tags = p.tags ? p.tags.split(',').map(t => t.trim()).filter(Boolean) : [] } catch { tags = [] }

      // 从 description 中解析输入格式、输出格式
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
      ElMessage.error('题目信息获取失败')
    }
  } else if (section.section_type === 3) {
    // 学习资料
    currentMaterialSection.value = section
    materialList.value = []
    showMaterialDetail.value = true
    loadMaterialList(section.section_id)
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

// ==================== 学习资料 ====================
const showMaterialDetail = ref(false)
const currentMaterialSection = ref(null)
const materialList = ref([])
const materialLoading = ref(false)

const loadMaterialList = async (sectionId) => {
  materialLoading.value = true
  try {
    const res = await studentAPI.getMaterials(sectionId)
    materialList.value = res.data?.materials || res.materials || []
  } catch (e) {
    console.error('加载学习资料失败:', e)
    materialList.value = []
  } finally {
    materialLoading.value = false
  }
}

const viewMaterialOnline = async (material) => {
  if (material.material_type === 'word') {
    // Word 浏览器无法直接预览，改为下载后用本地 Office 打开
    ElMessage.info('Word 文档不支持在线预览，已开始下载，请用 Office 打开查看')
    downloadMaterialAttachment(material)
    return
  }
  try {
    const apiBaseURL = 'http://localhost:8001/api'
    const token = localStorage.getItem('token')
    const url = `${apiBaseURL}/material/file/${material.material_id}/view`
    const resp = await fetch(url, {
      headers: { Authorization: token ? `Bearer ${token}` : '' }
    })
    if (!resp.ok) { ElMessage.error('查看资料失败'); return }
    const blob = await resp.blob()
    const objectUrl = URL.createObjectURL(blob)
    window.open(objectUrl, '_blank', 'noopener,noreferrer')
    setTimeout(() => URL.revokeObjectURL(objectUrl), 120 * 1000)
  } catch (e) {
    ElMessage.error('查看资料失败')
  }
}

const downloadMaterialAttachment = async (material) => {
  if (material.material_type === 'video') {
    ElMessage.warning('视频资料仅支持在线查看，不支持下载')
    return
  }
  try {
    const apiBaseURL = 'http://localhost:8001/api'
    const token = localStorage.getItem('token')
    const url = `${apiBaseURL}/material/file/${material.material_id}/download`
    const resp = await fetch(url, {
      headers: { Authorization: token ? `Bearer ${token}` : '' }
    })
    if (!resp.ok) { ElMessage.error('下载资料失败'); return }
    const blob = await resp.blob()
    const objectUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = material.file_name || 'download'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setTimeout(() => URL.revokeObjectURL(objectUrl), 60 * 1000)
  } catch (e) {
    ElMessage.error('下载资料失败')
  }
}

// 查看题目详情（保留兼容）
const viewProblem = (problem) => {
  currentProblem.value = problem
  showProblemDetail.value = true
}

// 难度标签文字（兼容中英文）
const difficultyLabel = (diff) => {
  const map = { easy: '简单', medium: '中等', hard: '困难', '简单': '简单', '中等': '中等', '困难': '困难' }
  return map[diff] || diff
}

// 难度标签类型（兼容中英文）
const difficultyType = (diff) => {
  const map = { easy: 'success', medium: 'warning', hard: 'danger', '简单': 'success', '中等': 'warning', '困难': 'danger' }
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

// 学习资料辅助函数
const materialTypeLabel = (type) => ({
  pdf: 'PDF文档', word: 'Word文档', video: '视频', text: '文字内容'
}[type] || type)

const materialTagType = (type) => ({
  pdf: 'danger', word: 'primary', video: 'warning', text: 'info'
}[type] || 'info')

const formatFileSize = (size) => {
  if (size < 1024) return size + 'B'
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + 'KB'
  if (size < 1024 * 1024 * 1024) return (size / (1024 * 1024)).toFixed(1) + 'MB'
  return (size / (1024 * 1024 * 1024)).toFixed(1) + 'GB'
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

  &.problem-item--done {
    background: #f6ffed;
    .problem-title {
      color: #52c41a;
    }
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

    .section-undone-icon {
      display: inline-block;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 2px solid #c8c9cc;
      background: #fff;
      flex-shrink: 0;
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

/* 讨论详情 */
.discuss-detail-body {
  padding: 4px 0;

  .discuss-title {
    font-size: 18px;
    font-weight: 700;
    color: #303133;
    margin-bottom: 12px;
    line-height: 1.5;
  }

  .discuss-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #909399;
    margin-bottom: 16px;
  }

  .discuss-content {
    font-size: 14px;
    color: #606266;
    line-height: 1.8;
    white-space: pre-line;
    background: #f5f7fa;
    border-radius: 8px;
    padding: 16px;
  }
}

/* 学习资料列表 */
.material-list {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .material-card {
    border: 1px solid #ebeef5;
    border-radius: 8px;
    padding: 14px 16px;
    transition: all 0.2s;

    &:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .material-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .material-card-left {
        display: flex;
        align-items: center;
        gap: 10px;

        .material-card-title {
          font-size: 15px;
          font-weight: 600;
          color: #303133;
        }
      }

      .material-card-actions {
        display: flex;
        gap: 8px;
      }
    }

    .material-text-content {
      margin-top: 10px;
      font-size: 14px;
      color: #606266;
      line-height: 1.8;
      white-space: pre-line;
      background: #f5f7fa;
      border-radius: 6px;
      padding: 12px;
    }

    .material-file-info {
      margin-top: 8px;
      font-size: 13px;
      color: #909399;
    }
  }
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