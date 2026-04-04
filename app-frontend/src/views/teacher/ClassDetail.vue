<template>
  <div class="class-detail-page">
    <van-nav-bar
      :title="classInfo.className || '班级详情'"
      left-arrow
      @click-left="$router.back()"
    />

    <!-- 加载中 -->
    <div v-if="infoLoading" class="loading-wrap">
      <van-loading type="spinner" color="#4F6EF7" />
    </div>

    <template v-else>
      <!-- 班级信息卡片 -->
      <div class="info-card card">
        <div class="info-grid">
          <div class="info-item">
            <span class="label">学期</span>
            <span class="value">{{ classInfo.semester || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="label">班级人数</span>
            <span class="value">{{ classInfo.currentStudents }}/{{ classInfo.maxStudents }}</span>
          </div>
          <div class="info-item">
            <span class="label">验证码</span>
            <span class="value code">{{ classInfo.classCode }}</span>
          </div>
          <div class="info-item">
            <span class="label">状态</span>
            <van-tag :type="getStatusType(classInfo.status)">{{ getStatusLabel(classInfo.status) }}</van-tag>
          </div>
        </div>
        <div v-if="classInfo.description" class="desc">{{ classInfo.description }}</div>
      </div>

      <!-- Tab -->
      <van-tabs v-model:active="activeTab" sticky>
        <!-- 班级成员 -->
        <van-tab title="班级成员" name="members">
          <div class="tab-content">
            <van-pull-refresh v-model="refreshing" @refresh="onRefreshMembers">
              <van-list
                v-model:loading="memberLoading"
                :finished="memberFinished"
                finished-text="没有更多了"
                @load="loadMoreMembers"
              >
                <van-cell
                  v-for="(member, index) in memberList"
                  :key="member.student_id"
                  :title="`${index + 1}. ${member.student_name || member.student_id}`"
                  :label="`学号：${member.student_id}  加入时间：${formatDate(member.join_time)}`"
                >
                  <template #right-icon>
                    <van-button
                      size="mini"
                      type="danger"
                      plain
                      @click.stop="removeStudent(member.student_id)"
                    >移除</van-button>
                  </template>
                </van-cell>
              </van-list>
            </van-pull-refresh>
          </div>
        </van-tab>

        <!-- 班级公告 -->
        <van-tab title="班级公告" name="announcements">
          <div class="tab-content">
            <!-- 发布/编辑公告 -->
            <div class="publish-section card">
              <div class="section-title">{{ editingAnnouncementId ? '修改公告' : '发布新公告' }}</div>
              <van-field
                v-model="announcementForm.title"
                label="标题"
                placeholder="请输入公告标题"
                required
              />
              <van-field
                v-model="announcementForm.content"
                label="内容"
                type="textarea"
                rows="4"
                autosize
                placeholder="请输入公告内容"
                required
              />
              <div class="publish-btn">
                <van-button
                  round
                  block
                  type="primary"
                  :loading="publishingAnnouncement"
                  @click="publishAnnouncement"
                >{{ editingAnnouncementId ? '保存修改' : '发布公告' }}</van-button>
                <van-button v-if="editingAnnouncementId" round block plain style="margin-top:8px" @click="cancelEdit">取消编辑</van-button>
              </div>
            </div>

            <!-- 历史公告 -->
            <div class="section-title-outer">历史公告</div>
            <div v-if="announcementList.length === 0" class="empty-tip">暂无公告</div>
              <div
              v-for="item in announcementList"
              :key="item.id"
              class="announcement-item card"
            >
              <div class="ann-header">
                <span class="ann-title">{{ item.title }}</span>
                <div style="display:flex;gap:6px">
                  <van-button size="mini" type="primary" plain @click="editAnnouncement(item)">编辑</van-button>
                  <van-button size="mini" type="danger" plain @click="deleteAnnouncement(item.id)">删除</van-button>
                </div>
              </div>
              <div class="ann-time">{{ formatDate(item.publish_time || item.publishTime) }}</div>
              <div class="ann-content">{{ item.content }}</div>
            </div>
          </div>
        </van-tab>

        <!-- 章节管理 -->
        <van-tab title="章节管理" name="chapters">
          <div class="tab-content">
            <!-- 新增章节按钮 -->
            <van-button
              round
              block
              type="primary"
              icon="plus"
              style="margin-bottom: 16px;"
              @click="openAddChapterSheet"
            >新增章节</van-button>

            <!-- 加载中 -->
            <div v-if="chapterLoading" class="empty-tip">
              <van-loading type="spinner" color="#4F6EF7" />
            </div>

            <!-- 空状态 -->
            <div v-else-if="chapterList.length === 0" class="empty-tip">
              暂无章节，点击上方按钮创建
            </div>

            <!-- 章节列表 -->
            <div
              v-for="(chapter, cIdx) in chapterList"
              :key="chapter.chapter_id"
              class="chapter-item card"
            >
              <div class="chapter-header">
                <div class="chapter-title-wrap">
                  <span class="chapter-badge">第{{ cIdx + 1 }}章</span>
                  <span class="chapter-title">{{ chapter.title }}</span>
                </div>
                <div class="chapter-ops">
                  <van-button size="mini" type="primary" plain @click="openAddSectionSheet(chapter)">+ 小节</van-button>
                  <van-button size="mini" type="danger" plain @click="deleteChapter(chapter)">删除</van-button>
                </div>
              </div>
              <div v-if="chapter.description" class="chapter-desc">{{ chapter.description }}</div>

              <!-- 小节列表 -->
              <div v-if="chapter.sections && chapter.sections.length > 0" class="section-list">
                <div
                  v-for="(section, sIdx) in chapter.sections"
                  :key="section.section_id"
                  class="section-item"
                >
                  <div class="section-left">
                    <span class="section-num">{{ sIdx + 1 }}</span>
                    <van-tag :type="section.section_type === 1 ? 'success' : section.section_type === 3 ? 'warning' : 'primary'" size="mini">
                      {{ section.section_type === 1 ? '算法题' : section.section_type === 3 ? '学习资料' : '讨论' }}
                    </van-tag>
                    <span class="section-title">{{ section.title }}</span>
                    <span v-if="section.section_type === 3 && section.material_count" class="section-count">{{ section.material_count }}份</span>
                  </div>
                  <van-button size="mini" type="danger" plain @click="deleteSection(section)">删除</van-button>
                </div>
              </div>
              <div v-else class="section-empty">暂无小节</div>
            </div>
          </div>
        </van-tab>

        <!-- 班级设置 -->
        <van-tab title="班级设置" name="settings">
          <div class="tab-content">
            <van-cell-group inset>
              <van-field
                v-model="editForm.className"
                label="班级名称"
                placeholder="请输入班级名称"
              />
              <van-field
                v-model="editForm.description"
                label="班级描述"
                type="textarea"
                rows="2"
                autosize
                placeholder="请输入班级描述"
              />
            </van-cell-group>
            <div class="settings-btn">
              <van-button round block type="primary" :loading="saving" @click="saveSettings">
                保存修改
              </van-button>
            </div>
          </div>
        </van-tab>
      </van-tabs>
    </template>

    <!-- 新增章节弹出层 -->
    <van-popup
      v-model:show="addChapterVisible"
      position="bottom"
      round
      :style="{ padding: '20px 16px 40px' }"
    >
      <div class="popup-title">新增章节</div>
      <van-field
        v-model="chapterForm.title"
        label="章节标题"
        placeholder="请输入章节标题（必填）"
        required
      />
      <van-field
        v-model="chapterForm.description"
        label="章节描述"
        type="textarea"
        rows="2"
        autosize
        placeholder="可选"
      />
      <div class="popup-btns">
        <van-button plain round @click="addChapterVisible = false" style="flex:1">取消</van-button>
        <van-button type="primary" round :loading="chapterSubmitting" @click="submitAddChapter" style="flex:1">确认新增</van-button>
      </div>
    </van-popup>

    <!-- 选择小节类型弹出层 -->
    <van-popup
      v-model:show="sectionTypeVisible"
      position="bottom"
      round
      :style="{ padding: '20px 16px 40px' }"
    >
      <div class="popup-title">选择小节类型</div>
      <div class="type-cards">
        <div class="type-card" @click="selectSectionType(1)">
          <div class="type-icon">🧮</div>
          <div class="type-name">发布算法题</div>
          <div class="type-desc">创建编程题，学生在线提交代码</div>
        </div>
        <div class="type-card" @click="selectSectionType(2)">
          <div class="type-icon">💬</div>
          <div class="type-name">发布讨论</div>
          <div class="type-desc">发起讨论话题，学生参与讨论</div>
        </div>
        <div class="type-card" @click="selectSectionType(3)">
          <div class="type-icon">📄</div>
          <div class="type-name">发布学习资料</div>
          <div class="type-desc">上传PDF、Word、视频或文字资料</div>
        </div>
      </div>
    </van-popup>

    <!-- 新增算法题小节弹出层 -->
    <van-popup
      v-model:show="addProblemVisible"
      position="bottom"
      round
      :style="{ maxHeight: '90vh', overflowY: 'auto', padding: '20px 16px 40px' }"
    >
      <div class="popup-title">发布算法题</div>
      <van-field v-model="problemForm.sectionTitle" label="小节标题" placeholder="小节标题（必填）" required />
      <van-divider>题目来源</van-divider>

      <!-- 来源切换 -->
      <div class="source-tabs">
        <div
          class="source-tab"
          :class="{ active: problemForm.sourceMode === 'library' }"
          @click="problemForm.sourceMode = 'library'"
        >📚 从题库选择</div>
        <div
          class="source-tab"
          :class="{ active: problemForm.sourceMode === 'new' }"
          @click="problemForm.sourceMode = 'new'"
        >✏️ 新建题目</div>
      </div>

      <!-- 从题库选择 -->
      <template v-if="problemForm.sourceMode === 'library'">
        <van-field
          v-model="problemLibrarySearch"
          label="搜索题目"
          placeholder="输入题目名称搜索"
          clearable
          @input="searchProblemLibrary"
        />
        <div class="problem-list">
          <div
            v-for="p in problemLibraryList"
            :key="p.problem_id"
            class="problem-item"
            :class="{ selected: problemForm.problemId === p.problem_id }"
            @click="problemForm.problemId = p.problem_id"
          >
            <div class="problem-item-left">
              <van-tag :type="difficultyTagType(p.difficulty)" size="mini">{{ difficultyText(p.difficulty) }}</van-tag>
              <span class="problem-item-title">{{ p.title }}</span>
            </div>
            <van-icon v-if="problemForm.problemId === p.problem_id" name="success" color="#4F6EF7" />
          </div>
          <div v-if="problemLibraryList.length === 0" class="empty-tip" style="padding: 16px 0">暂无题目，请尝试其他关键词</div>
        </div>
      </template>

      <!-- 新建题目 -->
      <template v-if="problemForm.sourceMode === 'new'">
        <van-field v-model="problemForm.newProblemTitle" label="题目标题" placeholder="请输入题目标题（必填）" required />
        <van-field
          v-model="difficultyLabel"
          label="难度"
          readonly
          is-link
          @click="showDifficultyPicker = true"
        />
        <van-field v-model="problemForm.description" label="题目描述" type="textarea" rows="4" autosize placeholder="请输入题目描述（必填）" required />
        <van-field v-model="problemForm.inputDesc" label="输入说明" type="textarea" rows="2" autosize placeholder="输入格式说明（可选）" />
        <van-field v-model="problemForm.outputDesc" label="输出说明" type="textarea" rows="2" autosize placeholder="输出格式说明（可选）" />
        <van-divider>测试用例</van-divider>
        <div v-for="(tc, idx) in problemForm.testCases" :key="idx" class="test-case-block">
          <div class="tc-header">
            <span>用例 {{ idx + 1 }}</span>
            <van-button v-if="problemForm.testCases.length > 1" size="mini" type="danger" plain @click="removeTestCase(idx)">删除</van-button>
          </div>
          <van-field v-model="tc.input" label="输入" type="textarea" rows="2" autosize placeholder="测试输入" />
          <van-field v-model="tc.output" label="期望输出" type="textarea" rows="2" autosize placeholder="期望输出" />
        </div>
        <van-button plain block size="small" @click="addTestCase" style="margin: 8px 0 16px">+ 添加测试用例</van-button>
      </template>

      <div class="popup-btns">
        <van-button plain round @click="addProblemVisible = false" style="flex:1">取消</van-button>
        <van-button type="primary" round :loading="sectionSubmitting" @click="submitProblemSection" style="flex:1">确认发布</van-button>
      </div>
    </van-popup>

    <!-- 难度选择器 -->
    <van-popup v-model:show="showDifficultyPicker" position="bottom" round>
      <van-picker
        :columns="difficultyOptions"
        @confirm="onDifficultyConfirm"
        @cancel="showDifficultyPicker = false"
      />
    </van-popup>

    <!-- 新增讨论小节弹出层 -->
    <van-popup
      v-model:show="addDiscussionVisible"
      position="bottom"
      round
      :style="{ maxHeight: '80vh', overflowY: 'auto', padding: '20px 16px 40px' }"
    >
      <div class="popup-title">发布讨论</div>
      <van-field v-model="discussionForm.sectionTitle" label="小节标题" placeholder="小节标题（必填）" required />
      <van-field v-model="discussionForm.title" label="话题标题" placeholder="请输入讨论话题标题（必填）" required />
      <van-field v-model="discussionForm.content" label="话题描述" type="textarea" rows="4" autosize placeholder="请输入讨论话题描述或背景（可选）" />
      <div class="popup-btns">
        <van-button plain round @click="addDiscussionVisible = false" style="flex:1">取消</van-button>
        <van-button type="primary" round :loading="sectionSubmitting" @click="submitDiscussionSection" style="flex:1">确认发布</van-button>
      </div>
    </van-popup>

    <!-- 新增学习资料小节弹出层 -->
    <van-popup
      v-model:show="addMaterialVisible"
      position="bottom"
      round
      :style="{ maxHeight: '90vh', overflowY: 'auto', padding: '20px 16px 40px' }"
    >
      <div class="popup-title">发布学习资料</div>
      <van-field v-model="materialForm.sectionTitle" label="小节标题" placeholder="小节标题（必填）" required />
      <van-field v-model="materialForm.description" label="资料描述" type="textarea" rows="2" autosize placeholder="可选，填写资料简介" />

      <van-divider>资料内容</van-divider>
      <div v-for="(item, idx) in materialForm.items" :key="idx" class="material-item-block">
        <div class="material-item-head">
          <span>资料 {{ idx + 1 }}</span>
          <van-button v-if="materialForm.items.length > 1" size="mini" type="danger" plain @click="materialForm.items.splice(idx, 1)">移除</van-button>
        </div>
        <van-field
          v-model="item.typeLabel"
          label="资料类型"
          readonly
          is-link
          placeholder="请选择"
          @click="openMaterialTypePicker(idx)"
        />
        <van-field v-model="item.title" label="资料标题" placeholder="请输入资料标题（必填）" required />
        <van-field v-if="item.type === 'text'" v-model="item.textContent" label="文字内容" type="textarea" rows="4" autosize placeholder="请输入学习资料文字内容" />
        <div v-if="item.type && item.type !== 'text'" class="file-upload-area">
          <van-uploader
            v-model="item.fileList"
            :max-count="1"
            :accept="materialAcceptMap[item.type]"
            :max-size="200 * 1024 * 1024"
            @oversize="showToast('文件大小超过200MB限制')"
            :after-read="(f) => onMaterialFileRead(f, idx)"
          />
        </div>
      </div>
      <van-button plain block size="small" @click="materialForm.items.push({ type: '', typeLabel: '', title: '', file: null, fileList: [], textContent: '' })" style="margin: 8px 0 16px">+ 添加更多资料</van-button>

      <div class="popup-btns">
        <van-button plain round @click="addMaterialVisible = false" style="flex:1">取消</van-button>
        <van-button type="primary" round :loading="sectionSubmitting" @click="submitMaterialSection" style="flex:1">确认发布</van-button>
      </div>
    </van-popup>

    <!-- 资料类型选择器 -->
    <van-popup v-model:show="showMaterialTypePicker" position="bottom" round>
      <van-picker
        :columns="materialTypeOptions"
        @confirm="onMaterialTypeConfirm"
        @cancel="showMaterialTypePicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { showToast, showConfirmDialog } from 'vant';
import { teacherAPI, problemAPI } from '@/api';

const route = useRoute();
const router = useRouter();

const activeTab = ref('members');
const infoLoading = ref(false);

const classInfo = ref({
  classId: '',
  className: '',
  semester: '',
  currentStudents: 0,
  maxStudents: 0,
  classCode: '',
  description: '',
  status: 1
});

// 成员
const memberList = ref([]);
const memberLoading = ref(false);
const memberFinished = ref(false);
const refreshing = ref(false);
const memberPage = ref(1);

// 公告
const announcementForm = ref({ title: '', content: '' });
const publishingAnnouncement = ref(false);
const announcementList = ref([]);
const editingAnnouncementId = ref(''); // 编辑模式下当前公告ID

// 设置
const editForm = ref({ className: '', description: '' });
const saving = ref(false);

// ==================== 章节管理 ====================
const chapterList = ref([]);
const chapterLoading = ref(false);

// 新增章节
const addChapterVisible = ref(false);
const chapterSubmitting = ref(false);
const chapterForm = ref({ title: '', description: '' });

// 选择小节类型
const sectionTypeVisible = ref(false);
const currentChapter = ref(null);

// 算法题小节
const addProblemVisible = ref(false);
const sectionSubmitting = ref(false);
const showDifficultyPicker = ref(false);
const difficultyOptions = [
  { text: '简单', value: 'easy' },
  { text: '中等', value: 'medium' },
  { text: '困难', value: 'hard' }
];
const problemForm = ref({
  sectionTitle: '',
  sourceMode: 'library', // 'library' 从题库选 | 'new' 新建题目
  problemId: '',         // 从题库选时使用
  newProblemTitle: '',   // 新建题目时使用
  difficulty: 'medium',
  description: '',
  inputDesc: '',
  outputDesc: '',
  testCases: [{ input: '', output: '' }]
});
const difficultyLabel = computed(() => {
  const map = { easy: '简单', medium: '中等', hard: '困难' };
  return map[problemForm.value.difficulty] || '中等';
});

// 题库搜索
const problemLibrarySearch = ref('');
const problemLibraryList = ref([]);

const difficultyText = (d) => ({ easy: '简单', medium: '中等', hard: '困难' }[d] || d);
const difficultyTagType = (d) => ({ easy: 'success', medium: 'warning', hard: 'danger' }[d] || 'default');

// 切换来源模式时，若切回「从题库选择」则重新加载题库
watch(() => problemForm.value.sourceMode, (val) => {
  if (val === 'library' && problemLibraryList.value.length === 0) {
    searchProblemLibrary();
  }
});

// 搜索题库（调用后端接口）
const searchProblemLibrary = async () => {
  try {
    const res = await problemAPI.listProblems(problemLibrarySearch.value, '', 1, 50);
    const list = res.data?.problems || res.problems || [];
    const difficultyValueMap = (d) => ({ '简单': 'easy', '中等': 'medium', '困难': 'hard' }[d] || d);
    problemLibraryList.value = list.map(p => ({
      problem_id: String(p.id),
      title: p.title,
      difficulty: difficultyValueMap(p.difficulty),
      description: p.description || ''
    }));
  } catch (error) {
    console.error('搜索题库失败:', error);
    showToast({ type: 'fail', message: '搜索题库失败' });
  }
};

// 讨论小节
const addDiscussionVisible = ref(false);
const discussionForm = ref({ sectionTitle: '', title: '', content: '' });

// ---- 学习资料 ----
const addMaterialVisible = ref(false);
const materialForm = ref({
  sectionTitle: '',
  description: '',
  items: [{ type: '', typeLabel: '', title: '', file: null, fileList: [], textContent: '' }]
});
const showMaterialTypePicker = ref(false);
const currentMaterialItemIdx = ref(0);
const materialTypeOptions = [
  { text: 'PDF文档', value: 'pdf' },
  { text: 'Word文档', value: 'word' },
  { text: '视频', value: 'video' },
  { text: '文字内容', value: 'text' }
];
const materialAcceptMap = {
  pdf: '.pdf',
  word: '.doc,.docx',
  video: '.mp4,.avi,.mkv,.mov,.webm'
};

const openMaterialTypePicker = (idx) => {
  currentMaterialItemIdx.value = idx;
  showMaterialTypePicker.value = true;
};

const onMaterialTypeConfirm = ({ selectedOptions }) => {
  const opt = selectedOptions[0];
  const idx = currentMaterialItemIdx.value;
  materialForm.value.items[idx].type = opt.value;
  materialForm.value.items[idx].typeLabel = opt.text;
  materialForm.value.items[idx].file = null;
  materialForm.value.items[idx].fileList = [];
  showMaterialTypePicker.value = false;
};

const onMaterialFileRead = (fileInfo, idx) => {
  materialForm.value.items[idx].file = fileInfo.file;
};

const submitMaterialSection = async () => {
  if (!materialForm.value.sectionTitle.trim()) {
    showToast('请输入小节标题');
    return;
  }
  for (const item of materialForm.value.items) {
    if (!item.type) { showToast('请选择资料类型'); return; }
    if (!item.title.trim()) { showToast('请输入资料标题'); return; }
    if (item.type !== 'text' && !item.file) { showToast(`资料「${item.title}」需要上传文件`); return; }
  }

  sectionSubmitting.value = true;
  try {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const teacherId = userInfo.teacher_id || userInfo.id || '';
    const chapterId = currentChapter.value.chapter_id;

    // 创建 section_type=3 的小节
    await teacherAPI.createSection(teacherId, chapterId, {
      title: materialForm.value.sectionTitle,
      description: materialForm.value.description,
      section_type: 3
    });

    // 获取新创建的小节ID
    const chapRes = await teacherAPI.getClassChapters(route.params.classId);
    const chaps = chapRes.data?.chapters || chapRes.chapters || [];
    const curChap = chaps.find(c => c.chapter_id === chapterId);
    const newSection = curChap?.sections?.find(s => s.title === materialForm.value.sectionTitle && s.section_type === 3);
    if (!newSection) {
      showToast({ type: 'fail', message: '创建成功，但未找到小节ID' });
      addMaterialVisible.value = false;
      loadChapters();
      return;
    }

    // 逐条上传资料
    for (const item of materialForm.value.items) {
      const formData = new FormData();
      formData.append('teacher_id', teacherId);
      formData.append('section_id', newSection.section_id);
      formData.append('title', item.title);
      formData.append('material_type', item.type);
      if (item.type === 'text') {
        formData.append('description', item.textContent || '');
      } else {
        formData.append('description', '');
        formData.append('file', item.file);
      }
      await teacherAPI.uploadMaterial(formData);
    }

    showToast({ type: 'success', message: '学习资料发布成功' });
    addMaterialVisible.value = false;
    loadChapters();
  } catch (error) {
    showToast({ type: 'fail', message: '发布失败' });
  } finally {
    sectionSubmitting.value = false;
  }
};

// ---- 工具函数 ----
const getStatusLabel = (status) => {
  const map = { 1: '进行中', 2: '已结束', 3: '已归档' };
  return map[status] || '未知';
};

const getStatusType = (status) => {
  const map = { 1: 'success', 2: 'default', 3: 'warning' };
  return map[status] || 'default';
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// ---- 加载班级信息 ----
const loadClassInfo = async () => {
  infoLoading.value = true;
  try {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const teacherId = userInfo.teacher_id || userInfo.id || '';
    const res = await teacherAPI.getTeacherClasses(teacherId);
    const classes = res.classes || [];
    const classId = route.params.classId;
    const found = classes.find(c => String(c.class_id) === String(classId));
    if (found) {
      classInfo.value = {
        classId: found.class_id,
        className: found.class_name,
        semester: found.semester,
        currentStudents: found.current_students,
        maxStudents: found.max_students,
        classCode: found.class_code,
        description: found.description || '',
        status: found.status
      };
      editForm.value.className = found.class_name;
      editForm.value.description = found.description || '';
    }
  } catch (error) {
    showToast({ type: 'fail', message: '加载班级信息失败' });
  } finally {
    infoLoading.value = false;
  }
};

// ---- 班级成员 ----
const loadMoreMembers = async () => {
  try {
    const res = await teacherAPI.getClassMembers(route.params.classId, memberPage.value, 20);
    const list = res.members || [];
    memberList.value.push(...list);
    memberPage.value++;
    if (list.length < 20) memberFinished.value = true;
  } catch (error) {
    memberFinished.value = true;
  } finally {
    memberLoading.value = false;
    refreshing.value = false;
  }
};

const onRefreshMembers = () => {
  memberList.value = [];
  memberPage.value = 1;
  memberFinished.value = false;
  loadMoreMembers();
};

const removeStudent = async (studentId) => {
  try {
    await showConfirmDialog({ title: '确认移除', message: '确定要移除该学生吗？' });
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const teacherId = userInfo.teacher_id || userInfo.id || '';
    await teacherAPI.removeStudent(teacherId, route.params.classId, studentId);
    showToast({ type: 'success', message: '移除成功' });
    onRefreshMembers();
  } catch (error) {
    if (error !== 'cancel') showToast({ type: 'fail', message: '操作失败' });
  }
};

// ---- 公告 ----
const loadAnnouncements = async () => {
  try {
    const classId = route.params.classId;
    const res = await teacherAPI.getAnnouncements(classId);
    announcementList.value = res.data?.announcements || res.announcements || [];
  } catch (error) {
    console.error('加载公告失败:', error);
  }
};

const publishAnnouncement = async () => {
  if (!announcementForm.value.title.trim()) {
    showToast({ type: 'fail', message: '请输入公告标题' });
    return;
  }
  if (!announcementForm.value.content.trim()) {
    showToast({ type: 'fail', message: '请输入公告内容' });
    return;
  }
  publishingAnnouncement.value = true;
  try {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const teacherId = userInfo.teacher_id || userInfo.id || '';
    const isEditing = !!editingAnnouncementId.value;
    // 编辑模式：先删除旧公告
    if (isEditing) {
      await teacherAPI.deleteAnnouncement(teacherId, route.params.classId, editingAnnouncementId.value);
    }
    await teacherAPI.publishAnnouncement(teacherId, route.params.classId, announcementForm.value.title, announcementForm.value.content);
    announcementForm.value = { title: '', content: '' };
    editingAnnouncementId.value = '';
    showToast({ type: 'success', message: isEditing ? '修改成功' : '发布成功' });
    loadAnnouncements();
  } catch (error) {
    showToast({ type: 'fail', message: '操作失败' });
  } finally {
    publishingAnnouncement.value = false;
  }
};

const editAnnouncement = (item) => {
  announcementForm.value.title = item.title;
  announcementForm.value.content = item.content;
  editingAnnouncementId.value = item.id;
  showToast({ type: 'text', message: '请修改后点击「保存修改」' });
};

const cancelEdit = () => {
  announcementForm.value = { title: '', content: '' };
  editingAnnouncementId.value = '';
};

const deleteAnnouncement = async (id) => {
  try {
    await showConfirmDialog({ title: '确认删除', message: '确定要删除该公告吗？' });
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const teacherId = userInfo.teacher_id || userInfo.id || '';
    await teacherAPI.deleteAnnouncement(teacherId, route.params.classId, id);
    showToast({ type: 'success', message: '删除成功' });
    loadAnnouncements();
  } catch (error) {
    // cancel
  }
};

// ---- 设置 ----
const saveSettings = async () => {
  saving.value = true;
  try {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const teacherId = userInfo.teacher_id || userInfo.id || '';
    await teacherAPI.updateClass(teacherId, route.params.classId, {
      class_name: editForm.value.className,
      description: editForm.value.description
    });
    classInfo.value.className = editForm.value.className;
    classInfo.value.description = editForm.value.description;
    showToast({ type: 'success', message: '保存成功' });
  } catch (error) {
    showToast({ type: 'fail', message: '保存失败' });
  } finally {
    saving.value = false;
  }
};

// ==================== 章节管理方法 ====================

// 加载章节列表
const loadChapters = async () => {
  chapterLoading.value = true;
  try {
    const res = await teacherAPI.getClassChapters(route.params.classId);
    chapterList.value = res.data?.chapters || res.chapters || [];
  } catch (error) {
    showToast({ type: 'fail', message: '加载章节失败' });
  } finally {
    chapterLoading.value = false;
  }
};

// 打开新增章节弹出层
const openAddChapterSheet = () => {
  chapterForm.value = { title: '', description: '' };
  addChapterVisible.value = true;
};

// 提交新增章节
const submitAddChapter = async () => {
  if (!chapterForm.value.title.trim()) {
    showToast({ type: 'fail', message: '请输入章节标题' });
    return;
  }
  chapterSubmitting.value = true;
  try {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const teacherId = userInfo.teacher_id || userInfo.id || '';
    await teacherAPI.createChapter(teacherId, route.params.classId, chapterForm.value.title, chapterForm.value.description);
    showToast({ type: 'success', message: '章节创建成功' });
    addChapterVisible.value = false;
    loadChapters();
  } catch (error) {
    showToast({ type: 'fail', message: '创建章节失败' });
  } finally {
    chapterSubmitting.value = false;
  }
};

// 删除章节
const deleteChapter = async (chapter) => {
  try {
    await showConfirmDialog({
      title: '确认删除',
      message: `确定要删除章节「${chapter.title}」吗？其下所有小节也将被删除！`
    });
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const teacherId = userInfo.teacher_id || userInfo.id || '';
    await teacherAPI.deleteChapter(teacherId, chapter.chapter_id);
    showToast({ type: 'success', message: '删除成功' });
    loadChapters();
  } catch (error) {
    if (error !== 'cancel') showToast({ type: 'fail', message: '删除失败' });
  }
};

// 打开选择小节类型弹出层
const openAddSectionSheet = (chapter) => {
  currentChapter.value = chapter;
  sectionTypeVisible.value = true;
};

// 选择小节类型
const selectSectionType = (type) => {
  sectionTypeVisible.value = false;
  if (type === 1) {
    problemForm.value = {
      sectionTitle: '',
      sourceMode: 'library',
      problemId: '',
      newProblemTitle: '',
      difficulty: 'medium',
      description: '',
      inputDesc: '',
      outputDesc: '',
      testCases: [{ input: '', output: '' }]
    };
    problemLibrarySearch.value = '';
    searchProblemLibrary();
    addProblemVisible.value = true;
  } else if (type === 3) {
    materialForm.value = {
      sectionTitle: '',
      description: '',
      items: [{ type: '', typeLabel: '', title: '', file: null, fileList: [], textContent: '' }]
    };
    addMaterialVisible.value = true;
  } else {
    discussionForm.value = { sectionTitle: '', title: '', content: '' };
    addDiscussionVisible.value = true;
  }
};

// 难度选择确认
const onDifficultyConfirm = ({ selectedOptions }) => {
  problemForm.value.difficulty = selectedOptions[0]?.value || 'medium';
  showDifficultyPicker.value = false;
};

// 添加/移除测试用例
const addTestCase = () => {
  problemForm.value.testCases.push({ input: '', output: '' });
};
const removeTestCase = (idx) => {
  problemForm.value.testCases.splice(idx, 1);
};

// 提交算法题小节
const submitProblemSection = async () => {
  if (!problemForm.value.sectionTitle.trim()) {
    showToast({ type: 'fail', message: '请输入小节标题' });
    return;
  }

  let problemId = '';
  if (problemForm.value.sourceMode === 'library') {
    if (!problemForm.value.problemId) {
      showToast({ type: 'fail', message: '请从题库中选择一道题目' });
      return;
    }
    problemId = String(problemForm.value.problemId);
  } else {
    if (!problemForm.value.newProblemTitle.trim()) {
      showToast({ type: 'fail', message: '请输入题目标题' });
      return;
    }
    if (!problemForm.value.description.trim()) {
      showToast({ type: 'fail', message: '请输入题目描述' });
      return;
    }
    // TODO: 先调用题库创建接口，获取 problem_id
    // const res = await problemAPI.createProblem({...}); problemId = res.problem_id;
    problemId = `prob_${Date.now()}`; // 临时占位，待题库接口接入后替换
    showToast({ type: 'text', message: '新建题目功能待题库接口接入' });
  }

  sectionSubmitting.value = true;
  try {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const teacherId = userInfo.teacher_id || userInfo.id || '';
    await teacherAPI.createSection(teacherId, currentChapter.value.chapter_id, {
      title: problemForm.value.sectionTitle,
      section_type: 1,
      problem_id: problemId
    });
    showToast({ type: 'success', message: '算法题小节创建成功' });
    addProblemVisible.value = false;
    loadChapters();
  } catch (error) {
    showToast({ type: 'fail', message: '创建失败' });
  } finally {
    sectionSubmitting.value = false;
  }
};

// 提交讨论小节
const submitDiscussionSection = async () => {
  if (!discussionForm.value.sectionTitle.trim()) {
    showToast({ type: 'fail', message: '请输入小节标题' });
    return;
  }
  if (!discussionForm.value.title.trim()) {
    showToast({ type: 'fail', message: '请输入话题标题' });
    return;
  }
  sectionSubmitting.value = true;
  try {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const teacherId = userInfo.teacher_id || userInfo.id || '';
    await teacherAPI.createSection(teacherId, currentChapter.value.chapter_id, {
      title: discussionForm.value.sectionTitle,
      section_type: 2,
      discussion_title: discussionForm.value.title,
      discussion_content: discussionForm.value.content
    });
    showToast({ type: 'success', message: '讨论小节创建成功' });
    addDiscussionVisible.value = false;
    loadChapters();
  } catch (error) {
    showToast({ type: 'fail', message: '创建失败' });
  } finally {
    sectionSubmitting.value = false;
  }
};

// 删除小节
const deleteSection = async (section) => {
  try {
    await showConfirmDialog({ title: '确认删除', message: `确定要删除小节「${section.title}」吗？` });
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const teacherId = userInfo.teacher_id || userInfo.id || '';
    await teacherAPI.deleteSection(teacherId, section.section_id);
    showToast({ type: 'success', message: '删除成功' });
    loadChapters();
  } catch (error) {
    if (error !== 'cancel') showToast({ type: 'fail', message: '删除失败' });
  }
};

onMounted(() => {
  loadClassInfo();
  loadChapters();
  loadAnnouncements();
});
</script>

<style scoped>
.class-detail-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.loading-wrap {
  display: flex;
  justify-content: center;
  padding: 60px 0;
}

.card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.info-card {
  margin: 12px 16px;
  padding: 16px;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 10px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.label {
  font-size: 12px;
  color: #999;
}

.value {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.value.code {
  color: #4F6EF7;
  font-family: 'Courier New', monospace;
  font-size: 16px;
}

.desc {
  font-size: 13px;
  color: #666;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
}

.tab-content {
  padding: 12px 16px;
}

/* 公告 */
.publish-section {
  padding: 16px;
  margin-bottom: 16px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.section-title-outer {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
}

.publish-btn {
  padding: 12px 0 0;
}

.announcement-item {
  padding: 14px;
  margin-bottom: 12px;
}

.ann-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.ann-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  flex: 1;
  margin-right: 8px;
}

.ann-time {
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
}

.ann-content {
  font-size: 14px;
  color: #606266;
  line-height: 1.7;
}

.empty-tip {
  text-align: center;
  color: #999;
  font-size: 14px;
  padding: 30px 0;
}

/* 章节管理 */
.chapter-item {
  padding: 14px;
  margin-bottom: 12px;
}

.chapter-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.chapter-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  flex-wrap: wrap;
}

.chapter-badge {
  background: #4F6EF7;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 4px;
  white-space: nowrap;
}

.chapter-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.chapter-desc {
  font-size: 12px;
  color: #999;
  width: 100%;
  margin-top: 4px;
}

.chapter-ops {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
  margin-left: 8px;
}

.section-list {
  border-top: 1px solid #f0f0f0;
  padding-top: 10px;
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  background: #f8f9ff;
  border-radius: 8px;
}

.section-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  overflow: hidden;
}

.section-num {
  font-size: 12px;
  color: #999;
  min-width: 16px;
}

.section-title {
  font-size: 13px;
  color: #333;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.section-empty {
  border-top: 1px solid #f0f0f0;
  padding-top: 10px;
  margin-top: 8px;
  font-size: 13px;
  color: #bbb;
  text-align: center;
}

/* 弹出层 */
.popup-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  text-align: center;
  margin-bottom: 16px;
}

.popup-btns {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.type-cards {
  display: flex;
  gap: 12px;
  padding: 8px 0;
}

.type-card {
  flex: 1;
  background: #f8f9ff;
  border-radius: 12px;
  padding: 20px 12px;
  text-align: center;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.type-card:active {
  border-color: #4F6EF7;
  background: #eef0ff;
}

.type-icon {
  font-size: 32px;
  margin-bottom: 10px;
}

.type-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
}

.type-desc {
  font-size: 12px;
  color: #999;
  line-height: 1.5;
}

.test-case-block {
  background: #f8f9ff;
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 10px;
}

.tc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  font-weight: 600;
  color: #666;
  margin-bottom: 8px;
}

/* 题目来源切换 */
.source-tabs {
  display: flex;
  gap: 8px;
  padding: 8px 0 12px;
}

.source-tab {
  flex: 1;
  text-align: center;
  padding: 10px 8px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #666;
  background: #f5f5f5;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.source-tab.active {
  background: #eef0ff;
  color: #4F6EF7;
  border-color: #4F6EF7;
}

/* 题库列表 */
.problem-list {
  margin: 8px 0;
  max-height: 240px;
  overflow-y: auto;
  border: 1px solid #eee;
  border-radius: 8px;
}

.problem-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  transition: background 0.2s;
}

.problem-item:last-child {
  border-bottom: none;
}

.problem-item.selected {
  background: #eef0ff;
}

.problem-item-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  overflow: hidden;
}

.problem-item-title {
  font-size: 14px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 设置 */
.settings-btn {
  padding: 16px;
}
</style>
