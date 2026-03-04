<template>
  <div class="teacher-page class-detail-page">
    <!-- 顶部导航栏 -->
    <div class="teacher-top-nav">
      <div class="nav-left">
        <el-button type="primary" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回首页
        </el-button>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item>教师端</el-breadcrumb-item>
          <el-breadcrumb-item>班级详情</el-breadcrumb-item>
          <el-breadcrumb-item>{{ classInfo.name }}</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
    </div>

    <!-- 班级信息卡片 -->
    <div class="teacher-card class-info-card">
      <div class="info-row">
        <div class="info-item">
          <span class="label">班级名称：</span>
          <span class="value">{{ classInfo.name }}</span>
        </div>
        <div class="info-item">
          <span class="label">授课科目：</span>
          <span class="value">{{ classInfo.subject }}</span>
        </div>
        <div class="info-item">
          <span class="label">学期：</span>
          <span class="value">{{ classInfo.semester }}</span>
        </div>
        <div class="info-item">
          <span class="label">班级验证码：</span>
          <span class="value code">{{ classInfo.code }}</span>
        </div>
      </div>
    </div>

    <!-- 主内容区 - Tab切换 -->
    <div class="teacher-card">
      <el-tabs v-model="activeTab" class="teacher-tabs">
        <!-- 班级成员Tab -->
        <el-tab-pane label="班级成员" name="members">
          <div class="tab-header">
            <el-input
              v-model="memberSearch"
              placeholder="搜索学生姓名或学号"
              style="width: 300px"
              clearable
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>

          <el-table :data="filteredMembers" class="teacher-table" stripe>
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column prop="name" label="姓名" width="120" />
            <el-table-column prop="studentId" label="学号" width="150" />
            <el-table-column prop="email" label="邮箱" min-width="200" />
            <el-table-column prop="joinTime" label="加入时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.joinTime) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button type="danger" size="small" @click="removeMember(row.id)">
                  移除
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="teacher-pagination">
            <el-pagination
              v-model:current-page="memberPage"
              :page-size="10"
              layout="prev, pager, next"
              :total="memberTotal"
            />
          </div>
        </el-tab-pane>

        <!-- 班级公告Tab -->
        <el-tab-pane label="班级公告" name="announcements">
          <!-- 发布/编辑公告区域 -->
          <div class="publish-section">
            <h4>{{ editingAnnouncementId ? '修改公告' : '发布新公告' }}</h4>
            <el-form :model="announcementForm" label-width="80px">
              <el-form-item label="公告标题">
                <el-input
                  v-model="announcementForm.title"
                  placeholder="请输入公告标题"
                  clearable
                />
              </el-form-item>
              <el-form-item label="公告内容">
                <el-input
                  v-model="announcementForm.content"
                  type="textarea"
                  :rows="5"
                  placeholder="请输入公告内容"
                />
              </el-form-item>
              <el-form-item>
                <el-button
                  type="primary"
                  :loading="publishingAnnouncement"
                  @click="publishAnnouncement"
                  class="teacher-btn-primary"
                >
                  {{ editingAnnouncementId ? '保存修改' : '发布公告' }}
                </el-button>
                <el-button v-if="editingAnnouncementId" @click="cancelEdit">取消</el-button>
              </el-form-item>
            </el-form>
          </div>

          <!-- 历史公告列表 -->
          <div class="history-section">
            <h4>历史公告</h4>
            <div v-if="announcementList.length === 0" class="teacher-empty">
              <el-empty description="暂无公告" />
            </div>
            <div v-else class="announcement-list">
              <el-card
                v-for="item in announcementList"
                :key="item.id"
                class="announcement-item"
                shadow="hover"
              >
                <div class="announcement-header">
                  <h3>{{ item.title }}</h3>
                  <div class="actions">
                    <el-button type="primary" size="small" link @click="editAnnouncement(item)">
                      编辑
                    </el-button>
                    <el-button type="danger" size="small" link @click="deleteAnnouncement(item.id)">
                      删除
                    </el-button>
                  </div>
                </div>
                <div class="announcement-meta">
                  <span>
                    <el-icon><Clock /></el-icon>
                    {{ formatDate(item.publish_time || item.publishTime) }}
                  </span>
                </div>
                <div class="announcement-content">
                  {{ item.content }}
                </div>
              </el-card>
            </div>
          </div>
        </el-tab-pane>

        <!-- 章节管理Tab -->
        <el-tab-pane label="章节管理" name="chapters">
          <div class="tab-header">
            <el-button type="primary" @click="openAddChapterDialog">
              <el-icon><Plus /></el-icon>
              新增章节
            </el-button>
          </div>

          <!-- 章节列表 -->
          <div v-if="chapterLoading" class="chapter-loading">
            <el-icon class="is-loading"><Loading /></el-icon> 加载中...
          </div>
          <div v-else-if="chapterList.length === 0" class="teacher-empty">
            <el-empty description="暂无章节，点击「新增章节」开始创建" />
          </div>
          <div v-else class="chapter-list">
            <el-card
              v-for="(chapter, cIdx) in chapterList"
              :key="chapter.chapter_id"
              class="chapter-card"
              shadow="hover"
            >
              <div class="chapter-header">
                <div class="chapter-title-wrap">
                  <span class="chapter-index">第{{ cIdx + 1 }}章</span>
                  <span class="chapter-title">{{ chapter.title }}</span>
                  <span v-if="chapter.description" class="chapter-desc">{{ chapter.description }}</span>
                </div>
                <div class="chapter-actions">
                  <el-button type="primary" size="small" @click="openAddSectionDialog(chapter)">
                    <el-icon><Plus /></el-icon> 新增小节
                  </el-button>
                  <el-button type="danger" size="small" @click="deleteChapter(chapter)">
                    <el-icon><Delete /></el-icon> 删除章节
                  </el-button>
                </div>
              </div>

              <!-- 小节列表 -->
              <div v-if="chapter.sections && chapter.sections.length > 0" class="section-list">
                <div
                  v-for="(section, sIdx) in chapter.sections"
                  :key="section.section_id"
                  class="section-item"
                >
                  <div class="section-left">
                    <span class="section-index">{{ sIdx + 1 }}</span>
                    <el-tag :type="section.section_type === 1 ? 'success' : 'primary'" size="small">
                      {{ section.section_type === 1 ? '算法题' : '讨论' }}
                    </el-tag>
                    <span class="section-title">{{ section.title }}</span>
                    <span v-if="section.description" class="section-desc">{{ section.description }}</span>
                  </div>
                  <el-button type="danger" size="small" link @click="deleteSection(section)">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
              <div v-else class="section-empty">暂无小节</div>
            </el-card>
          </div>
        </el-tab-pane>

        <!-- 新增章节对话框 -->
        <el-dialog v-model="addChapterVisible" title="新增章节" width="480px" :close-on-click-modal="false">
          <el-form :model="chapterForm" label-width="80px" ref="chapterFormRef">
            <el-form-item label="章节标题" prop="title" :rules="[{ required: true, message: '请输入章节标题' }]">
              <el-input v-model="chapterForm.title" placeholder="请输入章节标题" clearable />
            </el-form-item>
            <el-form-item label="章节描述">
              <el-input v-model="chapterForm.description" type="textarea" :rows="3" placeholder="可选，填写章节描述" />
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="addChapterVisible = false">取消</el-button>
            <el-button type="primary" :loading="chapterSubmitting" @click="submitAddChapter">确认新增</el-button>
          </template>
        </el-dialog>

        <!-- 新增小节对话框 -->
        <el-dialog v-model="addSectionVisible" :title="`新增小节 - ${currentChapter?.title || ''}`" width="640px" :close-on-click-modal="false">
          <!-- 选择小节类型 -->
          <div v-if="!sectionType" class="section-type-select">
            <div class="type-title">请选择小节类型</div>
            <div class="type-buttons">
              <el-card class="type-card" shadow="hover" @click="sectionType = 1">
                <el-icon size="32" color="#67c23a"><Cpu /></el-icon>
                <div class="type-name">发布算法题</div>
                <div class="type-desc">创建一道算法编程题，学生可在线提交代码</div>
              </el-card>
              <el-card class="type-card" shadow="hover" @click="sectionType = 2">
                <el-icon size="32" color="#409eff"><ChatDotRound /></el-icon>
                <div class="type-name">发布讨论</div>
                <div class="type-desc">发起一个讨论话题，学生可参与讨论</div>
              </el-card>
            </div>
          </div>

          <!-- 算法题表单 -->
          <el-form v-if="sectionType === 1" :model="problemForm" label-width="100px" ref="problemFormRef">
            <el-form-item label="小节标题" prop="sectionTitle" :rules="[{ required: true, message: '请输入小节标题' }]">
              <el-input v-model="problemForm.sectionTitle" placeholder="小节标题（显示在章节列表中）" clearable />
            </el-form-item>
            <el-divider content-position="left">选择题目方式</el-divider>
            <!-- 选择方式 -->
            <el-form-item label="题目来源">
              <el-radio-group v-model="problemForm.sourceMode">
                <el-radio value="library">从题库选择</el-radio>
                <el-radio value="new">新建题目</el-radio>
              </el-radio-group>
            </el-form-item>

            <!-- 从题库选择 -->
            <template v-if="problemForm.sourceMode === 'library'">
              <el-form-item label="搜索题目">
                <el-input
                  v-model="problemLibrarySearch"
                  placeholder="输入题目名称搜索"
                  clearable
                  @input="searchProblemLibrary"
                >
                  <template #prefix><el-icon><Search /></el-icon></template>
                </el-input>
              </el-form-item>
              <el-form-item label="选择题目" prop="problemId" :rules="[{ required: true, message: '请选择题目' }]">
                <el-select
                  v-model="problemForm.problemId"
                  placeholder="请从题库中选择题目"
                  style="width: 100%"
                  filterable
                >
                  <el-option
                    v-for="p in problemLibraryList"
                    :key="p.problem_id"
                    :label="`[${difficultyText(p.difficulty)}] ${p.title}`"
                    :value="p.problem_id"
                  />
                </el-select>
              </el-form-item>
              <div v-if="selectedProblemInfo" class="problem-preview">
                <div class="preview-title">{{ selectedProblemInfo.title }}</div>
                <el-tag :type="difficultyTagType(selectedProblemInfo.difficulty)" size="small">{{ difficultyText(selectedProblemInfo.difficulty) }}</el-tag>
                <div class="preview-desc">{{ selectedProblemInfo.description }}</div>
              </div>
            </template>

            <!-- 新建题目 -->
            <template v-if="problemForm.sourceMode === 'new'">
              <el-form-item label="题目标题" prop="newProblemTitle" :rules="[{ required: true, message: '请输入题目标题' }]">
                <el-input v-model="problemForm.newProblemTitle" placeholder="请输入题目标题" clearable />
              </el-form-item>
              <el-form-item label="难度">
                <el-select v-model="problemForm.difficulty" placeholder="请选择难度">
                  <el-option label="简单" value="easy" />
                  <el-option label="中等" value="medium" />
                  <el-option label="困难" value="hard" />
                </el-select>
              </el-form-item>
              <el-form-item label="题目描述" prop="description" :rules="[{ required: true, message: '请输入题目描述' }]">
                <el-input v-model="problemForm.description" type="textarea" :rows="5" placeholder="请输入题目描述（支持Markdown）" />
              </el-form-item>
              <el-form-item label="输入说明">
                <el-input v-model="problemForm.inputDesc" type="textarea" :rows="2" placeholder="输入格式说明" />
              </el-form-item>
              <el-form-item label="输出说明">
                <el-input v-model="problemForm.outputDesc" type="textarea" :rows="2" placeholder="输出格式说明" />
              </el-form-item>
              <el-divider content-position="left">测试用例</el-divider>
              <div v-for="(tc, idx) in problemForm.testCases" :key="idx" class="test-case-item">
                <div class="test-case-header">
                  <span>用例 {{ idx + 1 }}</span>
                  <el-button type="danger" size="small" link @click="removeTestCase(idx)" v-if="problemForm.testCases.length > 1">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
                <el-row :gutter="12">
                  <el-col :span="12">
                    <el-form-item label="输入">
                      <el-input v-model="tc.input" type="textarea" :rows="3" placeholder="测试输入" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="期望输出">
                      <el-input v-model="tc.output" type="textarea" :rows="3" placeholder="期望输出" />
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>
              <el-button type="primary" plain size="small" @click="addTestCase">
                <el-icon><Plus /></el-icon> 添加测试用例
              </el-button>
            </template>
          </el-form>

          <!-- 讨论表单 -->
          <el-form v-if="sectionType === 2" :model="discussionForm" label-width="100px" ref="discussionFormRef">
            <el-form-item label="小节标题" prop="sectionTitle" :rules="[{ required: true, message: '请输入小节标题' }]">
              <el-input v-model="discussionForm.sectionTitle" placeholder="小节标题（显示在章节列表中）" clearable />
            </el-form-item>
            <el-form-item label="话题标题" prop="title" :rules="[{ required: true, message: '请输入话题标题' }]">
              <el-input v-model="discussionForm.title" placeholder="请输入讨论话题标题" clearable />
            </el-form-item>
            <el-form-item label="话题描述">
              <el-input v-model="discussionForm.content" type="textarea" :rows="5" placeholder="请输入讨论话题描述或背景" />
            </el-form-item>
          </el-form>

          <template #footer>
            <el-button @click="cancelAddSection">取消</el-button>
            <el-button v-if="sectionType" @click="sectionType = null">上一步</el-button>
            <el-button v-if="sectionType" type="primary" :loading="sectionSubmitting" @click="submitAddSection">确认发布</el-button>
          </template>
        </el-dialog>
      </el-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { teacherAPI, problemAPI } from '@/services/index';

const router = useRouter();
const route = useRoute();

// 当前激活的Tab
const activeTab = ref('members');

// 班级信息
const classInfo = ref({
  id: '',
  name: '',
  subject: '',
  semester: '',
  code: ''
});

// 班级成员相关
const memberList = ref([]);
const memberSearch = ref('');
const memberPage = ref(1);
const memberTotal = ref(0);

// 过滤后的成员列表
const filteredMembers = computed(() => {
  if (!memberSearch.value) return memberList.value;
  return memberList.value.filter(m =>
    m.name.includes(memberSearch.value) || m.studentId.includes(memberSearch.value)
  );
});

// 公告相关
const announcementForm = ref({
  title: '',
  content: ''
});
const publishingAnnouncement = ref(false);
const announcementList = ref([]);
const editingAnnouncementId = ref(''); // 正在编辑的公告ID，空字符串表示新增

// ==================== 章节管理 ====================
const chapterList = ref([]);
const chapterLoading = ref(false);

// 新增章节
const addChapterVisible = ref(false);
const chapterSubmitting = ref(false);
const chapterFormRef = ref(null);
const chapterForm = ref({ title: '', description: '' });

// 新增小节
const addSectionVisible = ref(false);
const sectionSubmitting = ref(false);
const currentChapter = ref(null);
const sectionType = ref(null); // null=选择类型, 1=算法题, 2=讨论

// 算法题表单
const problemFormRef = ref(null);
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

// 题库搜索
const problemLibrarySearch = ref('');
const problemLibraryList = ref([]);
const selectedProblemInfo = computed(() => {
  if (!problemForm.value.problemId) return null;
  return problemLibraryList.value.find(p => p.problem_id === problemForm.value.problemId) || null;
});

// 难度文本/标签类型
const difficultyText = (d) => ({ easy: '简单', medium: '中等', hard: '困难', '简单': '简单', '中等': '中等', '困难': '困难' }[d] || d);
const difficultyTagType = (d) => ({ easy: 'success', medium: 'warning', hard: 'danger', '简单': 'success', '中等': 'warning', '困难': 'danger' }[d] || 'info');

// 选择「发布算法题」类型时才加载题库
watch(sectionType, (val) => {
  if (val === 1 && problemForm.value.sourceMode === 'library') {
    searchProblemLibrary();
  }
});

// 切换来源模式时，若切换到「从题库选择」则加载题库
watch(() => problemForm.value.sourceMode, (val) => {
  if (sectionType.value === 1 && val === 'library' && problemLibraryList.value.length === 0) {
    searchProblemLibrary();
  }
});

// 搜索题库（调用后端接口）
const searchProblemLibrary = async () => {
  try {
    const res = await problemAPI.listProblems(problemLibrarySearch.value, '', 1, 50);
    const list = res.problems || [];
    problemLibraryList.value = list.map(p => ({
      problem_id: String(p.id),
      title: p.title,
      difficulty: difficultyValueMap(p.difficulty),
      tags: p.tags
    }));
  } catch (error) {
    console.error('搜索题库失败:', error);
    ElMessage.error('搜索题库失败');
  }
};

// 难度中文转value映射
const difficultyValueMap = (d) => ({ '简单': 'easy', '中等': 'medium', '困难': 'hard' }[d] || d);

// 讨论表单
const discussionFormRef = ref(null);
const discussionForm = ref({
  sectionTitle: '',
  title: '',
  content: ''
});

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

// 加载班级信息
const loadClassInfo = async () => {
  try {
    const classId = route.params.id || route.params.classId;
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const teacherId = userInfo.teacher_id || userInfo.id || '';
    const res = await teacherAPI.getTeacherClasses(teacherId);
    const classes = res.classes || [];
    const found = classes.find(c => String(c.class_id) === String(classId));
    if (found) {
      classInfo.value = {
        id: found.class_id,
        name: found.class_name,
        subject: found.subject || found.subject_name,
        semester: found.semester,
        code: found.class_code
      };
    }
  } catch (error) {
    console.error('加载班级信息失败:', error);
    ElMessage.error('加载班级信息失败');
  }
};

// 加载班级成员
const loadMembers = async () => {
  try {
    const classId = route.params.id || route.params.classId;
    const res = await teacherAPI.getClassMembers(classId, memberPage.value, 50);
    memberList.value = (res.members || []).map(m => ({
      id: m.student_id,
      name: m.student_name || m.student_id,
      studentId: m.student_number || m.student_id,
      email: m.email || '',
      joinTime: m.join_time
    }));
    memberTotal.value = res.total || memberList.value.length;
  } catch (error) {
    console.error('加载班级成员失败:', error);
    ElMessage.error('加载班级成员失败');
  }
};

// 移除成员
const removeMember = async (memberId) => {
  try {
    await ElMessageBox.confirm('确定要移除该学生吗？', '确认移除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const teacherId = userInfo.teacher_id || userInfo.id || '';
    await teacherAPI.removeStudent(teacherId, route.params.id || route.params.classId, memberId);
    ElMessage.success('移除成功');
    loadMembers();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('移除成员失败:', error);
      ElMessage.error('移除成员失败');
    }
  }
};

// 加载公告列表
const loadAnnouncements = async () => {
  try {
    const classId = route.params.id || route.params.classId;
    const res = await teacherAPI.getAnnouncements(classId);
    announcementList.value = res.data?.announcements || res.announcements || [];
  } catch (error) {
    console.error('加载公告列表失败:', error);
  }
};

// 发布/更新公告
const publishAnnouncement = async () => {
  if (!announcementForm.value.title.trim()) {
    ElMessage.warning('请输入公告标题');
    return;
  }
  if (!announcementForm.value.content.trim()) {
    ElMessage.warning('请输入公告内容');
    return;
  }
  try {
    publishingAnnouncement.value = true;
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const teacherId = userInfo.teacher_id || userInfo.id || '';
    const classId = route.params.id || route.params.classId;
    const isEditing = !!editingAnnouncementId.value;
    // 如果是编辑模式，先删除旧公告
    if (isEditing) {
      await teacherAPI.deleteAnnouncement(teacherId, classId, editingAnnouncementId.value);
    }
    await teacherAPI.publishAnnouncement(teacherId, classId, announcementForm.value.title, announcementForm.value.content);
    ElMessage.success(isEditing ? '修改成功' : '发布成功');
    announcementForm.value.title = '';
    announcementForm.value.content = '';
    editingAnnouncementId.value = '';
    loadAnnouncements();
  } catch (error) {
    ElMessage.error('操作失败');
  } finally {
    publishingAnnouncement.value = false;
  }
};

// 编辑公告（填入表单，进入编辑模式）
const editAnnouncement = (announcement) => {
  announcementForm.value.title = announcement.title;
  announcementForm.value.content = announcement.content;
  editingAnnouncementId.value = announcement.id;
  ElMessage.info('请修改后点击「保存修改」');
};

// 取消编辑
const cancelEdit = () => {
  announcementForm.value.title = '';
  announcementForm.value.content = '';
  editingAnnouncementId.value = '';
};

// 删除公告
const deleteAnnouncement = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除该公告吗？', '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const teacherId = userInfo.teacher_id || userInfo.id || '';
    const classId = route.params.id || route.params.classId;
    await teacherAPI.deleteAnnouncement(teacherId, classId, id);
    ElMessage.success('删除成功');
    loadAnnouncements();
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('删除公告失败');
  }
};

// ==================== 章节管理方法 ====================

// 加载章节列表
const loadChapters = async () => {
  chapterLoading.value = true;
  try {
    const classId = route.params.id || route.params.classId;
    const res = await teacherAPI.getClassChapters(classId);
    chapterList.value = res.data?.chapters || res.chapters || [];
  } catch (error) {
    console.error('加载章节失败:', error);
    ElMessage.error('加载章节失败');
  } finally {
    chapterLoading.value = false;
  }
};

// 打开新增章节对话框
const openAddChapterDialog = () => {
  chapterForm.value = { title: '', description: '' };
  addChapterVisible.value = true;
};

// 提交新增章节
const submitAddChapter = async () => {
  if (!chapterFormRef.value) return;
  await chapterFormRef.value.validate(async (valid) => {
    if (!valid) return;
    chapterSubmitting.value = true;
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      const teacherId = userInfo.teacher_id || userInfo.id || '';
      await teacherAPI.createChapter(teacherId, route.params.id || route.params.classId, chapterForm.value.title, chapterForm.value.description);
      ElMessage.success('章节创建成功');
      addChapterVisible.value = false;
      loadChapters();
    } catch (error) {
      ElMessage.error('创建章节失败');
    } finally {
      chapterSubmitting.value = false;
    }
  });
};

// 删除章节
const deleteChapter = async (chapter) => {
  try {
    await ElMessageBox.confirm(`确定要删除章节「${chapter.title}」吗？删除后其下所有小节也将被删除！`, '确认删除', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning'
    });
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const teacherId = userInfo.teacher_id || userInfo.id || '';
    await teacherAPI.deleteChapter(teacherId, chapter.chapter_id);
    ElMessage.success('章节删除成功');
    loadChapters();
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('删除章节失败');
  }
};

// 打开新增小节对话框
const openAddSectionDialog = (chapter) => {
  currentChapter.value = chapter;
  sectionType.value = null;
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
  problemLibraryList.value = [];
  discussionForm.value = { sectionTitle: '', title: '', content: '' };
  addSectionVisible.value = true;
};

// 取消新增小节
const cancelAddSection = () => {
  addSectionVisible.value = false;
  sectionType.value = null;
};

// 添加测试用例
const addTestCase = () => {
  problemForm.value.testCases.push({ input: '', output: '' });
};

// 移除测试用例
const removeTestCase = (idx) => {
  problemForm.value.testCases.splice(idx, 1);
};

// 提交新增小节
const submitAddSection = async () => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const teacherId = userInfo.teacher_id || userInfo.id || '';
  const chapterId = currentChapter.value.chapter_id;

  sectionSubmitting.value = true;
  try {
    if (sectionType.value === 1) {
      // 算法题
      if (!problemFormRef.value) return;
      const valid = await problemFormRef.value.validate().catch(() => false);
      if (!valid) { sectionSubmitting.value = false; return; }

      let problemId = '';
      if (problemForm.value.sourceMode === 'library') {
        // 从题库选择
        if (!problemForm.value.problemId) {
          ElMessage.warning('请从题库中选择一道题目');
          sectionSubmitting.value = false;
          return;
        }
        problemId = problemForm.value.problemId;
      } else {
        // 新建题目：TODO 先调用题库创建接口，获取 problem_id
        // 暂时用标题生成临时ID，实际应接入题库创建API
        if (!problemForm.value.newProblemTitle.trim()) {
          ElMessage.warning('请输入题目标题');
          sectionSubmitting.value = false;
          return;
        }
        // TODO: const res = await problemAPI.createProblem({...}); problemId = res.problem_id;
        problemId = `prob_${Date.now()}`; // 临时占位，待题库接口接入后替换
        ElMessage.info('新建题目功能待题库接口接入，当前使用临时ID');
      }

      await teacherAPI.createSection(teacherId, chapterId, {
        title: problemForm.value.sectionTitle,
        section_type: 1,
        problem_id: problemId
      });
      ElMessage.success('算法题小节创建成功');
    } else if (sectionType.value === 2) {
      // 讨论
      if (!discussionFormRef.value) return;
      const valid = await discussionFormRef.value.validate().catch(() => false);
      if (!valid) { sectionSubmitting.value = false; return; }

      await teacherAPI.createSection(teacherId, chapterId, {
        title: discussionForm.value.sectionTitle,
        section_type: 2,
        discussion_title: discussionForm.value.title,
        discussion_content: discussionForm.value.content
      });
      ElMessage.success('讨论小节创建成功');
    }
    addSectionVisible.value = false;
    sectionType.value = null;
    loadChapters();
  } catch (error) {
    ElMessage.error('创建小节失败');
  } finally {
    sectionSubmitting.value = false;
  }
};

// 删除小节
const deleteSection = async (section) => {
  try {
    await ElMessageBox.confirm(`确定要删除小节「${section.title}」吗？`, '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const teacherId = userInfo.teacher_id || userInfo.id || '';
    await teacherAPI.deleteSection(teacherId, section.section_id);
    ElMessage.success('小节删除成功');
    loadChapters();
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('删除小节失败');
  }
};

// 返回首页
const goBack = () => {
  router.push({ name: 'TeacherDashboard' });
};

// 页面加载
onMounted(() => {
  loadClassInfo();
  loadMembers();
  loadAnnouncements();
  loadChapters();
});
</script>

<style scoped lang="scss">
@import '@/styles/teacher.css';

.class-detail-page {
  // 班级信息卡片
  .class-info-card {
    .info-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;

      .info-item {
        display: flex;
        align-items: center;
        gap: 8px;

        .label {
          font-size: 14px;
          color: var(--teacher-text-secondary);
          font-weight: 500;
        }

        .value {
          font-size: 15px;
          color: var(--teacher-text-primary);
          font-weight: 600;

          &.code {
            color: var(--teacher-primary);
            font-size: 18px;
            font-family: 'Courier New', monospace;
          }
        }
      }
    }
  }

  // Tab头部
  .tab-header {
    margin-bottom: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .task-buttons {
      display: flex;
      gap: 12px;
    }
  }

  // 发布区域
  .publish-section {
    background: var(--teacher-bg);
    padding: 20px;
    border-radius: 10px;
    margin-bottom: 24px;

    h4 {
      margin: 0 0 16px 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--teacher-text-primary);
    }
  }

  // 历史区域
  .history-section {
    h4 {
      margin: 0 0 16px 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--teacher-text-primary);
    }

    .announcement-list {
      display: flex;
      flex-direction: column;
      gap: 16px;

      .announcement-item {
        transition: all 0.3s ease;

        &:hover {
          transform: translateY(-2px);
        }

        .announcement-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;

          h3 {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
            color: var(--teacher-text-primary);
          }

          .actions {
            display: flex;
            gap: 8px;
          }
        }

        .announcement-meta {
          display: flex;
          gap: 20px;
          margin-bottom: 12px;
          font-size: 13px;
          color: var(--teacher-text-secondary);

          span {
            display: flex;
            align-items: center;
            gap: 5px;
          }
        }

        .announcement-content {
          font-size: 14px;
          color: var(--teacher-text-primary);
          line-height: 1.6;
        }
      }
    }
  }

  // 文本颜色
  .text-success {
    color: var(--teacher-success);
    font-weight: 600;
  }

  // 章节加载
  .chapter-loading {
    padding: 40px;
    text-align: center;
    color: var(--teacher-text-secondary);
    font-size: 14px;
  }

  // 章节列表
  .chapter-list {
    display: flex;
    flex-direction: column;
    gap: 16px;

    .chapter-card {
      border-radius: 10px;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
      }

      .chapter-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 14px;

        .chapter-title-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;

          .chapter-index {
            background: var(--teacher-primary);
            color: #fff;
            font-size: 12px;
            font-weight: 600;
            padding: 2px 8px;
            border-radius: 4px;
            white-space: nowrap;
          }

          .chapter-title {
            font-size: 16px;
            font-weight: 600;
            color: var(--teacher-text-primary);
          }

          .chapter-desc {
            font-size: 13px;
            color: var(--teacher-text-secondary);
          }
        }

        .chapter-actions {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
        }
      }

      // 小节列表
      .section-list {
        border-top: 1px solid var(--teacher-border);
        padding-top: 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;

        .section-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: var(--teacher-bg);
          border-radius: 8px;
          transition: background 0.2s;

          &:hover {
            background: #f0f4ff;
          }

          .section-left {
            display: flex;
            align-items: center;
            gap: 10px;
            flex: 1;

            .section-index {
              font-size: 12px;
              color: var(--teacher-text-secondary);
              min-width: 20px;
            }

            .section-title {
              font-size: 14px;
              color: var(--teacher-text-primary);
              font-weight: 500;
            }

            .section-desc {
              font-size: 12px;
              color: var(--teacher-text-secondary);
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              max-width: 300px;
            }
          }
        }
      }

      .section-empty {
        border-top: 1px solid var(--teacher-border);
        padding-top: 12px;
        font-size: 13px;
        color: var(--teacher-text-secondary);
        text-align: center;
      }
    }
  }

  // 小节类型选择
  .section-type-select {
    padding: 10px 0;

    .type-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--teacher-text-primary);
      margin-bottom: 20px;
      text-align: center;
    }

    .type-buttons {
      display: flex;
      gap: 20px;
      justify-content: center;

      .type-card {
        width: 200px;
        cursor: pointer;
        text-align: center;
        padding: 20px;
        transition: all 0.3s ease;

        &:hover {
          transform: translateY(-4px);
          border-color: var(--teacher-primary);
        }

        .type-name {
          font-size: 15px;
          font-weight: 600;
          color: var(--teacher-text-primary);
          margin: 12px 0 8px;
        }

        .type-desc {
          font-size: 12px;
          color: var(--teacher-text-secondary);
          line-height: 1.5;
        }
      }
    }
  }

  // 测试用例
  .test-case-item {
    background: var(--teacher-bg);
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 12px;

    .test-case-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      font-size: 13px;
      font-weight: 600;
      color: var(--teacher-text-secondary);
    }
  }

  // 题目预览
  .problem-preview {
    background: var(--teacher-bg);
    border-radius: 8px;
    padding: 12px 16px;
    margin-top: 8px;
    border-left: 3px solid var(--teacher-primary);

    .preview-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--teacher-text-primary);
      margin-bottom: 6px;
    }

    .preview-desc {
      font-size: 13px;
      color: var(--teacher-text-secondary);
      margin-top: 6px;
      line-height: 1.6;
    }
  }
}

// 响应式
@media (max-width: 768px) {
  .class-info-card .info-row {
    grid-template-columns: 1fr !important;
  }

  .tab-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start !important;
  }

  .type-buttons {
    flex-direction: column;
  }
}
</style>
