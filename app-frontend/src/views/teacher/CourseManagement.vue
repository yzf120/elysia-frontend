<template>
  <div class="course-management-page">
    <van-nav-bar
      title="课程管理"
      left-arrow
      @click-left="$router.back()"
    />

    <van-tabs v-model:active="activeTab" sticky>
      <!-- 章节列表 -->
      <van-tab title="章节列表" name="chapters">
        <div class="tab-content">
          <div class="tab-header">
            <van-button type="primary" size="small" icon="plus" @click="showAddDialog = true">
              新增章节
            </van-button>
          </div>

          <van-loading v-if="chaptersLoading" type="spinner" color="#4F6EF7" class="loading-center" />
          <van-empty v-else-if="chapterTree.length === 0" description="暂无章节，点击新增" />
          <div v-else class="chapter-list">
            <div v-for="chapter in chapterTree" :key="chapter.id" class="chapter-group">
              <div class="chapter-title-row">
                <span class="chapter-title">{{ chapter.label }}</span>
                <div class="chapter-actions">
                  <van-button size="mini" type="primary" plain @click="editChapter(chapter)">编辑</van-button>
                  <van-button size="mini" type="danger" plain @click="deleteChapter(chapter.id, chapter)">删除</van-button>
                </div>
              </div>
              <div v-if="chapter.children && chapter.children.length" class="sub-chapters">
                <div v-for="sub in chapter.children" :key="sub.id" class="sub-chapter-row">
                  <span class="sub-icon">
                    {{ sub.type === 'video' ? '🎬' : sub.type === 'pdf' ? '📄' : '📝' }}
                  </span>
                  <span class="sub-label">{{ sub.label }}</span>
                  <div class="chapter-actions">
                    <van-button size="mini" type="primary" plain @click="editChapter(sub)">编辑</van-button>
                    <van-button size="mini" type="danger" plain @click="deleteChapter(sub.id, sub)">删除</van-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </van-tab>

      <!-- AI出题 -->
      <van-tab title="AI出题" name="ai-question">
        <div class="tab-content">
          <van-cell-group inset>
            <van-field
              v-model="questionForm.scene"
              label="出题场景"
              placeholder="请选择"
              readonly
              is-link
              @click="showScenePicker = true"
            />
            <van-field
              v-model="questionForm.knowledge"
              label="知识点"
              type="textarea"
              rows="3"
              autosize
              placeholder="请输入知识点"
            />
            <van-field
              v-model="questionForm.difficulty"
              label="难度"
              placeholder="请选择"
              readonly
              is-link
              @click="showDifficultyPicker = true"
            />
          </van-cell-group>

          <div class="action-wrap">
            <van-button
              type="primary"
              block
              round
              :loading="generatingQuestion"
              @click="generateQuestion"
            >
              ✨ 生成题目
            </van-button>
          </div>

          <!-- 题目预览 -->
          <div v-if="questionResult.length > 0" class="result-card">
            <div class="result-title">题目预览</div>
            <div v-for="(q, i) in questionResult" :key="i" class="question-item">
              <div class="q-title">{{ i + 1 }}. {{ q.title }}</div>
              <div v-if="q.options" class="q-options">
                <div v-for="(opt, j) in q.options" :key="j">{{ String.fromCharCode(65 + j) }}. {{ opt }}</div>
              </div>
              <div class="q-answer">答案：{{ q.answer }}</div>
            </div>
            <van-button type="success" block round @click="goPublishTask">发布至班级</van-button>
          </div>
        </div>
      </van-tab>
    </van-tabs>

    <!-- 新增/编辑章节弹窗 -->
    <van-dialog
      v-model:show="showAddDialog"
      :title="editingChapter ? '编辑章节' : '新增章节'"
      show-cancel-button
      :before-close="saveChapter"
    >
      <div class="dialog-form">
        <van-field
          v-model="chapterForm.name"
          label="章节名称"
          placeholder="请输入章节名称"
          required
        />
      </div>
    </van-dialog>

    <!-- 出题场景选择器 -->
    <van-popup v-model:show="showScenePicker" position="bottom" round>
      <van-picker
        :columns="sceneOptions"
        @confirm="({ selectedOptions }) => { questionForm.scene = selectedOptions[0].text; showScenePicker = false }"
        @cancel="showScenePicker = false"
        title="选择出题场景"
      />
    </van-popup>

    <!-- 难度选择器 -->
    <van-popup v-model:show="showDifficultyPicker" position="bottom" round>
      <van-picker
        :columns="difficultyOptions"
        @confirm="({ selectedOptions }) => { questionForm.difficulty = selectedOptions[0].text; showDifficultyPicker = false }"
        @cancel="showDifficultyPicker = false"
        title="选择难度"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { teacherAPI } from '@/api/index.js'

const router = useRouter()
const route = useRoute()
const activeTab = ref('chapters')

// 当前班级ID（从路由 query 传入）
const classId = ref(route.query.class_id || '')
// 当前教师ID
const teacherId = ref(localStorage.getItem('userId') || '')

// 章节
const chapterTree = ref([])
const chaptersLoading = ref(false)
const showAddDialog = ref(false)
const editingChapter = ref(null)
const chapterForm = ref({ id: null, name: '' })

// AI出题
const questionForm = ref({ scene: '', knowledge: '', difficulty: '' })
const generatingQuestion = ref(false)
const questionResult = ref([])
const showScenePicker = ref(false)
const showDifficultyPicker = ref(false)

const sceneOptions = [
  { text: '讨论', value: '讨论' },
  { text: '作业', value: '作业' },
  { text: '考试', value: '考试' }
]
const difficultyOptions = [
  { text: '简单', value: '简单' },
  { text: '中等', value: '中等' },
  { text: '困难', value: '困难' }
]

// 将后端章节数据映射为树形结构
const mapChaptersToTree = (chapters) => {
  return (chapters || []).map(chap => ({
    id: chap.chapter_id,
    label: chap.title,
    description: chap.description,
    sort_order: chap.sort_order,
    type: 'folder',
    children: (chap.sections || []).map(sec => ({
      id: sec.section_id,
      label: sec.title,
      description: sec.description,
      section_type: sec.section_type,
      sort_order: sec.sort_order,
      type: sec.section_type === 1 ? 'problem' : 'discussion',
      parentId: chap.chapter_id
    }))
  }))
}

const loadChapters = async () => {
  if (!classId.value) {
    showToast({ type: 'fail', message: '缺少班级ID，无法加载章节' })
    return
  }
  chaptersLoading.value = true
  try {
    const res = await teacherAPI.getClassChapters(classId.value)
    chapterTree.value = mapChaptersToTree(res.data?.chapters)
  } catch (e) {
    showToast({ type: 'fail', message: '加载章节失败' })
  } finally {
    chaptersLoading.value = false
  }
}

const editChapter = (chapter) => {
  editingChapter.value = chapter
  chapterForm.value = { id: chapter.id, name: chapter.label }
  showAddDialog.value = true
}

const saveChapter = async (action) => {
  if (action === 'cancel') {
    editingChapter.value = null
    chapterForm.value = { id: null, name: '' }
    return true
  }
  if (!chapterForm.value.name.trim()) {
    showToast({ type: 'fail', message: '请输入章节名称' })
    return false
  }
  try {
    if (editingChapter.value) {
      // 编辑章节
      await teacherAPI.updateChapter(teacherId.value, chapterForm.value.id, chapterForm.value.name, '')
    } else {
      // 新增章节
      await teacherAPI.createChapter(teacherId.value, classId.value, chapterForm.value.name, '')
    }
    showToast({ type: 'success', message: editingChapter.value ? '修改成功' : '新增成功' })
    editingChapter.value = null
    chapterForm.value = { id: null, name: '' }
    loadChapters()
    return true
  } catch (e) {
    showToast({ type: 'fail', message: '保存失败' })
    return false
  }
}

const deleteChapter = async (id, data) => {
  try {
    await showConfirmDialog({ title: '确认删除', message: '确定要删除吗？' })
    if (data && data.parentId) {
      // 删除小节
      await teacherAPI.deleteSection(teacherId.value, id)
    } else {
      // 删除章节
      await teacherAPI.deleteChapter(teacherId.value, id)
    }
    showToast({ type: 'success', message: '删除成功' })
    loadChapters()
  } catch {}
}

const generateQuestion = async () => {
  if (!questionForm.value.scene || !questionForm.value.knowledge || !questionForm.value.difficulty) {
    showToast({ type: 'fail', message: '请填写完整信息' })
    return
  }
  generatingQuestion.value = true
  try {
    // TODO: 调用AI API生成题目
    await new Promise(r => setTimeout(r, 1500))
    questionResult.value = [
      { title: '以下哪个是正确的变量命名？', options: ['1name', '_name', 'name-1', 'name 1'], answer: 'B' },
      { title: '如何定义一个列表？', options: ['[]', '{}', '()', '<>'], answer: 'A' }
    ]
    showToast({ type: 'success', message: '生成成功' })
  } catch {
    showToast({ type: 'fail', message: '生成失败' })
  } finally {
    generatingQuestion.value = false
  }
}

const goPublishTask = () => {
  router.push({
    name: 'teacher-publish-task',
    query: {
      type: questionForm.value.scene,
      questions: JSON.stringify(questionResult.value)
    }
  })
}

onMounted(() => {
  loadChapters()
})
</script>

<style scoped>
.course-management-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 24px;
}

.tab-content {
  padding: 12px 16px;
}

.tab-header {
  margin-bottom: 12px;
}

.loading-center {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}

.chapter-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.chapter-group {
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
}

.chapter-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  background: #f0f0ff;
}

.chapter-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  flex: 1;
}

.chapter-actions {
  display: flex;
  gap: 6px;
}

.sub-chapters {
  padding: 4px 0;
}

.sub-chapter-row {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  border-top: 1px solid #f5f5f5;
  gap: 8px;
}

.sub-icon {
  font-size: 16px;
}

.sub-label {
  flex: 1;
  font-size: 14px;
  color: #555;
}

.action-wrap {
  padding: 16px 0 8px;
}

.result-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-top: 12px;
}

.result-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.question-item {
  background: #f8f8ff;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 10px;
}

.q-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.q-options {
  font-size: 13px;
  color: #555;
  margin-bottom: 8px;
  padding-left: 8px;
  line-height: 1.8;
}

.q-answer {
  font-size: 13px;
  color: #52c41a;
  font-weight: 600;
}

.dialog-form {
  padding: 8px 0;
}
</style>
